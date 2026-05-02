'use client';

import React from 'react';
import {
  Box, Paper, Typography, Chip, Stack, IconButton, TextField,
  Tooltip, Checkbox, Button, Select, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

interface StatusBadgeProps {
  errors: Record<string, string> | undefined;
  status: MappedRow['_status'];
}

function StatusBadge({ errors, status }: StatusBadgeProps) {
  if (status === 'success') return <Chip label="Imported" size="small" color="success" sx={{ fontWeight: 700 }} />;
  if (status === 'failed') return <Chip label="Failed" size="small" color="error" sx={{ fontWeight: 700 }} />;
  if (status === 'skipped') return <Chip label="Skipped" size="small" sx={{ fontWeight: 700, bgcolor: 'action.selected' }} />;
  const errCount = Object.keys(errors ?? {}).length;
  if (errCount === 0) return <Chip label="Valid" size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />;
  return (
    <Chip
      label={`${errCount} error${errCount > 1 ? 's' : ''}`}
      size="small"
      color="error"
      variant="outlined"
      icon={<span style={{ paddingLeft: 4 }}><WarnIcon /></span>}
      sx={{ fontWeight: 700 }}
    />
  );
}

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

  const commit = () => {
    onSave(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 140 }}>
        {field === 'role' ? (
          <Select
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            size="small"
            autoFocus
            sx={{ fontSize: '0.8125rem', minWidth: 110, '& .MuiSelect-select': { py: 0.5 } }}
          >
            {VALID_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        ) : (
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
            size="small"
            autoFocus
            sx={{ '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8125rem' } }}
          />
        )}
        <IconButton size="small" onClick={commit} sx={{ color: 'success.main', p: 0.25 }}><CheckIcon /></IconButton>
        <IconButton size="small" onClick={cancel} sx={{ color: 'text.secondary', p: 0.25 }}><XIcon /></IconButton>
      </Box>
    );
  }

  return (
    <Tooltip title={error ?? ''} arrow placement="top">
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 80,
          px: 0.75, py: 0.25, borderRadius: 1, cursor: readOnly ? 'default' : 'text',
          border: '1px solid',
          borderColor: error ? 'error.main' : 'transparent',
          bgcolor: error ? 'error.main' + '14' : 'transparent',
          '&:hover': readOnly ? {} : { bgcolor: 'action.hover', borderColor: 'divider' },
          transition: 'all 0.1s',
          position: 'relative',
        }}
        onClick={() => !readOnly && setEditing(true)}
      >
        <Typography
          variant="body2"
          sx={{
            color: error ? 'error.main' : 'text.primary',
            fontFamily: field === 'email' || field === 'external_id' ? 'monospace' : 'inherit',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 200,
          }}
        >
          {value ?? <span style={{ opacity: 0.3 }}>—</span>}
        </Typography>
        {!readOnly && !error && (
          <Box sx={{ opacity: 0, '.MuiBox-root:hover > &': { opacity: 1 }, ml: 'auto' }}>
            <EditIcon />
          </Box>
        )}
        {error && (
          <Tooltip title={error} arrow>
            <Box sx={{ color: 'error.main', display: 'flex', ml: 'auto' }}>
              <WarnIcon />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Tooltip>
  );
}

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

  const filterOptions: Array<{ val: FilterType; label: string; color?: 'success' | 'error' | 'primary' }> = [
    { val: 'all', label: `All (${rows.length})` },
    { val: 'valid', label: `Valid (${validCount})`, color: 'success' },
    { val: 'errors', label: `Errors (${errorCount})`, color: 'error' },
    ...(showImportStatus
      ? [
          { val: 'success' as FilterType, label: 'Imported', color: 'success' as const },
          { val: 'failed' as FilterType, label: 'Failed', color: 'error' as const },
        ]
      : []),
  ];

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={0.5}>
          {filterOptions.map((f) => (
            <Chip
              key={f.val}
              label={f.label}
              size="small"
              color={filter === f.val ? (f.color ?? 'primary') : 'default'}
              variant={filter === f.val ? 'filled' : 'outlined'}
              onClick={() => onFilterChange(f.val)}
              sx={{ cursor: 'pointer', fontWeight: filter === f.val ? 700 : 400 }}
            />
          ))}
        </Stack>
        {selected.size > 0 && (
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={() => { onDeleteSelected([...selected]); setSelected(new Set()); }}
            sx={{ ml: 'auto' }}
          >
            Delete {selected.size} row{selected.size > 1 ? 's' : ''}
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 460 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'background.paper' } }}>
              <TableCell padding="checkbox" sx={{ width: 40 }}>
                <Checkbox size="small" checked={allSelected} indeterminate={selected.size > 0 && !allSelected} onChange={toggleAll} />
              </TableCell>
              <TableCell sx={{ width: 40 }}><Typography variant="caption" color="text.secondary">#</Typography></TableCell>
              <TableCell sx={{ width: 80 }}><Typography variant="caption" color="text.secondary">STATUS</Typography></TableCell>
              {fields.map((field) => (
                <TableCell key={field} onClick={() => handleSort(field)} sx={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{FIELD_LABELS[field] ?? field}</Typography>
                    {sortField === field && (
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</Typography>
                    )}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => {
              const hasError = Object.keys(row._errors ?? {}).length > 0;
              const isSelected = selected.has(row._id);
              return (
                <TableRow
                  key={row._id}
                  selected={isSelected}
                  sx={{
                    bgcolor: row._status === 'success' ? 'success.main' + '0A' :
                      row._status === 'failed' ? 'error.main' + '0A' :
                      hasError ? 'error.main' + '08' :
                      isSelected ? 'primary.main' + '10' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.15s',
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={isSelected} onChange={() => toggleRow(row._id)} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{rows.indexOf(row) + 1}</Typography>
                  </TableCell>
                  <TableCell>
                    <StatusBadge errors={row._errors} status={row._status} />
                  </TableCell>
                  {fields.map((field) => (
                    <TableCell key={field} sx={{ p: 0.5, minWidth: 120 }}>
                      <EditableCell
                        value={rowAsRecord(row)[field]}
                        error={row._errors?.[field]}
                        field={field}
                        readOnly={!!row._status}
                        onSave={(val) => handleCellSave(row._id, field, val)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={fields.length + 3} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No rows match the current filter</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
