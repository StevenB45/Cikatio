import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { HistoryItem, fetchItemHistory, fetchUserHistory } from '../historyUtils';

interface HistoryContextType {
  itemHistory: HistoryItem[];
  userHistory: HistoryItem[];
  isLoading: boolean;
  loadItemHistory: (itemId: string) => Promise<void>;
  loadUserHistory: (userId: string) => Promise<void>;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

interface HistoryProviderProps {
  children: ReactNode;
}

export const HistoryProvider: React.FC<HistoryProviderProps> = ({ children }) => {
  const [itemHistory, setItemHistory] = useState<HistoryItem[]>([]);
  const [userHistory, setUserHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger l'historique d'un item en utilisant le module commun
  const loadItemHistory = useCallback(async (itemId: string) => {
    if (!itemId) return;
    
    setIsLoading(true);
    try {
      const history = await fetchItemHistory(itemId);
      setItemHistory(history);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique de l'item:", error);
      setItemHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger l'historique d'un utilisateur en utilisant le module commun
  const loadUserHistory = useCallback(async (userId: string) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const history = await fetchUserHistory(userId);
      setUserHistory(history);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique de l'utilisateur:", error);
      setUserHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effacer l'historique
  const clearHistory = useCallback(() => {
    setItemHistory([]);
    setUserHistory([]);
  }, []);

  const value = {
    itemHistory,
    userHistory,
    isLoading,
    loadItemHistory,
    loadUserHistory,
    clearHistory
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'historique
export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory doit être utilisé à l\'intérieur d\'un HistoryProvider');
  }
  return context;
};