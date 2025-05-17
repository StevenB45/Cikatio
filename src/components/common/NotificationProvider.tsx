import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface NotificationContextType {
  showNotification: (message: string, severity: AlertColor, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

// Création du contexte avec une valeur par défaut
const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {}
});

// Hook personnalisé pour utiliser le contexte de notification
export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
  defaultDuration?: number;
}

/**
 * Provider pour les notifications à l'échelle de l'application
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  defaultDuration = 4000 
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [duration, setDuration] = useState(defaultDuration);

  const showNotification = useCallback((message: string, severity: AlertColor, duration?: number) => {
    setMessage(message);
    setSeverity(severity);
    setDuration(duration || defaultDuration);
    setOpen(true);
  }, [defaultDuration]);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <NotificationContext.Provider 
      value={{ showNotification, showSuccess, showError, showInfo, showWarning }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          elevation={6} 
          variant="filled" 
          onClose={handleClose} 
          severity={severity}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;