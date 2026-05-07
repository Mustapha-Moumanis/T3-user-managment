'use client';

import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { EMAIL_RE, buildEndpointPayload, buildAuthHeaders, getFieldDefsForEndpoint } from '@/lib/validation';
import type { ProjectEndpoint } from '@/lib/schemas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
    if (!emailVal) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(emailVal)) errs.email = 'Invalid email format';
    if (!form.name?.trim()) errs.name = 'Name is required';
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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add single user</DialogTitle>
          <DialogDescription>Create one user without uploading a CSV.</DialogDescription>
        </DialogHeader>

        <div style={{ padding: '0 24px 8px' }}>
          {status === 'success' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 12 }}>
              <CheckCircle size={40} style={{ color: 'hsl(var(--success))' }} />
              <div style={{ fontWeight: 600, fontSize: 16 }}>User created!</div>
              <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                <strong>{form.name}</strong>{' '}
                <span className="mono" style={{ fontSize: 13 }}>({form.email})</span>
                {' '}was added successfully.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {status === 'error' && (
                <Badge variant="destructive" style={{ justifyContent: 'center', width: '100%', padding: '6px 12px', height: 'auto', borderRadius: 'calc(var(--radius) - 2px)' }}>
                  {errorMsg}
                </Badge>
              )}

              {endpoints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>
                  No endpoints configured.<br />Go to project settings and add an endpoint.
                </div>
              ) : (
                <>
                  {/* User type select */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Label>User type</Label>
                    <select
                      style={{ height: 36, width: '100%', borderRadius: 'calc(var(--radius) - 2px)', border: '1px solid hsl(var(--input))', background: 'hsl(var(--background))', fontSize: 14, padding: '0 12px', color: 'hsl(var(--foreground))' }}
                      value={selectedEndpointId}
                      onChange={(e) => { setSelectedEndpointId(e.target.value); setForm({}); setErrors({}); }}
                      disabled={status === 'loading'}
                    >
                      <option value="">— Select endpoint —</option>
                      {endpoints.map((ep) => (
                        <option key={ep.id} value={ep.id}>{ep.label || ep.path}</option>
                      ))}
                    </select>
                    {selectedEndpoint && config?.baseUrl && (
                      <div className="mono" style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                        POSTs to {config.baseUrl}{selectedEndpoint.path}
                      </div>
                    )}
                  </div>

                  {/* Dynamic field grid */}
                  {selectedEndpoint && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {activeFields.map((f) => (
                        <div key={f.key} style={{ gridColumn: f.type === 'array' ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Label>{f.label}{f.required ? ' *' : ''}</Label>
                          <Input
                            className={f.key === 'email' || f.key === 'codeCentre' || f.key === 'codeAref' ? 'mono' : undefined}
                            value={form[f.key] ?? ''}
                            onChange={(e) => handleChange(f.key, e.target.value)}
                            disabled={status === 'loading'}
                            placeholder={f.key === 'email' ? 'user@example.com' : f.type === 'array' ? 'value1, value2' : ''}
                          />
                          {errors[f.key] && (
                            <span style={{ fontSize: 12, color: 'hsl(var(--destructive))' }}>{errors[f.key]}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {status === 'success' ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={status === 'loading'}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={status === 'loading' || !selectedEndpoint}>
                {status === 'loading' ? <><Loader2 size={14} className="spin" /> Creating…</> : 'Create user'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
