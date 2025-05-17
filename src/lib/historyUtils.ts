// Utilitaires communs pour la gestion de l'historique des prêts, réservations, etc.
import { StatusType } from '@/components/items/statusBadges';
import { STATUS_LABELS } from './statusBadges';
import { formatDate } from '@/lib/utils';
import React from 'react';

// Types pour améliorer la maintenabilité et éviter les 'any'
export interface HistoryItem {
  action: string;
  itemName: string;
  itemId: string;
  date: string;
  status: string;
  rawStatus: string;
  comment?: string;
  returnedAt: string | null;
  type: string;
  id: string;
  userId?: string;
  user?: string;
  userObj?: any;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  statusLabel?: string;
  statusColor?: string;
  statusIcon?: React.ReactElement;
  errorMessage?: string;
}

// Mapping des statuts de prêt vers des libellés d'actions cohérents 
// pour assurer une traduction uniforme dans l'application
export const LOAN_STATUS_TO_ACTION: Record<string, string> = {
  'RETURNED': 'Retour',
  'ACTIVE': 'Emprunt',
  'OVERDUE': 'Retard de prêt',
  'SCHEDULED': 'Prêt programmé',
  'OUT_OF_ORDER': 'Item indisponible'
};

// Mapping des actions de réservation vers des libellés et statuts
export const RESERVATION_ACTION_MAP: Record<string, { label: string, status: string }> = {
  'RESERVE': { label: 'Nouvelle réservation', status: 'RESERVED' },
  'CANCEL': { label: 'Annulation de réservation', status: 'CANCELLED' },
  'MODIFY': { label: 'Modification de réservation', status: 'MODIFIED' },
  'EXPIRED': { label: 'Expiration de réservation', status: 'EXPIRED' }
};

// Fonction utilitaire pour parser une date au format français
export const parseFrenchDate = (dateStr: string): number => {
  if (!dateStr || dateStr === '-') return 0;
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
};

// Fonction pour traduire les statuts en libellés français
export const getTranslatedStatus = (status: string): string => {
  return STATUS_LABELS[status] || status;
};

// Fonction utilitaire pour formatter un utilisateur
export const formatUserName = (user: any): string => {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur inconnu';
};

