import { ReservationStatus, LoanStatus } from '@prisma/client';

// Types de statuts
export type ItemStatus = ReservationStatus | 'OUT_OF_ORDER';
export type LoanStatusType = LoanStatus;
export { LoanStatus };

// Labels en français pour tous les statuts
export const STATUS_LABELS: Record<string, string> = {
  // Statuts des items
  AVAILABLE: 'Disponible',
  BORROWED: 'Emprunté',
  RESERVED: 'Réservé',
  OUT_OF_ORDER: 'En panne',
  
  // Statuts des prêts
  ACTIVE: 'En cours',
  OVERDUE: 'En retard',
  RETURNED: 'Retourné',
  SCHEDULED: 'Programmé',
  LOST: 'Perdu',
  
  // Statuts des réservations
  CONFIRMED: 'Confirmée',
  PENDING: 'En attente',
  CANCELLED: 'Annulée',
  EXPIRED: 'Expirée'
};

// Couleurs des badges pour chaque statut
export const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  // Statuts des items
  AVAILABLE: 'success',
  BORROWED: 'error',
  RESERVED: 'warning',
  OUT_OF_ORDER: 'error',
  
  // Statuts des prêts
  ACTIVE: 'info',
  OVERDUE: 'error',
  RETURNED: 'success',
  SCHEDULED: 'info',
  LOST: 'error',
  
  // Statuts des réservations
  CONFIRMED: 'success',
  PENDING: 'warning',
  CANCELLED: 'error',
  EXPIRED: 'error'
};

// Vérifier si un item est en prêt
export function isItemBorrowed(item: { loans?: Array<{ status: LoanStatus; returnedAt: Date | null }> }): boolean {
  if (!item.loans) return false;
  
  return item.loans.some(loan => 
    (loan.status === 'ACTIVE' || loan.status === 'OVERDUE' || loan.status === 'SCHEDULED') && 
    !loan.returnedAt
  );
}

// Obtenir le statut correct d'un item en fonction de ses prêts
export function getItemStatus(item: { 
  reservationStatus: ItemStatus;
  loans?: Array<{ status: LoanStatus; returnedAt: Date | null }>;
}): ItemStatus {
  if (isItemBorrowed(item)) {
    return 'BORROWED';
  }
  return item.reservationStatus;
}

// Vérifier si un statut peut être modifié
export function canModifyStatus(item: { 
  reservationStatus: ItemStatus;
  loans?: Array<{ status: LoanStatus; returnedAt: Date | null }>;
}): boolean {
  return !isItemBorrowed(item);
}

// Obtenir le label en français d'un statut
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

// Obtenir la couleur d'un badge pour un statut
export function getStatusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  return STATUS_COLORS[status] || 'default';
} 