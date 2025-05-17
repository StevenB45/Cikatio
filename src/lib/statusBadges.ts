import React from 'react';
import { Assignment as AssignmentIcon, Warning as WarningIcon, CheckCircle as CheckIcon, Cancel as CancelIcon, Error as ErrorIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import type { StatusType } from '@/types';

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'En cours',
  OVERDUE: 'En retard',
  RETURNED: 'Retourné',
  OUT_OF_ORDER: 'En panne',
  AVAILABLE: 'Disponible',
  RESERVED: 'Réservé',
  BORROWED: 'Emprunté',
  LOST: 'Perdu',
  SCHEDULED: 'Programmé',
  CONFIRMED: 'Confirmé',
  PENDING: 'En attente',
  CANCELLED: 'Annulé',
  CANCEL: 'Annulé',        // Ajout pour la compatibilité avec l'ancien format
  EXPIRED: 'Expiré',       // Ajout du statut expiré
  RESERVE: 'Réservé',      // Ajout pour les réservations avec format différent
  EXPIRATION: 'Expiré',    // Autre format possible pour expiré
};

// Stocke les composants, pas du JSX
export const STATUS_ICONS: Record<string, React.ElementType> = {
  ACTIVE: AssignmentIcon,
  OVERDUE: WarningIcon,
  RETURNED: CheckIcon,
  OUT_OF_ORDER: ErrorIcon,
  AVAILABLE: CheckIcon,
  RESERVED: TimeIcon,
  BORROWED: CancelIcon,
  LOST: CancelIcon,
  SCHEDULED: TimeIcon,
  CANCEL: CancelIcon,     // Ajout de l'icône pour CANCEL
  CANCELLED: CancelIcon,  // Ajout de l'icône pour CANCELLED
  EXPIRED: WarningIcon,   // Ajout de l'icône pour EXPIRED
  RESERVE: TimeIcon,      // Ajout de l'icône pour RESERVE
  EXPIRATION: WarningIcon // Ajout de l'icône pour EXPIRATION
};

export const STATUS_COLORS: Record<string, 'primary'|'success'|'error'|'warning'|'default'> = {
  ACTIVE: 'primary',
  OVERDUE: 'error',
  RETURNED: 'success',
  OUT_OF_ORDER: 'warning',
  AVAILABLE: 'success',
  RESERVED: 'warning',
  BORROWED: 'error',
  LOST: 'error',
  SCHEDULED: 'primary',
  CANCEL: 'error',       // Ajout de la couleur pour CANCEL
  CANCELLED: 'error',    // Ajout de la couleur pour CANCELLED
  EXPIRED: 'error',      // Ajout de la couleur pour EXPIRED
  RESERVE: 'warning',    // Ajout de la couleur pour RESERVE
  EXPIRATION: 'error'    // Ajout de la couleur pour EXPIRATION
};

export function getStatusBadgeProps(status: string) {
  const Icon = STATUS_ICONS[status];
  
  // Déterminer la couleur du badge
  const badgeColor = STATUS_COLORS[status] || 'default';
  
  // Utiliser la couleur blanche pour l'icône sur les badges colorés (non gris)
  // Pour améliorer la visibilité, surtout sur les badges rouges
  let iconColor: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' = 'inherit';
  
  if (badgeColor !== 'default') {
    // Pour tous les badges colorés, utiliser une icône blanche
    iconColor = 'inherit'; // 'inherit' donnera la couleur du texte (blanc sur fond coloré)
  } else {
    // Pour les badges gris (default), conserver les couleurs spécifiques des icônes
    if (status === 'OVERDUE' || status === 'BORROWED' || status === 'LOST' || 
        status === 'CANCEL' || status === 'CANCELLED' || status === 'EXPIRED') {
      iconColor = 'error';
    } else if (status === 'RETURNED' || status === 'AVAILABLE') {
      iconColor = 'success';
    } else if (status === 'OUT_OF_ORDER' || status === 'RESERVED') {
      iconColor = 'warning';
    } else {
      iconColor = 'primary';
    }
  }
  
  return {
    label: STATUS_LABELS[status] || status,
    color: badgeColor,
    icon: Icon ? React.createElement(Icon, { color: iconColor }) : undefined,
  };
}
