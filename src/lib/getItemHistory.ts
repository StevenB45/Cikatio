// Utilitaire pour centraliser la récupération de l'historique d'un item (prêts et réservations)
import { fetchItemHistory, parseFrenchDate } from './historyUtils';

// Exporter la fonction utilitaire pour parser une date au format français pour la compatibilité
export { parseFrenchDate };

// Cette fonction est maintenant un simple proxy vers la fonction fetchItemHistory du module commun
export const getItemHistory = fetchItemHistory;
