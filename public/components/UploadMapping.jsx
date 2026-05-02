
// Upload & Column Mapping step
const {
  Box, Paper, Typography, Button, Select, MenuItem,
  FormControl, InputLabel, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, Stack, Alert, LinearProgress,
  IconButton, Tooltip,
} = MaterialUI;

const CANONICAL_FIELDS = [
  { key: 'email', label: 'Email', required: true },
  { key: 'name', label: 'Full Name', required: true },
  { key: 'first_name', label: 'First Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'role', label: 'Role', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'department', label: 'Department', required: false },
  { key: 'external_id', label: 'External ID', required: false },
  { key: '_skip', label: '— Skip Column —', required: false },
];

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

function UploadMapping({ rawData, mapping, onMappingChange, onFileLoad, onNext, onBack }) {
  const [dragging, setDragging] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const fileInputRef = React.useRef();

  const handleFile = (file) => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        const text = e.target.result;
        const parsed = window.parseCSVText(text);
        const autoMap = window.autoDetectMapping(parsed.headers);
        onFileLoad(parsed, autoMap);
        setLoading(false);
      }, 400);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);

  const usedFields = Object.values(mapping).filter(v => v && v !== '_skip');
  const hasDupeMapping = usedFields.length !== new Set(usedFields).size;

  const isValid = rawData && mapping.email && mapping.name && !hasDupeMapping;

  const previewRows = rawData ? rawData.rows.slice(0, 4) : [];

  const handleLoadDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const demoCSV = `email,full_name,phone,role,department,user_id
alice@acme.com,Alice Johnson,+1-555-0101,admin,Engineering,U001
bob@acme.com,Bob Smith,+1-555-0102,editor,Marketing,U002
carol@acme.com,Carol White,,viewer,Design,U003
dave.invalid,Dave Brown,555-9999,superadmin,Sales,U004
alice@acme.com,Alice Duplicate,,viewer,HR,U005
eve@acme.com,Eve Davis,+1-555-0106,analyst,Data,U006
frank@acme.com,,+1-555-0107,developer,Engineering,U007
grace@acme.com,Grace Lee,+1-555-0108,manager,Product,U008`;
      const parsed = window.parseCSVText(demoCSV);
      const autoMap = window.autoDetectMapping(parsed.headers);
      onFileLoad(parsed, autoMap);
      setLoading(false);
    }, 600);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>Upload & Map Columns</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a CSV or XLSX file, then verify the column mapping below.
      </Typography>

      {/* Upload zone */}
      {!rawData && (
        <Paper
          variant="outlined"
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          sx={{
            p: 5, mb: 3, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
            borderStyle: 'dashed',
            borderColor: dragging ? 'primary.main' : 'divider',
            bgcolor: dragging ? 'action.hover' : 'transparent',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={handleInputChange} />
          <UploadIcon />
          <Typography variant="h6" sx={{ mt: 1.5, mb: 0.5 }}>Drop your file here</Typography>
          <Typography variant="body2" color="text.secondary">CSV or XLSX — up to 10,000 rows</Typography>
          <Button variant="outlined" size="small" sx={{ mt: 2, mr: 1 }} onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}>
            Browse File
          </Button>
          <Button variant="text" size="small" sx={{ mt: 2 }} onClick={e => { e.stopPropagation(); handleLoadDemo(); }}>
            Load Demo Data
          </Button>
        </Paper>
      )}

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 4 }} />}

      {rawData && (
        <>
          {/* File info */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <FileIcon />
                <Box>
                  <Typography variant="body2" fontWeight={600}>{rawData.fileName || 'uploaded-file.csv'}</Typography>
                  <Typography variant="caption" color="text.secondary">{rawData.rows.length} rows · {rawData.headers.length} columns detected</Typography>
                </Box>
              </Stack>
              <Button size="small" variant="text" onClick={() => onFileLoad(null, {})}>Replace</Button>
            </Stack>
          </Paper>

          {/* Column mapping */}
          <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>COLUMN MAPPING</Typography>
            {hasDupeMapping && (
              <Alert severity="warning" sx={{ mb: 2 }}>Some fields are mapped to multiple columns — each field should be mapped once.</Alert>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 1.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>SOURCE COLUMN</Typography>
              <Box />
              <Typography variant="caption" color="text.secondary" fontWeight={700}>MAPS TO</Typography>

              {rawData.headers.map(header => {
                const mappedTo = Object.entries(mapping).find(([, v]) => v === header)?.[0];
                return (
                  <React.Fragment key={header}>
                    <Paper variant="outlined" sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{header}</Typography>
                      {previewRows.slice(0, 2).map((r, i) => (
                        <Chip key={i} label={r[header] || '—'} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                      ))}
                    </Paper>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>→</Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={mappedTo || '_skip'}
                        onChange={e => {
                          const newMapping = { ...mapping };
                          // Remove old mapping for this header
                          Object.keys(newMapping).forEach(k => { if (newMapping[k] === header) delete newMapping[k]; });
                          if (e.target.value !== '_skip') newMapping[e.target.value] = header;
                          onMappingChange(newMapping);
                        }}
                        displayEmpty
                        sx={{ '& .MuiSelect-select': { py: 0.75 } }}
                      >
                        {CANONICAL_FIELDS.map(f => (
                          <MenuItem key={f.key} value={f.key}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <span>{f.label}</span>
                              {f.required && <Chip label="required" size="small" color="primary" sx={{ fontSize: 9, height: 16 }} />}
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </React.Fragment>
                );
              })}
            </Box>
          </Paper>

          {/* Preview */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>PREVIEW</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {rawData.headers.slice(0, 6).map(h => <TableCell key={h}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((row, idx) => (
                  <TableRow key={idx}>
                    {rawData.headers.slice(0, 6).map(h => (
                      <TableCell key={h}>{row[h]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button onClick={onBack} variant="outlined">Back</Button>
            <Button onClick={onNext} variant="contained" disabled={!isValid}>Continue</Button>
          </Stack>
        </>
      )}
    </Box>
  );
}

Object.assign(window, { UploadMapping });
