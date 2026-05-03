'use client';

import React from 'react';

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
    <div className="fixed right-4 bottom-4 w-80 z-50">
      <div className="card p-3 shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between gap-2.5">
          <div className="label">Tweaks</div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? 'Hide' : 'Show'}
          </button>
        </div>

        {open && (
          <div className="mt-3 max-h-[60vh] overflow-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

interface TweakSectionProps {
  title: string;
  children: React.ReactNode;
}

export function TweakSection({ title, children }: TweakSectionProps) {
  return (
    <div className="mb-3.5">
      <div className="label mb-2">{title}</div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
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
    <div className="field">
      <div className="label">{label}</div>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2.5 text-[var(--text-2)] text-sm">
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface TweakColorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function TweakColor({ label, value, onChange }: TweakColorProps) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-11 h-8 p-0 border border-[var(--border-2)] rounded-[10px] bg-transparent"
        />
        <span className="mono text-[13px] text-[var(--text-3)]">{value}</span>
      </div>
    </div>
  );
}

interface TweakToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function TweakToggle({ label, value, onChange }: TweakToggleProps) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-[var(--text-2)] text-sm">{label}</span>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

interface TweakButtonProps {
  label: string;
  onClick: () => void;
}

export function TweakButton({ label, onClick }: TweakButtonProps) {
  return (
    <button type="button" className="btn btn-secondary btn-sm w-full" onClick={onClick}>
      {label}
    </button>
  );
}
