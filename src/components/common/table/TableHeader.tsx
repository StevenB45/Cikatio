import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface TableHeaderProps {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddClick?: () => void;
  addButtonText?: string;
  showDeleteButton?: boolean;
  onDeleteClick?: () => void;
  deleteButtonText?: string;
  deleteButtonDisabled?: boolean;
  renderExtraActions?: () => React.ReactNode;
}

/**
 * Composant réutilisable pour l'en-tête des tableaux avec recherche et actions
 */
const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  subtitle,
  searchPlaceholder = "Rechercher...",
  searchValue,
  onSearchChange,
  onAddClick,
  addButtonText = "Ajouter",
  showDeleteButton = false,
  onDeleteClick,
  deleteButtonText = "Supprimer la sélection",
  deleteButtonDisabled = true,
  renderExtraActions
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {subtitle}
        </Typography>
      )}

      <Box sx={{ mb: 3, mt: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={onSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' }, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
            {onAddClick && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddClick}
                sx={{ mr: 1 }}
              >
                {addButtonText}
              </Button>
            )}
            {showDeleteButton && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                disabled={deleteButtonDisabled}
                onClick={onDeleteClick}
              >
                {deleteButtonText}
              </Button>
            )}
            {renderExtraActions && renderExtraActions()}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

// Optimisation avec React.memo pour éviter les rendus inutiles
export default React.memo(TableHeader);