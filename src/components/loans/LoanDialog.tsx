import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogProps,
  Box,
  Typography,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';
import { Event as EventIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import LoanForm, { EditableLoan } from './LoanForm';
import LoadingOverlay from '../common/LoadingOverlay';
import { Item, User } from '@/types';
import { useRouter } from 'next/navigation';

interface LoanDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (loan: EditableLoan) => Promise<void>;
  onGenerateAgreement?: () => void;
  title: string;
  initialLoan: EditableLoan;
  items: Item[];
  users: User[];
  submitLabel?: string;
  cancelLabel?: string;
  dialogProps?: DialogProps;
  isEdit?: boolean;
  onAddUser?: () => void;
  errorMessage?: string | null;
  currentUser?: User;
}

// Interface pour les réservations en conflit
interface ConflictingReservation {
  id: string;        // ID de la réservation pour pouvoir naviguer vers celle-ci
  startDate: string;
  endDate: string;
  userName: string;
}

/**
 * Dialogue réutilisable pour la création et modification de prêts
 */
const LoanDialog: React.FC<LoanDialogProps> = ({
  open,
  onClose,
  onSave,
  onGenerateAgreement,
  title,
  initialLoan,
  items,
  users,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  dialogProps,
  isEdit = false,
  onAddUser,
  errorMessage,
  currentUser
}) => {
  const router = useRouter();
  
  // État pour le prêt en cours d'édition
  const [loan, setLoan] = useState<EditableLoan>(initialLoan);
  
  // État pour les erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // État pour les réservations en conflit
  const [conflictingReservations, setConflictingReservations] = useState<ConflictingReservation[]>([]);
  
  // État pour l'indicateur de chargement
  const [loading, setLoading] = useState(false);
  
  // État pour les éléments indisponibles
  const [unavailableItems, setUnavailableItems] = useState<Item[]>([]);

  // Réinitialiser l'état quand le dialogue s'ouvre avec un nouveau prêt
  useEffect(() => {
    if (open) {
      setLoan(initialLoan);
      setErrors({});
      setConflictingReservations([]);
      setUnavailableItems([]);
    }
  }, [open, initialLoan]);

  // Mettre à jour les erreurs quand le message d'erreur externe change
  useEffect(() => {
    console.log('LoanDialog - errorMessage reçu:', errorMessage);
    if (errorMessage) {
      // Forcer l'affichage immédiat de l'erreur
      setErrors(prev => ({
        ...prev,
        general: typeof errorMessage === 'string' ? errorMessage : 'Une erreur est survenue'
      }));
      setLoading(false);
    }
  }, [errorMessage]);

  // Vérifier la disponibilité des items sélectionnés
  useEffect(() => {
    if (loan.itemId) {
      const item = items.find(i => i.id === loan.itemId);
      if (item && item.reservationStatus !== 'AVAILABLE' && !isEdit) {
        setUnavailableItems([item]);
      } else {
        setUnavailableItems([]);
      }
    }
  }, [loan.itemId, items, isEdit]);

  // Gérer les changements dans le formulaire
  const handleChange = useCallback((updatedLoan: EditableLoan) => {
    // Ne mettre à jour que si les valeurs ont réellement changé
    setLoan(prevLoan => {
      if (JSON.stringify(prevLoan) === JSON.stringify(updatedLoan)) {
        return prevLoan;
      }
      return updatedLoan;
    });
    
    // Effacer les erreurs des champs modifiés
    if (Object.keys(errors).length > 0) {
      const updatedErrors = { ...errors };
      Object.keys(updatedLoan).forEach(key => {
        if (updatedErrors[key]) {
          delete updatedErrors[key];
        }
      });
      setErrors(updatedErrors);
    }
    
    // Réinitialiser les conflits de réservation si les dates changent
    if ((prevLoan) => 
      prevLoan.borrowedAt !== updatedLoan.borrowedAt || 
      prevLoan.dueAt !== updatedLoan.dueAt
    ) {
      setConflictingReservations([]);
    }
  }, [errors]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!loan.itemId) {
      newErrors.itemId = 'L\'item est requis';
    }
    
    if (!loan.borrowerId) {
      newErrors.borrowerId = 'L\'emprunteur est requis';
    }
    
    if (!loan.borrowedAt) {
      newErrors.borrowedAt = 'La date de début est requise';
    }
    
    if (!loan.dueAt) {
      newErrors.dueAt = 'La date de retour prévue est requise';
    }

    // Valider les dates
    if (loan.borrowedAt && loan.dueAt) {
      const borrowedAtDate = new Date(loan.borrowedAt);
      const dueAtDate = new Date(loan.dueAt);
      
      if (isNaN(borrowedAtDate.getTime())) {
        newErrors.borrowedAt = 'La date de début est invalide';
      }
      
      if (isNaN(dueAtDate.getTime())) {
        newErrors.dueAt = 'La date de retour est invalide';
      }
      
      if (!isNaN(borrowedAtDate.getTime()) && !isNaN(dueAtDate.getTime())) {
        if (dueAtDate <= borrowedAtDate) {
          newErrors.dueAt = 'La date de retour doit être postérieure à la date de début';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer la sauvegarde
  const handleSave = async () => {
    if (!validateForm()) return;
    
    if (unavailableItems.length > 0) {
      setErrors({
        itemId: 'Un ou plusieurs items sélectionnés ne sont plus disponibles'
      });
      return;
    }
    
    setLoading(true);
    try {
      await onSave(loan);
      if (onGenerateAgreement) {
        onGenerateAgreement();
      }
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      // Extraction des erreurs détaillées depuis la réponse API
      let errorMessage = error.message || 'Une erreur est survenue lors de la sauvegarde';
      
      // Gestion spécifique pour les erreurs de conflit avec des réservations
      if (error.details && error.details.conflictingReservations) {
        const reservations = error.details.conflictingReservations;
        setConflictingReservations(reservations);
        setErrors({
          general: 'Conflit avec des réservations existantes'
        });
      } else {
        setErrors({
          general: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire pour naviguer vers les détails d'une réservation
  const handleViewReservation = (reservationId: string) => {
    // Enregistrer temporairement l'état du dialogue pour permettre à l'utilisateur de revenir
    // après avoir consulté la réservation
    onClose();
    router.push(`/reservations/${reservationId}`);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="loan-dialog-title"
      maxWidth="md"
      fullWidth
      {...dialogProps}
    >
      <DialogTitle id="loan-dialog-title">{title}</DialogTitle>
      <DialogContent dividers>
        <LoadingOverlay open={loading} message="Enregistrement en cours..." />
        
        {/* Affichage forcé de l'erreur */}
        {errorMessage && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            variant="filled"
          >
            <AlertTitle>Erreur</AlertTitle>
            {errorMessage}
          </Alert>
        )}
        
        {errors.general && errorMessage !== errors.general && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            variant="filled"
          >
            <AlertTitle>Erreur</AlertTitle>
            {errors.general}
          </Alert>
        )}
        
        {conflictingReservations.length > 0 && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            variant="outlined"
          >
            <AlertTitle>L'item est déjà réservé pour les périodes suivantes :</AlertTitle>
            <List dense>
              {conflictingReservations.map((reservation, index) => (
                <ListItemButton 
                  key={index}
                  onClick={() => handleViewReservation(reservation.id)}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 0.5,
                    '&:hover': { 
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EventIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{`Du ${reservation.startDate} au ${reservation.endDate}`}</span>
                        <OpenInNewIcon fontSize="small" color="action" />
                      </Box>
                    }
                    secondary={`Par ${reservation.userName}`} 
                  />
                </ListItemButton>
              ))}
            </List>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Veuillez modifier les dates du prêt pour éviter ces périodes, ou cliquez sur une réservation pour la consulter ou l'annuler.
            </Typography>
          </Alert>
        )}
        
        <LoanForm
          loan={loan}
          items={items}
          users={users}
          onChange={handleChange}
          errors={errors}
          loading={loading}
          isEdit={isEdit}
          onAddUser={onAddUser}
          unavailableItems={unavailableItems}
          conflictingReservations={conflictingReservations}
          currentUser={currentUser}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          disabled={loading || !loan.itemId || !loan.borrowerId || unavailableItems.length > 0}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoanDialog;