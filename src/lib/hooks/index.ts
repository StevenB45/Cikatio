// Export de tous les hooks personnalisés pour faciliter l'importation

export { useApiCrud } from './useApiCrud';
export { useFilterable } from './useFilterable';
export { useSortable } from './useSortable';
export { useLoanActions } from './useLoanActions';

// Le chemin d'importation était incorrect, nous devons importer depuis le bon chemin
export { useDialog } from '../../components/common/DialogProvider';
export { useNotification } from '../../components/common/NotificationProvider';

export * from './useLoanDurations';
export * from './useGlobalStats';
export * from './useLoanFilters';
export * from './useExcelExport';

// Ajouter ici les futurs hooks personnalisés