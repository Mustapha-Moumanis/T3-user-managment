
// Theme configuration for MUI system-aware dark/light mode
const { createTheme } = MaterialUI;

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#5C6BC0',
      light: '#7986CB',
      dark: '#3949AB',
      contrastText: '#fff',
    },
    secondary: {
      main: '#26A69A',
      light: '#4DB6AC',
      dark: '#00897B',
    },
    error: { main: '#EF5350' },
    warning: { main: '#FFA726' },
    success: { main: '#66BB6A' },
    background: {
      default: mode === 'dark' ? '#0F1117' : '#F4F5F7',
      paper: mode === 'dark' ? '#1A1D27' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#E8EAF0' : '#1A1D27',
      secondary: mode === 'dark' ? '#8B90A7' : '#6B7280',
    },
    divider: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },
  typography: {
    fontFamily: '"DM Sans", "Inter", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.72rem' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        containedPrimary: { boxShadow: '0 2px 8px rgba(92,107,192,0.35)' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.72rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
        head: { fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontWeight: 500 },
      },
    },
  },
});

Object.assign(window, { getTheme });
