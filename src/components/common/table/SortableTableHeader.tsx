import React from 'react';
import { TableCell, TableCellProps, SxProps, Theme, Tooltip } from '@mui/material';

interface SortableTableHeaderProps extends TableCellProps {
  label: string;
  column: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  tooltip?: string;
  sx?: SxProps<Theme>;
}

/**
 * Composant pour une cellule d'en-tête de tableau avec fonctionnalité de tri
 */
const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  label,
  column,
  sortBy,
  sortDirection,
  onSort,
  tooltip,
  sx,
  ...rest
}) => {
  // Utilisation d'une fonction mémorisée pour le gestionnaire de clic
  const handleClick = React.useCallback(() => {
    onSort(column);
  }, [onSort, column]);

  const content = (
    <TableCell
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      sx={sx}
      {...rest}
    >
      {label} {sortBy === column && (sortDirection === 'asc' ? '▲' : '▼')}
    </TableCell>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};

// Optimisation avec React.memo pour éviter les rendus inutiles
export default React.memo(SortableTableHeader);