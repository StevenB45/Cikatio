import { useMemo } from 'react';
import { Loan, Item, User, ItemType, LoanStatus, LoanContext, ServiceCategory } from '@/types';
import { DatePeriod } from '@/types';
import { getDateRangeForPeriod } from '../utils/dateUtils';

export interface LoanFilters {
  period: DatePeriod;
  customStart: Date | null;
  customEnd: Date | null;
  itemType: 'all' | ItemType;
  status: 'all' | LoanStatus;
  userId: string | null;
  contexts: LoanContext[];
  services: ServiceCategory[];
  operationType: 'all' | 'loans' | 'reservations';
}

export const useLoanFilters = (
  loans: Loan[],
  items: Item[],
  filters: LoanFilters
): Loan[] => {
  return useMemo(() => {
    let result = [...loans];
    
    // Si on ne veut que les réservations, on retourne un tableau vide
    if (filters.operationType === 'reservations') {
      return [];
    }
    
    // Filtre par type d'item
    if (filters.itemType !== 'all') {
      const itemIds = items
        .filter(i => i.category === filters.itemType)
        .map(i => i.id);
      result = result.filter(l => itemIds.includes(l.itemId));
    }
    
    // Filtre par statut
    if (filters.status !== 'all') {
      result = result.filter(l => l.status === filters.status);
    }
    
    // Filtre par utilisateur
    if (filters.userId) {
      result = result.filter(l => l.borrowerId === filters.userId);
    }
    
    // Filtre par contextes
    if (filters.contexts.length > 0) {
      result = result.filter(l => 
        l.contexts && 
        Array.isArray(l.contexts) && 
        l.contexts.some(ctx => filters.contexts.includes(ctx))
      );
    }
    
    // Filtre par services
    if (filters.services.length > 0) {
      const serviceItems = items
        .filter(i => filters.services.includes(i.serviceCategory))
        .map(i => i.id);
      result = result.filter(l => serviceItems.includes(l.itemId));
    }
    
    // Filtre par période
    const dateRange = getDateRangeForPeriod(
      filters.period, 
      filters.customStart, 
      filters.customEnd
    );
    
    result = result.filter(l => 
      l.borrowedAt >= dateRange.start && 
      l.borrowedAt < dateRange.end
    );
    
    return result;
  }, [loans, items, filters]);
};