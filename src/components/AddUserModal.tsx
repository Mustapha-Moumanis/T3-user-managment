'use client';

import React from 'react';
import { EMAIL_RE, PHONE_RE, VALID_ROLES } from '@/lib/validation';
// import type { Project } from '@/lib/projectStore';
type Project = any;

interface FormState {
  email: string;
  name: string;
  role: string;
  phone: string;
  department: string;
}

type SubmitStatus = null | 'loading' | 'success' | 'error';

export interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  config: Project | null;
}

export function AddUserModal({ open, onClose, config }: AddUserModalProps) {
  const emptyForm: FormState = { email: '', name: '', role: '', phone: '', department: '' };
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<Partial<FormState>>({});
  const [status, setStatus] = React.useState<SubmitStatus>(null);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleChange = (field: keyof FormState, val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) {
      setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    }
  };

  const validate = (): Partial<FormState> => {
    const errs: Partial<FormState> = {};
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!EMAIL_RE.test(form.email.trim())) {
      errs.email = 'Invalid email format';
    }
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.phone && !PHONE_RE.test(form.phone.trim())) errs.phone = 'Invalid phone format';
    if (form.role && !(VALID_ROLES as readonly string[]).includes(form.role.toLowerCase())) {
      errs.role = 'Invalid role';
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStatus('loading');
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

  const createEndpoint = config?.endpoints?.find((e: any) => e.id === 'create');

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="card modal">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[18px] font-extrabold tracking-[-0.01em]">Add Single User</div>
            {config?.projectName ? (
              <div className="crumb">via <strong>{config.projectName}</strong></div>
            ) : (
              <div className="crumb">Create one user via the selected project</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-accent">{config?.auth?.type?.toUpperCase() ?? 'BEARER'}</span>
            <button type="button" className="btn btn-ghost btn-icon" onClick={handleClose} aria-label="Close">
              ✕
            </button>
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
                <div className="badge badge-danger mb-3 justify-center">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <div className="label">Email *</div>
                  <input
                    className="input mono"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={status === 'loading'}
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                  {errors.email && <div className="error">{errors.email}</div>}
                </div>
                <div className="field">
                  <div className="label">Full Name *</div>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={status === 'loading'}
                    aria-invalid={errors.name ? 'true' : 'false'}
                  />
                  {errors.name && <div className="error">{errors.name}</div>}
                </div>
                <div className="field">
                  <div className="label">Role</div>
                  <select
                    className="select"
                    value={form.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    disabled={status === 'loading'}
                    aria-invalid={errors.role ? 'true' : 'false'}
                  >
                    <option value="">None</option>
                    {VALID_ROLES.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                  {errors.role && <div className="error">{errors.role}</div>}
                </div>
                <div className="field">
                  <div className="label">Phone</div>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={status === 'loading'}
                    placeholder="+1-555-0100"
                    aria-invalid={errors.phone ? 'true' : 'false'}
                  />
                  {errors.phone && <div className="error">{errors.phone}</div>}
                </div>
                <div className="field col-span-full">
                  <div className="label">Department</div>
                  <input
                    className="input"
                    value={form.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    disabled={status === 'loading'}
                    placeholder="Engineering, Marketing…"
                  />
                </div>
              </div>

              {config?.endpoints && (
                <div className="mt-3">
                  <span className="badge">
                    Will POST to <code className="mono">{config.baseUrl}{createEndpoint?.path ?? '/users'}</code>
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 mt-4">
                <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={status === 'loading'}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={status === 'loading'}>
                  {status === 'loading' ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="spin" aria-hidden>⟳</span>
                      Creating...
                    </span>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
