'use client';

import React from 'react';
import {
  parseCSVText,
  parseExcelBuffer,
  autoDetectMapping,
  applyMapping,
  type RawRow,
  type Mapping,
  type FieldDef,
} from '@/lib/validation';

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

  const canonicalFields = fieldDefs;

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    setLoading(true);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();

    reader.onload = (e) => {
      setTimeout(() => {
        let parsed: { headers: string[]; rows: RawRow[] };
        if (isExcel) {
          const buffer = e.target?.result as ArrayBuffer;
          parsed = parseExcelBuffer(buffer);
        } else {
          const text = e.target?.result as string;
          parsed = parseCSVText(text);
        }

        const autoMap = autoDetectMapping(parsed.headers);
        // Merge savedMapping over autoDetect (saved takes priority)
        const mergedMap = savedMapping && Object.keys(savedMapping).length > 0
          ? { ...autoMap, ...savedMapping }
          : autoMap;
        onFileLoad({ ...parsed, fileName: file.name }, mergedMap);
        setLoading(false);
      }, 400);
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0]);

  const usedFields = Object.values(mapping).filter((v) => v && v !== '_skip');
  const hasDupeMapping = usedFields.length !== new Set(usedFields).size;

  const requiredFieldKeys = canonicalFields.filter((f) => f.required).map((f) => f.key);
  const isValid = rawData && requiredFieldKeys.every((k) => mapping[k]) && !hasDupeMapping;

  const previewRows = rawData ? rawData.rows.slice(0, 4) : [];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Upload & Map Columns</h1>
        <p className="page-subtitle">Upload a CSV or Excel file, then verify the column mapping below.</p>
      </div>

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
          <p className="page-subtitle mt-0 mb-4">
            Expected columns: {canonicalFields.filter((f) => f.required).map((f) => f.label).join(', ')}
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            Browse File
          </button>
        </div>
      )}

      {loading && (
        <div className="h-1 rounded-sm bg-[var(--border-2)] mb-4 overflow-hidden">
          <div className="skel h-full rounded-sm" />
        </div>
      )}

      {rawData && (
        <>
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
                    <div className="field-chip flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="font-bold text-[13px]">{header}</span>
                      {previewRows.slice(0, 2).map((r, i) => (
                        <span key={i} className="text-[11px] text-[var(--text-3)] bg-[color-mix(in_srgb,var(--text)_6%,transparent)] rounded-md px-1.5 py-[1px]">
                          {(r as Record<string, unknown>)[header] != null ? String((r as Record<string, unknown>)[header]) : '—'}
                        </span>
                      ))}
                    </div>

                    <span className="text-center text-[var(--text-3)] text-lg">→</span>

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
                      {canonicalFields.map((f) => (
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
                          {canonicalFields.find((f) => f.key === field)?.label ?? field}
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

      <div className="flex justify-between gap-2.5">
        <button type="button" className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button type="button" className="btn btn-primary btn-lg" onClick={onNext} disabled={!isValid}>
          Review Data →
        </button>
      </div>
    </>
  );
}
