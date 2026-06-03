'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, ArrowRight as Arrow, CheckCircle, File, Upload } from 'lucide-react';
import {
  parseCSVText,
  parseExcelBuffer,
  autoDetectMapping,
  applyMapping,
  type RawRow,
  type Mapping,
  type FieldDef,
} from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface RawData {
  headers: string[];
  rows: RawRow[];
  fileName?: string;
}

export interface UploadMappingProps {
  fieldDefs: FieldDef[];
  rawData: RawData | null;
  mapping: Mapping;
  onMappingChange: (mapping: Mapping) => void;
  onFileLoad: (parsed: RawData | null, autoMap: Mapping) => void;
  onNext: () => void;
  onBack: () => void;
  savedMapping?: Record<string, string>;
}

export function UploadMapping({
  fieldDefs,
  rawData,
  mapping,
  onMappingChange,
  onFileLoad,
  onNext,
  onBack,
  savedMapping,
}: UploadMappingProps) {
  const [dragging, setDragging] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    setLoading(true);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        let parsed: { headers: string[]; rows: RawRow[] };
        if (isExcel) {
          parsed = parseExcelBuffer(e.target?.result as ArrayBuffer);
        } else {
          parsed = parseCSVText(e.target?.result as string);
        }
        const autoMap = autoDetectMapping(parsed.headers);
        const mergedMap = savedMapping && Object.keys(savedMapping).length > 0
          ? { ...autoMap, ...savedMapping }
          : autoMap;
        onFileLoad({ ...parsed, fileName: file.name }, mergedMap);
        setLoading(false);
      }, 400);
    };
    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const previewRows = rawData ? rawData.rows.slice(0, 4) : [];
  const usedFields = Object.values(mapping).filter((v) => v && v !== '_skip');
  const hasDupe = usedFields.length !== new Set(usedFields).size;
  const requiredKeys = fieldDefs.filter((f) => f.required).map((f) => f.key);
  const isValid = rawData && requiredKeys.every((k) => mapping[k]) && !hasDupe;

  // Count how many are auto-mapped
  const mappedCount = rawData ? rawData.headers.filter((h) => {
    const v = Object.entries(mapping).find(([, col]) => col === h)?.[0];
    return v && v !== '_skip';
  }).length : 0;

  return (
    <>
      {/* Drop zone — shown when no file loaded */}
      {!rawData && (
        <div
          style={{
            border: `2px dashed ${dragging ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
            borderRadius: 'var(--radius)',
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 160ms',
            background: dragging ? 'hsl(var(--brand) / 0.04)' : 'hsl(var(--card))',
            marginBottom: 24,
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Upload size={40} style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Drop your file here</div>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, marginBottom: 16 }}>
            CSV or Excel · Expected: {fieldDefs.filter((f) => f.required).map((f) => f.label).join(', ')}
          </p>
          <Button variant="outline" size="sm" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Browse file
          </Button>
        </div>
      )}

      {loading && (
        <div style={{ height: 4, borderRadius: 9999, background: 'hsl(var(--muted))', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'hsl(var(--brand))', width: '60%', borderRadius: 9999, animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      )}

      {rawData && (
        <>
          {/* File info card */}
          <Card style={{ marginBottom: 16 }}>
            <CardContent style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <File size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{rawData.fileName ?? 'uploaded-file.csv'}</div>
                  <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                    {rawData.rows.length} rows · {rawData.headers.length} columns detected
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge variant="success">
                  <CheckCircle size={12} /> Auto-mapped {mappedCount} of {rawData.headers.length}
                </Badge>
                <Button variant="outline" size="sm" type="button" onClick={() => onFileLoad(null, {})}>
                  Replace file
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Column mapping card */}
          <Card style={{ marginBottom: 16 }}>
            <CardHeader>
              <CardTitle>Column mapping</CardTitle>
              <CardDescription>Each CSV column maps to a destination field. Required fields are marked with *.</CardDescription>
            </CardHeader>
            <CardContent>
              {hasDupe && (
                <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 'calc(var(--radius) - 2px)', border: '1px solid hsl(var(--warning) / 0.3)', background: 'hsl(var(--warning) / 0.08)', fontSize: 13, color: 'hsl(var(--warning))' }}>
                  ⚠ Some fields are mapped multiple times — each field should appear once.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 12, alignItems: 'center' }}>
                {/* Header row */}
                <div style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source column</div>
                <div />
                <div style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Maps to</div>

                {rawData.headers.map((header) => {
                  const mappedTo = Object.entries(mapping).find(([, v]) => v === header)?.[0];
                  const sampleVal = previewRows[0] ? String((previewRows[0] as Record<string, unknown>)[header] ?? '—') : '—';
                  return (
                    <React.Fragment key={header}>
                      <div style={{ padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 2px)', background: 'hsl(var(--muted) / 0.4)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="mono" style={{ fontWeight: 500, fontSize: 14 }}>{header}</span>
                        <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>e.g. {sampleVal}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
                        <Arrow size={14} />
                      </div>
                      <select
                        style={{ height: 36, width: '100%', borderRadius: 'calc(var(--radius) - 2px)', border: '1px solid hsl(var(--input))', background: 'hsl(var(--background))', fontSize: 13, padding: '0 12px', color: 'hsl(var(--foreground))', cursor: 'pointer' }}
                        value={mappedTo ?? '_skip'}
                        onChange={(e) => {
                          const newMap = { ...mapping };
                          Object.keys(newMap).forEach((k) => { if (newMap[k] === header) delete newMap[k]; });
                          if (e.target.value !== '_skip') newMap[e.target.value] = header;
                          onMappingChange(newMap);
                        }}
                      >
                        <option value="_skip">Skip</option>
                        {fieldDefs.map((f) => (
                          <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                        ))}
                      </select>
                    </React.Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Preview table card */}
          <Card style={{ marginBottom: 24 }}>
            <CardHeader>
              <CardTitle style={{ fontSize: 15 }}>Data preview</CardTitle>
              <CardDescription>First {previewRows.length} rows after applying the mapping above.</CardDescription>
            </CardHeader>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'hsl(var(--muted) / 0.4)' }}>
                    {Object.keys(mapping)
                      .filter((k) => mapping[k] && mapping[k] !== '_skip')
                      .map((field) => (
                        <th key={field} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>
                          {fieldDefs.find((f) => f.key === field)?.label ?? field}
                          {fieldDefs.find((f) => f.key === field)?.required ? ' *' : ''}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => {
                    const mapped = applyMapping([row], mapping)[0]!;
                    return (
                      <tr key={i} style={{ borderBottom: i < previewRows.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                        {Object.keys(mapping)
                          .filter((k) => mapping[k] && mapping[k] !== '_skip')
                          .map((field) => (
                            <td key={field} style={{ padding: '10px 14px', fontSize: 14 }}>
                              {mapped.data[field] != null ? String(mapped.data[field]) : <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>}
                            </td>
                          ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Footer nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </Button>
        <Button size="lg" onClick={onNext} disabled={!isValid}>
          Review data <ArrowRight size={14} />
        </Button>
      </div>
    </>
  );
}
