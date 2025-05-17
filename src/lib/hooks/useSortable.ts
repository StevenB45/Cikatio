import { useCallback, useState } from 'react';

type SortDirection = 'asc' | 'desc';

type CompareFunction<T> = (
  a: T,
  b: T,
  sortKey: string,
  direction: SortDirection
) => number;

/**
 * Hook pour gérer le tri de données.
 * @param defaultSortBy Propriété par défaut pour le tri
 * @param defaultDirection Direction de tri par défaut ('asc' ou 'desc')
 * @param customCompare Fonction de comparaison personnalisée
 * @returns Fonctions et états pour gérer le tri
 */
export function useSortable<T>(
  defaultSortBy: string,
  defaultDirection: SortDirection = 'asc',
  customCompare?: CompareFunction<T>
) {
  const [sortBy, setSortBy] = useState<string>(defaultSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  // Gestion du changement de colonne de tri
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Nouvelle colonne, réinitialiser la direction
      setSortBy(column);
      setSortDirection('asc');
    }
  }, [sortBy]);

  // Fonction de tri par défaut
  const defaultCompare = useCallback(
    (a: T, b: T, sortKey: string, direction: SortDirection): number => {
      const aValue = a[sortKey as keyof T];
      const bValue = b[sortKey as keyof T];

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    },
    []
  );

  // Fonction pour trier les données
  const getSortedData = useCallback(
    (data: T[]): T[] => {
      if (!data || data.length === 0) return data;

      const compareFunction = customCompare || defaultCompare;
      
      return [...data].sort((a, b) =>
        compareFunction(a, b, sortBy, sortDirection)
      );
    },
    [sortBy, sortDirection, customCompare, defaultCompare]
  );

  return {
    sortBy,
    sortDirection,
    handleSort,
    getSortedData,
  };
}