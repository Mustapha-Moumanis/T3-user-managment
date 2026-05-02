
// ProjectPicker — home screen: list saved projects, create new, quick-start
const {
  Box, Paper, Typography, Button, Stack, Chip, IconButton,
  Tooltip, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, TextField,
} = MaterialUI;

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EditIcon2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const ImportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const KeyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);
const GlobeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const AUTH_LABELS = { bearer: 'Bearer Token', apikey: 'API Key', basic: 'Basic Auth', oauth2: 'OAuth2' };

function ProjectCard({ project, onSelect, onEdit, onDelete, onAddUser }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const authLabel = AUTH_LABELS[project.auth?.type] || 'Bearer Token';
  const domain = (() => {
    try { return new URL(project.baseUrl).hostname; } catch { return project.baseUrl; }
  })();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5, borderRadius: 2.5, cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.main', boxShadow: '0 0 0 1px', boxShadowColor: 'primary.main' },
        position: 'relative',
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="body1" fontWeight={700} sx={{ mb: 0.25 }}>{project.projectName}</Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ color: 'text.secondary', display: 'flex' }}><GlobeIcon /></Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{domain || '—'}</Typography>
          </Stack>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit project">
            <IconButton size="small" onClick={e => { e.stopPropagation(); onEdit(project); }} sx={{ color: 'text.secondary' }}>
              <EditIcon2 />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete project">
            <IconButton size="small" onClick={e => { e.stopPropagation(); setConfirmDelete(true); }} sx={{ color: 'error.main' }}>
              <TrashIcon2 />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Meta */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        <Chip
          label={authLabel}
          size="small"
          variant="outlined"
          icon={<span style={{ paddingLeft: 4, display: 'flex' }}><KeyIcon /></span>}
          sx={{ fontSize: 11 }}
        />
        <Chip
          label={`${project.endpoints?.length || 0} endpoint${project.endpoints?.length !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
        {project.updatedAt && (
          <Chip
            label={`Updated ${window.ProjectStore.formatDate(project.updatedAt)}`}
            size="small"
            sx={{ fontSize: 11, bgcolor: 'action.selected' }}
          />
        )}
      </Stack>

      {/* Actions */}
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          size="small"
          startIcon={<ImportIcon />}
          onClick={() => onSelect(project)}
          sx={{ flex: 1 }}
        >
          Import Users
        </Button>
        <Tooltip title="Add single user">
          <Button
            variant="outlined"
            size="small"
            onClick={e => { e.stopPropagation(); onAddUser(project); }}
            sx={{ minWidth: 0, px: 1.5 }}
          >
            <UserIcon />
          </Button>
        </Tooltip>
      </Stack>

      {/* Delete confirm dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete project?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <strong>"{project.projectName}"</strong> will be permanently removed. Your API credentials will be erased.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => { onDelete(project.id); setConfirmDelete(false); }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function EmptyState({ onCreate }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
      <Box sx={{
        width: 72, height: 72, borderRadius: '50%',
        bgcolor: 'action.selected', mx: 'auto', mb: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>No projects yet</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 320, mx: 'auto' }}>
        Create a project to save your API connection and credentials. Once saved, importing users takes just a few clicks.
      </Typography>
      <Button variant="contained" size="large" startIcon={<PlusIcon />} onClick={onCreate}>
        Create First Project
      </Button>
    </Box>
  );
}

function ProjectPicker({ onSelect, onCreateNew, onAddUser, onEdit }) {
  const [projects, setProjects] = React.useState(() => window.ProjectStore.loadProjects());
  const [search, setSearch] = React.useState('');
  const [confirmReset, setConfirmReset] = React.useState(false);
  const handleEdit = onEdit || onCreateNew;

  // Reload on focus (in case another tab saved something)
  React.useEffect(() => {
    const refresh = () => setProjects(window.ProjectStore.loadProjects());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const handleDelete = (id) => {
    const updated = window.ProjectStore.deleteProject(id);
    setProjects(updated);
  };

  const filtered = projects.filter(p =>
    !search || p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
    p.baseUrl?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>Projects</Typography>
          <Typography variant="body2" color="text.secondary">Choose a project or create a new one.</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search projects"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button variant="contained" startIcon={<PlusIcon />} onClick={onCreateNew}>
            New Project
          </Button>
        </Stack>
      </Stack>

      {filtered.length === 0 ? (
        <EmptyState onCreate={onCreateNew} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddUser={onAddUser}
            />
          ))}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="text" color="error" onClick={() => setConfirmReset(true)}>Reset Projects</Button>
      </Stack>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset all projects?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">This removes all saved projects from local storage.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => { window.ProjectStore.saveProjects([]); setProjects([]); setConfirmReset(false); }}>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

Object.assign(window, { ProjectPicker });
