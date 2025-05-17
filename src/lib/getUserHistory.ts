import { fetchUserHistory } from './historyUtils';
// Définir le type HistoryItem directement ici au lieu de l'importer
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

export { RESERVATION_ACTION_MAP } from './historyUtils';

// Cette fonction est maintenant un simple proxy vers la fonction fetchUserHistory du module commun
export const getUserHistory = fetchUserHistory;
