"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createProject, updateProject } from "@/actions/projects";
import type { ProjectFormValues } from "@/lib/schemas";
import { Modal } from "@/components/shell/Modal";
import { ColorPickerPopover } from "@/components/ui/ColorPicker";

const PRESET_COLORS = [
  { value: "#0d74f6", label: "Dodger Blue" },
  { value: "#2563eb", label: "Blue" },
  { value: "#16a34a", label: "Green" },
  { value: "#d97706", label: "Amber" },
  { value: "#db2777", label: "Pink" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#0891b2", label: "Cyan" },
  { value: "#dc2626", label: "Red" },
];

const ID_TO_HEX: Record<string, string> = {
  dodgerBlue: "#0d74f6",
  indigo: "#4f46e5",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#db2777",
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = ({ off }: { off?: boolean }) => off ? (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

export function ProjectFormModal({
  mode,
  initial,
  onClose,
  inline = false,
}: {
  mode: "create" | "edit";
  initial?: Partial<ProjectFormValues & { id: string }>;
  onClose: () => void;
  inline?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const initialColor = (initial?.color?.startsWith("#") ? initial.color : ID_TO_HEX[initial?.color || "dodgerBlue"]) || "#0d74f6";

  const [data, setData] = useState<ProjectFormValues>({
    name: initial?.name || "",
    description: initial?.description || "",
    color: initialColor,
    baseUrl: initial?.baseUrl || "",
    auth: {
      type: initial?.auth?.type || "bearer",
      value: initial?.auth?.value || "",
      headerName: initial?.auth?.headerName || "",
      username: initial?.auth?.username || "",
      password: initial?.auth?.password || "",
      tokenUrl: initial?.auth?.tokenUrl || "",
      clientId: initial?.auth?.clientId || "",
    },
    endpoints: initial?.endpoints || [
      { id: "create", label: "Create User", method: "POST", path: "/users" },
      { id: "bulk", label: "Bulk Import", method: "POST", path: "/users/bulk" },
    ],
  });

  const [pickerAnchor, setPickerAnchor] = useState<{ top: number; left: number } | null>(null);
  const customBtnRef = useRef<HTMLButtonElement>(null);

  const themeColor = data.color || "#0d74f6";
  const isCustomColor = !PRESET_COLORS.some((c) => c.value === themeColor.toLowerCase());
  const hexValid = HEX_RE.test(themeColor);

  const togglePicker = () => {
    if (pickerAnchor) {
      setPickerAnchor(null);
      return;
    }
    const rect = customBtnRef.current?.getBoundingClientRect();
    if (rect) setPickerAnchor({ top: rect.bottom + 8, left: rect.left });
  };

  useEffect(() => {
    if (!pickerAnchor) return;
    const handler = (e: MouseEvent) => {
      if (customBtnRef.current?.contains(e.target as Node)) return;
      setPickerAnchor(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerAnchor]);

  const handleAuthChange = (field: string, val: string) => {
    setData({ ...data, auth: { ...data.auth, [field]: val } });
  };

  const handleEndpointChange = (id: string, field: string, val: string) => {
    const next = (data.endpoints || []).map(e => e.id === id ? { ...e, [field]: val } : e);
    setData({ ...data, endpoints: next });
  };

  const addEndpoint = () => {
    const ep = { id: `ep-${Date.now()}`, label: 'New Endpoint', method: 'POST', path: '/endpoint' };
    const next = [...(data.endpoints || []), ep];
    setData({ ...data, endpoints: next });
  };

  const removeEndpoint = (id: string) => {
    const next = (data.endpoints || []).filter(e => e.id !== id);
    setData({ ...data, endpoints: next });
  };

  const handleSubmit = () => {
    if (!data.name.trim()) return;
    if (!hexValid) {
      setError("Theme color must be a hex like #4f46e5");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createProject(data);
        } else {
          if (initial?.id) await updateProject(initial.id, data);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  const formContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center">
        <h2 className="m-0 text-base font-semibold">
          {mode === "create" ? "New project" : "Edit project"}
        </h2>
        <div className="flex-1" />
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div>
          <span className="label">Name</span>
          <input
            className="input w-full"
            autoFocus
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="e.g. Acme Analytics"
          />
        </div>

        <div>
          <span className="label">Base URL</span>
          <input
            className="input w-full"
            value={data.baseUrl}
            onChange={(e) => setData({ ...data, baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
          />
        </div>

        <div>
          <span className="label">Description</span>
          <textarea
            className="textarea w-full min-h-[60px]"
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="What is this project for?"
          />
        </div>

        {/* Auth Section */}
        <div className="mt-2">
          <h3 className="text-[13px] uppercase tracking-wider text-[var(--text-3)] mb-3 flex items-center gap-2">
            Authentication
            <span className="badge badge-ok normal-case text-[9px]">🔒 Server-side only</span>
          </h3>

          <div className="card pad flex flex-col gap-4">
            <div>
              <span className="label">Auth Type</span>
              <select
                className="select w-full"
                value={data.auth?.type || "bearer"}
                onChange={(e) => handleAuthChange("type", e.target.value)}
              >
                <option value="bearer">Bearer Token</option>
                <option value="apikey">API Key (Header)</option>
                <option value="basic">Basic Auth</option>
                <option value="oauth2">OAuth2 / Client Credentials</option>
              </select>
            </div>

            {(data.auth?.type === "bearer" || !data.auth?.type) && (
              <div>
                <span className="label">Bearer Token</span>
                <div className="flex items-center relative">
                  <span className="absolute left-2.5 text-[var(--text-3)] flex"><LockIcon /></span>
                  <input
                    className="input w-full pl-9 pr-9"
                    type={showSecret ? "text" : "password"}
                    value={data.auth?.value || ""}
                    onChange={(e) => handleAuthChange("value", e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                  />
                  <button type="button" className="btn-icon absolute right-1 text-[var(--text-3)]" onClick={() => setShowSecret(!showSecret)}>
                    <EyeIcon off={showSecret} />
                  </button>
                </div>
              </div>
            )}

            {data.auth?.type === "apikey" && (
              <>
                <div>
                  <span className="label">Header Name</span>
                  <input className="input w-full" value={data.auth?.headerName || "X-API-Key"} onChange={(e) => handleAuthChange("headerName", e.target.value)} />
                </div>
                <div>
                  <span className="label">API Key</span>
                  <div className="flex items-center relative">
                    <span className="absolute left-2.5 text-[var(--text-3)] flex"><LockIcon /></span>
                    <input
                      className="input w-full pl-9 pr-9"
                      type={showSecret ? "text" : "password"}
                      value={data.auth?.value || ""}
                      onChange={(e) => handleAuthChange("value", e.target.value)}
                    />
                    <button type="button" className="btn-icon absolute right-1 text-[var(--text-3)]" onClick={() => setShowSecret(!showSecret)}>
                      <EyeIcon off={showSecret} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {data.auth?.type === "basic" && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="label">Username</span>
                  <input className="input w-full" value={data.auth?.username || ""} onChange={(e) => handleAuthChange("username", e.target.value)} />
                </div>
                <div className="flex-1">
                  <span className="label">Password</span>
                  <div className="flex items-center relative">
                    <input
                      className="input w-full pr-9"
                      type={showSecret ? "text" : "password"}
                      value={data.auth?.value || ""}
                      onChange={(e) => handleAuthChange("value", e.target.value)}
                    />
                    <button type="button" className="btn-icon absolute right-1 text-[var(--text-3)]" onClick={() => setShowSecret(!showSecret)}>
                      <EyeIcon off={showSecret} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {data.auth?.type === "oauth2" && (
              <>
                <div>
                  <span className="label">Client ID</span>
                  <input className="input w-full" value={data.auth?.clientId || ""} onChange={(e) => handleAuthChange("clientId", e.target.value)} />
                </div>
                <div>
                  <span className="label">Client Secret</span>
                  <div className="flex items-center relative">
                    <input
                      className="input w-full pr-9"
                      type={showSecret ? "text" : "password"}
                      value={data.auth?.value || ""}
                      onChange={(e) => handleAuthChange("value", e.target.value)}
                    />
                    <button type="button" className="btn-icon absolute right-1 text-[var(--text-3)]" onClick={() => setShowSecret(!showSecret)}>
                      <EyeIcon off={showSecret} />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="label">Token URL</span>
                  <input className="input w-full" value={data.auth?.tokenUrl || ""} onChange={(e) => handleAuthChange("tokenUrl", e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Endpoints Section */}
        <div className="mt-2">
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-[13px] uppercase tracking-wider text-[var(--text-3)] m-0">
              API Endpoints
            </h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addEndpoint}>
              <PlusIcon /> Add Endpoint
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {(data.endpoints || []).map(ep => (
              <div key={ep.id} className="card pad flex flex-col gap-3">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input className="input w-full bg-transparent border-none p-0 font-medium shadow-none outline-none focus:ring-0 focus:shadow-none" value={ep.label || ""} onChange={(e) => handleEndpointChange(ep.id, "label", e.target.value)} placeholder="Endpoint Label" />
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon text-[var(--danger)]/80 hover:text-[var(--danger)]" onClick={() => removeEndpoint(ep.id)}>
                    <TrashIcon />
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="w-[100px]">
                    <select className="select w-full" value={ep.method || "GET"} onChange={(e) => handleEndpointChange(ep.id, "method", e.target.value)}>
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <input className="input w-full" value={ep.path || ""} onChange={(e) => handleEndpointChange(ep.id, "path", e.target.value)} placeholder="/api/v1/resource" />
                  </div>
                </div>
              </div>
            ))}
            {(!data.endpoints || data.endpoints.length === 0) && (
              <div className="card pad text-center text-[var(--text-3)] text-[13px]">
                No endpoints configured.
              </div>
            )}
          </div>
        </div>

        <div>
          <span className="label">Theme color</span>
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {PRESET_COLORS.map((c) => {
              const selected = themeColor.toLowerCase() === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setData({ ...data, color: c.value });
                    setPickerAnchor(null);
                  }}
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={selected}
                  className="color-swatch w-7 h-7 rounded-lg cursor-pointer border-none"
                  style={{
                    background: c.value,
                    boxShadow: selected
                      ? `0 0 0 2px var(--surface), 0 0 0 4px ${c.value}`
                      : undefined,
                  }}
                />
              );
            })}

            {/* Divider */}
            <span className="w-px h-[18px] bg-[var(--border)] shrink-0 mx-1" aria-hidden />

            {/* Custom color trigger */}
            <button
              ref={customBtnRef}
              type="button"
              onClick={togglePicker}
              title="Custom color"
              aria-label="Pick a custom color"
              className="color-swatch color-swatch-custom w-7 h-7 rounded-lg cursor-pointer inline-flex items-center justify-center"
              style={{
                border: isCustomColor ? "none" : "1px dashed var(--border-2)",
                background: isCustomColor ? themeColor : "transparent",
                color: isCustomColor ? "white" : "var(--text-3)",
                boxShadow: isCustomColor
                  ? `0 0 0 2px var(--surface), 0 0 0 4px ${themeColor}`
                  : pickerAnchor
                    ? `0 0 0 2px var(--surface), 0 0 0 4px var(--accent)`
                    : undefined
              }}
            >
              {!isCustomColor && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span
              className="w-4 h-4 rounded"
              style={{ background: hexValid ? themeColor : "var(--surface-3)" }}
              aria-hidden
            />
            <span className="text-[13px] font-mono" style={{ color: hexValid ? "var(--text-2)" : "var(--text-3)" }}>
              {themeColor}
            </span>
            {isCustomColor && hexValid && (
              <span className="badge badge-surface text-[11px] px-1.5 py-0.5">Custom</span>
            )}
          </div>
        </div>

        {pickerAnchor && (
          <ColorPickerPopover
            value={hexValid ? themeColor : "#0d74f6"}
            onChange={(c) => setData({ ...data, color: c })}
            onClose={() => setPickerAnchor(null)}
            anchor={pickerAnchor}
          />
        )}

        {error && (
          <div className="text-[12px] text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-2.5 py-2 rounded-[5px]">
            {error}
          </div>
        )}
      </div>

      <div className="px-[18px] py-3 border-t border-[var(--border)] flex justify-end gap-2 bg-[var(--surface)]">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isPending}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isPending || !data.name.trim() || !hexValid}
        >
          {isPending ? (mode === "create" ? "Creating…" : "Saving…") : mode === "create" ? "Create project" : "Save changes"}
        </button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="card max-w-[560px] mx-auto overflow-hidden">
        {formContent}
      </div>
    );
  }

  return (
    <Modal onClose={onClose} width={560}>
      {formContent}
    </Modal>
  );
}
