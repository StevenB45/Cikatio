import { DatePeriod } from '@/types';

export interface DateRange {
  start: Date;
  end: Date;
}

export const getDateRangeForPeriod = (period: DatePeriod, customStart?: Date | null, customEnd?: Date | null): DateRange => {
  const now = new Date();
  
  switch (period) {
    case 'day':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      };
      
    case 'week': {
      const day = now.getDay() || 7; // 1 = Lundi, ..., 7 = Dimanche
      const start = new Date(now);
      start.setDate(now.getDate() - day + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { start, end };
    }
      
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      };
      
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), quarter * 3, 1),
        end: new Date(now.getFullYear(), quarter * 3 + 3, 1)
      };
    }
      
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear() + 1, 0, 1)
      };
      
    case 'custom':
      if (customStart && customEnd) {
        const end = new Date(customEnd);
        end.setDate(end.getDate() + 1); // Inclure la date de fin
        return {
          start: new Date(customStart),
          end
        };
      }
      // Fallback sur le mois en cours si les dates personnalisées sont manquantes
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      };
  }
};

export const formatDateToLocal = (date: Date): string => {
  return date.toLocaleDateString('fr-FR');
};

export const getPeriodLabel = (period: DatePeriod, customStart?: Date | null, customEnd?: Date | null): string => {
  if (period === 'custom' && customStart && customEnd) {
    return `${formatDateToLocal(customStart)} au ${formatDateToLocal(customEnd)}`;
  }
  
  const labels: Record<DatePeriod, string> = {
    day: "Aujourd'hui",
    week: 'Cette semaine',
    month: 'Ce mois-ci',
    quarter: 'Ce trimestre',
    year: 'Cette année',
    custom: 'Période personnalisée'
  };
  
  return labels[period];
};