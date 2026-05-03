// Validation, transformation, and API payload logic

import type { ProjectEndpoint } from './schemas';

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

export interface MappedRow {
  _id: string;
  [key: string]: string | Record<string, string> | 'success' | 'failed' | 'skipped' | null | undefined;
  _errors?: Record<string, string>;
  _status?: 'success' | 'failed' | 'skipped' | null;
  _errorMsg?: string | null;
}

export type Mapping = Partial<Record<string, string>>;

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

export function applyMapping(rows: RawRow[], mapping: Mapping): MappedRow[] {
  return rows.map((row) => {
    const mapped: MappedRow = { _id: row._id };
    for (const [field, srcCol] of Object.entries(mapping)) {
      if (srcCol && row[srcCol] !== undefined) {
        (mapped as Record<string, unknown>)[field] = row[srcCol] ?? '';
      }
    }
    // Combine first/last name if separate columns but no "name" mapping
    const firstName = (mapped as Record<string, unknown>)['first_name'] as string | undefined;
    const lastName = (mapped as Record<string, unknown>)['last_name'] as string | undefined;
    if (!(mapped as Record<string, unknown>)['name'] && (firstName || lastName)) {
      (mapped as Record<string, unknown>)['name'] = [firstName, lastName].filter(Boolean).join(' ');
    }
    return mapped;
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
  row: MappedRow,
  endpoint: ProjectEndpoint,
): Record<string, unknown> {
  const allFields = [...(endpoint.requiredFields || []), ...(endpoint.optionalFields || [])];
  const payload: Record<string, unknown> = {};
  if (endpoint.bodyKey) payload.userType = endpoint.bodyKey;
  for (const f of allFields) {
    const val = (row as Record<string, string>)[f.key];
    if (!val?.trim()) continue;
    const payloadKey = f.key === 'name' ? 'fullName' : f.key;
    payload[payloadKey] = f.type === 'array'
      ? val.split(',').map((s) => s.trim()).filter(Boolean)
      : f.type === 'number'
        ? Number(val)
        : val.trim();
  }
  return payload;
}

// ── Endpoint-driven validation ────────────────────────────────────────────────

function validateRowForEndpoint(
  row: MappedRow,
  allRows: MappedRow[],
  existingEmails: Set<string>,
  rowIndex: number,
  endpoint: ProjectEndpoint,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const emailVal = (row as Record<string, string>)['email'];
  if (!emailVal?.trim()) {
    errors['email'] = 'Email is required';
  } else if (!EMAIL_RE.test(emailVal.trim())) {
    errors['email'] = 'Invalid email format';
  } else {
    const dupeIdx = allRows.findIndex(
      (r, i) =>
        i !== rowIndex &&
        (r as Record<string, string>)['email']?.trim().toLowerCase() === emailVal.trim().toLowerCase(),
    );
    if (dupeIdx !== -1) errors['email'] = `Duplicate of row ${dupeIdx + 1}`;
    if (existingEmails.has(emailVal.trim().toLowerCase())) errors['email'] = 'Already exists in system';
  }

  const nameVal = (row as Record<string, string>)['name'];
  if (!nameVal?.trim()) errors['name'] = 'Name is required';

  for (const f of (endpoint.requiredFields || [])) {
    if (f.key === 'email' || f.key === 'name') continue;
    const val = (row as Record<string, string>)[f.key];
    if (!val?.trim()) {
      errors[f.key] = `${f.label} is required`;
    }
  }

  return errors;
}

export function validateAllRowsForEndpoint(
  rows: MappedRow[],
  endpoint: ProjectEndpoint,
  existingEmails = new Set<string>(),
): MappedRow[] {
  return rows.map((row, i) => ({
    ...row,
    _errors: validateRowForEndpoint(row, rows, existingEmails, i, endpoint),
    _status: null,
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
