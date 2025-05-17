import React from 'react';
import { Grid } from '@mui/material';
import {
  LibraryAdd as LibraryAddIcon, 
  AddToQueue as AddToQueueIcon, 
  PostAdd as PostAddIcon 
} from '@mui/icons-material';
import DashboardCard from '@/components/common/DashboardCard';

const QuickActions = () => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={4}>
      <DashboardCard
        type="action"
        title="Ajouter un livre"
        subtitle="Créer une nouvelle fiche livre"
        icon={<LibraryAddIcon fontSize="large" />}
        iconColor="primary.main"
        link="/items?action=add&category=BOOK"
      />
    </Grid>
    <Grid item xs={12} sm={4}>
      <DashboardCard
        type="action"
        title="Ajouter du matériel"
        subtitle="Créer une fiche matériel"
        icon={<AddToQueueIcon fontSize="large" />}
        iconColor="secondary.main"
        link="/items?action=add&category=EQUIPMENT"
      />
    </Grid>
    <Grid item xs={12} sm={4}>
      <DashboardCard
        type="action"
        title="Enregistrer un prêt"
        subtitle="Nouvel emprunt de livre ou matériel"
        icon={<PostAddIcon fontSize="large" />}
        iconColor="info.main"
        link="/loans?action=add"
      />
    </Grid>
  </Grid>
);

export default QuickActions;
