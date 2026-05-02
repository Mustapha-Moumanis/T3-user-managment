
// Spreadsheet-like Review Table component
const {
  Box, Paper, Typography, Chip, Stack, IconButton, TextField,
  Tooltip, Checkbox, Button, Select, MenuItem, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} = MaterialUI;

const FIELD_LABELS = {
  email: 'Email', name: 'Full Name', first_name: 'First Name',
  last_name: 'Last Name', role: 'Role', phone: 'Phone',
  department: 'Department', external_id: 'External ID',
};

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const WarnIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

function StatusBadge({ errors, status }) {
  if (status === 'success') return <Chip label="Imported" size="small" color="success" sx={{ fontWeight: 700 }} />;
  if (status === 'failed') return <Chip label="Failed" size="small" color="error" sx={{ fontWeight: 700 }} />;
  if (status === 'skipped') return <Chip label="Skipped" size="small" sx={{ fontWeight: 700, bgcolor: 'action.selected' }} />;
  const errCount = Object.keys(errors || {}).length;
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

function EditableCell({ value, error, field, onSave, readOnly }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value || '');

  React.useEffect(() => { setDraft(value || ''); }, [value]);

  const commit = () => {
    onSave(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 140 }}>
        {field === 'role' ? (
          <Select
            value={draft}
            onChange={e => setDraft(e.target.value)}
            size="small"
            autoFocus
            sx={{ fontSize: '0.8125rem', minWidth: 110, '& .MuiSelect-select': { py: 0.5 } }}
          >
            {window.VALID_ROLES_LIST.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        ) : (
          <TextField
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
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
    <Tooltip title={error || ''} arrow placement="top">
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
          {value || <span style={{ opacity: 0.3 }}>—</span>}
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

function ReviewTable({ rows, fields, onRowUpdate, onDeleteSelected, filter, onFilterChange, showImportStatus }) {
  const [selected, setSelected] = React.useState(new Set());
  const [sortField, setSortField] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');

  const allSelected = rows.length > 0 && selected.size === rows.length;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map(r => r._id)));
  const toggleRow = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortField) return 0;
    const av = a[sortField] || '';
    const bv = b[sortField] || '';
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const filtered = sorted.filter(row => {
    if (!filter || filter === 'all') return true;
    if (filter === 'errors') return Object.keys(row._errors || {}).length > 0;
    if (filter === 'valid') return Object.keys(row._errors || {}).length === 0;
    if (filter === 'success') return row._status === 'success';
    if (filter === 'failed') return row._status === 'failed';
    return true;
  });

  const errorCount = rows.filter(r => Object.keys(r._errors || {}).length > 0).length;
  const validCount = rows.length - errorCount;

  const handleCellSave = (rowId, field, value) => {
    onRowUpdate(rowId, field, value);
    setSelected(s => { const n = new Set(s); return n; });
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={0.5}>
          {[
            { key: 'all', label: 'All', count: rows.length },
            { key: 'valid', label: 'Valid', count: validCount },
            { key: 'errors', label: 'Errors', count: errorCount },
            showImportStatus && { key: 'success', label: 'Imported', count: rows.filter(r => r._status === 'success').length },
            showImportStatus && { key: 'failed', label: 'Failed', count: rows.filter(r => r._status === 'failed').length },
          ].filter(Boolean).map(tab => (
            <Chip
              key={tab.key}
              label={`${tab.label} (${tab.count})`}
              size="small"
              variant={filter === tab.key ? 'filled' : 'outlined'}
              color={filter === tab.key ? 'primary' : 'default'}
              onClick={() => onFilterChange(tab.key)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1} alignItems="center">
          {selected.size > 0 && (
            <Button size="small" color="error" variant="outlined" onClick={() => onDeleteSelected(Array.from(selected))}>
              Delete Selected
            </Button>
          )}
          <Tooltip title="Filter rows">
            <IconButton size="small"><FilterIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </TableCell>
                {fields.map(f => (
                  <TableCell key={f} onClick={() => handleSort(f)} sx={{ cursor: 'pointer' }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <span>{FIELD_LABELS[f] || f}</span>
                      {sortField === f && <span style={{ fontSize: 10 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </Stack>
                  </TableCell>
                ))}
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.has(row._id)} onChange={() => toggleRow(row._id)} />
                  </TableCell>
                  {fields.map(field => (
                    <TableCell key={field}>
                      <EditableCell
                        value={row[field]}
                        field={field}
                        error={row._errors?.[field]}
                        onSave={(val) => handleCellSave(row._id, field, val)}
                        readOnly={showImportStatus}
                      />
                    </TableCell>
                  ))}
                  <TableCell><StatusBadge errors={row._errors} status={row._status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filtered.length === 0 && (
          <Box sx={{ p: 3 }}>
            <Alert severity="info">No rows match this filter.</Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

Object.assign(window, { ReviewTable });
