import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Typography,
  FormControl,
  FormHelperText,
  Button,
  InputAdornment,
  CircularProgress,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Grid,
  Alert,
  Chip
} from '@mui/material';
import { 
  Book as BookIcon, 
  Inventory as EquipmentIcon, 
  Warning as WarningIcon,
  EventBusy as ConflictIcon
} from '@mui/icons-material';
import { fr } from 'date-fns/locale';
import { Item, User, LoanContext } from '@/types';

// Type pour les données d'un prêt éditable
export interface EditableLoan {
  id?: string;
  itemId?: string;
  borrowerId?: string;
  borrowedAt?: Date;
  dueAt?: Date;
  status?: string;
  returnedAt?: Date | null;
  notes?: string;
  contexts?: LoanContext[]; // Utilisation du type LoanContext partagé
}

// Interface pour les réservations en conflit
export interface ConflictingReservation {
  startDate: string;
  endDate: string;
  userName: string;
}

interface LoanFormProps {
  loan: EditableLoan;
  items: Item[];
  users: User[];
  onChange: (updatedLoan: EditableLoan) => void;
  onAddUser?: () => void;
  errors?: Record<string, string>;
  loading?: boolean;
  isEdit?: boolean;
  unavailableItems?: Item[];
  conflictingReservations?: ConflictingReservation[];
  currentUser?: User;
}

/**
 * Formulaire réutilisable pour la création et modification de prêts
 */
