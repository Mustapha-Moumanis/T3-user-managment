import type { ProjectEndpoint } from './schemas';
import * as XLSX from 'xlsx';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'array';
  required: boolean;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RawRow extends Record<string, string> {
  _id: string;
}

export interface ProcessedRow {
  _id: string;
  data: Record<string, string>;
  validation: {
    errors: Record<string, string>;
  };
  import: {
    status: 'pending' | 'sending' | 'success' | 'server-error' | 'skipped';
    errorMessage?: string | null;
  };
}

export type Mapping = Partial<Record<string, string>>;

// ── CSV serialisation ─────────────────────────────────────────────────────────

export function rowsToCSV(headers: string[], rows: RawRow[]): string {
  const esc = (v: string) =>
    v.includes(',') || v.includes('"') || v.includes('\n')
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  return [
    headers.map(esc).join(','),
    ...rows.map((r) => headers.map((h) => esc(r[h] ?? '')).join(',')),
  ].join('\n');
}

// ── CSV parsing ───────────────────────────────────────────────────────────────

export function parseCSVText(text: string): { headers: string[]; rows: RawRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0] ?? '');
  const rows: RawRow[] = lines.slice(1).map((line, i) => {
    const vals = parseRow(line);
    const obj: RawRow = { _id: `row-${i}` };
    headers.forEach((h, hi) => {
      obj[h] = vals[hi] ?? '';
    });
    return obj;
  });
  return { headers, rows };
}

// ── Excel parsing ─────────────────────────────────────────────────────────────

export function parseExcelBuffer(buffer: ArrayBuffer): { headers: string[]; rows: RawRow[] } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return { headers: [], rows: [] };
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) return { headers: [], rows: [] };

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  if (data.length === 0) return { headers: [], rows: [] };

  const headers = Object.keys(data[0]!);
  const rows: RawRow[] = data.map((row, i) => {
    const obj: RawRow = { _id: `row-${i}` };
    headers.forEach((h) => {
      obj[h] = row[h] != null ? String(row[h]) : '';
    });
    return obj;
  });

  return { headers, rows };
}

// ── Auto-detect mapping ───────────────────────────────────────────────────────

export function autoDetectMapping(headers: string[]): Mapping {
  const mapping: Mapping = {};
  const FIELD_PATTERNS: Record<string, RegExp> = {
    email: /email|e-mail|mail/i,
    name: /^name$|full.?name|display.?name|nom.?complet/i,
    codeCentre: /code.?centre|centre.?code|codecentre/i,
    codeAref: /code.?aref|aref.?code|codeAref/i,
    matieres: /matiere|matieres?|subject/i,
    first_name: /first.?name|firstname|prenom/i,
    last_name: /last.?name|lastname|surname/i,
    phone: /phone|mobile|tel/i,
    role: /role|permission|access.?level/i,
    department: /dept|department|team/i,
    external_id: /^id$|user.?id|external/i,
  };
  headers.forEach((h) => {
    for (const [field, re] of Object.entries(FIELD_PATTERNS)) {
      if (re.test(h) && !Object.values(mapping).includes(h)) {
        if (!mapping[field]) {
          mapping[field] = h;
          break;
        }
      }
    }
  });
  return mapping;
}

// ── Apply mapping ─────────────────────────────────────────────────────────────

export function applyMapping(rows: RawRow[], mapping: Mapping): ProcessedRow[] {
  return rows.map((row) => {
    const data: Record<string, string> = {};
    for (const [field, srcCol] of Object.entries(mapping)) {
      if (srcCol && srcCol !== '_skip' && row[srcCol] !== undefined) {
        data[field] = row[srcCol] ?? '';
      }
    }
    // Combine first/last name if separate columns but no "name" mapping
    if (!data['name'] && (data['first_name'] || data['last_name'])) {
      data['name'] = [data['first_name'], data['last_name']].filter(Boolean).join(' ');
    }
    return {
      _id: row._id,
      data,
      validation: { errors: {} },
      import: { status: 'pending' as const },
    };
  });
}

// ── Endpoint-driven field defs ────────────────────────────────────────────────

export function getFieldDefsForEndpoint(endpoint: ProjectEndpoint): FieldDef[] {
  return [
    ...(endpoint.requiredFields || []).map((f) => ({ key: f.key, label: f.label, type: f.type as FieldDef['type'], required: true })),
    ...(endpoint.optionalFields || []).map((f) => ({ key: f.key, label: f.label, type: f.type as FieldDef['type'], required: false })),
    { key: '_skip', label: '— Skip Column —', required: false },
  ];
}

// ── Endpoint payload builder ──────────────────────────────────────────────────

export function buildEndpointPayload(
  row: ProcessedRow,
  endpoint: ProjectEndpoint,
): Record<string, unknown> {
  const allFields = [...(endpoint.requiredFields || []), ...(endpoint.optionalFields || [])];
  const payload: Record<string, unknown> = {};
  for (const f of allFields) {
    const val = row.data[f.key];
    if (!val?.trim()) continue;
    payload[f.key] = f.type === 'array'
      ? val.split(',').map((s) => s.trim()).filter(Boolean)
      : f.type === 'number'
        ? Number(val)
        : val.trim();
  }
  return payload;
}

// ── Endpoint-driven validation ────────────────────────────────────────────────

function validateRowForEndpoint(
  data: Record<string, string>,
  allData: Record<string, string>[],
  existingEmails: Set<string>,
  rowIndex: number,
  endpoint: ProjectEndpoint,
  globalDomains: string[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  const emailVal = data['email'];
  if (!emailVal?.trim()) {
    errors['email'] = 'Email is required';
  } else if (!EMAIL_RE.test(emailVal.trim())) {
    errors['email'] = 'Invalid email format';
  } else {
    // Merge global env domains with per-endpoint domains; empty = allow all
    const effectiveDomains = [
      ...new Set([...globalDomains, ...(endpoint.emailDomainAllowlist ?? [])]),
    ];
    if (effectiveDomains.length > 0) {
      const domain = emailVal.trim().split('@')[1]?.toLowerCase() ?? '';
      if (!effectiveDomains.some((d) => d.toLowerCase() === domain)) {
        errors['email'] = `Email domain must be: ${effectiveDomains.join(', ')}`;
      }
    }
    if (!errors['email']) {
      const dupeIdx = allData.findIndex(
        (r, i) =>
          i !== rowIndex &&
          r['email']?.trim().toLowerCase() === emailVal.trim().toLowerCase(),
      );
      if (dupeIdx !== -1) errors['email'] = `Duplicate of row ${dupeIdx + 1}`;
      if (existingEmails.has(emailVal.trim().toLowerCase())) errors['email'] = 'Already exists in system';
    }
  }

  for (const f of (endpoint.requiredFields || [])) {
    if (f.key === 'email') continue;
    const val = data[f.key];
    if (!val?.trim()) {
      errors[f.key] = `${f.label} is required`;
    }
  }

  return errors;
}

export function validateAllRowsForEndpoint(
  rows: ProcessedRow[],
  endpoint: ProjectEndpoint,
  existingEmails = new Set<string>(),
  globalDomains: string[] = [],
): ProcessedRow[] {
  const allData = rows.map((r) => r.data);
  return rows.map((row, i) => ({
    ...row,
    validation: {
      errors: validateRowForEndpoint(row.data, allData, existingEmails, i, endpoint, globalDomains),
    },
    // import state is intentionally preserved here
  }));
}

// ── Auth headers ──────────────────────────────────────────────────────────────

export function buildAuthHeaders(
  auth: { type?: string; value?: string; headerName?: string; username?: string } | undefined,
): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!auth?.type) return headers;

  if (auth.type === 'bearer' && auth.value) {
    headers['Authorization'] = `Bearer ${auth.value}`;
  } else if (auth.type === 'apikey' && auth.headerName && auth.value) {
    headers[auth.headerName] = auth.value;
  } else if (auth.type === 'basic' && auth.username && auth.value) {
    headers['Authorization'] = 'Basic ' + btoa(`${auth.username}:${auth.value}`);
  }

  return headers;
}
