// Validation and transformation logic

export const VALID_ROLES = ['admin', 'editor', 'viewer', 'manager', 'developer', 'analyst', 'support'] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

export interface RawRow extends Record<string, string> {
  _id: string;
}

export interface MappedRow {
  _id: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  department?: string;
  external_id?: string;
  _errors?: Record<string, string>;
  _status?: 'success' | 'failed' | 'skipped' | null;
  _errorMsg?: string | null;
}

export type Mapping = Partial<Record<string, string>>;

export function validateRow(
  row: MappedRow,
  allRows: MappedRow[],
  existingEmails: Set<string> = new Set(),
  rowIndex: number,
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Required: email
  if (!row.email || !row.email.trim()) {
    errors['email'] = 'Email is required';
  } else if (!EMAIL_RE.test(row.email.trim())) {
    errors['email'] = 'Invalid email format';
  } else {
    // Duplicate within file
    const dupeIdx = allRows.findIndex(
      (r, i) => i !== rowIndex && r.email && r.email.trim().toLowerCase() === row.email!.trim().toLowerCase(),
    );
    if (dupeIdx !== -1) errors['email'] = `Duplicate of row ${dupeIdx + 1}`;
    // Duplicate against existing
    if (existingEmails.has(row.email.trim().toLowerCase())) {
      errors['email'] = 'Already exists in system';
    }
  }

  // Required: name
  if (!row.name || !row.name.trim()) {
    errors['name'] = 'Name is required';
  }

  // Optional: phone
  if (row.phone && row.phone.trim() && !PHONE_RE.test(row.phone.trim())) {
    errors['phone'] = 'Invalid phone format';
  }

  // Optional: role allowlist
  if (row.role && row.role.trim()) {
    const roleVal = row.role.trim().toLowerCase();
    if (!(VALID_ROLES as readonly string[]).includes(roleVal)) {
      errors['role'] = `Must be one of: ${VALID_ROLES.join(', ')}`;
    }
  }

  return errors;
}

export function validateAllRows(rows: MappedRow[], existingEmails: Set<string> = new Set()): MappedRow[] {
  return rows.map((row, i) => ({
    ...row,
    _errors: validateRow(row, rows, existingEmails, i),
    _status: null,
  }));
}

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

export function autoDetectMapping(headers: string[]): Mapping {
  const mapping: Mapping = {};
  const FIELD_PATTERNS: Record<string, RegExp> = {
    email: /email|e-mail|mail/i,
    name: /^name$|full.?name|display.?name/i,
    first_name: /first.?name|firstname/i,
    last_name: /last.?name|lastname|surname/i,
    phone: /phone|mobile|tel/i,
    role: /role|permission|access.?level/i,
    department: /dept|department|team/i,
    external_id: /id$|user.?id|external/i,
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

export function applyMapping(rows: RawRow[], mapping: Mapping): MappedRow[] {
  return rows.map((row) => {
    const mapped: MappedRow = { _id: row._id };
    for (const [field, srcCol] of Object.entries(mapping)) {
      if (srcCol && row[srcCol] !== undefined) {
        (mapped as unknown as Record<string, string>)[field] = row[srcCol] ?? '';
      }
    }
    // If separate first/last name but no full name
    if (!mapped.name && (mapped.first_name || mapped.last_name)) {
      mapped.name = [mapped.first_name, mapped.last_name].filter(Boolean).join(' ');
    }
    return mapped;
  });
}