const LoanForm: React.FC<LoanFormProps> = ({
  loan,
  items,
  users,
  onChange,
  onAddUser,
  errors = {},
  loading = false,
  isEdit = false,
  unavailableItems = [],
  conflictingReservations = [],
  currentUser
}) => {
  // États locaux pour les prêts multiples
  const [selectedItems, setSelectedItems] = useState<Item[]>(
    loan.itemId ? [items.find(i => i.id === loan.itemId) as Item].filter(Boolean) : []
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(
    loan.borrowerId ? users.find(u => u.id === loan.borrowerId) || null : null
  );
  
  // Initialiser les dates avec des objets Date valides
  const today = new Date();
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);
  
  const [startDate, setStartDate] = useState<Date>(
    loan.borrowedAt ? new Date(loan.borrowedAt) : today
  );
  const [dueDate, setDueDate] = useState<Date>(
    loan.dueAt ? new Date(loan.dueAt) : twoWeeksLater
  );
  const [notes, setNotes] = useState<string>(loan.notes || '');
  const [selectedContexts, setSelectedContexts] = useState<LoanContext[]>(loan.contexts || []);

  // Synchroniser les dates avec le parent lors du montage initial
  useEffect(() => {
    // Notifier le parent avec les dates formatées
    onChange({
      ...loan,
      borrowedAt: startDate,
      dueAt: dueDate
    });
  }, []); // Uniquement au montage

  // Filtrer les items disponibles pour le prêt
  const availableItems = items.filter(item => 
    item.reservationStatus === 'AVAILABLE' || 
    (loan.itemId === item.id && isEdit)
  );

  // Gérer les changements des items sélectionnés
  const handleItemsChange = (newItems: Item[]) => {
    setSelectedItems(newItems);
    
    // Si c'est un mode édition ou s'il n'y a qu'un seul item, mettre à jour le loan
    if (isEdit || newItems.length === 1) {
      onChange({
        ...loan,
        itemId: newItems.length > 0 ? newItems[0].id : undefined
      });
    }
  };

  // Gérer le changement d'utilisateur
  const handleUserChange = (newUser: User | null) => {
    setSelectedUser(newUser);
    onChange({
      ...loan,
      borrowerId: newUser?.id
    });
  };

  // Notifier le parent des changements de dates
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      try {
        const validDate = new Date(date);
        if (isNaN(validDate.getTime())) {
          throw new Error("Date invalide");
        }
        setStartDate(validDate);
        onChange({
          ...loan,
          borrowedAt: validDate
        });
      } catch (error) {
        console.error("Erreur de validation de la date de début:", error);
      }
    }
  };

  const handleDueDateChange = (date: Date | null) => {
    if (date) {
      try {
        const validDate = new Date(date);
        if (isNaN(validDate.getTime())) {
          throw new Error("Date invalide");
        }
        setDueDate(validDate);
        onChange({
          ...loan,
          dueAt: validDate
        });
      } catch (error) {
        console.error("Erreur de validation de la date de fin:", error);
      }
    }
  };

  // Gérer le changement de notes
  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(e.target.value);
    onChange({
      ...loan,
      notes: e.target.value
    });
  };

  // Gérer le changement des contextes
  const handleContextChange = (context: LoanContext) => {
    // S'assurer que selectedContexts est toujours un tableau
    const currentContexts = Array.isArray(selectedContexts) ? selectedContexts : [];
    
    const newContexts = currentContexts.includes(context)
      ? currentContexts.filter(c => c !== context)
      : [...currentContexts, context];
    
    setSelectedContexts(newContexts);
    
    // Passer directement les valeurs de l'enum sans conversion supplémentaire
    onChange({
      ...loan,
      contexts: newContexts
    });
  };

  // Labels en français pour les contextes
  const contextLabels: Record<LoanContext, string> = {
    CONFERENCE_FINANCEURS: "Conférence des financeurs",
    APPUIS_SPECIFIQUES: "Appuis spécifiques",
    PLATEFORME_AGEFIPH: "Plateforme Agefiph",
    AIDANTS: "Aidants",
    RUNE: "RUNE",
    PNT: "PNT",
    SAVS: "SAVS",
    CICAT: "CICAT",
    LOGEMENT_INCLUSIF: "Logement inclusif"
  };

  // Fonction pour convertir les dates de réservation françaises en objets Date
  const parseFrenchDate = (dateStr: string): Date | null => {
    try {
      // Format attendu: "DD/MM/YYYY"
      const [day, month, year] = dateStr.split('/').map(Number);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      
      // Attention: les mois dans Date sont 0-indexés
      return new Date(year, month - 1, day);
    } catch (e) {
      return null;
    }
  };

  // Vérifier si les dates sélectionnées sont en conflit avec des réservations existantes
  const hasDateConflict = conflictingReservations.some(reservation => {
    const resStart = parseFrenchDate(reservation.startDate);
    const resEnd = parseFrenchDate(reservation.endDate);
    
    if (!resStart || !resEnd || !startDate || !dueDate) return false;
    
    return (
      // Le début du prêt est pendant une réservation
      (startDate >= resStart && startDate <= resEnd) ||
      // La fin du prêt est pendant une réservation
      (dueDate >= resStart && dueDate <= resEnd) ||
      // Le prêt englobe une réservation
      (startDate <= resStart && dueDate >= resEnd)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Ajouter l'ID de l'administrateur aux données du prêt
    const loanData = {
      ...loan,
      performedById: currentUser?.id
    };

    onChange(loanData);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, my: 2 }}>
      {/* Afficher un avertissement si des items sélectionnés ne sont pas disponibles */}
      {unavailableItems.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          <Typography color="error" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon fontSize="small" />
            Attention : au moins un item sélectionné n'est plus disponible. Veuillez ajuster votre sélection.
          </Typography>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            {unavailableItems.map(item => (
              <li key={item.id} style={{ color: '#d32f2f' }}>{item.name} ({item.customId})</li>
            ))}
          </ul>
        </Box>
      )}

      {/* Champ pour sélectionner un ou plusieurs items */}
      <FormControl fullWidth error={!!errors.itemId}>
        <Autocomplete
          multiple={!isEdit}
          options={availableItems}
          getOptionLabel={(option) => `${option.customId} - ${option.name}`}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <li key={option.id} {...rest}>
                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                  {option.category === 'BOOK' ? (
                    <BookIcon color="primary" sx={{ mr: 1 }} />
                  ) : (
                    <EquipmentIcon color="secondary" sx={{ mr: 1 }} />
                  )}
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.customId} - {option.category === 'BOOK' ? 'Livre' : 'Matériel'}
                    </Typography>
                  </Box>
                </Box>
              </li>
            );
          }}
          value={selectedItems}
          onChange={(_, newValue) => handleItemsChange(newValue)}
          disabled={loading || isEdit}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Sélectionner des items à prêter"
              placeholder="Rechercher par nom ou ID"
              required
              error={!!errors.itemId}
              helperText={errors.itemId}
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && <CircularProgress size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </FormControl>

      {/* Champ pour sélectionner un utilisateur */}
      <FormControl fullWidth error={!!errors.borrowerId}>
        <Autocomplete
          options={users}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <li key={option.id} {...rest}>
                <Box>
                  <Typography variant="body2">{`${option.firstName} ${option.lastName}`}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </li>
            );
          }}
          value={selectedUser}
          onChange={(_, newValue) => handleUserChange(newValue)}
          disabled={loading || (isEdit && !!loan.id)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Sélectionner un emprunteur"
              placeholder="Rechercher par nom ou email"
              required
              error={!!errors.borrowerId}
              helperText={errors.borrowerId}
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && <CircularProgress size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {onAddUser && (
          <Box sx={{ textAlign: 'right' }}>
            <Button size="small" sx={{ mt: 1 }} onClick={onAddUser}>
              + Ajouter un usager
            </Button>
          </Box>
        )}
      </FormControl>

      {/* Section des dates avec avertissement pour les conflits */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            Période d'emprunt
          </Typography>
          {hasDateConflict && (
            <Chip
              icon={<ConflictIcon />}
              label="Période en conflit"
              color="warning"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
        <Grid container spacing={3} alignItems="flex-end">
          {/* Date de début */}
          <Grid item xs={12} md={6} sx={{ mb: { xs: 2, md: 0 } }}>
            <TextField
              label="Date de début d'emprunt"
              type="date"
              value={startDate ? startDate.toISOString().slice(0, 10) : ''}
              onChange={e => {
                const val = e.target.value;
                if (val) {
                  const d = new Date(val);
                  if (d > new Date()) return;
                  setStartDate(d);
                  onChange({ ...loan, borrowedAt: d });
                } else {
                  setStartDate(today);
                  onChange({ ...loan, borrowedAt: today });
                }
              }}
              fullWidth
              required
              size="small"
              inputProps={{
                max: dueDate ? dueDate.toISOString().slice(0, 10) : undefined,
                inputMode: 'numeric',
                pattern: '[0-9]{4}-[0-9]{2}-[0-9]{2}'
              }}
              InputLabelProps={{ shrink: true }}
              error={!!errors.borrowedAt}
              helperText={errors.borrowedAt || 'Format attendu : JJ/MM/AAAA'}
            />
          </Grid>
          {/* Date de retour */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Date de retour prévue"
              type="date"
              value={dueDate ? dueDate.toISOString().slice(0, 10) : ''}
              onChange={e => {
                const val = e.target.value;
                if (val) {
                  const d = new Date(val);
                  if (d < startDate) return;
                  setDueDate(d);
                  onChange({ ...loan, dueAt: d });
                } else {
                  setDueDate(twoWeeksLater);
                  onChange({ ...loan, dueAt: twoWeeksLater });
                }
              }}
              fullWidth
              required
              size="small"
              inputProps={{
                min: startDate ? startDate.toISOString().slice(0, 10) : undefined,
                inputMode: 'numeric',
                pattern: '[0-9]{4}-[0-9]{2}-[0-9]{2}'
              }}
              InputLabelProps={{ shrink: true }}
              error={!!errors.dueAt}
              helperText={errors.dueAt || 'Format attendu : JJ/MM/AAAA'}
            />
          </Grid>
        </Grid>
      </Box>
      
      {/* Contextes de la demande */}
      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Contexte de la demande
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(contextLabels).map(([key, label]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedContexts.includes(key as LoanContext)}
                    onChange={() => handleContextChange(key as LoanContext)}
                    disabled={loading}
                  />
                }
                label={label}
              />
            </Grid>
          ))}
        </Grid>
        {errors.contexts && (
          <FormHelperText error>{errors.contexts}</FormHelperText>
        )}
      </Box>

      {/* Notes */}
      <TextField
        fullWidth
        label="Notes"
        multiline
        rows={3}
        value={notes}
        onChange={handleNotesChange}
        placeholder="Informations supplémentaires sur le prêt..."
        disabled={loading}
        InputProps={{
          endAdornment: loading && (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default LoanForm;