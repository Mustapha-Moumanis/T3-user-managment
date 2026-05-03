'use client';

import React from 'react';
import { VALID_ROLES, type MappedRow } from '@/lib/validation';

export const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  name: 'Full Name',
  first_name: 'First Name',
  last_name: 'Last Name',
  role: 'Role',
  phone: 'Phone',
  department: 'Department',
  external_id: 'External ID',
};

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const WarnIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ── Status Badge ───────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  errors: Record<string, string> | undefined;
  status: MappedRow['_status'];
}

function StatusBadge({ errors, status }: StatusBadgeProps) {
  if (status === 'success') return <span className="badge badge-ok" style={{ fontWeight: 800, fontSize: 11 }}>Imported</span>;
  if (status === 'failed') return <span className="badge badge-danger" style={{ fontWeight: 800, fontSize: 11 }}>Failed</span>;
  if (status === 'skipped') return <span className="badge" style={{ fontWeight: 800, fontSize: 11 }}>Skipped</span>;
  const errCount = Object.keys(errors ?? {}).length;
  if (errCount === 0) return (
    <span className="badge badge-ok" style={{ fontWeight: 800, fontSize: 11, background: 'color-mix(in srgb, var(--ok) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--ok) 35%, var(--border))' }}>
      Valid
    </span>
  );
  return (
    <span className="badge badge-danger" style={{ fontWeight: 800, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <WarnIcon /> {errCount} error{errCount > 1 ? 's' : ''}
    </span>
  );
}

// ── Editable Cell ─────────────────────────────────────────────────────────────

interface EditableCellProps {
  value: string | undefined;
  error: string | undefined;
  field: string;
  onSave: (value: string) => void;
  readOnly: boolean;
}

function EditableCell({ value, error, field, onSave, readOnly }: EditableCellProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? '');

  React.useEffect(() => { setDraft(value ?? ''); }, [value]);

  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value ?? ''); setEditing(false); };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 140 }}>
        {field === 'role' ? (
          <select
            className="select"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            style={{ fontSize: 13, padding: '4px 8px' }}
          >
            {VALID_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        ) : (
          <input
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
            autoFocus
            style={{ fontSize: 13, padding: '4px 8px' }}
          />
        )}
        <button type="button" className="btn btn-ghost btn-icon" onClick={commit}
          style={{ width: 26, height: 26, color: 'var(--ok)' }}>
          <CheckIcon />
        </button>
        <button type="button" className="btn btn-ghost btn-icon" onClick={cancel}
          style={{ width: 26, height: 26 }}>
          <XIcon />
        </button>
      </div>
    );
  }

  return (
    <div
      title={error}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        minWidth: 80,
        padding: '3px 6px',
        borderRadius: 8,
        cursor: readOnly ? 'default' : 'text',
        border: '1px solid',
        borderColor: error ? 'color-mix(in srgb, var(--danger) 60%, var(--border-2))' : 'transparent',
        background: error ? 'color-mix(in srgb, var(--danger) 8%, transparent)' : 'transparent',
        transition: 'border-color 0.1s, background 0.1s',
      }}
      onClick={() => !readOnly && setEditing(true)}
      onMouseEnter={(e) => { if (!readOnly && !error) (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--text) 5%, transparent)'; }}
      onMouseLeave={(e) => { if (!error) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <span
        className={field === 'email' || field === 'external_id' ? 'mono' : ''}
        style={{
          color: error ? 'var(--danger)' : 'var(--text)',
          fontSize: 13,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 200,
        }}
      >
        {value ?? <span style={{ opacity: 0.3 }}>—</span>}
      </span>
      {!readOnly && !error && (
        <span style={{ opacity: 0, marginLeft: 'auto', color: 'var(--text-3)' }}
          className="edit-hint">
          <EditIcon />
        </span>
      )}
      {error && (
        <span style={{ color: 'var(--danger)', marginLeft: 'auto', display: 'flex' }}>
          <WarnIcon />
        </span>
      )}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'valid' | 'errors' | 'success' | 'failed';

export interface ReviewTableProps {
  rows: MappedRow[];
  fields: string[];
  onRowUpdate: (rowId: string, field: string, value: string) => void;
  onDeleteSelected: (ids: string[]) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  showImportStatus: boolean;
}

// ── ReviewTable ───────────────────────────────────────────────────────────────

export function ReviewTable({ rows, fields, onRowUpdate, onDeleteSelected, filter, onFilterChange, showImportStatus }: ReviewTableProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const allSelected = rows.length > 0 && selected.size === rows.length;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r._id)));
  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const rowAsRecord = (row: MappedRow): Record<string, string> =>
    row as unknown as Record<string, string>;

  const sorted = [...rows].sort((a, b) => {
    if (!sortField) return 0;
    const av = rowAsRecord(a)[sortField] ?? '';
    const bv = rowAsRecord(b)[sortField] ?? '';
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const filtered = sorted.filter((row) => {
    if (!filter || filter === 'all') return true;
    if (filter === 'errors') return Object.keys(row._errors ?? {}).length > 0;
    if (filter === 'valid') return Object.keys(row._errors ?? {}).length === 0;
    if (filter === 'success') return row._status === 'success';
    if (filter === 'failed') return row._status === 'failed';
    return true;
  });

  const errorCount = rows.filter((r) => Object.keys(r._errors ?? {}).length > 0).length;
  const validCount = rows.length - errorCount;

  const handleCellSave = (rowId: string, field: string, value: string) => {
    onRowUpdate(rowId, field, value);
    setSelected((s) => new Set(s));
  };

  const filterOptions: Array<{ val: FilterType; label: string; variant?: 'ok' | 'danger' }> = [
    { val: 'all', label: `All (${rows.length})` },
    { val: 'valid', label: `Valid (${validCount})`, variant: 'ok' },
    { val: 'errors', label: `Errors (${errorCount})`, variant: 'danger' },
    ...(showImportStatus
      ? [
          { val: 'success' as FilterType, label: 'Imported', variant: 'ok' as const },
          { val: 'failed' as FilterType, label: 'Failed', variant: 'danger' as const },
        ]
      : []),
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="tabs">
          {filterOptions.map((f) => (
            <button
              key={f.val}
              type="button"
              className={`tab${filter === f.val ? ' active' : ''}`}
              onClick={() => onFilterChange(f.val)}
              style={{
                color: filter === f.val
                  ? (f.variant === 'ok' ? 'var(--ok)' : f.variant === 'danger' ? 'var(--danger)' : undefined)
                  : undefined,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <button
            type="button"
            className="btn btn-sm"
            style={{ marginLeft: 'auto', borderColor: 'color-mix(in srgb, var(--danger) 60%, var(--border-2))', color: 'var(--danger)' }}
            onClick={() => { onDeleteSelected([...selected]); setSelected(new Set()); }}
          >
            Delete {selected.size} row{selected.size > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Table container */}
      <div className="card" style={{ overflow: 'hidden', maxHeight: 460, overflowY: 'auto' }}>
        <table style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: 40, padding: '9px 10px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = selected.size > 0 && !allSelected; }}
                  onChange={toggleAll}
                  style={{ width: 15, height: 15, cursor: 'pointer' }}
                />
              </th>
              <th style={{ width: 40 }}>#</th>
              <th style={{ width: 90 }}>Status</th>
              {fields.map((field) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                >
                  {FIELD_LABELS[field] ?? field}
                  {sortField === field && (
                    <span style={{ marginLeft: 4, opacity: 0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const hasError = Object.keys(row._errors ?? {}).length > 0;
              const isSelected = selected.has(row._id);
              return (
                <tr
                  key={row._id}
                  style={{
                    background:
                      row._status === 'success' ? 'color-mix(in srgb, var(--ok) 8%, transparent)' :
                      row._status === 'failed' ? 'color-mix(in srgb, var(--danger) 8%, transparent)' :
                      hasError ? 'color-mix(in srgb, var(--danger) 5%, transparent)' :
                      isSelected ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <td style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(row._id)}
                      style={{ width: 15, height: 15, cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{rows.indexOf(row) + 1}</td>
                  <td>
                    <StatusBadge errors={row._errors} status={row._status} />
                  </td>
                  {fields.map((field) => (
                    <td key={field} style={{ padding: '5px 8px', minWidth: 120 }}>
                      <EditableCell
                        value={rowAsRecord(row)[field]}
                        error={row._errors?.[field]}
                        field={field}
                        readOnly={!!row._status}
                        onSave={(val) => handleCellSave(row._id, field, val)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={fields.length + 3} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
                  No rows match the current filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
