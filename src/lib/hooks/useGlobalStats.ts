import { useMemo } from 'react';
import { Loan, Item, User } from '@/types';

export interface GlobalStats {
  items: {
    total: number;
    borrowed: number;
    reserved: number;
    available: number;
  };
  loans: {
    total: number;
    active: number;
    overdue: number;
    returned: number;
    lost: number;
  };
  users: {
    total: number;
    active: number;
  };
}

export const useGlobalStats = (
  items: Item[], 
  loans: Loan[], 
  users: User[]
): GlobalStats => {
  return useMemo(() => {
    return {
      items: {
        total: items.length,
        borrowed: items.filter(i => i.reservationStatus === 'BORROWED').length,
        reserved: items.filter(i => i.reservationStatus === 'RESERVED').length,
        available: items.filter(i => i.reservationStatus === 'AVAILABLE').length
      },
      loans: {
        total: loans.length,
        active: loans.filter(l => l.status === 'ACTIVE').length,
        overdue: loans.filter(l => l.status === 'OVERDUE').length,
        returned: loans.filter(l => l.status === 'RETURNED').length,
        lost: loans.filter(l => l.status === 'LOST').length
      },
      users: {
        total: users.length,
        active: users.filter(u => 
          loans.some(l => 
            l.borrowerId === u.id && 
            (l.status === 'ACTIVE' || l.status === 'OVERDUE')
          )
        ).length
      }
    };
  }, [items, loans, users]);
};