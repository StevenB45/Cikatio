import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { Book as BookIcon, Inventory as EquipmentIcon } from '@mui/icons-material';
import { ItemType } from '@/types';

interface ItemTypeChipProps extends Omit<ChipProps, 'icon'> {
  itemType: ItemType;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled';
}

/**
 * Composant pour afficher un badge correspondant au type d'item
 */
const ItemTypeChip: React.FC<ItemTypeChipProps> = ({
  itemType,
  size = 'small',
  variant = 'outlined',
  ...chipProps
}) => {
  const isBook = itemType === 'BOOK';

  // Mémorisation des icônes pour éviter des recréations inutiles
  const bookIcon = React.useMemo(() => <BookIcon />, []);
  const equipmentIcon = React.useMemo(() => <EquipmentIcon />, []);

  return (
    <Chip
      icon={isBook ? bookIcon : equipmentIcon}
      label={isBook ? 'Livre' : 'Matériel'}
      size={size}
      color={isBook ? 'primary' : 'secondary'}
      variant={variant}
      {...chipProps}
    />
  );
};

// Optimisation avec React.memo pour éviter les rendus inutiles
export default React.memo(ItemTypeChip);