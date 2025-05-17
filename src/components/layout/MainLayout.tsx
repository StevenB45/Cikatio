'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CssBaseline, ThemeProvider, createTheme, CircularProgress, Typography } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { isAdminAuthenticated } from '@/lib/auth';
import { HistoryProvider } from '@/lib/context';
import { NotificationProvider } from '@/components/common/NotificationProvider';

// Création du thème personnalisé pour l'application
// Séparé dans une constante pour éviter une recréation à chaque rendu
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

// Layout principal de l'application (sidebar, header, contenu, footer)
// Gère l'authentification administrateur et le thème global
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérification de l'authentification administrateur (redirection si non connecté)
    const checkAuth = () => {
      const authenticated = isAdminAuthenticated();
      setIsAuthenticated(authenticated);
      setIsAuthChecked(true);

      if (!authenticated) {
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // Afficher un indicateur de chargement tant que la vérification n'est pas terminée
  if (!isAuthChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si l'utilisateur n'est pas authentifié après vérification, ne rien afficher (la redirection est en cours)
  if (!isAuthenticated) {
    return null;
  }

  // Structure du layout (Sidebar, Header, contenu principal, footer)
  // Si authentifié, afficher le layout et les enfants
  return (
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        <HistoryProvider>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            <Sidebar />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <Header />
              <Box
                component="div"
                sx={{
                  flexGrow: 1,
                  padding: 3,
                  marginTop: '64px',
                  backgroundColor: (theme) => theme.palette.background.default,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {children}
                <Footer /> 
              </Box>
            </Box>
          </Box>
        </HistoryProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}