'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel,
  Select, MenuItem, TextField, Button, Chip,
  Snackbar, Alert, CircularProgress, Card,
  CardContent, Accordion, AccordionSummary,
  AccordionDetails, SelectChangeEvent
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/common/PageTitle';
import { DatePeriod, Item, Loan, User, ItemType, LoanStatus, LoanContext, ServiceCategory } from '@/types';
import { LOAN_CONTEXTS, SERVICE_CATEGORIES } from '@/types';
import { useLoanDurations, useGlobalStats, useLoanFilters, useExcelExport } from '@/lib/hooks';
import { useReservationFilters } from '@/lib/hooks/useReservationFilters';
import { getPeriodLabel, formatDateToLocal } from '@/lib/utils/dateUtils';

/**
 * Composant pour les filtres de période
 */
interface PeriodFilterProps {
  period: DatePeriod;
  setPeriod: (value: DatePeriod) => void;
  customStart: Date | null;
  setCustomStart: (date: Date | null) => void;
  customEnd: Date | null;
  setCustomEnd: (date: Date | null) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd
}) => {
  const handlePeriodChange = (e: SelectChangeEvent<string>) => {
    setPeriod(e.target.value as DatePeriod);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Période d'analyse</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel id="period-label">Période</InputLabel>
            <Select
              labelId="period-label"
              value={period}
              label="Période"
              onChange={handlePeriodChange}
            >
              <MenuItem value="day">Aujourd'hui</MenuItem>
              <MenuItem value="week">Cette semaine</MenuItem>
              <MenuItem value="month">Ce mois-ci</MenuItem>
              <MenuItem value="quarter">Ce trimestre</MenuItem>
              <MenuItem value="year">Cette année</MenuItem>
              <MenuItem value="custom">Période personnalisée</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {period === 'custom' && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Date de début"
                type="date"
                value={customStart ? customStart.toISOString().slice(0, 10) : ''}
                onChange={e => setCustomStart(e.target.value ? new Date(e.target.value) : null)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Date de fin"
                type="date"
                value={customEnd ? customEnd.toISOString().slice(0, 10) : ''}
                onChange={e => setCustomEnd(e.target.value ? new Date(e.target.value) : null)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6} md={period === 'custom' ? 3 : 9}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Période analysée: <strong>{getPeriodLabel(period, customStart, customEnd)}</strong>
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * Composant pour les filtres de contexte et service
 */
interface ChipFiltersProps {
  title: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

const ChipFilters: React.FC<ChipFiltersProps> = ({
  title,
  options,
  selectedValues,
  onChange
}) => {
  const handleClearAll = () => {
    onChange([]);
  };

  const handleToggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <Grid item xs={12}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">{title}</Typography>
        {selectedValues.length > 0 && (
          <Button 
            startIcon={<ClearIcon />} 
            size="small"
            onClick={handleClearAll}
          >
            Effacer ({selectedValues.length})
          </Button>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            variant={selectedValues.includes(option.value) ? "filled" : "outlined"}
            onClick={() => handleToggleValue(option.value)}
            color={selectedValues.includes(option.value) ? "primary" : "default"}
            sx={{ m: 0.5 }}
          />
        ))}
      </Box>
    </Grid>
  );
};

/**
 * Page principale des statistiques
 */
export default function StatsPage() {
  // États pour les données
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les filtres
  const [period, setPeriod] = useState<DatePeriod>('month');
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [itemType, setItemType] = useState<'all' | ItemType>('all');
  const [loanStatus, setLoanStatus] = useState<'all' | LoanStatus>('all');
  const [operationType, setOperationType] = useState<'all' | 'loans' | 'reservations'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [contextFilters, setContextFilters] = useState<string[]>([]);
  const [serviceFilters, setServiceFilters] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // États pour les notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsData, usersData, loansData, reservationsResponse] = await Promise.all([
          fetch('/api/items').then(res => res.json()),
          fetch('/api/users').then(res => res.json()),
          fetch('/api/loans').then(res => res.json()),
          fetch('/api/reservations')
        ]);

        if (!reservationsResponse.ok) {
          throw new Error(`Erreur lors de la récupération des réservations: ${reservationsResponse.statusText}`);
        }

        const reservationsData = await reservationsResponse.json();

        setItems(itemsData);
        setUsers(usersData);
        setLoans(loansData.map((loan: any) => ({
          ...loan,
          borrowedAt: new Date(loan.borrowedAt),
          dueAt: new Date(loan.dueAt),
          returnedAt: loan.returnedAt ? new Date(loan.returnedAt) : undefined
        })));
        setReservations(Array.isArray(reservationsData) ? reservationsData.map((reservation: any) => ({
          ...reservation,
          startDate: new Date(reservation.startDate),
          endDate: new Date(reservation.endDate),
          createdAt: new Date(reservation.createdAt),
          updatedAt: new Date(reservation.updatedAt)
        })) : []);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setSnackbarMessage("Erreur lors du chargement des données");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Utilisation des hooks personnalisés
  const loanFilters = useMemo(() => ({
    period,
    customStart,
    customEnd,
    itemType,
    status: loanStatus,
    userId: selectedUser?.id || null,
    contexts: contextFilters as LoanContext[],
    services: serviceFilters as ServiceCategory[],
    operationType
  }), [
    period, customStart, customEnd, itemType, 
    loanStatus, selectedUser, contextFilters, serviceFilters,
    operationType
  ]);

  const reservationFilters = useMemo(() => ({
    period,
    customStart,
    customEnd,
    itemType,
    status: loanStatus,
    userId: selectedUser?.id || null,
    services: serviceFilters as ServiceCategory[],
    operationType
  }), [
    period, customStart, customEnd, itemType, 
    loanStatus, selectedUser, serviceFilters,
    operationType
  ]);

  const filteredLoans = useLoanFilters(loans, items, loanFilters);
  const filteredReservations = useReservationFilters(reservations, items, reservationFilters);
  const globalStats = useGlobalStats(items, loans, users);
  const durations = useLoanDurations(filteredLoans, items);

  // Configuration de l'export Excel
  const exportConfig = useMemo(() => ({
    filename: `Statistiques_Cikatio_${formatDateToLocal(new Date())}`,
    period,
    customStart,
    customEnd
  }), [period, customStart, customEnd]);

  const { isExporting, exportData } = useExcelExport(
    filteredLoans,
    items,
    users,
    globalStats,
    exportConfig,
    filteredReservations
  );

  // Gestionnaires d'événements
  const handleResetFilters = useCallback(() => {
    setPeriod('month');
    setCustomStart(null);
    setCustomEnd(null);
    setItemType('all');
    setLoanStatus('all');
    setSelectedUser(null);
    setContextFilters([]);
    setServiceFilters([]);
  }, []);

  const handleExport = useCallback(() => {
    exportData().catch(error => {
      setSnackbarMessage("Erreur lors de l'export Excel");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    });
  }, [exportData]);

  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvancedFilters(prev => !prev);
  }, []);

  // Calcul du nombre total de filtres appliqués
  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    if (itemType !== 'all') count++;
    if (loanStatus !== 'all') count++;
    if (selectedUser) count++;
    if (operationType !== 'all') count++;
    count += contextFilters.length;
    count += serviceFilters.length;
    return count;
  }, [itemType, loanStatus, selectedUser, contextFilters, serviceFilters, operationType]);

  const hasFilters = appliedFiltersCount > 0;

  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  return (
    <MainLayout>
      <PageTitle
        title="Statistiques"
        subtitle="Exportez un rapport statistique détaillé sur les prêts, usagers et items"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Filtres principaux toujours visibles */}
          <PeriodFilter
            period={period}
            setPeriod={setPeriod}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
          />

          {/* Filtres avancés dans un accordéon */}
          <Accordion 
            expanded={showAdvancedFilters}
            onChange={toggleAdvancedFilters}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterIcon sx={{ mr: 1 }} />
                <Typography>Filtres avancés</Typography>
                {hasFilters && (
                  <Chip 
                    size="small" 
                    label={`${appliedFiltersCount} appliqué(s)`} 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="operation-type-label">Type d'opération</InputLabel>
                    <Select
                      labelId="operation-type-label"
                      value={operationType}
                      label="Type d'opération"
                      onChange={e => setOperationType(e.target.value as 'all' | 'loans' | 'reservations')}
                    >
                      <MenuItem value="all">Tous</MenuItem>
                      <MenuItem value="loans">Prêts</MenuItem>
                      <MenuItem value="reservations">Réservations</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="item-type-label">Type d'item</InputLabel>
                    <Select
                      labelId="item-type-label"
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
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="loan-status-label">Statut du prêt</InputLabel>
                    <Select
                      labelId="loan-status-label"
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
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="user-label">Usager</InputLabel>
                    <Select
                      labelId="user-label"
                      value={selectedUser ? selectedUser.id : 'all'}
                      label="Usager"
                      onChange={(e) => {
                        if (e.target.value === 'all') {
                          setSelectedUser(null);
                        } else {
                          const user = users.find(u => u.id === e.target.value);
                          setSelectedUser(user || null);
                        }
                      }}
                    >
                      <MenuItem value="all">Tous</MenuItem>
                      {users.map(user => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
            
                {/* Section des contextes et services avec le composant ChipFilters */}
                <ChipFilters
                  title="Contextes de demande"
                  options={[
                    { value: 'CONFERENCE_FINANCEURS', label: 'Conférence des financeurs' },
                    { value: 'APPUIS_SPECIFIQUES', label: 'Appuis spécifiques' },
                    { value: 'PLATEFORME_AGEFIPH', label: 'Plateforme Agefiph' },
                    { value: 'FORMATION', label: 'Formation' },
                    { value: 'ACCOMPAGNEMENT', label: 'Accompagnement' },
                    { value: 'AUTRE', label: 'Autre' }
                  ]}
                  selectedValues={contextFilters}
                  onChange={setContextFilters}
                />

                <ChipFilters
                  title="Services"
                  options={[
                    { value: 'RUNE', label: 'RUNE' },
                    { value: 'SAVS', label: 'SAVS' },
                    { value: 'CICAT', label: 'CICAT' },
                    { value: 'PNT', label: 'PNT' }
                  ]}
                  selectedValues={serviceFilters}
                  onChange={setServiceFilters}
                />
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Actions et résumé */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {loading ? (
                <CircularProgress size={24} sx={{ mr: 2 }} />
              ) : (
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {operationType === 'all' ? (
                    `${filteredLoans.length + filteredReservations.length} opération${filteredLoans.length + filteredReservations.length !== 1 ? 's' : ''} sélectionnée${filteredLoans.length + filteredReservations.length !== 1 ? 's' : ''}`
                  ) : operationType === 'loans' ? (
                    `${filteredLoans.length} prêt${filteredLoans.length !== 1 ? 's' : ''} sélectionné${filteredLoans.length !== 1 ? 's' : ''}`
                  ) : (
                    `${filteredReservations.length} réservation${filteredReservations.length !== 1 ? 's' : ''} sélectionnée${filteredReservations.length !== 1 ? 's' : ''}`
                  )}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                onClick={handleResetFilters}
                disabled={loading || !hasFilters}
              >
                Réinitialiser les filtres
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />} 
                onClick={handleExport}
                disabled={loading || isExporting || (filteredLoans.length === 0 && filteredReservations.length === 0)}
              >
                {isExporting ? 'Exportation...' : 'Exporter vers Excel'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* État de chargement global */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          mt: 4,
          p: 3
        }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Chargement des données...
          </Typography>
        </Box>
      )}

      {/* Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
}