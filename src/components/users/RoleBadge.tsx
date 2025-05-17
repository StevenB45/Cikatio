import React from 'react';
import { Chip } from '@mui/material';
import { AdminPanelSettings as AdminIcon, Person as PersonIcon } from '@mui/icons-material';

export function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Chip
      label={isAdmin ? 'Administrateur' : 'Utilisateur'}
      color={isAdmin ? 'info' : 'default'}
      size="small"
      icon={isAdmin ? <AdminIcon /> : <PersonIcon />}
      sx={{
        fontWeight: 500,
        borderRadius: 1,
        px: 1.5,
        textTransform: 'capitalize',
        ml: 0.5
      }}
      variant="filled"
    />
  );
}
