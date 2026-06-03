'use client';

import React from 'react';
import { Plus, Trash2, Save, Lock } from 'lucide-react';
import { updateEndpoint } from '@/actions/projects';
import type { ProjectEndpoint } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type FieldDef = { key: string; label: string; type: 'string' | 'number' | 'array' };

function DomainTagInput({
  domains,
  onChange,
  globalDomains = [],
}: {
  domains: string[];
  onChange: (d: string[]) => void;
  globalDomains?: string[];
}) {
  const [draft, setDraft] = React.useState('');

  const commit = () => {
    const val = draft.trim().toLowerCase().replace(/^@/, '');
    // don't add if already in editable or global list
    if (val && !domains.includes(val) && !globalDomains.includes(val)) onChange([...domains, val]);
    setDraft('');
  };

  const hasAny = globalDomains.length > 0 || domains.length > 0;

  return (
    <div>
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4,
          minHeight: 34, padding: '3px 8px',
          border: '1px solid hsl(var(--input))', borderRadius: 'calc(var(--radius) - 2px)',
          background: 'hsl(var(--background))', cursor: 'text',
        }}
        onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
      >
        {/* Read-only env chips */}
        {globalDomains.map((d) => (
          <span
            key={`global-${d}`}
            title="Set via ALLOWED_EMAIL_DOMAINS env variable — cannot be removed here"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '1px 6px', borderRadius: 4,
              background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))',
              fontSize: 12, fontFamily: 'ui-monospace, monospace',
              color: 'hsl(var(--muted-foreground))',
              cursor: 'default',
            }}
          >
            <Lock size={9} style={{ flexShrink: 0 }} />
            {d}
          </span>
        ))}

        {/* Editable endpoint chips */}
        {domains.map((d) => (
          <span
            key={d}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '1px 6px', borderRadius: 4,
              background: 'hsl(var(--brand) / 0.1)', border: '1px solid hsl(var(--brand) / 0.25)',
              fontSize: 12, fontFamily: 'ui-monospace, monospace',
            }}
          >
            {d}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(domains.filter((x) => x !== d)); }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'hsl(var(--muted-foreground))', fontSize: 14 }}
            >×</button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
            if (e.key === 'Backspace' && draft === '' && domains.length > 0) onChange(domains.slice(0, -1));
          }}
          onBlur={commit}
          placeholder={hasAny ? '' : 'e.g. men.gov.ma — press Enter to add'}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: 12, fontFamily: 'ui-monospace, monospace',
            minWidth: 200, flex: 1, color: 'hsl(var(--foreground))',
          }}
        />
      </div>
      {globalDomains.length > 0 && (
        <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Lock size={10} /> Locked domains are enforced via the <code style={{ fontFamily: 'ui-monospace, monospace' }}>ALLOWED_EMAIL_DOMAINS</code> env variable.
        </p>
      )}
    </div>
  );
}

