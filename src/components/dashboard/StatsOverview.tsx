import React from 'react';
import { Grid } from '@mui/material';
import StatCard from './StatCard';
import {
  Book as BookIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';

// Define the stats structure expected by this component
interface DashboardStats {
  books: number;
  booksBorrowed: number;
  equipment: number;
  equipmentBorrowed: number;
  users: number;
  newUsers: number;
  activeLoans: number;
  overdue: number;
}

interface StatsOverviewProps {
  stats: DashboardStats;
}

const StatsOverview = ({ stats }: StatsOverviewProps) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6} md={3}>
      <StatCard 
        title="Livres" 
        value={stats.books.toString()} 
        icon={<BookIcon />} 
        color="primary.main" 
        subtitle={`${stats.booksBorrowed} actuellement en prêt`}
        link="/items?category=BOOK"
      />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <StatCard 
        title="Matériel" 
        value={stats.equipment.toString()} 
        icon={<InventoryIcon />} 
        color="secondary.main" 
        subtitle={`${stats.equipmentBorrowed} actuellement en prêt`}
        link="/items?category=EQUIPMENT"
      />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <StatCard 
        title="Utilisateurs" 
        value={stats.users.toString()} 
        icon={<PeopleIcon />} 
        color="success.main" 
        subtitle={`${stats.newUsers} nouveaux cette semaine`}
        link="/users"
      />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <StatCard 
        title="Prêts en cours" 
        value={stats.activeLoans.toString()} 
        icon={<SwapIcon />} 
        color="warning.main" 
        subtitle={`${stats.overdue} retours en retard`}
        link="/loans?status=ACTIVE"
      />
    </Grid>
  </Grid>
);

export default StatsOverview;
