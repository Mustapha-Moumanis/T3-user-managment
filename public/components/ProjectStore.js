
// ProjectStore — persist/load project configs in localStorage
// Credentials are stored locally (simulating server-side vault in a real app)

const STORAGE_KEY = 'uim_projects_v1';
const LAST_PROJECT_KEY = 'uim_last_project_id';

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProjects(projects) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch {}
}

function getLastProjectId() {
  return localStorage.getItem(LAST_PROJECT_KEY) || null;
}

function setLastProjectId(id) {
  if (id) localStorage.setItem(LAST_PROJECT_KEY, id);
  else localStorage.removeItem(LAST_PROJECT_KEY);
}

function upsertProject(project) {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === project.id);
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

function deleteProject(id) {
  const projects = loadProjects().filter(p => p.id !== id);
  saveProjects(projects);
  if (getLastProjectId() === id) setLastProjectId(null);
  return projects;
}

function generateId() {
  return 'proj_' + Math.random().toString(36).slice(2, 10);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

Object.assign(window, {
  ProjectStore: { loadProjects, saveProjects, upsertProject, deleteProject, generateId, getLastProjectId, setLastProjectId, formatDate }
});
