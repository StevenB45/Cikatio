import React from 'react';
import { Box, Tabs, Tab, SxProps, Theme } from '@mui/material';

/**
 * Type pour représenter une option d'onglet de filtre
 */
export interface FilterTabOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
}

interface FilterTabsProps {
  value: string;
  onChange: (event: React.SyntheticEvent, newValue: string) => void;
  options: FilterTabOption[];
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}

/**
 * Composant réutilisable pour les onglets de filtrage
 */
const FilterTabs: React.FC<FilterTabsProps> = ({
  value,
  onChange,
  options,
  ariaLabel = "filtres par onglets",
  sx
}) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, ...sx }}>
      <Tabs 
        value={value} 
        onChange={onChange}
        indicatorColor="primary"
        textColor="primary"
        aria-label={ariaLabel}
      >
        {options.map(option => (
          <Tab 
            key={option.value}
            label={option.label} 
            value={option.value}
            icon={option.icon}
            iconPosition="start"
            sx={option.color ? { 
              '& .MuiSvgIcon-root': { 
                color: option.color 
              }
            } : undefined}
          />
        ))}
      </Tabs>
    </Box>
  );
};

// Optimisation avec React.memo pour éviter les rendus inutiles quand les props ne changent pas
export default React.memo(FilterTabs);