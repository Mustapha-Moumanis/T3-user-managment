'use client';

import React from 'react';
import {
  ThemeProvider, CssBaseline, Box, Typography, Stepper, Step,
  StepLabel, AppBar, Toolbar, IconButton, Tooltip, Fab, Stack,
  useMediaQuery,
} from '@mui/material';
import { getTheme } from '@/lib/theme';
import { applyMapping, parseCSVText, autoDetectMapping, validateAllRows, type MappedRow, type Mapping } from '@/lib/validation';
import { upsertProject, generateId, setLastProjectId, type Project } from '@/lib/projectStore';
import { ProjectPicker } from '@/components/ProjectPicker';
import { ProjectConfig } from '@/components/ProjectConfig';
import { UploadMapping, type RawData } from '@/components/UploadMapping';
import { ReviewStep } from '@/components/ReviewStep';
import { AddUserModal } from '@/components/AddUserModal';
import {
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakButton,
} from '@/components/TweaksPanel';

// ── Icons ────────────────────────────────────────────────────────────────────

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const PersonAddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'config' | 'upload' | 'review';

// Index signature required so useTweaks generic constraint is satisfied
interface TweakDefaults extends Record<string, string | boolean | number> {
  colorMode: string;
  accentColor: string;
  density: string;
  showRowNumbers: boolean;
}

const TWEAK_DEFAULTS: TweakDefaults = {
  colorMode: 'light',
  accentColor: '#159e87',
  density: 'normal',
  showRowNumbers: true,
};

