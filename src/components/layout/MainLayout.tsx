'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useSession } from 'next-auth/react';
import Sidebar from './Sidebar';
import Header from './Header';
import { HistoryProvider } from '@/lib/context/HistoryContext';

// Définir le type de session étendu
interface ExtendedSession {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
  };
}

// Thème personnalisé Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#4791db',
      dark: '#115293',
    },
    secondary: {
      main: '#e91e63',
      light: '#ed4b82',
      dark: '#a31545',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Poppins',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      color: '#1a1a1a',
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
      marginBottom: '1rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: string };

  // Afficher un indicateur de chargement pendant la vérification de la session
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (status === 'unauthenticated' || !session?.user?.isAdmin) {
    router.push('/auth/login');
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HistoryProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Header />
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
              {children}
            </Box>
          </Box>
        </Box>
      </HistoryProvider>
    </ThemeProvider>
  );
}