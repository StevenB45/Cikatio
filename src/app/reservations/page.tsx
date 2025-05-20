'use client';

import React, { useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Paper,
  Chip,
  Autocomplete,
  TextField,
  Alert,
  IconButton
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { CommonDialog, useNotification } from '@/components/common';
import frLocale from '@fullcalendar/core/locales/fr';

export default function ReservationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  
  // États pour la confirmation de suppression
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);
  
  // Nouveaux états pour la modification des réservations
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [reservationToEdit, setReservationToEdit] = useState<string | null>(null);
  const [editDates, setEditDates] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  
  // Nouvel état pour la sélection de réservation à déplacer
  const [isReservationMoveDialogOpen, setIsReservationMoveDialogOpen] = useState(false);
  const [selectedDateForMove, setSelectedDateForMove] = useState<Date | null>(null);
  
  // État pour stocker l'utilisateur actuel
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { showNotification } = useNotification();

  // Référence pour le calendrier FullCalendar
  const calendarRef = React.useRef<any>(null);

  // Chargement de l'utilisateur actuel
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Utilisez sessionStorage ou localStorage pour récupérer l'ID utilisateur si disponible
        const storedUserId = typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null;
        
        // Appeler l'API avec l'ID utilisateur si disponible
        const url = storedUserId 
          ? `/api/auth/profile?userId=${storedUserId}` 
          : '/api/auth/profile';
          
        const response = await fetch(url);
        
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
          console.log('Utilisateur chargé avec succès:', userData);
        } else {
          console.error('Erreur de chargement du profil utilisateur:', response.status);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Chargement des items et utilisateurs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, usersRes] = await Promise.all([
          fetch('/api/items'),
          fetch('/api/users')
        ]);
        if (itemsRes.ok && usersRes.ok) {
          const [itemsData, usersData] = await Promise.all([
            itemsRes.json(),
            usersRes.json()
          ]);
          setItems(itemsData);
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };
    fetchData();
  }, []);

  // Chargement des réservations pour l'item sélectionné
  useEffect(() => {
    const fetchReservations = async () => {
      if (selectedItem) {
        try {
          const response = await fetch(`/api/reservations?itemId=${selectedItem}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Fetched reservations:', data); // <-- Add log here
            setReservations(data);
          } else { // <-- Add else block for error handling
            console.error('Failed to fetch reservations:', response.statusText);
            setReservations([]); // Clear reservations on error
          }
        } catch (error) {
          console.error('Erreur lors du chargement des réservations:', error);
          setReservations([]); // Clear reservations on error
        }
      } else {
        setReservations([]);
      }
    };
    fetchReservations();
  }, [selectedItem]);

  // Effet pour nettoyer les réservations expirées
  useEffect(() => {
    const cleanupExpiredReservations = async () => {
      try {
        const response = await fetch('/api/reservations/cleanup', {
          method: 'POST'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.count > 0) {
            // Rafraîchir la liste des réservations si des réservations ont été nettoyées
            if (selectedItem) {
              const reservationsResponse = await fetch(`/api/reservations?itemId=${selectedItem}`);
              if (reservationsResponse.ok) {
                const reservationsData = await reservationsResponse.json();
                setReservations(reservationsData);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage des réservations expirées:', error);
      }
    };
    
    // Exécuter le nettoyage toutes les 5 minutes
    const interval = setInterval(cleanupExpiredReservations, 5 * 60 * 1000);
    
    // Exécuter une fois au chargement de la page
    cleanupExpiredReservations();

    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(interval);
  }, [selectedItem]);

  const handleDateSelect = useCallback((selectInfo: any) => {
    // Si aucun item n'est sélectionné, ne pas ouvrir le dialogue
    if (!selectedItem) {
      showNotification('Veuillez d\'abord sélectionner un item', 'warning');
      return;
    }

    // Vérifier si c'est pour créer une nouvelle réservation ou modifier une existante
    if (reservations.length > 0) {
      // Proposer de choisir entre créer une nouvelle réservation ou déplacer une existante
      setSelectedDateForMove(selectInfo.start);
      setIsReservationMoveDialogOpen(true);
    } else {
      // Procédure normale pour créer une réservation
      // Vérifier les conflits de réservation
      const start = selectInfo.start;
      const end = selectInfo.end;
      
      const hasConflict = reservations.some(reservation => {
        const resStart = new Date(reservation.startDate);
        const resEnd = new Date(reservation.endDate);
        return (
          (start >= resStart && start < resEnd) ||
          (end > resStart && end <= resEnd) ||
          (start <= resStart && end >= resEnd)
        );
      });

      if (hasConflict) {
        showNotification('Cette période n\'est pas disponible', 'error');
        return;
      }

      setSelectedDates({
        start: selectInfo.start,
        end: selectInfo.end
      });
      setIsReserveDialogOpen(true);
    }
  }, [reservations, showNotification, selectedItem]);

  // Fonction pour créer une nouvelle réservation à la date sélectionnée
  const handleCreateNewReservation = useCallback(() => {
    if (!selectedDateForMove) return;
    
    // Calculer la date de fin (par défaut 1 jour après la date de début)
    const endDate = new Date(selectedDateForMove);
    endDate.setDate(endDate.getDate() + 1);
    
    setSelectedDates({
      start: selectedDateForMove,
      end: endDate
    });
    setIsReservationMoveDialogOpen(false);
    setIsReserveDialogOpen(true);
  }, [selectedDateForMove]);

  // Fonction pour montrer les réservations existantes pour les déplacer
  const handleShowExistingReservations = useCallback(() => {
    setIsReservationMoveDialogOpen(false);
    // L'utilisateur cliquera directement sur les réservations dans le calendrier pour les modifier
  }, []);

  const handleReservationSubmit = async () => {
    if (!selectedItem || !selectedDates.start || !selectedDates.end || !selectedUser?.id) {
      showNotification('Informations manquantes', 'error');
      return;
    }

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: selectedItem,
          userId: selectedUser.id,
          startDate: selectedDates.start,
          endDate: selectedDates.end,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const newReservation = await response.json();
      setReservations(prev => [...prev, newReservation]);
      showNotification('Réservation créée avec succès', 'success');
      setIsReserveDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      showNotification(error.message || 'Erreur lors de la réservation', 'error');
    }
  };

  // Modifié pour ouvrir le dialogue de confirmation au lieu de supprimer directement
  const handleDeleteReservation = (reservationId: string) => {
    setReservationToDelete(reservationId);
    setIsDeleteDialogOpen(true);
  };

  // Fonction modifiée pour inclure l'ID de l'utilisateur actuel dans la requête
  const confirmDeleteReservation = async () => {
    if (!reservationToDelete || !currentUser) return;
    
    try {
      const response = await fetch(`/api/reservations/${reservationToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancelledById: currentUser.id // Ajoute l'ID de l'utilisateur qui effectue la suppression
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setReservations(prev => prev.filter(r => r.id !== reservationToDelete));
      showNotification('Réservation supprimée', 'success');
      
      // Fermer la boîte de dialogue et réinitialiser reservationToDelete
      setIsDeleteDialogOpen(false);
      setReservationToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression de la réservation', 'error');
    }
  };

  // Fonction pour gérer la sélection d'un item via l'Autocomplete
  const handleItemSelection = (event: React.SyntheticEvent, value: any) => {
    setSelectedItem(value?.id || '');
  };

  // Fonction pour gérer le clic sur un événement du calendrier
  const handleEventClick = (info: any) => {
    const reservation = reservations.find(r => r.id === info.event.id);
    if (reservation) {
      // Au lieu d'ouvrir le dialogue de suppression, ouvrir le dialogue de modification
      setReservationToEdit(reservation.id);
      setEditDates({
        start: new Date(reservation.startDate),
        end: new Date(reservation.endDate)
      });
      setIsEditDialogOpen(true);
    }
  };

  const calendarEvents = reservations.map(reservation => {
    // Ajuster la date de fin pour qu'elle soit inclusive dans l'affichage du calendrier
    // FullCalendar traite les dates de fin comme exclusives, donc nous ajoutons un jour
    const endDate = new Date(reservation.endDate);
    endDate.setDate(endDate.getDate() + 1);
    
    // Formater les dates pour l'affichage dans le titre
    const startDateFormat = format(new Date(reservation.startDate), 'dd/MM/yyyy', { locale: fr });
    const endDateFormat = format(new Date(reservation.endDate), 'dd/MM/yyyy', { locale: fr });
    
    return {
      id: reservation.id,
      title: `${reservation.user.firstName} ${reservation.user.lastName} (${startDateFormat} - ${endDateFormat})`,
      start: reservation.startDate,
      end: endDate, // Date de fin modifiée pour l'affichage inclusif
      backgroundColor: '#1976d2',
      extendedProps: {
        user: reservation.user,
        realEndDate: reservation.endDate // Garder la vraie date de fin pour d'autres opérations
      },
      allDay: true,
      interactive: true
    };
  });

  const selectedItemData = items.find(item => item.id === selectedItem);

  // Trouver les détails de la réservation à supprimer pour l'afficher dans la boîte de dialogue
  const reservationToDeleteDetails = reservationToDelete 
    ? reservations.find(r => r.id === reservationToDelete) 
    : null;
    
  // Trouver les détails de la réservation à modifier
  const reservationToEditDetails = reservationToEdit 
    ? reservations.find(r => r.id === reservationToEdit) 
    : null;

  // Fonction pour déplacer une réservation à la date sélectionnée
  const handleMoveReservation = async (reservationId: string, newDate: Date) => {
    if (!reservationId || !newDate || !currentUser) {
      showNotification('Informations manquantes', 'error');
      return;
    }
    
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) {
      showNotification('Réservation non trouvée', 'error');
      return;
    }
    
    // Calculer la différence en jours entre la date actuelle et la nouvelle date
    const currentStart = new Date(reservation.startDate);
    const daysDiff = Math.floor((newDate.getTime() - currentStart.getTime()) / (1000 * 3600 * 24));
    
    // Calculer les nouvelles dates en conservant la durée de la réservation
    const currentEnd = new Date(reservation.endDate);
    const newStart = new Date(newDate);
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + daysDiff);
    
    // Mettre à jour l'interface
    setReservationToEdit(reservationId);
    setEditDates({
      start: newStart,
      end: newEnd
    });
    setIsEditDialogOpen(true);
  };
    
  // Fonction pour mettre à jour une réservation
  const handleUpdateReservation = async () => {
    if (!reservationToEdit || !editDates.start || !editDates.end || !currentUser) {
      showNotification('Informations manquantes', 'error');
      return;
    }
    
    // Vérifier que la date de fin est après la date de début
    if (editDates.end <= editDates.start) {
      showNotification('La date de fin doit être postérieure à la date de début', 'error');
      return;
    }
    
    // Vérifier les conflits avec d'autres réservations (en excluant la réservation actuelle)
    const hasConflict = reservations.some(reservation => {
      if (reservation.id === reservationToEdit) return false; // Exclure la réservation en cours d'édition
      
      const resStart = new Date(reservation.startDate);
      const resEnd = new Date(reservation.endDate);
      
      if (!editDates.start || !editDates.end) return false;
      
      return (
        (editDates.start >= resStart && editDates.start < resEnd) ||
        (editDates.end > resStart && editDates.end <= resEnd) ||
        (editDates.start <= resStart && editDates.end >= resEnd)
      );
    });
    
    if (hasConflict) {
      showNotification('Cette période chevauche une autre réservation. Veuillez choisir une autre période.', 'error');
      return;
    }
    
    try {
      console.log('Mise à jour de la réservation avec l\'ID utilisateur:', currentUser.id);
      
      // Appel à l'API pour mettre à jour la réservation
      const response = await fetch(`/api/reservations/${reservationToEdit}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: editDates.start,
          endDate: editDates.end,
          status: 'CONFIRMED', // Garder le même statut
          modifiedById: currentUser.id // Ajouter l'ID de l'utilisateur qui effectue la modification
        }),
      });
      
      // Afficher les détails de la réponse pour le débogage
      console.log('Réponse API:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur de modification de réservation:', errorData);
        
        // Vérifier si c'est une erreur d'autorisation
        if (response.status === 403) {
          showNotification('Vous n\'êtes pas autorisé à modifier cette réservation. Seuls les administrateurs ou le créateur de la réservation peuvent la modifier.', 'error');
        } else {
          throw new Error(errorData.error || 'Erreur lors de la mise à jour de la réservation');
        }
        return;
      }
      
      const updatedReservation = await response.json();
      
      // Mettre à jour la liste des réservations dans l'état local
      setReservations(prev => prev.map(r => 
        r.id === reservationToEdit ? updatedReservation : r
      ));
      
      // Rafraîchir le calendrier directement après la mise à jour de l'état
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        
        // Trouver l'événement dans le calendrier
        const eventToUpdate = calendarApi.getEventById(reservationToEdit as string);
        
        if (eventToUpdate) {
          // Mettre à jour les dates de l'événement
          eventToUpdate.setProp('title', `Réservé par ${updatedReservation.user.firstName} ${updatedReservation.user.lastName}`);
          eventToUpdate.setStart(editDates.start);
          eventToUpdate.setEnd(editDates.end);
          
          // Forcer le rafraîchissement de la vue du calendrier
          calendarApi.refetchEvents();
          calendarApi.render();
        }
      }
      
      showNotification('Réservation mise à jour avec succès', 'success');
      setIsEditDialogOpen(false);
      setReservationToEdit(null);
    } catch (error: any) {
      console.error('Erreur complète:', error);
      showNotification(error.message || 'Erreur lors de la mise à jour de la réservation', 'error');
    }
  };

  console.log('Calendar events:', calendarEvents); // <-- Add log here

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Calendrier des Réservations
        </Typography>

        {/* Item Selection - Full Width */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Sélectionner un item
          </Typography>
          <Autocomplete
            options={items}
            getOptionLabel={(item) => `${item.customId} - ${item.name}`}
            renderOption={(props, item) => {
              const { key, ...otherProps } = props;
              return (
                <Box component="li" key={key} {...otherProps}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body1">{item.customId} - {item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.category === 'BOOK' 
                        ? `Livre${item.author ? ` - ${item.author}` : ''}`
                        : `Matériel${item.brand ? ` - ${item.brand} ${item.model || ''}` : ''}`
                      }
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            onChange={handleItemSelection}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="Aucun item trouvé"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Rechercher et sélectionner un item"
                variant="outlined"
                fullWidth
              />
            )}
            value={selectedItemData || null}
          />

          {selectedItemData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Détails de l'item
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type: {selectedItemData.category === 'BOOK' ? 'Livre' : 'Matériel'}
              </Typography>
              {selectedItemData.category === 'BOOK' && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Auteur: {selectedItemData.author || 'Non spécifié'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ISBN: {selectedItemData.isbn || 'Non spécifié'}
                  </Typography>
                </>
              )}
              {selectedItemData.category === 'EQUIPMENT' && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Marque: {selectedItemData.brand || 'Non spécifié'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Modèle: {selectedItemData.model || 'Non spécifié'}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Paper>

        {/* Calendar Display - Full Width Below Item Selection */}
        <Paper sx={{ p: 2 }}>
          {selectedItem ? (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="fr"
              locales={[frLocale]}
              selectable={true}
              select={handleDateSelect}
              events={calendarEvents}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
              }}
              buttonText={{
                today: 'Aujourd\'hui',
                month: 'Mois',
                week: 'Semaine'
              }}
              height="auto"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                omitZeroMinute: true,
                meridiem: false,
                hour12: false
              }}
              eventClick={handleEventClick}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: 400,
              gap: 2
            }}>
              <CalendarIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                Sélectionnez un item ci-dessus pour voir son calendrier de réservations
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Dialogue pour créer une réservation */}
        <CommonDialog
          open={isReserveDialogOpen}
          onClose={() => setIsReserveDialogOpen(false)}
          title="Réserver un item"
          confirmLabel="Confirmer la réservation"
          cancelLabel="Annuler"
          onConfirm={handleReservationSubmit}
          confirmDisabled={!selectedUser || !selectedDates.start || !selectedDates.end || (selectedDates.end <= selectedDates.start)}
          maxWidth="sm"
          ariaLabelledby="create-reservation-dialog-title"
        >
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedItemData?.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
              Choisissez la période de réservation :
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <TextField
                label="Date de début"
                type="date"
                fullWidth
                value={selectedDates.start ? selectedDates.start.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    // Créer une date correcte en préservant le fuseau horaire
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    // Créer la date avec l'heure à midi pour éviter les problèmes de décalage horaire
                    const date = new Date(year, month - 1, day, 12, 0, 0);
                    setSelectedDates(prev => ({ ...prev, start: date }));
                  } else {
                    setSelectedDates(prev => ({ ...prev, start: null }));
                  }
                }}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="Date de fin"
                type="date"
                fullWidth
                value={selectedDates.end ? selectedDates.end.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    // Créer une date correcte en préservant le fuseau horaire
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    // Créer la date avec l'heure à midi pour éviter les problèmes de décalage horaire
                    const date = new Date(year, month - 1, day, 12, 0, 0);
                    setSelectedDates(prev => ({ ...prev, end: date }));
                  } else {
                    setSelectedDates(prev => ({ ...prev, end: null }));
                  }
                }}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>

            <Autocomplete
              options={users}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
              value={selectedUser}
              onChange={(_, newValue) => setSelectedUser(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sélectionner un utilisateur"
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          </Box>
        </CommonDialog>
        
        {/* Dialogue de confirmation de suppression */}
        <CommonDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          title="Confirmer la suppression"
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          onConfirm={confirmDeleteReservation}
          maxWidth="sm"
          ariaLabelledby="delete-reservation-dialog-title"
          dialogProps={{ 
            PaperProps: { 
              sx: { '& .MuiButton-containedPrimary': { bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } } } 
            } 
          }}
        >
          <Box sx={{ pt: 1 }}>
            <Typography variant="body1">
              Êtes-vous sûr de vouloir supprimer cette réservation ?
            </Typography>
            
            {reservationToDeleteDetails && (
              <Box sx={{ mt: 2, bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Item : {selectedItemData?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Du : {format(new Date(reservationToDeleteDetails.startDate), 'dd MMMM yyyy', { locale: fr })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Au : {format(new Date(reservationToDeleteDetails.endDate), 'dd MMMM yyyy', { locale: fr })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Utilisateur : {reservationToDeleteDetails.user.firstName} {reservationToDeleteDetails.user.lastName}
                </Typography>
              </Box>
            )}
          </Box>
        </CommonDialog>
        
        {/* Dialogue de modification de la réservation */}
        <CommonDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          title="Modifier la réservation"
          confirmLabel="Enregistrer les modifications"
          cancelLabel="Annuler"
          onConfirm={handleUpdateReservation}
          confirmDisabled={!editDates.start || !editDates.end || (editDates.end <= editDates.start)}
          ariaLabelledby="edit-reservation-dialog-title"
          maxWidth="md"
        >
          <Box sx={{ mt: 2 }}>
            {reservationToEditDetails && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedItemData?.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Réservé par : {reservationToEditDetails.user.firstName} {reservationToEditDetails.user.lastName}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Modifier les dates de réservation :
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                  <TextField
                    label="Date de début"
                    type="date"
                    fullWidth
                    value={editDates.start ? editDates.start.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        // Créer une date correcte en préservant le fuseau horaire
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        // Créer la date avec l'heure à midi pour éviter les problèmes de décalage horaire
                        const date = new Date(year, month - 1, day, 12, 0, 0);
                        setEditDates(prev => ({ ...prev, start: date }));
                      } else {
                        setEditDates(prev => ({ ...prev, start: null }));
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  <TextField
                    label="Date de fin"
                    type="date"
                    fullWidth
                    value={editDates.end ? editDates.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        // Créer une date correcte en préservant le fuseau horaire
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        // Créer la date avec l'heure à midi pour éviter les problèmes de décalage horaire
                        const date = new Date(year, month - 1, day, 12, 0, 0);
                        setEditDates(prev => ({ ...prev, end: date }));
                      } else {
                        setEditDates(prev => ({ ...prev, end: null }));
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
                  <Button 
                    color="error" 
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setReservationToDelete(reservationToEdit);
                      setReservationToEdit(null);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    Supprimer
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </CommonDialog>

        {/* Dialogue pour choisir entre créer ou déplacer une réservation */}
        <CommonDialog
          open={isReservationMoveDialogOpen}
          onClose={() => setIsReservationMoveDialogOpen(false)}
          title="Action sur la date sélectionnée"
          confirmLabel=""
          cancelLabel="Annuler"
          maxWidth="sm"
          ariaLabelledby="reservation-move-dialog-title"
        >
          <Box sx={{ pt: 1, pb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Que souhaitez-vous faire pour la date du {selectedDateForMove && 
                format(selectedDateForMove, 'dd MMMM yyyy', { locale: fr })} ?
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleCreateNewReservation}
              >
                Créer une réservation
              </Button>
              
              <Button 
                variant="outlined" 
                color="info"
                onClick={handleShowExistingReservations}
              >
                Voir les réservations existantes
              </Button>
            </Box>
          </Box>
        </CommonDialog>
      </Box>
    </MainLayout>
  );
}