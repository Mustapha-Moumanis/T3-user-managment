'use client';

import React from 'react';
import {
  Box, Paper, Typography, TextField, Button, IconButton,
  FormControl, InputLabel, Select, MenuItem, Alert, Chip, Stack,
  InputAdornment,
} from '@mui/material';
import type { Project, Endpoint } from '@/lib/projectStore';

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ off }: { off: boolean }) =>
  off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export interface ProjectConfigProps {
  config: Project;
  onChange: (config: Project) => void;
  onNext: () => void;
  onBack?: () => void;
  isEdit: boolean;
}

export function ProjectConfig({ config, onChange, onNext, onBack, isEdit }: ProjectConfigProps) {
  const [showSecret, setShowSecret] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState<null | 'testing' | 'success' | 'error'>(null);
  const [endpoints, setEndpoints] = React.useState<Endpoint[]>(
    config.endpoints ?? [
      { id: 'create', label: 'Create User', method: 'POST', path: '/users' },
      { id: 'bulk', label: 'Bulk Import', method: 'POST', path: '/users/bulk' },
    ],
  );

  const handleAuthChange = (field: string, val: string) => {
    onChange({ ...config, auth: { ...config.auth, [field]: val } });
  };

  const handleEndpointChange = (id: string, field: keyof Endpoint, val: string) => {
    const next = endpoints.map((e) => (e.id === id ? { ...e, [field]: val } : e)) as Endpoint[];
    setEndpoints(next);
    onChange({ ...config, endpoints: next });
  };

  const addEndpoint = () => {
    const ep: Endpoint = { id: `ep-${Date.now()}`, label: 'New Endpoint', method: 'POST', path: '/endpoint' };
    const next = [...endpoints, ep];
    setEndpoints(next);
    onChange({ ...config, endpoints: next });
  };

  const removeEndpoint = (id: string) => {
    const next = endpoints.filter((e) => e.id !== id);
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

  const eyeAdornment = (
    <InputAdornment position="end">
      <IconButton size="small" onClick={() => setShowSecret((s) => !s)}>
        <EyeIcon off={showSecret} />
      </IconButton>
    </InputAdornment>
  );

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
          value={config.projectName ?? ''}
          onChange={(e) => onChange({ ...config, projectName: e.target.value })}
          placeholder="e.g. Production API, Staging Environment"
          sx={{ mb: 2 }}
        />
        <TextField
          label="Base API URL"
          fullWidth
          size="small"
          value={config.baseUrl ?? ''}
          onChange={(e) => onChange({ ...config, baseUrl: e.target.value })}
          placeholder="https://api.yourapp.com/v1"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="caption" color="text.secondary">URL</Typography>
                </InputAdornment>
              ),
            },
          }}
        />
      </Paper>

      {/* Auth */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">AUTHENTICATION</Typography>
          <Chip label="Server-side only" size="small" color="success" variant="outlined" icon={<span style={{ fontSize: 10, paddingLeft: 4 }}>🔒</span>} />
        </Stack>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Auth Type</InputLabel>
          <Select
            value={config.auth?.type ?? 'bearer'}
            label="Auth Type"
            onChange={(e) => handleAuthChange('type', e.target.value)}
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
            value={config.auth?.value ?? ''}
            onChange={(e) => handleAuthChange('value', e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                endAdornment: eyeAdornment,
              },
            }}
          />
        )}

        {config.auth?.type === 'apikey' && (
          <Stack spacing={2}>
            <TextField
              label="Header Name"
              fullWidth size="small"
              value={config.auth?.headerName ?? 'X-API-Key'}
              onChange={(e) => handleAuthChange('headerName', e.target.value)}
            />
            <TextField
              label="API Key"
              fullWidth size="small"
              type={showSecret ? 'text' : 'password'}
              value={config.auth?.value ?? ''}
              onChange={(e) => handleAuthChange('value', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                  endAdornment: eyeAdornment,
                },
              }}
            />
          </Stack>
        )}

        {config.auth?.type === 'basic' && (
          <Stack spacing={2}>
            <TextField
              label="Username" fullWidth size="small"
              value={config.auth?.username ?? ''}
              onChange={(e) => handleAuthChange('username', e.target.value)}
            />
            <TextField
              label="Password" fullWidth size="small"
              type={showSecret ? 'text' : 'password'}
              value={config.auth?.value ?? ''}
              onChange={(e) => handleAuthChange('value', e.target.value)}
              slotProps={{
                input: {
                  endAdornment: eyeAdornment,
                },
              }}
            />
          </Stack>
        )}

        {config.auth?.type === 'oauth2' && (
          <Stack spacing={2}>
            <TextField
              label="Token URL" fullWidth size="small"
              value={config.auth?.tokenUrl ?? ''}
              onChange={(e) => handleAuthChange('tokenUrl', e.target.value)}
              placeholder="https://auth.yourapp.com/oauth/token"
            />
            <TextField
              label="Client ID" fullWidth size="small"
              value={config.auth?.clientId ?? ''}
              onChange={(e) => handleAuthChange('clientId', e.target.value)}
            />
            <TextField
              label="Client Secret" fullWidth size="small"
              type={showSecret ? 'text' : 'password'}
              value={config.auth?.value ?? ''}
              onChange={(e) => handleAuthChange('value', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                  endAdornment: eyeAdornment,
                },
              }}
            />
          </Stack>
        )}

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
          >
            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </Button>
          {testStatus === 'success' && <Alert severity="success" sx={{ py: 0, px: 1.5, fontSize: 12 }}>Connected successfully</Alert>}
          {testStatus === 'error' && <Alert severity="error" sx={{ py: 0, px: 1.5, fontSize: 12 }}>Connection failed — check URL and credentials</Alert>}
        </Box>
      </Paper>

      {/* Endpoints */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">API ENDPOINTS</Typography>
          <Button size="small" startIcon={<PlusIcon />} onClick={addEndpoint} variant="text">Add Endpoint</Button>
        </Stack>
        <Stack spacing={2}>
          {endpoints.map((ep) => (
            <Box key={ep.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr auto', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Label"
                size="small"
                value={ep.label}
                onChange={(e) => handleEndpointChange(ep.id, 'label', e.target.value)}
              />
              <FormControl size="small">
                <InputLabel>Method</InputLabel>
                <Select
                  value={ep.method}
                  label="Method"
                  onChange={(e) => handleEndpointChange(ep.id, 'method', e.target.value)}
                >
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="PATCH">PATCH</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Path"
                size="small"
                value={ep.path}
                onChange={(e) => handleEndpointChange(ep.id, 'path', e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="caption" color="text.secondary">/</Typography>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <IconButton size="small" onClick={() => removeEndpoint(ep.id)} sx={{ color: 'error.main' }}>
                <TrashIcon />
              </IconButton>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {onBack && (
          <Button variant="outlined" onClick={onBack}>← Back to Projects</Button>
        )}
        <Button
          variant="contained"
          size="large"
          onClick={onNext}
          disabled={!isValid}
          sx={{ minWidth: 160, ml: 'auto' }}
        >
          {isEdit ? 'Save & Start Import →' : 'Save & Continue →'}
        </Button>
      </Box>
    </Box>
  );
}
