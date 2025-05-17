import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, TablePagination, Avatar, Button, Typography, Tooltip, Tabs, Tab
} from '@mui/material';
import { 
  Person as PersonIcon, 
  History as HistoryIcon, 
  AdminPanelSettings as AdminIcon,
  Bookmark as BookmarkIcon,
  PriorityHigh as OverdueIcon,
  CheckCircle as ReturnedIcon,
  TimerOutlined as ActiveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { formatDate, calculateAge } from '@/lib/utils';
import type { User } from '@/types';
import { StatusBadge } from '@/components/items/statusBadges';
import { RoleBadge } from '@/components/users/RoleBadge';
import { HistoryTable, HistoryRow } from '@/components/items/HistoryTable';
import DialogLayout from '../layout/DialogLayout';
import { HistoryPanel } from '@/components/common';
import { useHistory } from '@/lib/context';

interface UserSheetProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  getHistory?: (userId: string) => Promise<HistoryRow[]>;
  dialogProps?: any;
}

// Fiche détaillée d'un usager
const UserSheet: React.FC<UserSheetProps> = ({ open, user, onClose, getHistory, dialogProps }) => {
  const [tabValue, setTabValue] = useState(0);
  const { loadUserHistory, isLoading } = useHistory();

  // Charger l'historique au montage si un utilisateur est sélectionné
  useEffect(() => {
    setTabValue(0);
    if (open && user) {
      loadUserHistory(user.id);
    }
  }, [user, open, loadUserHistory]);

  if (!user) return null;

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <DialogLayout
      open={open}
      onClose={onClose}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 64, height: 64, fontSize: 32 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5, wordBreak: 'break-word' }}>{user.firstName} {user.lastName}</Typography>
            <RoleBadge isAdmin={user.isAdmin} />
            <Typography variant="body2" color="text.secondary" sx={{ display: 'inline', ml: 1 }}>
              Email : <strong>{user.email}</strong>
            </Typography>
          </Box>
        </Box>
      }
      actions={<Button onClick={onClose} variant="contained">Fermer</Button>}
      dialogProps={dialogProps}
    >
      <Box sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="onglets fiche utilisateur"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Informations" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Historique" id="tab-1" aria-controls="tabpanel-1" />
        </Tabs>
      </Box>

      <div
        role="tabpanel"
        hidden={tabValue !== 0}
        id="tabpanel-0"
        aria-labelledby="tab-0"
      >
        {tabValue === 0 && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'flex-start' }}>
              <Typography variant="body2">Téléphone : <strong>{user.phone || '-'}</strong></Typography>
              <Typography variant="body2">Adresse : <strong>{user.address || '-'}</strong></Typography>
              {/* Date de naissance et âge */}
              <Typography variant="body2">
                Date de naissance : <strong>{user.dateOfBirth ? formatDate(user.dateOfBirth) : '-'}</strong>
                {user.dateOfBirth && (
                  <span style={{ marginLeft: 8, color: '#888' }}>(Âge : {calculateAge(user.dateOfBirth)} ans)</span>
                )}
              </Typography>
              {/* Département */}
              <Typography variant="body2">
                Département : <strong>{user.departmentCode || '-'}</strong>
              </Typography>
              <Typography variant="body2">Date d'ajout : <strong>{user.createdAt ? formatDate(user.createdAt) : '-'}</strong></Typography>
            </Box>
          </Box>
        )}
      </div>

      <div
        role="tabpanel"
        hidden={tabValue !== 1}
        id="tabpanel-1"
        aria-labelledby="tab-1"
      >
        {tabValue === 1 && (
          <Box sx={{ flex: 1, height: 'calc(80vh - 250px)', overflow: 'auto' }}>
            <HistoryPanel
              type="user"
              id={user.id}
              title={`Historique des emprunts de ${user.firstName} ${user.lastName}`}
              maxHeight="100%"
            />
          </Box>
        )}
      </div>
    </DialogLayout>
  );
};

export default UserSheet;
