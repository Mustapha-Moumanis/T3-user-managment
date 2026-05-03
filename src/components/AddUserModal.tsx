'use client';

import React from 'react';
import { EMAIL_RE, buildEndpointPayload, buildAuthHeaders, getFieldDefsForEndpoint } from '@/lib/validation';
import type { ProjectEndpoint } from '@/lib/schemas';

type Project = any;

type SubmitStatus = null | 'loading' | 'success' | 'error';

export interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  config: Project | null;
}

export function AddUserModal({ open, onClose, config }: AddUserModalProps) {
  const endpoints: ProjectEndpoint[] = config?.endpoints ?? [];

  const [selectedEndpointId, setSelectedEndpointId] = React.useState('');
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<SubmitStatus>(null);
  const [errorMsg, setErrorMsg] = React.useState('');

  const selectedEndpoint = endpoints.find((e) => e.id === selectedEndpointId) ?? null;

  const activeFields = selectedEndpoint
    ? getFieldDefsForEndpoint(selectedEndpoint).filter((f) => f.key !== '_skip')
    : [];

  const handleChange = (field: string, val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const emailVal = form.email?.trim();
    if (!emailVal) {
      errs.email = 'Email is required';
    } else if (!EMAIL_RE.test(emailVal)) {
      errs.email = 'Invalid email format';
    }
    const nameVal = form.name?.trim();
    if (!nameVal) errs.name = 'Name is required';
    for (const f of activeFields) {
      if (f.key === 'email' || f.key === 'name') continue;
      if (f.required && !form[f.key]?.trim()) errs[f.key] = `${f.label} is required`;
    }
    return errs;
  };

  const handleSubmit = async () => {
    if (!selectedEndpoint) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setStatus('loading');

    const row = { _id: 'single', ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) };

    try {
      const res = await fetch(`${config?.baseUrl}${selectedEndpoint.path}`, {
        method: selectedEndpoint.method ?? 'POST',
        headers: buildAuthHeaders(config?.auth),
        body: JSON.stringify(buildEndpointPayload(row as any, selectedEndpoint)),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMsg(errData.message || `HTTP ${res.status}`);
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Network error');
    }
  };

  const handleClose = () => {
    setForm({});
    setErrors({});
    setStatus(null);
    setErrorMsg('');
    setSelectedEndpointId('');
    onClose();
  };

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Add single user"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="card modal">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[18px] font-extrabold tracking-[-0.01em]">Add Single User</div>
            <div className="crumb">Create one user via <strong>{config?.name ?? 'project'}</strong></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-accent">{config?.auth?.type?.toUpperCase() ?? 'BEARER'}</span>
            <button type="button" className="btn btn-ghost btn-icon" onClick={handleClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="mt-4">
          {status === 'success' ? (
            <div className="empty p-2.5">
              <div className="text-4xl mb-1.5">✅</div>
              <div className="text-lg font-black mb-1.5">User Created!</div>
              <div className="text-[var(--text-2)] mb-3.5">
                <strong>{form.name}</strong> <span className="mono">({form.email})</span> was added successfully.
              </div>
              <button type="button" className="btn btn-primary btn-lg" onClick={handleClose}>Done</button>
            </div>
          ) : (
            <>
              {status === 'error' && (
                <div className="badge badge-danger mb-3 justify-center">{errorMsg}</div>
              )}

              {endpoints.length === 0 ? (
                <div className="text-sm text-[var(--text-3)] text-center py-6">
                  No endpoints configured.<br />
                  Go to project settings and add an endpoint.
                </div>
              ) : (
                <>
                  <div className="field mb-3">
                    <div className="label">Endpoint *</div>
                    <select
                      className="select w-full"
                      value={selectedEndpointId}
                      onChange={(e) => { setSelectedEndpointId(e.target.value); setForm({}); setErrors({}); }}
                      disabled={status === 'loading'}
                    >
                      <option value="">— Select endpoint —</option>
                      {endpoints.map((ep) => (
                        <option key={ep.id} value={ep.id}>{ep.label || ep.path}</option>
                      ))}
                    </select>
                  </div>

                  {selectedEndpoint && (
                    <div className="grid grid-cols-2 gap-3">
                      {activeFields.map((f) => (
                        <div key={f.key} className={`field ${f.type === 'array' ? 'col-span-full' : ''}`}>
                          <div className="label">{f.label} {f.required ? '*' : ''}</div>
                          <input
                            className="input"
                            value={form[f.key] ?? ''}
                            onChange={(e) => handleChange(f.key, e.target.value)}
                            disabled={status === 'loading'}
                            placeholder={f.key === 'email' ? 'user@example.com' : f.type === 'array' ? 'value1, value2, value3' : ''}
                          />
                          {errors[f.key] && <div className="error">{errors[f.key]}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {config?.baseUrl && selectedEndpoint && (
                    <div className="mt-3">
                      <span className="badge">
                        {selectedEndpoint.method ?? 'POST'} to <code className="mono">{config.baseUrl}{selectedEndpoint.path}</code>
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2.5 mt-4">
                    <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={status === 'loading'}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={handleSubmit}
                      disabled={status === 'loading' || !selectedEndpoint}
                    >
                      {status === 'loading' ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="spin" aria-hidden>⟳</span>
                          Creating...
                        </span>
                      ) : 'Create User'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
