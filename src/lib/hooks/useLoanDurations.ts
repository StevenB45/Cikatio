import { useMemo } from 'react';
import { Loan, Item } from '@/types';

export interface LoanDuration {
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  count: number;
}

export interface ItemTypeDurations {
  books: LoanDuration;
  equipment: LoanDuration;
  all: LoanDuration;
}

export const useLoanDurations = (loans: Loan[], items: Item[]): ItemTypeDurations => {
  return useMemo(() => {
    // Filtrer les prêts terminés
    const completedLoans = loans.filter(l => l.returnedAt);

    // Fonction pour calculer la durée d'un prêt en jours
    const calculateDuration = (loan: Loan): number => {
      const borrowedDate = new Date(loan.borrowedAt);
      const returnedDate = new Date(loan.returnedAt as Date);
      const diffTime = returnedDate.getTime() - borrowedDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Fonction pour calculer les statistiques de durée
    const calculateDurationStats = (durations: number[]): LoanDuration => {
      if (durations.length === 0) {
        return { avgDuration: 0, minDuration: 0, maxDuration: 0, count: 0 };
      }

      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      return {
        avgDuration: Math.round(avg),
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        count: durations.length
      };
    };

    // Calcul par type d'item
    const bookLoans = completedLoans.filter(l => {
      const item = items.find(i => i.id === l.itemId);
      return item?.category === 'BOOK';
    });
    
    const equipmentLoans = completedLoans.filter(l => {
      const item = items.find(i => i.id === l.itemId);
      return item?.category === 'EQUIPMENT';
    });

    const bookDurations = bookLoans.map(calculateDuration);
    const equipmentDurations = equipmentLoans.map(calculateDuration);
    const allDurations = completedLoans.map(calculateDuration);

    return {
      books: calculateDurationStats(bookDurations),
      equipment: calculateDurationStats(equipmentDurations),
      all: calculateDurationStats(allDurations)
    };
  }, [loans, items]);
};