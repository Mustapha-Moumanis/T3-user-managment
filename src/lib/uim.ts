export type AuthType = 'bearer' | 'apikey' | 'basic' | 'oauth2';
export type ImportStatus = 'success' | 'failed' | 'skipped' | null;
export type CanonicalField =
  | 'email'
  | 'name'
  | 'first_name'
  | 'last_name'
  | 'role'
  | 'phone'
  | 'department'
  | 'external_id';

export interface EndpointConfig {
  id: string;
  label: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
}

export interface ProjectConfig {
  id: string;
  projectName: string;
  baseUrl: string;
  auth: {
    type: AuthType;
    value: string;
    headerName?: string;
    username?: string;
    clientId?: string;
    tokenUrl?: string;
  };
  endpoints: EndpointConfig[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ParsedRow {
  _id: string;
  [key: string]: unknown;
}

export interface ParsedTable {
  headers: string[];
  rows: ParsedRow[];
  fileName?: string;
}

export interface ValidationErrors {
  email?: string;
  name?: string;
  phone?: string;
  role?: string;
}

export interface ImportedRow extends ParsedRow {
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone?: string;
  department?: string;
  external_id?: string;
  _errors: ValidationErrors;
  _status: ImportStatus;
  _errorMsg?: string | null;
}

export interface TweakState {
  colorMode: 'light' | 'dark' | 'system';
  accentColor: string;
  density: 'compact' | 'normal';
  showRowNumbers: boolean;
}

export const VALID_ROLES = ['admin', 'editor', 'viewer', 'manager', 'developer', 'analyst', 'support'] as const;

export const DEFAULT_ENDPOINTS: EndpointConfig[] = [
  { id: 'create', label: 'Create User', method: 'POST', path: '/users' },
  { id: 'bulk', label: 'Bulk Import', method: 'POST', path: '/users/bulk' },
];

export const DEFAULT_CONFIG: ProjectConfig = {
  id: '',
  projectName: '',
  baseUrl: '',
  auth: { type: 'bearer', value: '' },
  endpoints: DEFAULT_ENDPOINTS,
};

export const DEFAULT_TWEAKS: TweakState = {
  colorMode: 'light',
  accentColor: '#159e87',
  density: 'normal',
  showRowNumbers: true,
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

const STORAGE_KEY = 'uim_projects_v2';
const LAST_PROJECT_KEY = 'uim_last_project_v2';
const TWEAKS_KEY = 'uim_tweaks_v2';

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function loadProjects(): ProjectConfig[] {
  return readStorage<ProjectConfig[]>(STORAGE_KEY, []);
}

export function saveProjects(projects: ProjectConfig[]) {
  writeStorage(STORAGE_KEY, projects);
}

export function getLastProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LAST_PROJECT_KEY);
}

export function setLastProjectId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) window.localStorage.setItem(LAST_PROJECT_KEY, id);
  else window.localStorage.removeItem(LAST_PROJECT_KEY);
}

export function generateId(prefix = 'proj'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function upsertProject(project: ProjectConfig): ProjectConfig[] {
  const projects = loadProjects();
  const now = new Date().toISOString();
  const nextProject = {
    ...project,
    updatedAt: now,
    createdAt: project.createdAt || now,
  } satisfies ProjectConfig;

  const idx = projects.findIndex((item) => item.id === project.id);
  if (idx >= 0) projects[idx] = nextProject;
  else projects.push(nextProject);

  saveProjects(projects);
  setLastProjectId(project.id);
  return projects;
}

export function deleteProject(id: string): ProjectConfig[] {
  const projects = loadProjects().filter((item) => item.id !== id);
  saveProjects(projects);
  if (getLastProjectId() === id) setLastProjectId(null);
  return projects;
}

export function formatDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function loadTweaks(): TweakState {
  return readStorage<TweakState>(TWEAKS_KEY, DEFAULT_TWEAKS);
}

export function saveTweaks(tweaks: TweakState) {
  writeStorage(TWEAKS_KEY, tweaks);
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  values.push(current.trim());
  return values;
}

export function parseCSVText(text: string): ParsedTable {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row: ParsedRow = { _id: `row-${index}` };
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? '';
    });
    return row;
  });

  return { headers, rows };
}

