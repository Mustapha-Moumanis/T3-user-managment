
// Single user creation modal
const {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Typography, Alert, CircularProgress, Stack, Chip, IconButton, InputAdornment,
} = MaterialUI;

function AddUserModal({ open, onClose, config }) {
  const emptyForm = { email: '', name: '', role: '', phone: '', department: '' };
  const [form, setForm] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState({});
  const [status, setStatus] = React.useState(null); // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    // Clear error on change
    if (errors[field]) setErrors(e => { const n = {...e}; delete n[field]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!window.EMAIL_RE.test(form.email.trim())) errs.email = 'Invalid email format';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.phone && !window.PHONE_RE.test(form.phone.trim())) errs.phone = 'Invalid phone format';
    if (form.role && !window.VALID_ROLES_LIST.includes(form.role.toLowerCase())) errs.role = 'Invalid role';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStatus('loading');
    // Simulate API call
    setTimeout(() => {
      if (Math.random() > 0.15) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg('API returned 409: user already exists');
      }
    }, 1200);
  };

  const handleClose = () => {
    setForm(emptyForm);
    setErrors({});
    setStatus(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight={700}>Add Single User</Typography>
            {config?.projectName && (
              <Typography variant="caption" color="text.secondary">via {config.projectName}</Typography>
            )}
          </Box>
          <Chip
            label={config?.auth?.type?.toUpperCase() || 'BEARER'}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {status === 'success' ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h2" sx={{ mb: 1 }}>✅</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>User Created!</Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>{form.name}</strong> ({form.email}) was added successfully.
            </Typography>
            <Button variant="contained" sx={{ mt: 3 }} onClick={handleClose}>Done</Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {status === 'error' && (
              <Alert severity="error">{errorMsg}</Alert>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Email *"
                fullWidth
                size="small"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                disabled={status === 'loading'}
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
              <TextField
                label="Full Name *"
                fullWidth
                size="small"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                disabled={status === 'loading'}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl size="small" error={!!errors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={form.role}
                  label="Role"
                  onChange={e => handleChange('role', e.target.value)}
                  disabled={status === 'loading'}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {window.VALID_ROLES_LIST.map(r => (
                    <MenuItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Phone"
                fullWidth
                size="small"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="+1-555-0100"
                disabled={status === 'loading'}
              />
            </Box>
            <TextField
              label="Department"
              fullWidth
              size="small"
              value={form.department}
              onChange={e => handleChange('department', e.target.value)}
              disabled={status === 'loading'}
              placeholder="Engineering, Marketing…"
            />

            {config?.endpoints && (
              <Alert severity="info" sx={{ fontSize: 12 }}>
                Will POST to <code>{config.baseUrl}{config.endpoints.find(e => e.id === 'create')?.path || '/users'}</code>
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      {status !== 'success' && (
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={handleClose} variant="outlined" disabled={status === 'loading'}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={status === 'loading'}
            startIcon={status === 'loading' ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {status === 'loading' ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

Object.assign(window, { AddUserModal });
