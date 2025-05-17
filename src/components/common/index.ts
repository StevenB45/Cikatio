// Export de tous les composants communs pour faciliter l'importation

// Composants de dialogues et notifications
export { default as DialogProvider } from './DialogProvider';
export { default as NotificationProvider, useNotification } from './NotificationProvider';
export { default as LoadingOverlay } from './LoadingOverlay';
export { default as CommonDialog } from './CommonDialog';
export { useDialog } from './hooks/useDialog';

// Composants d'interface
export { default as DashboardCard } from './DashboardCard';
export { default as HistoryPanel } from './HistoryPanel';
export { default as PageTitle } from './PageTitle';
export { default as ItemTypeChip } from './ItemTypeChip';

// Composants de tableau (re-export)
export * from './table';

// Ajouter ici les futurs composants communs