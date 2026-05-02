
// Validation and transformation logic (reusable)

const VALID_ROLES = ['admin', 'editor', 'viewer', 'manager', 'developer', 'analyst', 'support'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

function validateRow(row, allRows, existingEmails = new Set(), rowIndex) {
  const errors = {};

  // Required: email
  if (!row.email || !row.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_RE.test(row.email.trim())) {
    errors.email = 'Invalid email format';
  } else {
    // Duplicate within file
    const dupeIdx = allRows.findIndex((r, i) => i !== rowIndex && r.email && r.email.trim().toLowerCase() === row.email.trim().toLowerCase());
    if (dupeIdx !== -1) errors.email = `Duplicate of row ${dupeIdx + 1}`;
    // Duplicate against existing
    if (existingEmails.has(row.email.trim().toLowerCase())) {
      errors.email = 'Already exists in system';
    }
  }

  // Required: name
  if (!row.name || !row.name.trim()) {
    errors.name = 'Name is required';
  }

  // Optional: phone
  if (row.phone && row.phone.trim() && !PHONE_RE.test(row.phone.trim())) {
    errors.phone = 'Invalid phone format';
  }

  // Optional: role allowlist
  if (row.role && row.role.trim()) {
    const roleVal = row.role.trim().toLowerCase();
    if (!VALID_ROLES.includes(roleVal)) {
      errors.role = `Must be one of: ${VALID_ROLES.join(', ')}`;
    }
  }

  return errors;
}

function validateAllRows(rows, existingEmails = new Set()) {
  return rows.map((row, i) => ({
    ...row,
    _errors: validateRow(row, rows, existingEmails, i),
    _status: null, // will be set after import
  }));
}

function parseCSVText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  
  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
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

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map((line, i) => {
    const vals = parseRow(line);
    const obj = { _id: `row-${i}` };
    headers.forEach((h, hi) => { obj[h] = vals[hi] || ''; });
    return obj;
  });
  return { headers, rows };
}

function autoDetectMapping(headers) {
  const mapping = {};
  const FIELD_PATTERNS = {
    email: /email|e-mail|mail/i,
    name: /^name$|full.?name|display.?name/i,
    first_name: /first.?name|firstname/i,
    last_name: /last.?name|lastname|surname/i,
    phone: /phone|mobile|tel/i,
    role: /role|permission|access.?level/i,
    department: /dept|department|team/i,
    external_id: /id$|user.?id|external/i,
  };
  headers.forEach(h => {
    for (const [field, re] of Object.entries(FIELD_PATTERNS)) {
      if (re.test(h) && !Object.values(mapping).includes(h)) {
        if (!mapping[field]) mapping[field] = h;
        break;
      }
    }
  });
  return mapping;
}

function applyMapping(rows, mapping) {
  return rows.map(row => {
    const mapped = { _id: row._id };
    for (const [field, srcCol] of Object.entries(mapping)) {
      if (srcCol && row[srcCol] !== undefined) mapped[field] = row[srcCol];
    }
    // If separate first/last name but no full name
    if (!mapped.name && (mapped.first_name || mapped.last_name)) {
      mapped.name = [mapped.first_name, mapped.last_name].filter(Boolean).join(' ');
    }
    return mapped;
  });
}

const VALID_ROLES_LIST = VALID_ROLES;

Object.assign(window, {
  validateRow,
  validateAllRows,
  parseCSVText,
  autoDetectMapping,
  applyMapping,
  VALID_ROLES_LIST,
  EMAIL_RE,
  PHONE_RE,
});
