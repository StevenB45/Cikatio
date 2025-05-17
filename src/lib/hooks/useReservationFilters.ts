import { useMemo } from 'react';
import { Item, ItemType, ServiceCategory } from '@/types';
import { DatePeriod } from '@/types';
import { getDateRangeForPeriod } from '../utils/dateUtils';

export interface ReservationFilters {
  period: DatePeriod;
  customStart: Date | null;
  customEnd: Date | null;
  itemType: 'all' | ItemType;
  status: 'all' | string;
  userId: string | null;
  services: ServiceCategory[];
  operationType: 'all' | 'loans' | 'reservations';
}

export const useReservationFilters = (
  reservations: any[],
  items: Item[],
  filters: ReservationFilters
): any[] => {
  return useMemo(() => {
    let result = [...reservations];
    
    // Si on ne veut que les prêts, on retourne un tableau vide
    if (filters.operationType === 'loans') {
      return [];
    }
    
    // Filtre par type d'item
    if (filters.itemType !== 'all') {
      const itemIds = items
        .filter(i => i.category === filters.itemType)
        .map(i => i.id);
      result = result.filter(r => itemIds.includes(r.itemId));
    }
    
    // Filtre par statut
    if (filters.status !== 'all') {
      result = result.filter(r => r.status === filters.status);
    }
    
    // Filtre par utilisateur
    if (filters.userId) {
      result = result.filter(r => r.userId === filters.userId);
    }
    
    // Filtre par services
    if (filters.services.length > 0) {
      const serviceItems = items
        .filter(i => filters.services.includes(i.serviceCategory))
        .map(i => i.id);
      result = result.filter(r => serviceItems.includes(r.itemId));
    }
    
    // Filtre par période
    const dateRange = getDateRangeForPeriod(
      filters.period, 
      filters.customStart, 
      filters.customEnd
    );
    
    result = result.filter(r => 
      r.startDate >= dateRange.start && 
      r.startDate < dateRange.end
    );
    
    return result;
  }, [reservations, items, filters]);
}; 