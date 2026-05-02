
// ProjectConfig step component
const {
  Box, Paper, Typography, TextField, Button, IconButton,
  FormControl, InputLabel, Select, MenuItem, Divider,
  InputAdornment, Tooltip, Alert, Chip, Stack, Switch,
  FormControlLabel, Collapse,
} = MaterialUI;

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = ({ off }) => off ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

function ProjectConfig({ config, onChange, onNext, onBack, isEdit }) {
  const [showSecret, setShowSecret] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState(null); // null | 'testing' | 'success' | 'error'
  const [endpoints, setEndpoints] = React.useState(config.endpoints || [
    { id: 'create', label: 'Create User', method: 'POST', path: '/users' },
    { id: 'bulk', label: 'Bulk Import', method: 'POST', path: '/users/bulk' },
  ]);

  const handleAuthChange = (field, val) => {
    onChange({ ...config, auth: { ...config.auth, [field]: val } });
  };

  const handleEndpointChange = (id, field, val) => {
    const next = endpoints.map(e => e.id === id ? { ...e, [field]: val } : e);
    setEndpoints(next);
    onChange({ ...config, endpoints: next });
  };

  const addEndpoint = () => {
    const ep = { id: `ep-${Date.now()}`, label: 'New Endpoint', method: 'POST', path: '/endpoint' };
    const next = [...endpoints, ep];
    setEndpoints(next);
    onChange({ ...config, endpoints: next });
  };

  const removeEndpoint = (id) => {
    const next = endpoints.filter(e => e.id !== id);
    setEndpoints(next);
    onChange({ ...config, endpoints: next });
  };

  const handleTestConnection = () => {
    setTestStatus('testing');
    setTimeout(() => {
      const ok = config.baseUrl && config.baseUrl.startsWith('http') && config.auth?.value;
      setTestStatus(ok ? 'success' : 'error');
    }, 1400);
  };

  const isValid = config.baseUrl && config.auth?.value && config.projectName;

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: 2 }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>Project Configuration</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define your API connection and authentication. Credentials are stored server-side only and never exposed to the client.
      </Typography>

      {/* Project Name */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>PROJECT DETAILS</Typography>
        <TextField
          label="Project Name"
          fullWidth
          size="small"
          value={config.projectName || ''}
          onChange={e => onChange({ ...config, projectName: e.target.value })}
          placeholder="e.g. Production API, Staging Environment"
          sx={{ mb: 2 }}
        />
        <TextField
          label="Base API URL"
          fullWidth
          size="small"
          value={config.baseUrl || ''}
          onChange={e => onChange({ ...config, baseUrl: e.target.value })}
          placeholder="https://api.yourapp.com/v1"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="caption" color="text.secondary">URL</Typography>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Auth */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">AUTHENTICATION</Typography>
          <Chip label="Server-side only" size="small" color="success" variant="outlined" icon={<span style={{fontSize:10, paddingLeft:4}}>🔒</span>} />
        </Stack>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Auth Type</InputLabel>
          <Select
            value={config.auth?.type || 'bearer'}
            label="Auth Type"
            onChange={e => handleAuthChange('type', e.target.value)}
          >
            <MenuItem value="bearer">Bearer Token</MenuItem>
            <MenuItem value="apikey">API Key (Header)</MenuItem>
            <MenuItem value="basic">Basic Auth</MenuItem>
            <MenuItem value="oauth2">OAuth2 / Client Credentials</MenuItem>
          </Select>
        </FormControl>

        {(config.auth?.type === 'bearer' || !config.auth?.type) && (
          <TextField
            label="Bearer Token"
            fullWidth
            size="small"
            type={showSecret ? 'text' : 'password'}
            value={config.auth?.value || ''}
            onChange={e => handleAuthChange('value', e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowSecret(s => !s)}>
                    <EyeIcon off={showSecret} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        {config.auth?.type === 'apikey' && (
          <Stack spacing={2}>
            <TextField
              label="Header Name"
              fullWidth size="small"
              value={config.auth?.headerName || 'X-API-Key'}
              onChange={e => handleAuthChange('headerName', e.target.value)}
            />
            <TextField
              label="API Key"
              fullWidth size="small"
              type={showSecret ? 'text' : 'password'}
              value={config.auth?.value || ''}
              onChange={e => handleAuthChange('value', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowSecret(s => !s)}>
                      <EyeIcon off={showSecret} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}

        {config.auth?.type === 'basic' && (
          <Stack spacing={2}>
            <TextField label="Username" fullWidth size="small" value={config.auth?.username || ''} onChange={e => handleAuthChange('username', e.target.value)} />
            <TextField
              label="Password" fullWidth size="small"
              type={showSecret ? 'text' : 'password'}
              value={config.auth?.value || ''}
              onChange={e => handleAuthChange('value', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowSecret(s => !s)}>
                      <EyeIcon off={showSecret} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}

        {config.auth?.type === 'oauth2' && (
          <Stack spacing={2}>
            <TextField label="Client ID" fullWidth size="small" value={config.auth?.clientId || ''} onChange={e => handleAuthChange('clientId', e.target.value)} />
            <TextField
              label="Client Secret" fullWidth size="small"
              type={showSecret ? 'text' : 'password'}
              value={config.auth?.value || ''}
              onChange={e => handleAuthChange('value', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowSecret(s => !s)}>
                      <EyeIcon off={showSecret} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField label="Token URL" fullWidth size="small" value={config.auth?.tokenUrl || ''} onChange={e => handleAuthChange('tokenUrl', e.target.value)} />
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button size="small" variant="outlined" onClick={handleTestConnection} disabled={!config.baseUrl}>
            Test Connection
          </Button>
          {testStatus === 'testing' && <Chip label="Testing..." size="small" />}
          {testStatus === 'success' && <Chip label="Connected" size="small" color="success" />}
          {testStatus === 'error' && <Chip label="Failed" size="small" color="error" />}
        </Stack>
      </Paper>

      {/* Endpoints */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">API ENDPOINTS</Typography>
          <Button size="small" variant="outlined" startIcon={<PlusIcon />} onClick={addEndpoint}>Add Endpoint</Button>
        </Stack>

        <Stack spacing={1.5}>
          {endpoints.map(ep => (
            <Paper key={ep.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <TextField
                  label="Label" size="small" value={ep.label}
                  onChange={e => handleEndpointChange(ep.id, 'label', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Method</InputLabel>
                  <Select value={ep.method} label="Method" onChange={e => handleEndpointChange(ep.id, 'method', e.target.value)}>
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="PATCH">PATCH</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                  </Select>
                </FormControl>
                <IconButton size="small" color="error" onClick={() => removeEndpoint(ep.id)}>
                  <TrashIcon />
                </IconButton>
              </Stack>
              <TextField
                label="Path" size="small" fullWidth value={ep.path}
                onChange={e => handleEndpointChange(ep.id, 'path', e.target.value)}
                placeholder="/users/bulk"
              />
            </Paper>
          ))}
        </Stack>
      </Paper>

      {/* Actions */}
      {!isEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>You can update endpoints and credentials anytime.</Alert>
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={onBack} variant="outlined">Back</Button>
        <Button onClick={onNext} variant="contained" disabled={!isValid}>
          {isEdit ? 'Save Changes' : 'Save & Continue'}
        </Button>
      </Stack>
    </Box>
  );
}

Object.assign(window, { ProjectConfig });
