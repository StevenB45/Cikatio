import { useState, useCallback } from 'react';
import { AlertColor } from '@mui/material/Alert';

/**
 * Type pour représenter une notification
 */
export interface Notification {
  open: boolean;
  message: string;
  severity: AlertColor;
  autoHideDuration?: number;
}

/**
 * Hook personnalisé pour gérer les notifications
 * @param initialDuration Durée par défaut d'affichage de la notification (en ms)
 * @returns Méthodes et états pour gérer les notifications
 */
export function useNotification(initialDuration: number = 4000) {
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: initialDuration,
  });

  // Afficher une notification de succès
  const showSuccess = useCallback((message: string, duration?: number) => {
    setNotification({
      open: true,
      message,
      severity: 'success',
      autoHideDuration: duration || initialDuration,
    });
  }, [initialDuration]);

  // Afficher une notification d'erreur
  const showError = useCallback((message: string, duration?: number) => {
    setNotification({
      open: true,
      message,
      severity: 'error',
      autoHideDuration: duration || initialDuration,
    });
  }, [initialDuration]);

  // Afficher une notification d'information
  const showInfo = useCallback((message: string, duration?: number) => {
    setNotification({
      open: true,
      message,
      severity: 'info',
      autoHideDuration: duration || initialDuration,
    });
  }, [initialDuration]);

  // Afficher une notification d'avertissement
  const showWarning = useCallback((message: string, duration?: number) => {
    setNotification({
      open: true,
      message,
      severity: 'warning',
      autoHideDuration: duration || initialDuration,
    });
  }, [initialDuration]);

  // Fermer la notification
  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    notification,
    setNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideNotification,
  };
}