import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogProps,
  Box,
  Typography
} from '@mui/material';

export interface CommonDialogProps {
  /**
   * Si le dialogue est ouvert ou fermé
   */
  open: boolean;
  
  /**
   * Fonction appelée lors de la fermeture du dialogue
   */
  onClose: () => void;
  
  /**
   * Titre du dialogue
   */
  title: React.ReactNode;
  
  /**
   * Contenu du dialogue
   */
  children: React.ReactNode;
  
  /**
   * Texte du bouton de confirmation (par défaut: "Confirmer")
   */
  confirmLabel?: string;
  
  /**
   * Texte du bouton d'annulation (par défaut: "Annuler")
   */
  cancelLabel?: string;
  
  /**
   * Fonction appelée lors de la confirmation
   */
  onConfirm?: () => void;
  
  /**
   * Si le bouton de confirmation est désactivé
   */
  confirmDisabled?: boolean;
  
  /**
   * Si le contenu du dialogue doit avoir une bordure (divider)
   */
  dividers?: boolean;
  
  /**
   * Taille maximale du dialogue
   * @default "md"
   */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Actions personnalisées à afficher dans le footer du dialogue
   * Si défini, remplace les boutons par défaut
   */
  actions?: React.ReactNode;
  
  /**
   * ID pour l'accessibilité
   */
  ariaLabelledby?: string;
  
  /**
   * Propriétés supplémentaires pour le composant Dialog
   */
  dialogProps?: Partial<DialogProps>;
  
  /**
   * Si un indicateur de chargement doit être affiché
   */
  loading?: boolean;
  
  /**
   * Type de notification à afficher
   */
  severity?: 'error' | 'warning' | 'info' | 'success';
  
  /**
   * Message à afficher
   */
  message?: React.ReactNode;
}

/**
 * Dialogue standardisé pour l'application
 * Utilisé pour les formulaires, confirmations et affichages d'informations
 */
const CommonDialog: React.FC<CommonDialogProps> = ({
  open,
  onClose,
  title,
  children,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  confirmDisabled = false,
  dividers = true,
  maxWidth = "md",
  actions,
  ariaLabelledby,
  dialogProps,
  loading = false,
  severity = 'info',
  message
}) => {
  // Générer un ID unique pour l'accessibilité si non fourni
  const titleId = ariaLabelledby || 'common-dialog-title';

  const getButtonColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
      default:
        return 'primary';
    }
  };

  const renderContent = () => {
    if (message) {
      return typeof message === 'string' ? (
        <Typography>{message}</Typography>
      ) : message;
    }
    return children;
  };

  const renderActions = () => {
    if (actions) return actions;

    return (
      <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
          color="primary"
        >
          {cancelLabel}
        </Button>
        {onConfirm && (
          <Button 
            onClick={onConfirm}
            variant="contained" 
            color={getButtonColor()}
            disabled={confirmDisabled || loading}
          >
            {confirmLabel}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby={titleId}
      maxWidth={maxWidth}
      fullWidth
      {...(dialogProps || {})}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent dividers={dividers}>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        {renderActions()}
      </DialogActions>
    </Dialog>
  );
};

export default CommonDialog;