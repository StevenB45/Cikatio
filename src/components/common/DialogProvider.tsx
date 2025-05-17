import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmDialog from './ConfirmDialog';

// Types pour les dialogues de confirmation
interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  severity?: 'error' | 'warning' | 'info';
}

interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// Création du contexte avec une valeur par défaut
const DialogContext = createContext<DialogContextType>({
  confirm: async () => false,
});

// Hook personnalisé pour utiliser le contexte de dialogue
export const useDialog = () => useContext(DialogContext);

interface DialogProviderProps {
  children: ReactNode;
}

/**
 * Provider pour les dialogues à l'échelle de l'application
 */
export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  // État pour le dialogue de confirmation
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  
  // Résolution pour la promesse de confirmation
  const [resolveConfirm, setResolveConfirm] = useState<(value: boolean) => void>(() => () => {});

  // Fonction pour ouvrir un dialogue de confirmation
  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmOptions(options);
        setConfirmDialogOpen(true);
        setResolveConfirm(() => resolve);
      }),
    []
  );

  // Gestionnaires pour les actions du dialogue de confirmation
  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false);
    resolveConfirm(true);
  }, [resolveConfirm]);

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false);
    resolveConfirm(false);
  }, [resolveConfirm]);

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={confirmDialogOpen}
        title={confirmOptions.title}
        message={confirmOptions.message}
        confirmButtonText={confirmOptions.confirmButtonText}
        cancelButtonText={confirmOptions.cancelButtonText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        severity={confirmOptions.severity}
      />
    </DialogContext.Provider>
  );
};

export default DialogProvider;