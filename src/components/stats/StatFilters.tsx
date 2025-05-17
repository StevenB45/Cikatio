import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Button,
  SelectChangeEvent,
  Box,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';

// Types
export type ItemType = 'BOOK' | 'EQUIPMENT';
export type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'RETURNED' | 'LOST';
export type DatePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: Date;
}

export interface StatFiltersProps {
  itemType: 'all' | ItemType;
  setItemType: (value: 'all' | ItemType) => void;
  loanStatus: 'all' | LoanStatus;
  setLoanStatus: (value: 'all' | LoanStatus) => void;
  period: DatePeriod;
  setPeriod: (value: DatePeriod) => void;
  customStart: Date | null;
  setCustomStart: (value: Date | null) => void;
  customEnd: Date | null;
  setCustomEnd: (value: Date | null) => void;
  selectedUser: User | null;
  setSelectedUser: (value: User | null) => void;
  users: User[];
  onExport: () => void;
  onReset: () => void;
  expanded: boolean;
  toggleExpanded: () => void;
}

const StatFilters: React.FC<StatFiltersProps> = ({
  itemType,
  setItemType,
  loanStatus,
  setLoanStatus,
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  selectedUser,
  setSelectedUser,
  users,
  onExport,
  onReset,
  expanded,
  toggleExpanded
}) => {
  const handlePeriodChange = (event: SelectChangeEvent<string>) => {
    setPeriod(event.target.value as DatePeriod);
  };

  return (
    <Paper sx={{ p: 2, mb: 3, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1 }} />
          <h3 style={{ margin: 0 }}>Filtres</h3>
        </Box>
        <Box>
          <Tooltip title={expanded ? "Réduire les filtres" : "Afficher tous les filtres"}>
            <IconButton onClick={toggleExpanded}>
              {expanded ? <ClearIcon /> : <FilterListIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={expanded ? 3 : 4}>
          <FormControl fullWidth size="small">
            <InputLabel>Type d'item</InputLabel>
            <Select
              value={itemType}
              label="Type d'item"
              onChange={e => setItemType(e.target.value as 'all' | ItemType)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="BOOK">Livre</MenuItem>
              <MenuItem value="EQUIPMENT">Matériel</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={expanded ? 3 : 4}>
          <FormControl fullWidth size="small">
            <InputLabel>Statut du prêt</InputLabel>
            <Select
              value={loanStatus}
              label="Statut du prêt"
              onChange={e => setLoanStatus(e.target.value as 'all' | LoanStatus)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="ACTIVE">En cours</MenuItem>
              <MenuItem value="OVERDUE">En retard</MenuItem>
              <MenuItem value="RETURNED">Retourné</MenuItem>
              <MenuItem value="LOST">Perdu</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={expanded ? 3 : 4}>
          <FormControl fullWidth size="small">
            <InputLabel>Période</InputLabel>
            <Select
              value={period}
              label="Période"
              onChange={handlePeriodChange}
            >
              <MenuItem value="day">Aujourd'hui</MenuItem>
              <MenuItem value="week">Cette semaine</MenuItem>
              <MenuItem value="month">Ce mois</MenuItem>
              <MenuItem value="quarter">Ce trimestre</MenuItem>
              <MenuItem value="year">Cette année</MenuItem>
              <MenuItem value="custom">Période personnalisée</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {expanded && (
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={users}
              getOptionLabel={u => `${u.firstName} ${u.lastName}`}
              value={selectedUser}
              onChange={(_, value) => setSelectedUser(value)}
              renderInput={params => (
                <TextField {...params} label="Usager" size="small" fullWidth />
              )}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              clearOnEscape
            />
          </Grid>
        )}
        
        {period === 'custom' && (
          <>
            <Grid item xs={6} md={3}>
              <TextField
                label="Début"
                type="date"
                value={customStart ? customStart.toISOString().slice(0, 10) : ''}
                onChange={e => setCustomStart(e.target.value ? new Date(e.target.value) : null)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Fin"
                type="date"
                value={customEnd ? customEnd.toISOString().slice(0, 10) : ''}
                onChange={e => setCustomEnd(e.target.value ? new Date(e.target.value) : null)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </>
        )}
        
        <Grid item xs={12} md={expanded ? 3 : 4} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="secondary" onClick={onReset}>
            Réinitialiser
          </Button>
          <Button variant="outlined" color="primary" startIcon={<DownloadIcon />} onClick={onExport}>
            Exporter
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StatFilters;