export function autoDetectMapping(headers: string[]): Partial<Record<CanonicalField, string>> {
  const mapping: Partial<Record<CanonicalField, string>> = {};
  const patterns: Array<[CanonicalField, RegExp]> = [
    ['email', /email|e-mail|mail/i],
    ['name', /^name$|full.?name|display.?name/i],
    ['first_name', /first.?name|firstname/i],
    ['last_name', /last.?name|lastname|surname/i],
    ['phone', /phone|mobile|tel/i],
    ['role', /role|permission|access.?level/i],
    ['department', /dept|department|team/i],
    ['external_id', /id$|user.?id|external/i],
  ];

  headers.forEach((header) => {
    for (const [field, regex] of patterns) {
      if (regex.test(header) && !Object.values(mapping).includes(header)) {
        if (!mapping[field]) mapping[field] = header;
        break;
      }
    }
  });

  return mapping;
}

export function applyMapping(
  rows: ParsedRow[],
  mapping: Partial<Record<CanonicalField | '_skip', string>>
): Array<Record<string, string> & { _id: string }> {
  return rows.map((row) => {
    const mapped: Record<string, string> & { _id: string } = { _id: row._id };

    (Object.entries(mapping) as Array<[CanonicalField | '_skip', string | undefined]>).forEach(
      ([field, sourceColumn]) => {
        if (!sourceColumn || field === '_skip') return;
        const value = row[sourceColumn];
        if (typeof value === 'string') mapped[field] = value;
      }
    );

    if (!mapped.name && (mapped.first_name || mapped.last_name)) {
      mapped.name = [mapped.first_name, mapped.last_name].filter(Boolean).join(' ');
    }

    return mapped;
  });
}

export function validateRow(
  row: Partial<Record<string, unknown>>,
  allRows: Array<Partial<Record<string, unknown>>>,
  existingEmails = new Set<string>(),
  rowIndex = -1
): ValidationErrors {
  const errors: ValidationErrors = {};

  const email = typeof row.email === 'string' ? row.email.trim() : '';
  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Invalid email format';
  else {
    const duplicateIndex = allRows.findIndex(
      (item, index) => {
        const itemEmail = typeof item.email === 'string' ? item.email.trim().toLowerCase() : '';
        return index !== rowIndex && itemEmail === email.toLowerCase();
      }
    );
    if (duplicateIndex >= 0) errors.email = `Duplicate of row ${duplicateIndex + 1}`;
    if (existingEmails.has(email.toLowerCase())) errors.email = 'Already exists in system';
  }

  if (!(typeof row.name === 'string' ? row.name.trim() : '')) errors.name = 'Name is required';

  const phone = typeof row.phone === 'string' ? row.phone.trim() : '';
  if (phone && !PHONE_RE.test(phone)) errors.phone = 'Invalid phone format';

  const role = typeof row.role === 'string' ? row.role.trim().toLowerCase() : '';
  if (role && !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    errors.role = `Must be one of: ${VALID_ROLES.join(', ')}`;
  }

  return errors;
}

export function validateAllRows(rows: Array<{ _id: string; [key: string]: unknown }>, existingEmails = new Set<string>()) {
  return rows.map<ImportedRow>((row, index) => ({
    ...row,
    _errors: validateRow(row, rows, existingEmails, index),
    _status: null,
    _errorMsg: null,
  }));
}

export function createDemoCsv() {
  return `email,full_name,phone,role,department,user_id
alice@acme.com,Alice Johnson,+1-555-0101,admin,Engineering,U001
bob@acme.com,Bob Smith,+1-555-0102,editor,Marketing,U002
carol@acme.com,Carol White,,viewer,Design,U003
dave.invalid,Dave Brown,555-9999,superadmin,Sales,U004
alice@acme.com,Alice Duplicate,,viewer,HR,U005
eve@acme.com,Eve Davis,+1-555-0106,analyst,Data,U006
frank@acme.com,,+1-555-0107,developer,Engineering,U007
grace@acme.com,Grace Lee,+1-555-0108,manager,Product,U008`;
}
