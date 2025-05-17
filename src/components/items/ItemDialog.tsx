import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogProps
} from '@mui/material';
import ItemForm, { EditableItem } from './ItemForm';
import LoadingOverlay from '../common/LoadingOverlay';

interface ItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: EditableItem) => Promise<void>;
  title: string;
  initialItem: EditableItem;
  submitLabel?: string;
  cancelLabel?: string;
  dialogProps?: DialogProps;
}

/**
 * Dialogue réutilisable pour la création et modification d'items
 */
const ItemDialog: React.FC<ItemDialogProps> = ({
  open,
  onClose,
  onSave,
  title,
  initialItem,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  dialogProps
}) => {
  // État pour l'item en cours d'édition
  const [item, setItem] = useState<EditableItem>(initialItem);
  
  // État pour les erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // État pour l'indicateur de chargement
  const [loading, setLoading] = useState(false);

  // Réinitialiser l'état quand le dialogue s'ouvre avec un nouvel item
  React.useEffect(() => {
    if (open) {
      setItem(initialItem);
      setErrors({});
    }
  }, [open, initialItem]);

  // Gérer les changements dans le formulaire
  const handleChange = useCallback((updatedItem: EditableItem) => {
    setItem(updatedItem);
    
    // Effacer les erreurs des champs modifiés
    if (Object.keys(errors).length > 0) {
      const updatedErrors = { ...errors };
      Object.keys(updatedItem).forEach(key => {
        if (updatedErrors[key]) {
          delete updatedErrors[key];
        }
      });
      setErrors(updatedErrors);
    }
  }, [errors]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validations requises
    if (!item.name?.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    
    if (!item.customId?.trim()) {
      newErrors.customId = 'Le code barre est requis';
    }
    
    if (!item.category) {
      newErrors.category = 'La catégorie est requise';
    }
    
    if (!item.serviceCategory) {
      newErrors.serviceCategory = 'Le service est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer la sauvegarde
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSave(item);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // Traitement des erreurs spécifiques si nécessaire
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="item-dialog-title"
      maxWidth="md"
      fullWidth
      {...dialogProps}
    >
      <DialogTitle id="item-dialog-title">{title}</DialogTitle>
      <DialogContent dividers>
        <LoadingOverlay open={loading} message="Enregistrement en cours..." />
        <ItemForm
          item={item}
          onChange={handleChange}
          errors={errors}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          disabled={loading || !item.name || !item.serviceCategory}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemDialog;