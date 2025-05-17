import { useState, useCallback } from 'react';

interface UseDialogOptions {
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface UseDialogReturn {
  open: boolean;
  handleOpen: () => void;
  handleClose: () => void;
  handleConfirm: () => Promise<void>;
  loading: boolean;
}

export const useDialog = ({ onConfirm, onCancel }: UseDialogOptions = {}): UseDialogReturn => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    setOpen(false);
    onCancel?.();
  }, [loading, onCancel]);

  const handleConfirm = useCallback(async () => {
    if (!onConfirm) return;
    
    try {
      setLoading(true);
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error('Error in dialog confirmation:', error);
    } finally {
      setLoading(false);
    }
  }, [onConfirm]);

  return {
    open,
    handleOpen,
    handleClose,
    handleConfirm,
    loading
  };
}; 