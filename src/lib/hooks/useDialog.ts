import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer l'état d'un dialogue
 * @param initialState État initial du dialogue (ouvert ou fermé)
 * @returns Méthodes et états pour contrôler le dialogue
 */
export function useDialog<T = any>(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [dialogData, setDialogData] = useState<T | null>(null);

  // Ouvrir le dialogue avec des données optionnelles
  const openDialog = useCallback((data?: T) => {
    setIsOpen(true);
    if (data) {
      setDialogData(data);
    }
  }, []);

  // Fermer le dialogue et réinitialiser les données
  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setDialogData(null);
  }, []);

  // Mettre à jour les données du dialogue
  const updateDialogData = useCallback((newData: Partial<T>) => {
    setDialogData((prev) => {
      if (!prev) return newData as T;
      return { ...prev, ...newData };
    });
  }, []);

  return {
    isOpen,
    dialogData,
    openDialog,
    closeDialog,
    updateDialogData,
  };
}