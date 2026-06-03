'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { ReviewTable } from './ReviewTable';
import {
  validateAllRowsForEndpoint,
  buildEndpointPayload,
  buildAuthHeaders,
  getFieldDefsForEndpoint,
  rowsToCSV,
  type ProcessedRow,
  type RawRow,
} from '@/lib/validation';
import type { ProjectEndpoint } from '@/lib/schemas';
import type { ProjectDto } from '@/lib/types';
import { saveEndpointMapping } from '@/actions/projects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

type Phase = 'review' | 'running' | 'done';
interface Summary { successCount: number; failedCount: number; skippedCount: number; total: number; elapsed?: number; }

export interface ReviewStepProps {
  rows: ProcessedRow[];
  fields: string[];
  config: ProjectDto;
  endpoint: ProjectEndpoint;
  mappedRows: ProcessedRow[];
  mapping?: Record<string, string | undefined>;
  globalAllowedDomains?: string[];
  /** Required for bulk-file endpoints — the original unparsed rows with source column names */
  rawRows?: RawRow[];
  rawHeaders?: string[];
  onBack: () => void;
  onRowUpdate: (updated: ProcessedRow[]) => void;
  onDeleteSelected: (updated: ProcessedRow[]) => void;
  onStartNew: () => void;
}

export function ReviewStep({ rows, fields, config, endpoint, onBack, onRowUpdate, onDeleteSelected, onStartNew, mapping, globalAllowedDomains = [], rawRows, rawHeaders }: ReviewStepProps) {
  const [forceIncludeErrors, setForceIncludeErrors] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'valid' | 'errors' | 'success' | 'failed'>('all');
  const [phase, setPhase] = React.useState<Phase>('review');
  const [progress, setProgress] = React.useState(0);
  const [currentRow, setCurrentRow] = React.useState(0);
  const [importedRows, setImportedRows] = React.useState<ProcessedRow[]>(rows);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [urlError, setUrlError] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  React.useEffect(() => { setImportedRows(rows); }, [rows]);

  const errorRows = importedRows.filter((r) => Object.keys(r.validation.errors).length > 0);
  const validRows = importedRows.filter((r) => Object.keys(r.validation.errors).length === 0);
  const toImportCount = forceIncludeErrors ? importedRows.length : validRows.length;

  // Build field labels from endpoint definition for ReviewTable
  const fieldLabels = React.useMemo(() => {
    const defs = getFieldDefsForEndpoint(endpoint);
    return Object.fromEntries(defs.map((f) => [f.key, f.label]));
  }, [endpoint]);

  const handleBulkImport = async () => {
    setUrlError(null);
    if (!config?.baseUrl?.trim()) {
      setUrlError('Project Base URL is not configured — go to Settings to add it before importing.');
      return;
    }
    if (!rawHeaders || !rawRows) {
      setUrlError('Original file data is missing — please go back and re-upload the file.');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('running');
    setProgress(50);
    const startTime = Date.now();

    const csv = rowsToCSV(rawHeaders, rawRows);
    const formData = new FormData();
    formData.append('file', new Blob([csv], { type: 'text/csv' }), 'import.csv');

    try {
      const res = await fetch(`${config.baseUrl}${endpoint.path}`, {
        method: endpoint.method ?? 'POST',
        headers: (() => {
          const h = buildAuthHeaders(config?.auth);
          delete h['Content-Type']; // let browser set multipart boundary
          return h;
        })(),
        body: formData,
        signal: controller.signal,
      });

      const elapsed = Math.round((Date.now() - startTime) / 100) / 10;
      setProgress(100);

      if (res.ok) {
        setSummary({ successCount: rawRows.length, failedCount: 0, skippedCount: 0, total: rawRows.length, elapsed });
      } else {
        const errData = await res.json().catch(() => ({}));
        setSummary({ successCount: 0, failedCount: rawRows.length, skippedCount: 0, total: rawRows.length, elapsed });
        setUrlError(errData.message || `Server error: HTTP ${res.status}`);
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        setUrlError(e instanceof Error ? e.message : 'Network error');
      }
      setSummary({ successCount: 0, failedCount: rawRows.length, skippedCount: 0, total: rawRows.length });
    }

    setPhase('done');
  };

  const handleImport = async () => {
    setUrlError(null);
    if (!config?.baseUrl?.trim()) {
      setUrlError('Project Base URL is not configured — go to Settings to add it before importing.');
      return;
    }
    const toImport = forceIncludeErrors ? importedRows : validRows;
    if (toImport.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('running');
    setProgress(0);
    setCurrentRow(0);
    const startTime = Date.now();

    const results: ProcessedRow[] = importedRows.map((r) =>
      !forceIncludeErrors && Object.keys(r.validation.errors).length > 0
        ? { ...r, import: { status: 'skipped' as const } }
        : { ...r }
    );
    const headers = buildAuthHeaders(config?.auth);

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      if (!row) continue;
      const rowIdx = results.findIndex((r) => r._id === row._id);
      if (rowIdx === -1) continue;

      try {
        const res = await fetch(`${config.baseUrl}${endpoint.path}`, {
          method: endpoint.method ?? 'POST',
          headers,
          body: JSON.stringify(buildEndpointPayload(row, endpoint)),
          signal: controller.signal,
        });
        if (res.ok) {
          results[rowIdx] = { ...results[rowIdx]!, import: { status: 'success', errorMessage: null } };
        } else {
          const errData = await res.json().catch(() => ({}));
          results[rowIdx] = { ...results[rowIdx]!, import: { status: 'server-error', errorMessage: errData.message || `HTTP ${res.status}` } };
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') break;
        results[rowIdx] = { ...results[rowIdx]!, import: { status: 'server-error', errorMessage: e instanceof Error ? e.message : 'Network error' } };
      }

      setProgress(Math.round(((i + 1) / toImport.length) * 100));
      setCurrentRow(i + 1);
      setImportedRows([...results]);
    }

    const elapsed = Math.round((Date.now() - startTime) / 100) / 10;
    const successCount = results.filter((r) => r.import.status === 'success').length;
    const failedCount = results.filter((r) => r.import.status === 'server-error').length;
    const skippedCount = results.filter((r) => r.import.status === 'skipped').length;
    setSummary({ successCount, failedCount, skippedCount, total: importedRows.length, elapsed });
    setImportedRows([...results]);
    setPhase('done');

    if (successCount > 0 && mapping && config?.id) {
      const cleanMapping: Record<string, string> = {};
      for (const [k, v] of Object.entries(mapping)) {
        if (v && v !== '_skip') cleanMapping[k] = v;
      }
      try { await saveEndpointMapping(config.id, endpoint.id, cleanMapping); } catch { /* non-critical */ }
    }
  };

  const handleRetryFailed = async () => {
    const failed = importedRows.filter((r) => r.import.status === 'server-error');
    if (failed.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('running');
    setProgress(0);
    const results = [...importedRows];
    const headers = buildAuthHeaders(config?.auth);

    for (let i = 0; i < failed.length; i++) {
      const row = failed[i];
      if (!row) continue;
      const rowIdx = results.findIndex((r) => r._id === row._id);
      if (rowIdx === -1) continue;
      try {
        const res = await fetch(`${config.baseUrl}${endpoint.path}`, {
          method: endpoint.method ?? 'POST',
          headers,
          body: JSON.stringify(buildEndpointPayload(row, endpoint)),
          signal: controller.signal,
        });
        results[rowIdx] = res.ok
          ? { ...results[rowIdx]!, import: { status: 'success', errorMessage: null } }
          : { ...results[rowIdx]!, import: { status: 'server-error', errorMessage: (await res.json().catch(() => ({}))).message || `HTTP ${res.status}` } };
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') break;
        results[rowIdx] = { ...results[rowIdx]!, import: { status: 'server-error', errorMessage: e instanceof Error ? e.message : 'Network error' } };
      }
      setProgress(Math.round(((i + 1) / failed.length) * 100));
      setImportedRows([...results]);
    }

    const successCount = results.filter((r) => r.import.status === 'success').length;
    const failedCount = results.filter((r) => r.import.status === 'server-error').length;
    const skippedCount = results.filter((r) => r.import.status === 'skipped').length;
    setSummary({ successCount, failedCount, skippedCount, total: importedRows.length });
    setImportedRows([...results]);
    setPhase('done');
  };

  return (
    <div style={{ width: '100%' }}>
      {/* URL error */}
      {urlError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 'calc(var(--radius) - 2px)', border: '1px solid hsl(var(--destructive) / 0.3)', background: 'hsl(var(--destructive) / 0.06)', color: 'hsl(var(--destructive))', fontSize: 13 }}>
          ⚠ {urlError}
        </div>
      )}

      {/* Summary stat strip — 3 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total rows', value: importedRows.length, color: undefined },
          { label: 'Ready to import', value: validRows.length, color: 'hsl(var(--success))' },
          { label: 'Have issues', value: errorRows.length, color: errorRows.length > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: s.color ?? 'hsl(var(--foreground))' }}>
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Warning banner when rows have issues */}
      {phase === 'review' && errorRows.length > 0 && (
        <div style={{
          marginBottom: 16, padding: '10px 14px',
          borderRadius: 'calc(var(--radius) - 2px)',
          border: '1px solid hsl(var(--warning, 38 92% 50%) / 0.35)',
          background: 'hsl(var(--warning, 38 92% 50%) / 0.07)',
          display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13,
        }}>
          <AlertTriangle size={16} style={{ color: 'hsl(var(--warning, 38 92% 50%))', flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>{errorRows.length} row{errorRows.length > 1 ? 's have' : ' has'} validation errors</strong> and will be skipped.{' '}
            Click any cell to edit inline, or select and delete rows to exclude them.
          </span>
        </div>
      )}

      {/* Running phase */}
      {phase === 'running' && (
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={16} className="spin" style={{ color: 'hsl(var(--brand))' }} />
              <span style={{ fontWeight: 500, fontSize: 14 }}>
                Importing… {currentRow} of {toImportCount}
              </span>
            </div>
            <span className="mono" style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{progress}%</span>
          </div>
          <Progress value={progress} />
        </Card>
      )}

      {/* Done phase */}
      {phase === 'done' && summary && (
        <div
          style={{
            marginBottom: 16, padding: 16, borderRadius: 'calc(var(--radius) - 2px)',
            border: '1px solid hsl(var(--success) / 0.3)',
            background: 'hsl(var(--success) / 0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={20} style={{ color: 'hsl(var(--success))', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Import complete</div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                {summary.successCount} succeeded · {summary.skippedCount} skipped · {summary.failedCount} failed{summary.elapsed ? ` · ${summary.elapsed}s` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {summary.failedCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleRetryFailed}>
                Retry {summary.failedCount} failed
              </Button>
            )}
            <Button size="sm" onClick={onStartNew}>Start new import</Button>
          </div>
        </div>
      )}

      {/* Data table */}
      <ReviewTable
        rows={importedRows}
        fields={fields}
        fieldLabels={fieldLabels}
        onRowUpdate={(id, field, val) => onRowUpdate(validateAllRowsForEndpoint(importedRows.map((r) => (r._id === id ? { ...r, data: { ...r.data, [field]: val } } : r)), endpoint, new Set(), globalAllowedDomains))}
        onDeleteSelected={(ids) => onDeleteSelected(importedRows.filter((r) => !ids.includes(r._id)))}
        filter={filter}
        onFilterChange={setFilter}
        showImportStatus={phase !== 'review'}
      />

      {/* Footer nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
        <Button variant="outline" onClick={onBack} disabled={phase === 'running'}>
          <ArrowLeft size={14} /> Back to mapping
        </Button>

        {phase === 'review' && endpoint.importMode === 'bulk-file' && (
          <Button size="lg" onClick={handleBulkImport} disabled={(rawRows?.length ?? 0) === 0}>
            Send CSV file ({rawRows?.length ?? 0} rows)
            <ArrowRight size={14} />
          </Button>
        )}

        {phase === 'review' && endpoint.importMode !== 'bulk-file' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <Button size="lg" onClick={handleImport} disabled={toImportCount === 0}>
              Import {toImportCount} user{toImportCount !== 1 ? 's' : ''}
              <ArrowRight size={14} />
            </Button>
            {errorRows.length > 0 && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'hsl(var(--muted-foreground))', cursor: 'pointer', userSelect: 'none' }}>
                <Checkbox
                  checked={forceIncludeErrors}
                  onCheckedChange={(v) => setForceIncludeErrors(Boolean(v))}
                />
                Also import {errorRows.length} row{errorRows.length > 1 ? 's' : ''} with errors
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
