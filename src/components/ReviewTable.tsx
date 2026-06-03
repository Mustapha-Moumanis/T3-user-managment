'use client';

import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { type ProcessedRow } from '@/lib/validation';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

function StatusBadge({ errors, importStatus, errorMessage }: {
  errors: Record<string, string>;
  importStatus: ProcessedRow['import']['status'];
  errorMessage?: string | null;
}) {
  if (importStatus === 'success') return <Badge variant="success"><Check className="h-2.5 w-2.5" strokeWidth={3} /> Imported</Badge>;
  if (importStatus === 'server-error') return <Badge variant="destructive" title={errorMessage || 'Import failed'}><AlertCircle className="h-2.5 w-2.5" /> Failed</Badge>;
  if (importStatus === 'skipped') return <Badge variant="secondary">Skipped</Badge>;
  const errCount = Object.keys(errors).length;
  if (errCount === 0) return <Badge variant="success"><Check className="h-2.5 w-2.5" strokeWidth={3} /> Valid</Badge>;
  return <Badge variant="destructive"><AlertCircle className="h-2.5 w-2.5" /> {errCount} error{errCount > 1 ? 's' : ''}</Badge>;
}

function EditableCell({ value, error, field, onSave, readOnly }: {
  value: string | undefined;
  error: string | undefined;
  field: string;
  onSave: (v: string) => void;
  readOnly: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? '');
  React.useEffect(() => { setDraft(value ?? ''); }, [value]);
  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value ?? ''); setEditing(false); };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 140 }}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          style={{ flex: 1, height: 28, border: '1px solid hsl(var(--input))', borderRadius: 'calc(var(--radius) - 4px)', padding: '0 8px', fontSize: 13, background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
        />
        <button type="button" onClick={commit} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--success))', padding: 2 }}><Check size={12} strokeWidth={3} /></button>
        <button type="button" onClick={cancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 2 }}><X size={12} /></button>
      </div>
    );
  }

  return (
    <div
      title={error}
      onClick={() => !readOnly && setEditing(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        minWidth: 80, padding: '3px 6px', borderRadius: 6, cursor: readOnly ? 'default' : 'text',
        border: `1px solid ${error ? 'hsl(var(--destructive) / 0.5)' : 'transparent'}`,
        background: error ? 'hsl(var(--destructive) / 0.05)' : 'transparent',
      }}
    >
      <span
        className={field === 'email' || field === 'external_id' ? 'mono' : ''}
        style={{ fontSize: 13, color: error ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}
      >
        {value ?? <span style={{ opacity: 0.3 }}>—</span>}
      </span>
      {error && <AlertCircle size={12} style={{ flexShrink: 0, color: 'hsl(var(--destructive))' }} />}
    </div>
  );
}

type FilterType = 'all' | 'valid' | 'errors' | 'success' | 'failed';

export interface ReviewTableProps {
  rows: ProcessedRow[];
  fields: string[];
  onRowUpdate: (rowId: string, field: string, value: string) => void;
  onDeleteSelected: (ids: string[]) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  showImportStatus: boolean;
  fieldLabels?: Record<string, string>;
}

export function ReviewTable({ rows, fields, onRowUpdate, onDeleteSelected, filter, onFilterChange, showImportStatus, fieldLabels = {} }: ReviewTableProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r._id)));
  const toggleRow = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const errorCount = rows.filter((r) => Object.keys(r.validation.errors).length > 0).length;
  const validCount = rows.length - errorCount;

  const sorted = [...rows].sort((a, b) => {
    if (!sortField) return 0;
    const av = a.data[sortField] ?? '';
    const bv = b.data[sortField] ?? '';
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const filtered = sorted.filter((r) => {
    if (!filter || filter === 'all') return true;
    if (filter === 'errors') return Object.keys(r.validation.errors).length > 0;
    if (filter === 'valid') return Object.keys(r.validation.errors).length === 0;
    if (filter === 'success') return r.import.status === 'success';
    if (filter === 'failed') return r.import.status === 'server-error';
    return true;
  });

  const filterTabs = [
    { val: 'all' as FilterType, label: `All (${rows.length})` },
    { val: 'valid' as FilterType, label: `Valid (${validCount})` },
    { val: 'errors' as FilterType, label: `Errors (${errorCount})` },
    ...(showImportStatus ? [
      { val: 'success' as FilterType, label: 'Imported' },
      { val: 'failed' as FilterType, label: 'Failed' },
    ] : []),
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Tabs value={filter} onValueChange={(v) => onFilterChange(v as FilterType)}>
          <TabsList>
            {filterTabs.map((f) => (
              <TabsTrigger key={f.val} value={f.val}>{f.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', maxHeight: 460 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'hsl(var(--muted) / 0.4)' }}>
                <th style={{ width: 36, padding: '10px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
                  <Checkbox
                    checked={allSelected}
                    data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th style={{ width: 36, padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>#</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>Status</th>
                {fields.map((field) => (
                  <th
                    key={field}
                    onClick={() => { if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc'); } }}
                    style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                  >
                    {fieldLabels[field] ?? field}
                    {sortField === field && <span style={{ marginLeft: 4, opacity: 0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                ))}
                <th style={{ padding: '10px 14px', borderBottom: '1px solid hsl(var(--border))' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const hasError = Object.keys(row.validation.errors).length > 0;
                const isSelected = selected.has(row._id);
                return (
                  <tr
                    key={row._id}
                    style={{
                      borderBottom: '1px solid hsl(var(--border))',
                      background:
                        row.import.status === 'success' ? 'hsl(var(--success) / 0.04)' :
                        row.import.status === 'server-error' ? 'hsl(var(--destructive) / 0.05)' :
                        hasError ? 'hsl(var(--destructive) / 0.04)' :
                        isSelected ? 'hsl(var(--brand) / 0.04)' : 'transparent',
                    }}
                  >
                    <td style={{ width: 36, padding: '10px 14px' }}>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(row._id)} />
                    </td>
                    <td style={{ padding: '10px 14px', color: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge errors={row.validation.errors} importStatus={row.import.status} errorMessage={row.import.errorMessage} />
                    </td>
                    {fields.map((field) => (
                      <td key={field} style={{ padding: '5px 8px', minWidth: 120 }}>
                        <EditableCell
                          value={row.data[field]}
                          error={row.validation.errors[field]}
                          field={field}
                          readOnly={row.import.status !== 'pending'}
                          onSave={(val) => { onRowUpdate(row._id, field, val); setSelected((s) => new Set(s)); }}
                        />
                      </td>
                    ))}
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                      {row.import.errorMessage ?? ''}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={fields.length + 4} style={{ textAlign: 'center', padding: '32px 0', color: 'hsl(var(--muted-foreground))' }}>
                    No rows match the current filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
            {filtered.length} of {rows.length} rows shown
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={selected.size === 0}
            onClick={() => { onDeleteSelected([...selected]); setSelected(new Set()); }}
            style={{ opacity: selected.size === 0 ? 0.5 : 1 }}
          >
            <Trash2 size={14} /> Delete selected ({selected.size})
          </Button>
        </div>
      </div>
    </div>
  );
}
