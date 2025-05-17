import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Assignment as LoanIcon,
  Book as BookIcon,
  Inventory as EquipmentIcon,
  AccessTime as TimeIcon,
  Warning as OverdueIcon,
  CheckCircle as ReturnedIcon,
  Person as UserIcon
} from '@mui/icons-material';
import { GlobalStats, Item, Loan, User, ItemType, LoanStatus } from './types';
import { ServiceCategory, LoanContext } from '@/types';

interface StatsOverviewProps {
  items: Item[];
  loans: Loan[];
  users: User[];
  periodLabel: string;
  isLoading?: boolean;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subStats?: { label: string; value: string | number; color?: string }[];
}

// Carte de statistique individuelle
const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, subStats }) => (
  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{ 
        p: 1, 
        borderRadius: '50%', 
        bgcolor: `${color}.light`,
        color: `${color}.main`,
        mr: 2 
      }}>
        {icon}
      </Box>
      <Typography variant="body1" color="text.secondary">{title}</Typography>
    </Box>
    <Typography variant="h4" sx={{ mb: 1 }}>{value}</Typography>
    {subStats && (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {subStats.map((stat, index) => (
          <Chip 
            key={index} 
            label={`${stat.label}: ${stat.value}`} 
            size="small"
            color={stat.color as any || "default"}
            variant="outlined"
          />
        ))}
      </Box>
    )}
  </Paper>
);

// Composant principal de synthèse des statistiques
const StatsOverview: React.FC<StatsOverviewProps> = ({ 
  items, 
  loans, 
  users, 
  periodLabel,
  isLoading = false
}) => {
  // Si les données sont en cours de chargement, afficher un indicateur
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calcul des statistiques de base
  const totalItems = items.length;
  const totalLoans = loans.length;
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;
  const overdueLoans = loans.filter(l => l.status === 'OVERDUE').length;
  const returnedLoans = loans.filter(l => l.status === 'RETURNED').length;
  const lostLoans = loans.filter(l => l.status === 'LOST').length;
  
  // Calcul des durées d'emprunt
  const completedLoans = loans.filter(l => l.returnedAt);
  let avgLoanDuration = 0;
  let maxLoanDuration = 0;
  let maxLoanDurationItem = '';
  
  if (completedLoans.length > 0) {
    const durations = completedLoans.map(loan => {
      const borrowedDate = new Date(loan.borrowedAt);
      const returnedDate = new Date(loan.returnedAt as Date);
      const diffTime = returnedDate.getTime() - borrowedDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > maxLoanDuration) {
        maxLoanDuration = diffDays;
        const item = items.find(i => i.id === loan.itemId);
        maxLoanDurationItem = item ? item.name : 'Inconnu';
      }
      
      return diffDays;
    });
    
    avgLoanDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Statistiques par type d'item
  const bookItems = items.filter(i => i.category === 'BOOK').length;
  const equipmentItems = items.filter(i => i.category === 'EQUIPMENT').length;
  const bookLoans = loans.filter(l => {
    const item = items.find(i => i.id === l.itemId);
    return item?.category === 'BOOK';
  }).length;
  const equipmentLoans = loans.filter(l => {
    const item = items.find(i => i.id === l.itemId);
    return item?.category === 'EQUIPMENT';
  }).length;

  // Statistiques d'utilisateurs
  const activeUsers = new Set(loans.filter(l => 
    l.status === 'ACTIVE' || l.status === 'OVERDUE'
  ).map(l => l.borrowerId)).size;
  
  const topUsers = Array.from(
    loans.reduce((acc, loan) => {
      const count = acc.get(loan.borrowerId) || 0;
      acc.set(loan.borrowerId, count + 1);
      return acc;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Calcul des durées de retard
  const overdueLoansData = loans.filter(l => l.status === 'OVERDUE');
  let avgOverdueDays = 0;
  
  if (overdueLoansData.length > 0) {
    const today = new Date();
    const overdueDays = overdueLoansData.map(loan => {
      const dueDate = new Date(loan.dueAt);
      const diffTime = today.getTime() - dueDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });
    
    avgOverdueDays = overdueDays.reduce((a, b) => a + b, 0) / overdueDays.length;
  }

  // Statistiques par service
  const loansByService = loans.reduce((acc, loan) => {
    const item = items.find(i => i.id === loan.itemId);
    if (!item) return acc;
    
    const service = item.serviceCategory || 'Non défini';
    if (!acc[service]) {
      acc[service] = { total: 0, active: 0, overdue: 0 };
    }
    
    acc[service].total++;
    if (loan.status === 'ACTIVE') acc[service].active++;
    if (loan.status === 'OVERDUE') acc[service].overdue++;
    
    return acc;
  }, {} as Record<string, { total: number, active: number, overdue: number }>);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Synthèse pour la période : {periodLabel}
      </Typography>

      {/* Première ligne : Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total des prêts"
            value={totalLoans}
            icon={<LoanIcon />}
            color="primary"
            subStats={[
              { label: "En cours", value: activeLoans, color: "primary" },
              { label: "En retard", value: overdueLoans, color: "error" },
              { label: "Retournés", value: returnedLoans, color: "success" }
            ]}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Durée moyenne"
            value={`${Math.round(avgLoanDuration)} jours`}
            icon={<TimeIcon />}
            color="secondary"
            subStats={[
              { label: "Retard moyen", value: `${Math.round(avgOverdueDays)} jours` },
              { label: "Prêt le plus long", value: `${maxLoanDuration} jours` }
            ]}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Types d'items"
            value={totalItems}
            icon={<EquipmentIcon />}
            color="info"
            subStats={[
              { label: "Livres", value: `${bookItems} (${Math.round(bookItems/totalItems*100)}%)` },
              { label: "Équipements", value: `${equipmentItems} (${Math.round(equipmentItems/totalItems*100)}%)` }
            ]}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Utilisateurs"
            value={users.length}
            icon={<UserIcon />}
            color="success"
            subStats={[
              { label: "Actifs", value: activeUsers },
              { label: "Taux", value: `${Math.round(activeUsers/users.length*100)}%` }
            ]}
          />
        </Grid>
      </Grid>

      {/* Deuxième ligne : Tableaux de statistiques */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Répartition par service</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell align="right">Prêts</TableCell>
                    <TableCell align="right">En cours</TableCell>
                    <TableCell align="right">En retard</TableCell>
                    <TableCell align="right">% du total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(loansByService)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([service, data]) => (
                      <TableRow key={service} hover>
                        <TableCell>{service}</TableCell>
                        <TableCell align="right">{data.total}</TableCell>
                        <TableCell align="right">{data.active}</TableCell>
                        <TableCell align="right">{data.overdue}</TableCell>
                        <TableCell align="right">
                          {`${Math.round(data.total / totalLoans * 100)}%`}
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Utilisateurs les plus actifs</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell align="right">Nombre de prêts</TableCell>
                    <TableCell align="right">% du total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topUsers.map(([userId, count]) => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <TableRow key={userId} hover>
                        <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                        <TableCell align="right">{count}</TableCell>
                        <TableCell align="right">
                          {`${Math.round(count / totalLoans * 100)}%`}
                        </TableCell>
                      </TableRow>
                    ) : null;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatsOverview;