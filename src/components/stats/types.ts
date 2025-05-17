import { ServiceCategory } from '@/types';

// Types de base
export type ItemType = 'BOOK' | 'EQUIPMENT';
export type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'RETURNED' | 'LOST';
export type DatePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

// Interfaces
export interface Item {
  id: string;
  name: string;
  category: ItemType;
  reservationStatus: 'AVAILABLE' | 'BORROWED' | 'RESERVED';
  customId: string;
  available: boolean;
  serviceCategory: ServiceCategory;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: Date;
}

export interface Loan {
  id: string;
  itemId: string;
  borrowerId: string;
  borrowedAt: Date;
  dueAt: Date;
  returnedAt?: Date;
  status: LoanStatus;
}

// Interfaces pour les statistiques
export interface GlobalStats {
  totalItems: number;
  itemsBorrowed: number;
  itemsReserved: number;
  itemsAvailable: number;
  totalLoans: number;
  loansActive: number;
  loansOverdue: number;
  loansReturned: number;
  loansLost: number;
  totalUsers: number;
}

export interface AdvancedStats {
  newUsers: User[];
  newLoans: Loan[];
  returnedLoans: Loan[];
  neverBorrowedItems: Item[];
  rotationRate: number;
  overdueRate: number;
  bookLoans: number;
  equipmentLoans: number;
  topNeverBorrowed: Item[];
  topActiveUsers: Array<{
    id: string;
    count: number;
    user: User | undefined;
  }>;
}

// Interface pour un utilisateur avec des statistiques
export interface UserWithStats {
  id: string;
  name: string;
  email: string;
  loansCount: number;
  activeLoansCount: number;
  overdueLoansCount: number;
  avgLoanDuration?: number;
}

// Interface pour un item avec des statistiques
export interface ItemWithStats {
  id: string;
  name: string;
  type: ItemType;
  loansCount: number;
  availabilityRate?: number;
  lastBorrowed?: Date;
  currentStatus: string;
}

// Fonction utilitaire pour obtenir des statistiques globales sur les items et les prêts
export function getGlobalStats(items: Item[], loans: Loan[], users: User[]): GlobalStats {
  // Statistiques sur les items
  const totalItems = items.length;
  const itemsBorrowed = items.filter(i => i.reservationStatus === 'BORROWED').length;
  const itemsReserved = items.filter(i => i.reservationStatus === 'RESERVED').length;
  const itemsAvailable = items.filter(i => i.reservationStatus === 'AVAILABLE').length;

  // Statistiques sur les prêts
  const totalLoans = loans.length;
  const loansActive = loans.filter(l => l.status === 'ACTIVE').length;
  const loansOverdue = loans.filter(l => l.status === 'OVERDUE').length;
  const loansReturned = loans.filter(l => l.status === 'RETURNED').length;
  const loansLost = loans.filter(l => l.status === 'LOST').length;

  // Statistiques sur les usagers
  const totalUsers = users.length;

  return {
    totalItems,
    itemsBorrowed,
    itemsReserved,
    itemsAvailable,
    totalLoans,
    loansActive,
    loansOverdue,
    loansReturned,
    loansLost,
    totalUsers
  };
}

// Statistiques avancées et croisements
export function getAdvancedStats(
  loans: Loan[],
  items: Item[],
  users: User[],
  periodStart: Date,
  periodEnd: Date
): AdvancedStats {
  // Nouveaux usagers sur la période
  const newUsers = users.filter(u => u.createdAt && u.createdAt >= periodStart && u.createdAt < periodEnd);
  // Prêts créés sur la période
  const newLoans = loans.filter(l => l.borrowedAt >= periodStart && l.borrowedAt < periodEnd);
  // Retours effectués sur la période
  const returnedLoans = loans.filter(l => l.returnedAt && l.returnedAt >= periodStart && l.returnedAt < periodEnd);
  // Items jamais empruntés
  const neverBorrowedItems = items.filter(i => !loans.some(l => l.itemId === i.id));
  // Taux de rotation des items
  const rotationRate = loans.length / (items.length || 1);
  // Taux de retard
  const overdueRate = loans.filter(l => l.status === 'OVERDUE').length / (loans.length || 1);
  // Taux d'utilisation par type
  const bookLoans = loans.filter(l => items.find(i => i.id === l.itemId)?.category === 'BOOK').length;
  const equipmentLoans = loans.filter(l => items.find(i => i.id === l.itemId)?.category === 'EQUIPMENT').length;
  // Top 5 items jamais empruntés
  const topNeverBorrowed = neverBorrowedItems.slice(0, 5);
  // Top 5 usagers les plus actifs sur la période
  const userLoanCounts: Record<string, number> = {};
  newLoans.forEach(l => { userLoanCounts[l.borrowerId] = (userLoanCounts[l.borrowerId] || 0) + 1; });
  const topActiveUsers = Object.entries(userLoanCounts)
    .map(([id, count]) => ({ id, count, user: users.find(u => u.id === id) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return {
    newUsers,
    newLoans,
    returnedLoans,
    neverBorrowedItems,
    rotationRate,
    overdueRate,
    bookLoans,
    equipmentLoans,
    topNeverBorrowed,
    topActiveUsers
  };
}

// Fonction pour filtrer les prêts selon les critères
export function filterLoans(
  loans: Loan[], 
  items: Item[], 
  itemType: 'all' | ItemType,
  loanStatus: 'all' | LoanStatus,
  selectedUser: User | null,
  period: DatePeriod,
  customStart: Date | null,
  customEnd: Date | null
): Loan[] {
  let filteredLoans = [...loans];
  
  // Filtre par type d'item
  if (itemType !== 'all') {
    const itemIds = items.filter(i => i.category === itemType).map(i => i.id);
    filteredLoans = filteredLoans.filter(l => itemIds.includes(l.itemId));
  }
  
  // Filtre par statut
  if (loanStatus !== 'all') {
    filteredLoans = filteredLoans.filter(l => l.status === loanStatus);
  }
  
  // Filtre par usager
  if (selectedUser) {
    filteredLoans = filteredLoans.filter(l => l.borrowerId === selectedUser.id);
  }
  
  // Filtre par période
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;
  
  if (period === 'day') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (period === 'week') {
    const day = now.getDay() || 7;
    start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    end = new Date(start);
    end.setDate(start.getDate() + 7);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (period === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), quarter * 3, 1);
    end = new Date(now.getFullYear(), quarter * 3 + 3, 1);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
  } else if (period === 'custom' && customStart && customEnd) {
    start = new Date(customStart);
    end = new Date(customEnd);
    end.setDate(end.getDate() + 1); // inclure la date de fin
  }
  
  if (start && end) {
    filteredLoans = filteredLoans.filter(l => l.borrowedAt >= start! && l.borrowedAt < end!);
  }
  
  return filteredLoans;
}