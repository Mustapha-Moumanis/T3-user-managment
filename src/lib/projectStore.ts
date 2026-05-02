// ProjectStore — persist/load project configs in localStorage
// Credentials are stored locally (simulating server-side vault in a real app)

const STORAGE_KEY = 'uim_projects_v1';
const LAST_PROJECT_KEY = 'uim_last_project_id';

export interface AuthConfig {
  type: 'bearer' | 'apikey' | 'basic' | 'oauth2';
  value: string;
  headerName?: string;
  username?: string;
  tokenUrl?: string;
  clientId?: string;
}

export interface Endpoint {
  id: string;
  label: string;
  method: 'POST' | 'PUT' | 'PATCH';
  path: string;
}

export interface Project {
  id: string;
  projectName: string;
  baseUrl: string;
  auth: AuthConfig;
  endpoints: Endpoint[];
  createdAt?: string;
  updatedAt?: string;
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // storage unavailable
  }
}

export function getLastProjectId(): string | null {
  try {
    return localStorage.getItem(LAST_PROJECT_KEY) ?? null;
  } catch {
    return null;
  }
}

export function setLastProjectId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(LAST_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(LAST_PROJECT_KEY);
    }
  } catch {
    // storage unavailable
  }
}

export function upsertProject(project: Project): Project[] {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  const now = new Date().toISOString();
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...project, updatedAt: now };
  } else {
    projects.push({ ...project, createdAt: now, updatedAt: now });
  }
  saveProjects(projects);
  setLastProjectId(project.id);
  return projects;
}

export function deleteProject(id: string): Project[] {
  const projects = loadProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  if (getLastProjectId() === id) setLastProjectId(null);
  return projects;
}

export function generateId(): string {
  return 'proj_' + Math.random().toString(36).slice(2, 10);
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
