'use client';

import React from 'react';
import { parseCSVText, autoDetectMapping, applyMapping, type RawRow, type Mapping } from '@/lib/validation';

const CANONICAL_FIELDS = [
  { key: 'email', label: 'Email', required: true },
  { key: 'name', label: 'Full Name', required: true },
  { key: 'first_name', label: 'First Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'role', label: 'Role', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'department', label: 'Department', required: false },
  { key: 'external_id', label: 'External ID', required: false },
  { key: '_skip', label: '— Skip Column —', required: false },
] as const;

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export interface RawData {
  headers: string[];
  rows: RawRow[];
  fileName?: string;
}

export interface UploadMappingProps {
  rawData: RawData | null;
  mapping: Mapping;
  onMappingChange: (mapping: Mapping) => void;
  onFileLoad: (parsed: RawData | null, autoMap: Mapping) => void;
  onNext: () => void;
  onBack: () => void;
}

export function UploadMapping({ rawData, mapping, onMappingChange, onFileLoad, onNext, onBack }: UploadMappingProps) {
  const [dragging, setDragging] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        const text = e.target?.result as string;
        const parsed = parseCSVText(text);
        const autoMap = autoDetectMapping(parsed.headers);
        onFileLoad({ ...parsed, fileName: file.name }, autoMap);
        setLoading(false);
      }, 400);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0]);

  const usedFields = Object.values(mapping).filter((v) => v && v !== '_skip');
  const hasDupeMapping = usedFields.length !== new Set(usedFields).size;

  const isValid = rawData && mapping.email && mapping.name && !hasDupeMapping;

  const previewRows = rawData ? rawData.rows.slice(0, 4) : [];

  const handleLoadDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const demoCSV = `email,full_name,phone,role,department,user_id
alice@acme.com,Alice Johnson,+1-555-0101,admin,Engineering,U001
bob@acme.com,Bob Smith,+1-555-0102,editor,Marketing,U002
carol@acme.com,Carol White,,viewer,Design,U003
dave.invalid,Dave Brown,555-9999,superadmin,Sales,U004
alice@acme.com,Alice Duplicate,,viewer,HR,U005
eve@acme.com,Eve Davis,+1-555-0106,analyst,Data,U006
frank@acme.com,,+1-555-0107,developer,Engineering,U007
grace@acme.com,Grace Lee,+1-555-0108,manager,Product,U008`;
      const parsed = parseCSVText(demoCSV);
      const autoMap = autoDetectMapping(parsed.headers);
      onFileLoad({ ...parsed, fileName: 'demo-users.csv' }, autoMap);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="max-w-[800px] mx-auto py-[18px] px-4">
      <div className="mb-6">
        <div className="text-[22px] font-black tracking-[-0.02em]">Upload &amp; Map Columns</div>
        <div className="page-subtitle mt-0 mb-4">Upload a CSV file, then verify the column mapping below.</div>
      </div>

      {/* Upload zone */}
      {!rawData && (
        <div
          className={`card p-10 mb-5 text-center cursor-pointer border-dashed border-2 transition-colors duration-150 ${
            dragging ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-2)] bg-transparent'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={handleInputChange} />
          <div className="flex justify-center mb-3">
            <UploadIcon />
          </div>
          <div className="text-lg font-extrabold mb-1.5">Drop your file here</div>
          <div className="page-subtitle mt-0 mb-4">CSV or XLSX — up to 10,000 rows</div>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              Browse File
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); handleLoadDemo(); }}
            >
              Load Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Loading bar */}
      {loading && (
        <div className="h-1 rounded-sm bg-[var(--border-2)] mb-4 overflow-hidden">
          <div className="skel h-full rounded-sm" />
        </div>
      )}

      {rawData && (
        <>
          {/* File info */}
          <div className="card px-4 py-3.5 mb-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[var(--text-3)]"><FileIcon /></span>
              <div>
                <div className="font-bold text-sm">{rawData.fileName ?? 'uploaded-file.csv'}</div>
                <div className="text-xs text-[var(--text-3)]">
                  {rawData.rows.length} rows · {rawData.headers.length} columns detected
                </div>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onFileLoad(null, {})}>Replace</button>
          </div>

          {/* Column mapping */}
          <div className="card pad mb-3.5">
            <div className="label mb-3">Column Mapping</div>

            {hasDupeMapping && (
              <div className="badge badge-warn mb-3.5 flex gap-2">
                ⚠️ Some fields are mapped to multiple columns — each field should be mapped once.
              </div>
            )}

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
              <div className="label">Source Column</div>
              <div />
              <div className="label">Maps To</div>

              {rawData.headers.map((header) => {
                const mappedTo = Object.entries(mapping).find(([, v]) => v === header)?.[0];
                return (
                  <React.Fragment key={header}>
                    {/* Source chip */}
                    <div className="field-chip flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="font-bold text-[13px]">{header}</span>
                      {previewRows.slice(0, 2).map((r, i) => (
                        <span key={i} className="text-[11px] text-[var(--text-3)] bg-[color-mix(in_srgb,var(--text)_6%,transparent)] rounded-md px-1.5 py-[1px]">
                          {(r as Record<string, unknown>)[header] != null ? String((r as Record<string, unknown>)[header]) : '—'}
                        </span>
                      ))}
                    </div>

                    <span className="text-center text-[var(--text-3)] text-lg">→</span>

                    {/* Mapping select */}
                    <select
                      className="select"
                      value={mappedTo ?? '_skip'}
                      onChange={(e) => {
                        const newMapping = { ...mapping };
                        Object.keys(newMapping).forEach((k) => {
                          if (newMapping[k] === header) delete newMapping[k];
                        });
                        if (e.target.value !== '_skip') newMapping[e.target.value] = header;
                        onMappingChange(newMapping);
                      }}
                    >
                      {CANONICAL_FIELDS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}{f.required ? ' *' : ''}
                        </option>
                      ))}
                    </select>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Preview table */}
          <div className="card mb-5 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="label">Data Preview (first 4 rows)</div>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    {Object.keys(mapping)
                      .filter((k) => mapping[k] && mapping[k] !== '_skip')
                      .map((field) => (
                        <th key={field}>
                          {CANONICAL_FIELDS.find((f) => f.key === field)?.label ?? field}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => {
                    const mapped = applyMapping([row], mapping)[0];
                    return (
                      <tr key={i}>
                        {Object.keys(mapping)
                          .filter((k) => mapping[k] && mapping[k] !== '_skip')
                          .map((field) => (
                            <td key={field} className="text-[13px]">
                              {(mapped as unknown as Record<string, unknown>)[field] != null
                                ? String((mapped as unknown as Record<string, unknown>)[field])
                                : <span className="opacity-30">—</span>}
                            </td>
                          ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Footer buttons */}
      <div className="flex justify-between gap-2.5">
        <button type="button" className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button type="button" className="btn btn-primary btn-lg" onClick={onNext} disabled={!isValid}>
          Review Data →
        </button>
      </div>
    </div>
  );
}
