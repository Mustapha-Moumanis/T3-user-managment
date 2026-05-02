
// Import step: Review, Validate, Dry Run, Import with progress
const {
  Box, Paper, Typography, Button, Stack, Alert, LinearProgress,
  Chip, Divider, CircularProgress, Collapse, Tooltip,
} = MaterialUI;

const IMPORT_MODES = [
  { key: 'dryrun', label: 'Dry Run', desc: 'Validate only — no changes made', icon: '🔍' },
  { key: 'valid_only', label: 'Valid Rows Only', desc: 'Skip rows with errors', icon: '✅' },
  { key: 'full', label: 'Full Import', desc: 'Import all rows, report failures inline', icon: '🚀' },
];

function ReviewStep({ rows, fields, config, mappedRows, onBack, onRowUpdate, onDeleteSelected }) {
  const [importMode, setImportMode] = React.useState('valid_only');
  const [filter, setFilter] = React.useState('all');
  const [phase, setPhase] = React.useState('review'); // review | running | done
  const [progress, setProgress] = React.useState(0);
  const [currentRow, setCurrentRow] = React.useState(0);
  const [importedRows, setImportedRows] = React.useState(rows);
  const [summary, setSummary] = React.useState(null);

  React.useEffect(() => { setImportedRows(rows); }, [rows]);

  const errorRows = importedRows.filter(r => Object.keys(r._errors || {}).length > 0);
  const validRows = importedRows.filter(r => Object.keys(r._errors || {}).length === 0);

  const handleImport = () => {
    const toImport = importMode === 'valid_only' ? validRows : importedRows;
    if (toImport.length === 0) return;

    setPhase('running');
    setProgress(0);
    setCurrentRow(0);

    // Simulate row-by-row import
    let processed = 0;
    const results = [...importedRows];

    const processNext = () => {
      if (processed >= toImport.length) {
        // Done
        const successCount = results.filter(r => r._status === 'success').length;
        const failedCount = results.filter(r => r._status === 'failed').length;
        const skippedCount = results.filter(r => r._status === 'skipped').length;
        setSummary({ successCount, failedCount, skippedCount, total: importedRows.length });
        setImportedRows(results);
        setPhase('done');
        return;
      }

      const row = toImport[processed];
      const rowIdx = results.findIndex(r => r._id === row._id);

      // Simulate import (mock API call)
      const willFail = row._errors && Object.keys(row._errors).length > 0 && importMode === 'full'
        ? Math.random() > 0.3
        : false;

      setTimeout(() => {
        if (rowIdx !== -1) {
          if (importMode === 'dryrun') {
            results[rowIdx] = { ...results[rowIdx], _status: 'skipped' };
          } else {
            results[rowIdx] = {
              ...results[rowIdx],
              _status: willFail ? 'failed' : 'success',
              _errorMsg: willFail ? 'API returned 422: validation error' : null,
            };
          }
        }
        processed++;
        const pct = Math.round((processed / toImport.length) * 100);
        setProgress(pct);
        setCurrentRow(processed);
        processNext();
      }, 60 + Math.random() * 80);
    };

    // Mark skipped rows
    importedRows.forEach((r, i) => {
      if (importMode === 'valid_only' && Object.keys(r._errors || {}).length > 0) {
        results[i] = { ...r, _status: 'skipped' };
      }
    });

    processNext();
  };

  const handleRetryFailed = () => {
    const failed = importedRows.filter(r => r._status === 'failed');
    if (failed.length === 0) return;
    setPhase('running');
    setProgress(0);
    let processed = 0;
    const results = [...importedRows];

    const retryNext = () => {
      if (processed >= failed.length) {
        const successCount = results.filter(r => r._status === 'success').length;
        const failedCount = results.filter(r => r._status === 'failed').length;
        const skippedCount = results.filter(r => r._status === 'skipped').length;
        setSummary({ successCount, failedCount, skippedCount, total: importedRows.length });
        setImportedRows(results);
        setPhase('done');
        return;
      }
      const row = failed[processed];
      const rowIdx = results.findIndex(r => r._id === row._id);
      setTimeout(() => {
        if (rowIdx !== -1) {
          results[rowIdx] = { ...results[rowIdx], _status: Math.random() > 0.2 ? 'success' : 'failed' };
        }
        processed++;
        setProgress(Math.round((processed / failed.length) * 100));
        retryNext();
      }, 80 + Math.random() * 100);
    };
    retryNext();
  };

  const handleRowUpdate = (rowId, field, value) => {
    const next = importedRows.map(r => r._id === rowId ? { ...r, [field]: value } : r);
    const validated = window.validateAllRows(next);
    setImportedRows(validated);
    onRowUpdate(validated);
  };

  const handleDeleteSelected = (ids) => {
    const remaining = importedRows.filter(r => !ids.includes(r._id));
    setImportedRows(remaining);
    onDeleteSelected(remaining);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            {phase === 'done' ? 'Import Complete' : 'Review & Import'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {phase === 'done'
              ? `${summary?.successCount} imported · ${summary?.failedCount} failed · ${summary?.skippedCount} skipped`
              : `${importedRows.length} rows · ${validRows.length} valid · ${errorRows.length} with errors`
            }
          </Typography>
        </Box>
        {phase === 'review' && (
          <Stack direction="row" spacing={1} alignItems="center">
            {errorRows.length > 0 && (
              <Alert severity="warning" sx={{ py: 0.25, px: 1.5 }}>
                Fix {errorRows.length} error{errorRows.length > 1 ? 's' : ''} before full import
              </Alert>
            )}
          </Stack>
        )}
      </Stack>

      {/* Import mode selector */}
      {phase === 'review' && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          {IMPORT_MODES.map(mode => (
            <Paper
              key={mode.key}
              variant="outlined"
              onClick={() => setImportMode(mode.key)}
              sx={{
                p: 1.5, borderRadius: 2, cursor: 'pointer', flex: 1, minWidth: 180,
                borderColor: importMode === mode.key ? 'primary.main' : 'divider',
                borderWidth: importMode === mode.key ? 2 : 1,
                bgcolor: importMode === mode.key ? 'primary.main' + '0D' : 'transparent',
                transition: 'all 0.15s',
                '&:hover': { borderColor: 'primary.light' },
              }}
            >
              <Typography variant="body2" sx={{ mb: 0.25 }}>
                <span style={{ marginRight: 6 }}>{mode.icon}</span>
                <strong>{mode.label}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">{mode.desc}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Progress bar (running) */}
      {phase === 'running' && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" fontWeight={600}>
              {importMode === 'dryrun' ? 'Validating' : 'Importing'} rows... ({currentRow} / {importedRows.length})
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {progress}% complete
          </Typography>
        </Paper>
      )}

      {/* Summary */}
      {phase === 'done' && summary && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', val: summary.total, color: 'default' },
            { label: 'Imported', val: summary.successCount, color: 'success' },
            { label: 'Failed', val: summary.failedCount, color: 'error' },
            { label: 'Skipped', val: summary.skippedCount, color: 'default' },
          ].map(s => (
            <Paper key={s.label} variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 100, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color={s.color !== 'default' ? `${s.color}.main` : 'text.primary'}>
                {s.val}
              </Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Table */}
      <ReviewTable
        rows={importedRows}
        fields={fields}
        filter={filter}
        onFilterChange={setFilter}
        onRowUpdate={handleRowUpdate}
        onDeleteSelected={handleDeleteSelected}
        showImportStatus={phase === 'done'}
      />

      {/* Actions */}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button onClick={onBack} variant="outlined">Back</Button>
        {phase === 'review' && (
          <Button onClick={handleImport} variant="contained" disabled={importedRows.length === 0}>Start Import</Button>
        )}
        {phase === 'done' && (
          <Button onClick={handleRetryFailed} variant="contained">Retry Failed</Button>
        )}
      </Stack>
    </Box>
  );
}

Object.assign(window, { ReviewStep });