function FieldRows({
  fields, onAdd, onUpdate, onRemove,
}: {
  fields: FieldDef[];
  onAdd: () => void;
  onUpdate: (i: number, k: keyof FieldDef, v: string) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      {fields.length === 0 ? (
        <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', margin: '4px 0 6px' }}>No fields defined</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
          {fields.map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 28px', gap: 5 }}>
              <Input className="mono" style={{ height: 28, fontSize: 12 }} value={f.key} onChange={(e) => onUpdate(i, 'key', e.target.value)} placeholder="fieldKey" />
              <Input style={{ height: 28, fontSize: 12 }} value={f.label} onChange={(e) => onUpdate(i, 'label', e.target.value)} placeholder="Label" />
              <select
                className={cn('flex h-7 w-full rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-xs')}
                value={f.type || 'string'}
                onChange={(e) => onUpdate(i, 'type', e.target.value)}
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="array">array</option>
              </select>
              <Button variant="ghost" size="icon-sm" type="button" style={{ height: 28, width: 28, color: 'hsl(var(--destructive))' }} onClick={() => onRemove(i)}>
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="ghost" size="sm" type="button" onClick={onAdd} style={{ height: 26, fontSize: 12, paddingLeft: 6 }}>
        <Plus size={12} /> Add field
      </Button>
    </div>
  );
}

export interface EndpointEditPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: ProjectEndpoint;
  projectId: string;
  globalDomains?: string[];
  onSave: (updated: ProjectEndpoint) => void;
}

export function EndpointEditPanel({ open, onOpenChange, endpoint, projectId, globalDomains = [], onSave }: EndpointEditPanelProps) {
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<ProjectEndpoint>(endpoint);

  // Reset draft whenever the dialog opens for a (possibly different) endpoint
  React.useEffect(() => {
    if (open) {
      setDraft({
        ...endpoint,
        requiredFields: (endpoint.requiredFields ?? []).map((f) => ({ ...f })),
        optionalFields: (endpoint.optionalFields ?? []).map((f) => ({ ...f })),
        emailDomainAllowlist: endpoint.emailDomainAllowlist ? [...endpoint.emailDomainAllowlist] : [],
      });
    }
  }, [open, endpoint]);

  const set = (field: keyof ProjectEndpoint, val: unknown) =>
    setDraft((d) => ({ ...d, [field]: val }));

  const updateField = (ft: 'requiredFields' | 'optionalFields', i: number, k: keyof FieldDef, v: string) =>
    setDraft((d) => {
      const arr = [...(d[ft] ?? [])] as FieldDef[];
      arr[i] = { ...arr[i]!, [k]: v };
      return { ...d, [ft]: arr };
    });

  const addField = (ft: 'requiredFields' | 'optionalFields') =>
    setDraft((d) => ({ ...d, [ft]: [...(d[ft] ?? []), { key: '', label: '', type: 'string' as const }] }));

  const removeField = (ft: 'requiredFields' | 'optionalFields', i: number) =>
    setDraft((d) => {
      const arr = [...(d[ft] ?? [])] as FieldDef[];
      arr.splice(i, 1);
      return { ...d, [ft]: arr };
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEndpoint(projectId, endpoint.id, draft as Record<string, unknown>);
      onSave(draft);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit endpoint</DialogTitle>
          <DialogDescription>
            Changes are saved to the project and take effect immediately for the current import.
          </DialogDescription>
        </DialogHeader>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Method + path */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10 }}>
            <div className="flex flex-col gap-1.5">
              <Label style={{ fontSize: 12 }}>Method</Label>
              <select
                value={draft.method || 'POST'}
                onChange={(e) => set('method', e.target.value)}
                style={{
                  height: 36, padding: '0 8px', fontSize: 12,
                  fontFamily: 'ui-monospace, monospace', fontWeight: 700, cursor: 'pointer',
                  border: '1px solid hsl(var(--input))', borderRadius: 'calc(var(--radius) - 2px)',
                  background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
                }}
              >
                <option>POST</option><option>PUT</option><option>PATCH</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ fontSize: 12 }}>Path</Label>
              <Input className="mono" value={draft.path} onChange={(e) => set('path', e.target.value)} placeholder="/users/create" />
            </div>
          </div>

          {/* Label */}
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontSize: 12 }}>Label</Label>
            <Input value={draft.label ?? ''} onChange={(e) => set('label', e.target.value)} placeholder="Display name" />
          </div>

          {/* Import mode */}
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontSize: 12 }}>Import mode</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([
                { v: 'per-row', l: 'Per row', d: 'One JSON request per row' },
                { v: 'bulk-file', l: 'Bulk file', d: 'Send entire CSV as multipart upload' },
              ] as const).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => set('importMode', opt.v)}
                  style={{
                    textAlign: 'left', padding: '8px 12px', cursor: 'pointer', transition: 'all 120ms',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    border: `1px solid ${draft.importMode === opt.v ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                    background: draft.importMode === opt.v ? 'hsl(var(--brand) / 0.06)' : 'hsl(var(--background))',
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{opt.l}</div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{opt.d}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Domain allowlist */}
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontSize: 12 }}>Allowed email domains</Label>
            <DomainTagInput
              domains={draft.emailDomainAllowlist ?? []}
              onChange={(d) => set('emailDomainAllowlist', d.length > 0 ? d : undefined)}
              globalDomains={globalDomains}
            />
          </div>

          {/* Required fields */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
              Required fields
            </div>
            <FieldRows
              fields={(draft.requiredFields ?? []) as FieldDef[]}
              onAdd={() => addField('requiredFields')}
              onUpdate={(i, k, v) => updateField('requiredFields', i, k, v)}
              onRemove={(i) => removeField('requiredFields', i)}
            />
          </div>

          {/* Optional fields */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
              Optional fields
            </div>
            <FieldRows
              fields={(draft.optionalFields ?? []) as FieldDef[]}
              onAdd={() => addField('optionalFields')}
              onUpdate={(i, k, v) => updateField('optionalFields', i, k, v)}
              onRemove={(i) => removeField('optionalFields', i)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !draft.path?.trim()}>
            {saving ? 'Saving…' : <><Save size={13} /> Save endpoint</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