// Fonction utilitaire pour récupérer l'historique d'un item
export async function fetchItemHistory(itemId: string): Promise<HistoryItem[]> {
  try {
    // Récupérer toutes les données en parallèle pour réduire le temps d'attente
    const [loansRes, reservationsRes, reservationHistoryRes, loanHistoryRes] = await Promise.all([
      fetch(`/api/loans?itemId=${itemId}`),
      fetch(`/api/reservations?itemId=${itemId}`),
      fetch(`/api/reservation-history?itemId=${itemId}`),
      fetch(`/api/loan-history?itemId=${itemId}`)
    ]);

    // Vérifier que les requêtes principales ont réussi
    if (!loansRes.ok) throw new Error('Erreur lors de la récupération de l\'historique des prêts');
    if (!reservationsRes.ok) throw new Error('Erreur lors de la récupération de l\'historique des réservations');
    if (!reservationHistoryRes.ok) throw new Error('Erreur lors de la récupération de l\'historique des actions de réservation');
    
    // Traiter les résultats des requêtes
    const loans = await loansRes.json();
    const reservations = await reservationsRes.json();
    const reservationHistory = await reservationHistoryRes.json();
    
    // Traiter l'historique des prêts (changements de statut)
    let loanStatusHistory: any[] = [];
    if (loanHistoryRes.ok) {
      loanStatusHistory = await loanHistoryRes.json();
    }
    
    // ⚠️ IMPORTANT: Ne pas créer d'entrées d'historique pour les prêts (actifs ou retournés)
    // car elles seront générées à partir de loanStatusHistory pour éviter les doublons
    const loansHistory: HistoryItem[] = [];
    
    // Transformer les réservations actives en entrées d'historique
    const reservationsHistory = reservations.map((r: any): HistoryItem => ({
      action: 'Réservation active',
      itemName: r.item?.name || 'Item inconnu',
      user: formatUserName(r.user),
      userId: r.userId,
      itemId: r.itemId,
      date: formatDate(r.createdAt || r.startDate),
      startDate: formatDate(r.startDate),
      endDate: formatDate(r.endDate),
      status: getTranslatedStatus(r.status),
      rawStatus: r.status,
      comment: `Réservation du ${formatDate(r.startDate)} au ${formatDate(r.endDate)}`,
      type: 'reservation',
      id: r.id,
      returnedAt: null
    }));

    // Transformer l'historique des actions de réservation
    const reservationActionsHistory = reservationHistory.map((rh: any): HistoryItem => {
      const actionMap = RESERVATION_ACTION_MAP[rh.action] || { label: 'Autre', status: rh.action };
      
      return {
        action: actionMap.label,
        itemName: rh.item?.name || 'Item inconnu',
        user: formatUserName(rh.user),
        userId: rh.userId,
        itemId: rh.itemId,
        date: formatDate(rh.date),
        status: getTranslatedStatus(rh.action),
        rawStatus: rh.action,
        comment: rh.comment || '',
        type: 'reservation_action',
        id: rh.id,
        returnedAt: null
      };
    });

    // Transformer l'historique des statuts de prêt
    // C'est ici que seront incluses toutes les entrées de prêt et de retour
    const loanStatusHistoryMapped = loanStatusHistory.map((lsh: any): HistoryItem => {
      // Déterminer l'action en fonction du statut
      let action = 'Changement de statut';
      if (lsh.status === 'ACTIVE') {
        action = 'Emprunt';
      } else if (lsh.status === 'RETURNED') {
        action = 'Retour';
      } else if (lsh.status === 'OVERDUE') {
        action = 'Retard de prêt';
      } else if (lsh.status === 'SCHEDULED') {
        action = 'Prêt programmé';
      }
      
      // Formater le commentaire
      let comment = lsh.comment || '';
      if (lsh.status === 'RETURNED' && !comment.includes('Retourné')) {
        comment = 'Retour de l\'item';
      } else if (lsh.status === 'ACTIVE' && !comment.includes('Emprunt')) {
        comment = 'Création du prêt';
      }

      return {
        action,
        itemName: lsh.itemName || 'Item inconnu',
        user: formatUserName(lsh.userObj),
        userId: lsh.userId,
        itemId: lsh.itemId,
        date: formatDate(lsh.date),
        status: getTranslatedStatus(lsh.status),
        rawStatus: lsh.status,
        comment,
        type: 'loan_status_change',
        id: lsh.id,
        returnedAt: lsh.status === 'RETURNED' ? formatDate(lsh.date) : null
      };
    });
    
    // Combiner et trier l'historique par date
    const combinedHistory = [...loansHistory, ...reservationsHistory, ...reservationActionsHistory, ...loanStatusHistoryMapped]
      .sort((a, b) => parseFrenchDate(b.date) - parseFrenchDate(a.date));
    
    return combinedHistory;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique complet:", error);
    return [];
  }
}

