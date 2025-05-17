'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers le tableau de bord
    router.push('/dashboard');
  }, [router]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: 2
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h5">Chargement de Cikatio...</Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
        Développé avec ❤️ par StevenB
      </Typography>
    </Box>
  );
}
