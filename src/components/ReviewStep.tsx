'use client';

import React from 'react';
import { ReviewTable } from './ReviewTable';
import {
  validateAllRowsForEndpoint,
  buildEndpointPayload,
  buildAuthHeaders,
  type MappedRow,
} from '@/lib/validation';
import type { ProjectEndpoint } from '@/lib/schemas';
import { saveEndpointMapping } from '@/actions/projects';

type Project = any;

const IMPORT_MODES = [
  { key: 'dryrun',     label: 'Dry Run',         desc: 'Validate only — no API calls made',      icon: '🔍' },
  { key: 'valid_only', label: 'Valid Rows Only',  desc: 'Skip rows with errors',                 icon: '✅' },
  { key: 'full',       label: 'Full Import',      desc: 'Import all rows, report failures inline', icon: '🚀' },
] as const;

type ImportMode = (typeof IMPORT_MODES)[number]['key'];
type Phase = 'review' | 'running' | 'done';

interface Summary { successCount: number; failedCount: number; skippedCount: number; total: number; }

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
  const validRows  = importedRows.filter((r) => Object.keys(r._errors ?? {}).length === 0);

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

    const results: MappedRow[] = importedRows.map((r) =>
      importMode === 'valid_only' && Object.keys(r._errors ?? {}).length > 0
        ? { ...r, _status: 'skipped' as const }
        : { ...r }
    );

    const headers  = buildAuthHeaders(config?.auth);

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

    const successCount = results.filter((r) => r._status === 'success').length;
    const failedCount  = results.filter((r) => r._status === 'failed').length;
    const skippedCount = results.filter((r) => r._status === 'skipped').length;
    setSummary({ successCount, failedCount, skippedCount, total: importedRows.length });
    setImportedRows([...results]);
    setPhase('done');

    // Save mapping after successful import
    if (successCount > 0 && mapping && config?._id) {
      const cleanMapping: Record<string, string> = {};
      for (const [k, v] of Object.entries(mapping)) {
        if (v && v !== '_skip') cleanMapping[k] = v;
      }
      try {
        await saveEndpointMapping(String(config._id), endpoint.id, cleanMapping);
      } catch {
        // Non-critical — mapping save failure shouldn't block the user
      }
    }
  };

  const handleRetryFailed = async () => {
    const failed = importedRows.filter((r) => r._status === 'failed');
    if (failed.length === 0) return;

    setPhase('running');
    setProgress(0);

    const results: MappedRow[] = [...importedRows];
    const headers  = buildAuthHeaders(config?.auth);

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

      setProgress(Math.round(((i + 1) / failed.length) * 100));
      setImportedRows([...results]);
    }

    const successCount = results.filter((r) => r._status === 'success').length;
    const failedCount  = results.filter((r) => r._status === 'failed').length;
    const skippedCount = results.filter((r) => r._status === 'skipped').length;
    setSummary({ successCount, failedCount, skippedCount, total: importedRows.length });
    setImportedRows([...results]);
    setPhase('done');
  };

  return (
    <div className="w-full">
      <div className="page-header flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{phase === 'done' ? 'Import Complete' : 'Review & Import'}</h1>
          <p className="page-subtitle">
            {phase === 'done'
              ? `${summary?.successCount} imported · ${summary?.failedCount} failed · ${summary?.skippedCount} skipped`
              : `${importedRows.length} rows · ${validRows.length} valid · ${errorRows.length} with errors`}
          </p>
        </div>
        {phase === 'review' && errorRows.length > 0 && (
          <span className="badge badge-warn">⚠️ Fix {errorRows.length} error{errorRows.length > 1 ? 's' : ''} before full import</span>
        )}
      </div>

      {urlError && (
        <div className="badge badge-danger mb-4 w-full justify-start gap-2" style={{ padding: '10px 14px', fontSize: 13 }}>
          ⚠️ {urlError}
        </div>
      )}

      {phase === 'review' && (
        <div className="flex flex-wrap gap-3 mb-6">
          {IMPORT_MODES.map((mode) => (
            <div
              key={mode.key}
              className={`card p-3.5 cursor-pointer flex-1 min-w-[180px] transition-colors duration-150 ${
                importMode === mode.key
                  ? 'border-[2px] border-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'border border-[var(--border)] bg-[var(--surface)]'
              }`}
              onClick={() => setImportMode(mode.key)}
            >
              <div className="font-bold mb-1"><span className="mr-1.5">{mode.icon}</span>{mode.label}</div>
              <div className="text-xs text-[var(--text-3)]">{mode.desc}</div>
            </div>
          ))}
        </div>
      )}

      {phase === 'running' && (
        <div className="card pad mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="spin text-[18px]">⟳</span>
            <span className="font-bold text-sm">
              {importMode === 'dryrun' ? 'Validating' : 'Importing'} rows... ({currentRow} / {importedRows.length})
            </span>
          </div>
          <div className="h-2 rounded bg-[var(--border-2)] overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1.5 text-xs text-[var(--text-3)]">{progress}% complete</div>
        </div>
      )}

      {phase === 'done' && summary && (
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: 'Total',    val: summary.total,        cls: '' },
            { label: 'Imported', val: summary.successCount, cls: 'badge-ok' },
            { label: 'Failed',   val: summary.failedCount,  cls: 'badge-danger' },
            { label: 'Skipped',  val: summary.skippedCount, cls: '' },
          ].map((s) => (
            <div key={s.label} className="card px-5 py-4 flex-1 min-w-[100px] text-center">
              <div className={`text-4xl font-black leading-[1.1] ${s.cls === 'badge-ok' ? 'text-[var(--ok)]' : s.cls === 'badge-danger' ? 'text-[var(--danger)]' : 'text-[var(--text)]'}`}>
                {s.val}
              </div>
              <div className="label mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <ReviewTable
        rows={importedRows}
        fields={fields}
        onRowUpdate={(id, field, val) => {
          const updated = importedRows.map((r) => (r._id === id ? { ...r, [field]: val } : r));
          onRowUpdate(validateAllRowsForEndpoint(updated, endpoint));
        }}
        onDeleteSelected={(ids) => onDeleteSelected(importedRows.filter((r) => !ids.includes(r._id)))}
        filter={filter}
        onFilterChange={setFilter}
        showImportStatus={phase !== 'review'}
      />

      <div className="h-px bg-[var(--border)] my-6" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={phase === 'running'}>← Back</button>

        {phase === 'review' && (
          <button type="button" className="btn btn-primary btn-lg" onClick={handleImport} disabled={importedRows.length === 0}>
            {importMode === 'dryrun'     ? '🔍 Run Dry Run'
             : importMode === 'valid_only' ? `✅ Import ${validRows.length} Valid Rows`
             : `🚀 Import All ${importedRows.length} Rows`}
          </button>
        )}

        {phase === 'done' && (
          <div className="flex flex-wrap gap-2.5">
            {(summary?.failedCount ?? 0) > 0 && (
              <button type="button" className="btn btn-secondary" onClick={handleRetryFailed}>
                Retry {summary?.failedCount} Failed
              </button>
            )}
            <button type="button" className="btn btn-primary btn-lg" onClick={onStartNew}>Start New Import</button>
          </div>
        )}
      </div>
    </div>
  );
}