const DEFAULT_CONFIG: Project = {
  id: '',
  projectName: '',
  baseUrl: '',
  auth: { type: 'bearer', value: '' },
  endpoints: [
    { id: 'create', label: 'Create User', method: 'POST', path: '/users' },
    { id: 'bulk', label: 'Bulk Import', method: 'POST', path: '/users/bulk' },
  ],
};

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const colorMode: 'light' | 'dark' =
    tweaks.colorMode === 'system' ? (prefersDark ? 'dark' : 'light') : tweaks.colorMode === 'dark' ? 'dark' : 'light';

  const theme = React.useMemo(() => getTheme(colorMode), [colorMode]);

  // ── Navigation state ───────────────────────────────────────────────────────
  const [screen, setScreen] = React.useState<Screen>('home');

  // ── Project config ─────────────────────────────────────────────────────────
  const [config, setConfig] = React.useState<Project>(DEFAULT_CONFIG);

  // ── Upload/mapping state ───────────────────────────────────────────────────
  const [rawData, setRawData] = React.useState<RawData | null>(null);
  const [mapping, setMapping] = React.useState<Mapping>({});
  const [rows, setRows] = React.useState<MappedRow[]>([]);
  const [fields, setFields] = React.useState<string[]>([]);

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [addUserOpen, setAddUserOpen] = React.useState(false);
  const [addUserConfig, setAddUserConfig] = React.useState<Project | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isImporting = screen === 'upload' || screen === 'review';
  const importStepIndex = screen === 'upload' ? 0 : screen === 'review' ? 1 : -1;

  const handleConfigSave = (cfg: Project) => {
    const toSave: Project = cfg.id ? cfg : { ...cfg, id: generateId() };
    upsertProject(toSave);
    setConfig(toSave);
    setScreen('upload');
    setRawData(null);
    setMapping({});
    setRows([]);
    setFields([]);
  };

  const handleSelectProject = (project: Project) => {
    setConfig(project);
    setLastProjectId(project.id);
    setScreen('upload');
    setRawData(null);
    setMapping({});
    setRows([]);
    setFields([]);
  };

  const handleEditProject = (project?: Project) => {
    setConfig(project ?? DEFAULT_CONFIG);
    setScreen('config');
  };

  const handleCreateNew = () => {
    setConfig({ ...DEFAULT_CONFIG, id: '' });
    setScreen('config');
  };

  const handleMappingNext = () => {
    if (!rawData) return;
    const mapped = applyMapping(rawData.rows, mapping);
    const validated = validateAllRows(mapped);
    const activeFields = Object.keys(mapping).filter((k) => mapping[k] && mapping[k] !== '_skip');
    setRows(validated);
    setFields(activeFields);
    setScreen('review');
  };

  const handleFileLoad = (parsed: RawData | null, autoMap: Mapping) => {
    if (!parsed) { setRawData(null); setMapping({}); return; }
    setRawData({ ...parsed, fileName: parsed.fileName ?? 'users.csv' });
    setMapping(autoMap);
  };

  const handleAddUser = (project?: Project) => {
    setAddUserConfig(project ?? config);
    setAddUserOpen(true);
  };

  const configLabel = config.projectName || 'New Project';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

        {/* ── App Bar ──────────────────────────────────────────────────────── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {/* Logo */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2, cursor: 'pointer' }}
              onClick={() => setScreen('home')}
            >
              <Box sx={{
                width: 32, height: 32, borderRadius: 1.5, bgcolor: 'primary.main',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
                UserImport
              </Typography>
            </Box>

            {/* Breadcrumb / Stepper */}
            {screen === 'home' && (
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Projects</Typography>
            )}
            {screen === 'config' && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 500, cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
                  onClick={() => setScreen('home')}
                >
                  Projects
                </Typography>
                <Typography variant="body2" color="text.secondary">/</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{configLabel}</Typography>
              </Stack>
            )}
            {isImporting && (
              <>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' } }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500, cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
                    onClick={() => setScreen('home')}
                  >
                    Projects
                  </Typography>
                  <Typography variant="body2" color="text.secondary">/</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500, cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
                    onClick={() => handleEditProject(config)}
                  >
                    {configLabel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">/</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Import</Typography>
                </Stack>
                <Stepper activeStep={importStepIndex} sx={{ flex: 1, display: { xs: 'none', lg: 'flex' }, ml: 2 }}>
                  {['Upload & Map', 'Review & Import'].map((label, i) => (
                    <Step key={label} completed={i < importStepIndex}>
                      <StepLabel
                        onClick={() => i < importStepIndex && setScreen(i === 0 ? 'upload' : 'review')}
                        sx={{ cursor: i < importStepIndex ? 'pointer' : 'default' }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: importStepIndex === i ? 700 : 400 }}>{label}</Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </>
            )}

            <Box sx={{ flex: 1 }} />

            {/* Right actions */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              {isImporting && config.baseUrl && (
                <Tooltip title="Add single user">
                  <IconButton size="small" onClick={() => handleAddUser(config)} sx={{ color: 'text.secondary' }}>
                    <PersonAddIcon />
                  </IconButton>
                </Tooltip>
              )}
              {isImporting && (
                <Tooltip title="Project settings">
                  <IconButton size="small" onClick={() => handleEditProject(config)} sx={{ color: 'text.secondary' }}>
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}>
                <IconButton
                  size="small"
                  onClick={() => setTweak('colorMode', colorMode === 'dark' ? 'light' : 'dark')}
                  sx={{ color: 'text.secondary' }}
                >
                  {colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
          {screen === 'home' && (
            <ProjectPicker
              onSelect={handleSelectProject}
              onCreateNew={handleCreateNew}
              onAddUser={(project) => handleAddUser(project)}
            />
          )}

          {screen === 'config' && (
            <ProjectConfig
              config={config}
              onChange={setConfig}
              onNext={() => handleConfigSave(config)}
              onBack={() => setScreen('home')}
              isEdit={!!config.id}
            />
          )}

          {screen === 'upload' && (
            <UploadMapping
              rawData={rawData}
              mapping={mapping}
              onMappingChange={setMapping}
              onFileLoad={handleFileLoad}
              onNext={handleMappingNext}
              onBack={() => setScreen('home')}
            />
          )}

          {screen === 'review' && (
            <ReviewStep
              rows={rows}
              fields={fields}
              config={config}
              mappedRows={rows}
              onBack={() => setScreen('upload')}
              onRowUpdate={(updated) => setRows(updated)}
              onDeleteSelected={(updated) => setRows(updated)}
              onStartNew={() => {
                setScreen('home');
                setRawData(null);
                setMapping({});
                setRows([]);
                setFields([]);
              }}
            />
          )}
        </Box>

        {/* FAB — mobile add user */}
        {isImporting && config.baseUrl && (
          <Tooltip title="Add single user" placement="left">
            <Fab
              color="primary"
              size="medium"
              onClick={() => handleAddUser(config)}
              sx={{
                position: 'fixed', bottom: 28, right: 28,
                display: { xs: 'flex', md: 'none' },
                boxShadow: '0 4px 20px rgba(92,107,192,0.45)',
              }}
            >
              <PersonAddIcon />
            </Fab>
          </Tooltip>
        )}

        {/* Add User Modal */}
        <AddUserModal
          open={addUserOpen}
          onClose={() => { setAddUserOpen(false); setAddUserConfig(null); }}
          config={addUserConfig ?? config}
        />

        {/* Tweaks Panel */}
        <TweaksPanel>
          <TweakSection title="Appearance">
            <TweakRadio
              label="Color Mode"
              value={String(tweaks.colorMode)}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
              onChange={(v) => setTweak('colorMode', v)}
            />
            <TweakColor
              label="Accent Color"
              value={String(tweaks.accentColor)}
              onChange={(v) => setTweak('accentColor', v)}
            />
            <TweakRadio
              label="Table Density"
              value={String(tweaks.density)}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'normal', label: 'Normal' },
              ]}
              onChange={(v) => setTweak('density', v)}
            />
          </TweakSection>
          <TweakSection title="Table">
            <TweakToggle
              label="Show Row Numbers"
              value={Boolean(tweaks.showRowNumbers)}
              onChange={(v) => setTweak('showRowNumbers', v)}
            />
          </TweakSection>
          <TweakSection title="Demo">
            <TweakButton label="← Back to Projects" onClick={() => setScreen('home')} />
            <TweakButton
              label="Load Demo & Skip to Review"
              onClick={() => {
                const demoCSV = `email,full_name,phone,role,department\nalice@acme.com,Alice Johnson,+1-555-0101,admin,Engineering\nbob@acme.com,Bob Smith,+1-555-0102,editor,Marketing\ncarol@acme.com,Carol White,,viewer,Design\ndave.invalid,Dave Brown,555-9999,superadmin,Sales\nalice@acme.com,Alice Duplicate,,viewer,HR\neve@acme.com,Eve Davis,+1-555-0106,analyst,Data\nfrank@acme.com,,+1-555-0107,developer,Engineering\ngrace@acme.com,Grace Lee,+1-555-0108,manager,Product`;
                const parsed = parseCSVText(demoCSV);
                const autoMap = autoDetectMapping(parsed.headers);
                const mapped = applyMapping(parsed.rows, autoMap);
                const validated = validateAllRows(mapped);
                const activeFields = Object.keys(autoMap).filter((k) => autoMap[k] && autoMap[k] !== '_skip');
                const demoProject: Project = {
                  id: generateId(),
                  projectName: 'Demo Project',
                  baseUrl: 'https://api.example.com/v1',
                  auth: { type: 'bearer', value: 'demo-token-abc123' },
                  endpoints: DEFAULT_CONFIG.endpoints,
                };
                upsertProject(demoProject);
                setConfig(demoProject);
                setRawData({ ...parsed, fileName: 'demo-users.csv' });
                setMapping(autoMap);
                setRows(validated);
                setFields(activeFields);
                setScreen('review');
              }}
            />
          </TweakSection>
        </TweaksPanel>
      </Box>
    </ThemeProvider>
  );
}
