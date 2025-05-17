// Utilitaire pour obtenir les propriétés d'affichage d'un badge de statut (label, couleur, icône)
// Utilisé pour afficher le statut d'un item ou d'un prêt dans toute l'application
import { CheckCircle as AvailableIcon, Cancel as UnavailableIcon, AccessTime as TimeIcon, Error as ErrorIcon, Done as DoneIcon, Warning as WarningIcon } from '@mui/icons-material';
import { getStatusBadgeProps as getStatusBadgePropsLib } from '@/lib/statusBadges';
import type { StatusType } from '@/types';
import Chip, { ChipProps } from '@mui/material/Chip'; // Import ChipProps
import React from 'react';

export { StatusType };

export function getStatusBadgeProps(status: StatusType) {
  return getStatusBadgePropsLib(status);
}

// Update props to include ChipProps for sx support
export function StatusBadge({ status, ...chipProps }: { status: string } & ChipProps) {
  const { label, color, icon } = getStatusBadgePropsLib(status);
  return (
    <Chip
      label={label}
      color={color}
      icon={icon}
      size="small"
      sx={{
        fontWeight: 500,
        borderRadius: 1,
        px: 1.5,
        textTransform: 'capitalize',
        minWidth: 150,
        maxWidth: 150,
        width: 150,
        display: 'inline-flex',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        justifyContent: 'center',
        alignItems: 'center',
        ...chipProps.sx, // Merge incoming sx props
      }}
      variant="filled"
      {...chipProps} // Spread other ChipProps
    />
  );
}
