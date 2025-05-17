import React from 'react';
import { Box, CircularProgress, Typography, Backdrop, SxProps, Theme } from '@mui/material';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  position?: 'absolute' | 'fixed';
  sx?: SxProps<Theme>;
}

/**
 * Composant pour afficher un indicateur de chargement avec un message
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  message = 'Chargement en cours...',
  position = 'absolute',
  sx
}) => {
  if (!open) return null;

  return (
    <Backdrop
      open={open}
      sx={{
        position,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <CircularProgress color="primary" size={60} thickness={4} sx={{ mb: 2 }} />
        {message && (
          <Typography variant="h6" color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
};

export default LoadingOverlay;