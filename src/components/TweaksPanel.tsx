'use client';

import React from 'react';
import {
  Box, Paper, Typography, IconButton, Collapse, Divider, Stack,
  FormControl, FormControlLabel, RadioGroup, Radio, Switch,
  TextField, Button, Tooltip,
} from '@mui/material';

const TWEAKS_STORAGE_KEY = 'uim_tweaks_v1';

export type TweakValues = Record<string, string | boolean | number>;

export function useTweaks<T extends Record<string, unknown>>(defaults: T): [T, (key: keyof T, value: T[keyof T]) => void] {
  const [tweaks, setTweaks] = React.useState<T>(() => {
    try {
      const raw = localStorage.getItem(TWEAKS_STORAGE_KEY);
      return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<T>) } : defaults;
    } catch {
      return defaults;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(tweaks));
    } catch {
      // storage unavailable
    }
  }, [tweaks]);

  const setTweak = (key: keyof T, value: T[keyof T]) =>
    setTweaks((t) => ({ ...t, [key]: value }));

  return [tweaks, setTweak];
}

interface TweaksPanelProps {
  children: React.ReactNode;
}

export function TweaksPanel({ children }: TweaksPanelProps) {
  const [open, setOpen] = React.useState(true);

  return (
    <Box sx={{ position: 'fixed', right: 16, bottom: 16, width: 320, zIndex: 1300 }}>
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" color="text.secondary">Tweaks</Typography>
          <Tooltip title={open ? 'Hide panel' : 'Show panel'}>
            <IconButton size="small" onClick={() => setOpen((o) => !o)}>
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

interface TweakSectionProps {
  title: string;
  children: React.ReactNode;
}

export function TweakSection({ title, children }: TweakSectionProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
        {title}
      </Typography>
      <Stack spacing={1.25}>{children}</Stack>
    </Box>
  );
}

interface TweakRadioOption {
  value: string;
  label: string;
}

interface TweakRadioProps {
  label: string;
  value: string;
  options: TweakRadioOption[];
  onChange: (value: string) => void;
}

export function TweakRadio({ label, value, options, onChange }: TweakRadioProps) {
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>{label}</Typography>
      <FormControl component="fieldset">
        <RadioGroup value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio size="small" />}
              label={opt.label}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );
}

interface TweakColorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function TweakColor({ label, value, onChange }: TweakColorProps) {
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>{label}</Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <TextField
          type="color"
          size="small"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          sx={{ width: 56 }}
        />
        <Typography variant="caption" color="text.secondary">{value}</Typography>
      </Stack>
    </Box>
  );
}

interface TweakToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function TweakToggle({ label, value, onChange }: TweakToggleProps) {
  return (
    <FormControlLabel
      control={<Switch size="small" checked={!!value} onChange={(e) => onChange(e.target.checked)} />}
      label={label}
    />
  );
}

interface TweakButtonProps {
  label: string;
  onClick: () => void;
}

export function TweakButton({ label, onClick }: TweakButtonProps) {
  return (
    <Button size="small" variant="outlined" onClick={onClick} fullWidth>
      {label}
    </Button>
  );
}
