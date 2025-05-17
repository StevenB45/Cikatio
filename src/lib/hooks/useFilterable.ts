import { useState, useCallback, useMemo, useEffect } from 'react';

type FilterFunction<T> = (item: T, filters: Record<string, any>) => boolean;

/**
 * Hook pour gérer le filtrage et la pagination des données
 * @param data Les données à filtrer
 * @param filterFn La fonction de filtrage à appliquer
 * @param initialFilters Les filtres initiaux
 * @param initialPage La page initiale (base 0)
 * @param initialRowsPerPage Le nombre initial d'éléments par page
 * @returns Fonctions et états pour gérer le filtrage et la pagination
 */
export function useFilterable<T>(
  data: T[],
  filterFn: FilterFunction<T>,
  initialFilters: Record<string, any> = {},
  initialPage: number = 0,
  initialRowsPerPage: number = 10
) {
  // États pour la recherche
  const [searchQuery, setSearchQuery] = useState<string>('');

  // État pour les autres filtres
  const [filters, setFilters] = useState<Record<string, any>>({
    ...initialFilters,
    searchQuery: '',
  });

  // États pour la pagination
  const [page, setPage] = useState<number>(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState<number>(initialRowsPerPage);

  // Mettre à jour les filtres quand searchQuery change
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, [searchQuery]);

  // Fonction pour mettre à jour un filtre spécifique
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Réinitialiser la page à 0 quand un filtre change
    setPage(0);
  }, []);

  // Calculer les données filtrées
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item => filterFn(item, filters));
  }, [data, filters, filterFn]);

  // Calculer le nombre total d'éléments après filtrage
  const totalCount = useMemo(() => filteredData.length, [filteredData]);

  // Calculer les données paginées
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, page, rowsPerPage]);

  // Gestion du changement de page
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  // Gestion du changement de nombre d'éléments par page
  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Réinitialiser les filtres à leurs valeurs initiales
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchQuery('');
    setPage(0);
  }, [initialFilters]);

  return {
    // États
    searchQuery,
    setSearchQuery,
    filters,
    page,
    rowsPerPage,
    filteredData,
    paginatedData,
    totalCount,
    
    // Fonctions
    updateFilter,
    handleChangePage,
    handleChangeRowsPerPage,
    resetFilters,
  };
}