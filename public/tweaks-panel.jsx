
// Tweaks panel + hook (lightweight demo helpers)
const {
  Box, Paper, Typography, IconButton, Collapse, Divider, Stack,
  FormControl, FormControlLabel, RadioGroup, Radio, Switch,
  TextField, Button, Tooltip,
} = MaterialUI;

const TWEAKS_STORAGE_KEY = 'uim_tweaks_v1';

function useTweaks(defaults) {
  const [tweaks, setTweaks] = React.useState(() => {
    try {
      const raw = localStorage.getItem(TWEAKS_STORAGE_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch {
      return defaults;
    }
  });

  React.useEffect(() => {
    try { localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(tweaks)); } catch {}
  }, [tweaks]);

  const setTweak = (key, value) => setTweaks(t => ({ ...t, [key]: value }));
  return [tweaks, setTweak];
}

function TweaksPanel({ children }) {
  const [open, setOpen] = React.useState(true);

  return (
    <Box sx={{ position: 'fixed', right: 16, bottom: 16, width: 320, zIndex: 1300 }}>
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
          <Typography variant="subtitle2" color="text.secondary">Tweaks</Typography>
          <Tooltip title={open ? 'Hide panel' : 'Show panel'}>
            <IconButton size="small" onClick={() => setOpen(o => !o)}>
              {open ? '▾' : '▸'}
            </IconButton>
          </Tooltip>
        </Stack>
        <Collapse in={open}>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 0.5 }}>
            {children}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}

function TweakSection({ title, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
        {title}
      </Typography>
      <Stack spacing={1.25}>{children}</Stack>
    </Box>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>{label}</Typography>
      <FormControl component="fieldset">
        <RadioGroup value={value} onChange={e => onChange(e.target.value)}>
          {options.map(opt => (
            <FormControlLabel key={opt.value} value={opt.value} control={<Radio size="small" />} label={opt.label} />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );
}

function TweakColor({ label, value, onChange }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>{label}</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          type="color"
          size="small"
          value={value}
          onChange={e => onChange(e.target.value)}
          sx={{ width: 56 }}
        />
        <Typography variant="caption" color="text.secondary">{value}</Typography>
      </Stack>
    </Box>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <FormControlLabel
      control={<Switch size="small" checked={!!value} onChange={e => onChange(e.target.checked)} />}
      label={label}
    />
  );
}

function TweakButton({ label, onClick }) {
  return (
    <Button size="small" variant="outlined" onClick={onClick} fullWidth>
      {label}
    </Button>
  );
}

Object.assign(window, { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakButton });
