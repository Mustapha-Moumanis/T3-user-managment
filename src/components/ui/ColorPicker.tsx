"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

// ── Color math ────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace(/^#/, "");
  if (h.length === 3)
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  if (h.length === 6)
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  return null;
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, max === 0 ? 0 : d / max, max];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const hh = h / 60;
  const i = Math.floor(hh);
  const f = hh - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const table: [number, number, number][] = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ];
  return table[i % 6].map((x) => x * 255) as [number, number, number];
}

function hexToHsv(hex: string): [number, number, number] {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsv(...rgb) : [0, 0, 1];
}

function hsvToHex(h: number, s: number, v: number) {
  return rgbToHex(...hsvToRgb(h, s, v));
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// ── Popover ───────────────────────────────────────────────────────────────────

interface ColorPickerPopoverProps {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  anchor: { top: number; left: number };
}

export function ColorPickerPopover({
  value,
  onChange,
  onClose,
  anchor,
}: ColorPickerPopoverProps) {
  const [hsv, setHsv] = useState<[number, number, number]>(() =>
    hexToHsv(value)
  );
  const [hexDraft, setHexDraft] = useState(value);
  const fieldRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const [h, s, v] = hsv;
  const pureHue = `hsl(${h}, 100%, 50%)`;
  const currentHex = hsvToHex(h, s, v);

  // Sync when an external value change arrives (e.g. preset clicked while open)
  useEffect(() => {
    if (!HEX_RE.test(value)) return;
    if (currentHex.toLowerCase() === value.toLowerCase()) return;
    const next = hexToHsv(value);
    setHsv(next);
    setHexDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = useCallback(
    (nh: number, ns: number, nv: number) => {
      const hex = hsvToHex(nh, ns, nv);
      setHexDraft(hex);
      onChange(hex);
    },
    [onChange]
  );

  const updateFromField = useCallback(
    (clientX: number, clientY: number) => {
      const el = fieldRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ns = clamp((clientX - rect.left) / rect.width, 0, 1);
      const nv = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
      setHsv([h, ns, nv]);
      commit(h, ns, nv);
    },
    [h, commit]
  );

  const onFieldDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    updateFromField(e.clientX, e.clientY);
  };

  const onFieldMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    updateFromField(e.clientX, e.clientY);
  };

  const onFieldUp = () => {
    dragging.current = false;
  };

  // Smart positioning: keep popover inside the viewport
  const left = Math.min(anchor.left, window.innerWidth - 240);
  const top = anchor.top;

  return createPortal(
    <div
      className="cp-popover"
      style={{ top, left }}
      // Prevent document mousedown handler from treating interior clicks as "outside"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Saturation + brightness 2-D field */}
      <div
        ref={fieldRef}
        className="cp-field"
        style={{
          background: `
            linear-gradient(to bottom, transparent, #000),
            linear-gradient(to right, #fff, ${pureHue})
          `,
        }}
        onPointerDown={onFieldDown}
        onPointerMove={onFieldMove}
        onPointerUp={onFieldUp}
      >
        <div
          className="cp-handle"
          style={{
            left: `${s * 100}%`,
            top: `${(1 - v) * 100}%`,
            background: currentHex,
          }}
        />
      </div>

      {/* Hue slider */}
      <div className="cp-hue-track">
        <input
          type="range"
          min={0}
          max={359}
          step={1}
          value={Math.round(h)}
          onChange={(e) => {
            const nh = Number(e.target.value);
            setHsv([nh, s, v]);
            commit(nh, s, v);
          }}
          className="cp-hue"
          aria-label="Hue"
        />
      </div>

      {/* Preview swatch + hex input + done */}
      <div className="cp-footer">
        <span
          className="cp-preview"
          style={{ background: currentHex }}
          aria-hidden
        />
        <input
          className="cp-hex"
          value={hexDraft}
          onChange={(e) => {
            const raw = e.target.value.startsWith("#")
              ? e.target.value
              : `#${e.target.value}`;
            setHexDraft(e.target.value);
            if (HEX_RE.test(raw)) {
              const next = hexToHsv(raw);
              setHsv(next);
              onChange(raw);
            }
          }}
          onBlur={(e) => {
            // Normalize on blur: ensure it starts with #
            const raw = e.target.value.startsWith("#")
              ? e.target.value
              : `#${e.target.value}`;
            if (HEX_RE.test(raw)) setHexDraft(raw);
            else setHexDraft(currentHex);
          }}
          maxLength={7}
          spellCheck={false}
          aria-label="Hex color value"
        />
        <button
          type="button"
          className="cp-done"
          onClick={onClose}
          aria-label="Apply color"
          title="Apply"
        >
          ✓
        </button>
      </div>
    </div>,
    document.body
  );
}