// Fonction utilitaire pour récupérer l'historique d'un utilisateur
export async function fetchUserHistory(userId: string): Promise<HistoryItem[]> {
  try {
    // Récupérer uniquement les prêts de cet utilisateur avec ?userId= pour optimiser la requête
    const res = await fetch(`/api/loans?userId=${userId}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des prêts');
    const userLoans = await res.json();
    
    // Récupérer uniquement les items nécessaires pour cet utilisateur
    const uniqueItemIds = [...new Set(userLoans.map((l: any) => l.itemId))];
    
    // Si aucun prêt, éviter la requête inutile pour les items
    let items: any[] = [];
    if (uniqueItemIds.length > 0) {
      // Utiliser des promesses pour les appels API en parallèle
      const itemPromises = uniqueItemIds.map(id => 
        fetch(`/api/items/${id}`).then(res => res.ok ? res.json() : null)
      );
      items = (await Promise.all(itemPromises)).filter(Boolean);
    }
    
    // Ne plus générer d'entrées d'historique à partir des prêts directement pour éviter les doublons
    // Toutes les entrées viendront de loanStatusHistory
    const loansHistory: HistoryItem[] = [];

    // Utiliser des promesses pour récupérer toutes les données en parallèle
    const [activeReservationsRes, reservationRes, loanHistoryRes] = await Promise.all([
      fetch(`/api/reservations?userId=${userId}`),
      fetch(`/api/reservation-history?userId=${userId}`),
      fetch(`/api/loan-history?userId=${userId}`)
    ]);
    
    // Traiter les réservations actives
    let activeReservationsHistory: HistoryItem[] = [];
    if (activeReservationsRes.ok) {
      const activeReservations = await activeReservationsRes.json();
      activeReservationsHistory = activeReservations.map((r: any) => ({
        action: 'Réservation active',
        itemName: r.item?.name || 'Item inconnu',
        itemId: r.itemId,
        date: formatDate(r.createdAt || r.startDate),
        startDate: formatDate(r.startDate),
        endDate: formatDate(r.endDate),
        status: r.status || 'CONFIRMED',
        rawStatus: r.status || 'CONFIRMED',
        comment: `Réservation du ${formatDate(r.startDate)} au ${formatDate(r.endDate)}`,
        returnedAt: null,
        type: 'reservation',
        id: r.id
      }));
    }

    // Traiter l'historique des réservations
    let mappedReservations: HistoryItem[] = [];
    if (reservationRes.ok) {
      const reservationHistory = await reservationRes.json();
      mappedReservations = reservationHistory.map((r: any) => {
        const actionMap = RESERVATION_ACTION_MAP[r.action] || { label: 'Autre', status: r.action };
        
        return {
          action: actionMap.label,
          itemName: r.item?.name || 'Item inconnu',
          itemId: r.itemId,
          date: formatDate(r.date),
          endDate: r.endDate ? formatDate(r.endDate) : undefined,
          status: actionMap.status,
          rawStatus: r.action,
          comment: r.comment || '',
          returnedAt: null,
          type: 'reservation_action',
          id: r.id
        };
      });
    } else {
      console.error('Erreur lors de la récupération des réservations', reservationRes.status);
    }

    // Traiter l'historique des statuts de prêt
    let loanStatusHistory: HistoryItem[] = [];
    if (loanHistoryRes.ok) {
      try {
        const loanHistoryData = await loanHistoryRes.json();
        loanStatusHistory = loanHistoryData.map((lh: any) => {
          // Utiliser notre mapping pour obtenir des actions cohérentes
          const actionLabel = lh.status && LOAN_STATUS_TO_ACTION[lh.status] || lh.action;
          
          // Améliorer le commentaire en fonction du statut
          let comment = lh.comment || '';
          if (lh.status === 'RETURNED' && !comment.includes('Retourné')) {
            comment = comment || 'Retour de l\'item';
          } else if (lh.status === 'ACTIVE' && !comment.includes('Emprunt')) {
            comment = comment || 'Création du prêt';
          }
          
          return {
            action: actionLabel,
            itemName: lh.itemName || 'Item inconnu',
            itemId: lh.itemId,
            date: formatDate(lh.date),
            status: lh.status,
            rawStatus: lh.status,
            comment: comment,
            returnedAt: lh.status === 'RETURNED' ? formatDate(lh.date) : null,
            type: 'loan_status_change',
            id: lh.id
          };
        });
      } catch (error) {
        console.error('Erreur lors du traitement de l\'historique des prêts:', error);
      }
    } else {
      console.error('Erreur lors de la récupération de l\'historique des prêts', loanHistoryRes.status);
    }

    // Fusionner et trier tous les historiques
    const allHistory = [...loansHistory, ...activeReservationsHistory, ...mappedReservations, ...loanStatusHistory]
      .sort((a, b) => parseFrenchDate(b.date) - parseFrenchDate(a.date));
    
    return allHistory;
  } catch (err: any) {
    console.error('Erreur lors de la récupération de l\'historique utilisateur:', err);
    return [{
      action: 'Erreur',
      itemName: '',
      itemId: '',
      date: '-',
      status: 'Erreur de récupération',
      statusLabel: 'Erreur',
      statusColor: 'error',
      statusIcon: undefined,
      returnedAt: null,
      type: 'error',
      id: 'error',
      errorMessage: err?.message || 'Erreur réseau lors de la récupération de l\'historique.'
    }];
  }
}