'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { ReviewTable } from './ReviewTable';
import {
  validateAllRowsForEndpoint,
  buildEndpointPayload,
  buildAuthHeaders,
  type MappedRow,
} from '@/lib/validation';
import type { ProjectEndpoint } from '@/lib/schemas';
import { saveEndpointMapping } from '@/actions/projects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Project = any;

type ImportMode = 'dryrun' | 'valid_only' | 'full';
type Phase = 'review' | 'running' | 'done';
interface Summary { successCount: number; failedCount: number; skippedCount: number; total: number; elapsed?: number; }

export interface ReviewStepProps {
  rows: MappedRow[];
  fields: string[];
  config: Project;
  endpoint: ProjectEndpoint;
  mappedRows: MappedRow[];
  mapping?: Record<string, string | undefined>;
  onBack: () => void;
  onRowUpdate: (updated: MappedRow[]) => void;
  onDeleteSelected: (updated: MappedRow[]) => void;
  onStartNew: () => void;
}

export function ReviewStep({ rows, fields, config, endpoint, onBack, onRowUpdate, onDeleteSelected, onStartNew, mapping }: ReviewStepProps) {
  const [importMode, setImportMode] = React.useState<ImportMode>('valid_only');
  const [filter, setFilter] = React.useState<'all' | 'valid' | 'errors' | 'success' | 'failed'>('all');
  const [phase, setPhase] = React.useState<Phase>('review');
  const [progress, setProgress] = React.useState(0);
  const [currentRow, setCurrentRow] = React.useState(0);
  const [importedRows, setImportedRows] = React.useState<MappedRow[]>(rows);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [urlError, setUrlError] = React.useState<string | null>(null);

  React.useEffect(() => { setImportedRows(rows); }, [rows]);

  const errorRows = importedRows.filter((r) => Object.keys(r._errors ?? {}).length > 0);
  const validRows = importedRows.filter((r) => Object.keys(r._errors ?? {}).length === 0);

  const willImportCount = importMode === 'dryrun' ? 0 : importMode === 'valid_only' ? validRows.length : importedRows.length;

  const handleImport = async () => {
    setUrlError(null);
    if (!config?.baseUrl?.trim()) {
      setUrlError('Project Base URL is not configured — go to Settings to add it before importing.');
      return;
    }
    const toImport = importMode === 'valid_only' ? validRows : importedRows;
    if (toImport.length === 0) return;

    setPhase('running');
    setProgress(0);
    setCurrentRow(0);
    const startTime = Date.now();

    const results: MappedRow[] = importedRows.map((r) =>
      importMode === 'valid_only' && Object.keys(r._errors ?? {}).length > 0
        ? { ...r, _status: 'skipped' as const }
        : { ...r }
    );
    const headers = buildAuthHeaders(config?.auth);

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      if (!row) continue;
      const rowIdx = results.findIndex((r) => r._id === row._id);
      if (rowIdx === -1) continue;

      if (importMode === 'dryrun') {
        results[rowIdx] = { ...results[rowIdx]!, _status: 'skipped' };
      } else {
        try {
          const res = await fetch(`${config.baseUrl}${endpoint.path}`, {
            method: endpoint.method ?? 'POST',
            headers,
            body: JSON.stringify(buildEndpointPayload(row, endpoint)),
          });
          if (res.ok) {
            results[rowIdx] = { ...results[rowIdx]!, _status: 'success', _errorMsg: null };
          } else {
            const errData = await res.json().catch(() => ({}));
            results[rowIdx] = { ...results[rowIdx]!, _status: 'failed', _errorMsg: errData.message || `HTTP ${res.status}` };
          }
        } catch (e) {
          results[rowIdx] = { ...results[rowIdx]!, _status: 'failed', _errorMsg: e instanceof Error ? e.message : 'Network error' };
        }
      }

      setProgress(Math.round(((i + 1) / toImport.length) * 100));
      setCurrentRow(i + 1);
      setImportedRows([...results]);
    }

    const elapsed = Math.round((Date.now() - startTime) / 100) / 10;
    const successCount = results.filter((r) => r._status === 'success').length;
    const failedCount = results.filter((r) => r._status === 'failed').length;
    const skippedCount = results.filter((r) => r._status === 'skipped').length;
    setSummary({ successCount, failedCount, skippedCount, total: importedRows.length, elapsed });
    setImportedRows([...results]);
    setPhase('done');

    if (successCount > 0 && mapping && config?._id) {
      const cleanMapping: Record<string, string> = {};
      for (const [k, v] of Object.entries(mapping)) {
        if (v && v !== '_skip') cleanMapping[k] = v;
      }
      try { await saveEndpointMapping(String(config._id), endpoint.id, cleanMapping); } catch { /* non-critical */ }
    }
  };

  const handleRetryFailed = async () => {
    const failed = importedRows.filter((r) => r._status === 'failed');
    if (failed.length === 0) return;
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
          method: endpoint.method ?? 'POST', headers,
          body: JSON.stringify(buildEndpointPayload(row, endpoint)),
        });
        results[rowIdx] = res.ok
          ? { ...results[rowIdx]!, _status: 'success', _errorMsg: null }
          : { ...results[rowIdx]!, _status: 'failed', _errorMsg: (await res.json().catch(() => ({}))).message || `HTTP ${res.status}` };
      } catch (e) {
        results[rowIdx] = { ...results[rowIdx]!, _status: 'failed', _errorMsg: e instanceof Error ? e.message : 'Network error' };
      }
      setProgress(Math.round(((i + 1) / failed.length) * 100));
      setImportedRows([...results]);
    }

    const successCount = results.filter((r) => r._status === 'success').length;
    const failedCount = results.filter((r) => r._status === 'failed').length;
    const skippedCount = results.filter((r) => r._status === 'skipped').length;
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

      {/* Summary stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total rows', value: importedRows.length, color: undefined },
          { label: 'Valid', value: validRows.length, color: 'hsl(var(--success))' },
          { label: 'Errors', value: errorRows.length, color: 'hsl(var(--destructive))' },
          { label: 'Will import', value: willImportCount, color: 'hsl(var(--brand))' },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: s.color ?? 'hsl(var(--foreground))' }}>
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Controls row: mode + filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Mode</span>
          <Tabs value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
            <TabsList>
              <TabsTrigger value="dryrun">Dry run</TabsTrigger>
              <TabsTrigger value="valid_only">Valid only</TabsTrigger>
              <TabsTrigger value="full">Full import</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {phase === 'review' && errorRows.length > 0 && (
          <Badge variant="warning">⚠ {errorRows.length} error{errorRows.length > 1 ? 's' : ''} need attention</Badge>
        )}
      </div>

      {/* Running phase */}
      {phase === 'running' && (
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={16} className="spin" style={{ color: 'hsl(var(--brand))' }} />
              <span style={{ fontWeight: 500, fontSize: 14 }}>
                {importMode === 'dryrun' ? 'Validating' : 'Importing'}… {currentRow} of {importedRows.length}
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
        onRowUpdate={(id, field, val) => onRowUpdate(validateAllRowsForEndpoint(importedRows.map((r) => (r._id === id ? { ...r, [field]: val } : r)), endpoint))}
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

        {phase === 'review' && (
          <Button size="lg" onClick={handleImport} disabled={importedRows.length === 0}>
            {importMode === 'dryrun'
              ? 'Run dry validation'
              : importMode === 'valid_only'
              ? `Import ${validRows.length} valid rows`
              : `Import all ${importedRows.length} rows`}
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
