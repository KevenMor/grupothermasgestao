"use client";
import { ThemeProvider, createTheme, CssBaseline, responsiveFontSizes } from "@mui/material";

let theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: '#1976d2', contrastText: '#fff' },
    secondary: { main: '#00bcd4', contrastText: '#fff' },
    background: { default: '#f7fafd', paper: '#fff' },
    text: { primary: '#222', secondary: '#5f6a7d' },
    success: { main: '#43a047' },
    warning: { main: '#ffa726' },
    error: { main: '#e53935' },
    info: { main: '#0288d1' },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: -1 },
    h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: -0.5 },
    h3: { fontWeight: 600, fontSize: '1.5rem' },
    h4: { fontWeight: 600, fontSize: '1.25rem' },
    h5: { fontWeight: 500, fontSize: '1.1rem' },
    h6: { fontWeight: 500, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          fontWeight: 600,
          padding: '8px 24px',
          transition: 'all 0.2s',
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #1976d2 0%, #00bcd4 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
} 