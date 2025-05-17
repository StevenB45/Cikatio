// Types partagés pour toute l'application

// Types pour les données statistiques
export type ItemType = 'BOOK' | 'EQUIPMENT';
export type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'RETURNED' | 'LOST';
export type DatePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export type ServiceCategory = 'RUNE' | 'SAVS' | 'CICAT' | 'PNT' | 'LOGEMENT_INCLUSIF';

// Définition des contextes de prêt qui correspond exactement à l'enum LoanContext du schéma Prisma
export type LoanContext = 
  | 'CONFERENCE_FINANCEURS'
  | 'APPUIS_SPECIFIQUES'
  | 'PLATEFORME_AGEFIPH'
  | 'AIDANTS'
  | 'RUNE'
  | 'PNT'
  | 'SAVS'
  | 'CICAT'
  | 'LOGEMENT_INCLUSIF';

// Constantes partagées
export const LOAN_CONTEXTS = [
  { value: 'CONFERENCE_FINANCEURS', label: 'Conférence des financeurs' },
  { value: 'APPUIS_SPECIFIQUES', label: 'Appuis spécifiques' },
  { value: 'PLATEFORME_AGEFIPH', label: 'Plateforme Agefiph' },
  { value: 'AIDANTS', label: 'Aidants' },
  { value: 'RUNE', label: 'RUNE' },
  { value: 'PNT', label: 'PNT' },
  { value: 'SAVS', label: 'SAVS' },
  { value: 'CICAT', label: 'CICAT' },
  { value: 'LOGEMENT_INCLUSIF', label: 'Logement Inclusif' }
] as const;

export const SERVICE_CATEGORIES = [
  { value: 'RUNE', label: 'RUNE' },
  { value: 'SAVS', label: 'SAVS' },
  { value: 'CICAT', label: 'CICAT' },
  { value: 'PNT', label: 'PNT' },
  { value: 'LOGEMENT_INCLUSIF', label: 'Logement Inclusif' }
] as const;

// Interfaces pour les données
export interface BaseEntity {
  id: string;
}

export interface Item extends BaseEntity {
  name: string;
  category: ItemType;
  customId: string;
  available: boolean;
  reservationStatus: 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'OUT_OF_ORDER';
  serviceCategory: ServiceCategory;
  // Champs spécifiques pour les livres
  author?: string | null;
  publisher?: string | null;
  yearPublished?: number | null;
  isbn?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  // Champs spécifiques pour le matériel
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  // Réservations
  reservedById?: string | null;
  reservedAt?: Date | null;
}

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: Date;
}

export interface Loan extends BaseEntity {
  itemId: string;
  borrowerId: string;
  borrowedAt: Date;
  dueAt: Date;
  returnedAt?: Date;
  status: LoanStatus;
  contexts?: LoanContext[];
  // Pour l'affichage
  borrower?: User;
  isVirtual?: boolean;
}

export type StatusType = 'ACTIVE' | 'OVERDUE' | 'RETURNED' | 'OUT_OF_ORDER' | 'AVAILABLE' | 'RESERVED' | 'BORROWED' | 'LOST';
