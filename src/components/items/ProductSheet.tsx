import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Chip,
  Typography,
  Box,
  TablePagination,
  Tabs,
  Tab
} from '@mui/material';
import {
  History as HistoryIcon
} from '@mui/icons-material';
import { getStatusBadgeProps } from './statusBadges';
import type { Item, User, Loan, StatusType } from '@/types';
import { HistoryTable } from './HistoryTable';
import { StatusBadge } from './statusBadges';
import DialogLayout from '../layout/DialogLayout';
import UserSheet from '../users/UserSheet';
import { getUserHistory } from '@/lib/getUserHistory';
import { HistoryPanel } from '@/components/common';
import { useHistory } from '@/lib/context';
import { formatDate } from '@/lib/utils';

interface ProductSheetProps {
  open: boolean;
  item: Item | null;
  onClose: () => void;
  history?: Array<{
    action: string;
    user: string;
    userObj?: User;
    date: string | Date;
    status?: StatusType;
    returnedAt?: string | Date | null;
    [key: string]: any;
  }>;
  getHistory?: (itemId: string) => Promise<any[]> | any[];
  dialogProps?: any;
}

const ProductSheet: React.FC<ProductSheetProps> = ({ open, item, onClose, history, getHistory, dialogProps }) => {
  const [tabValue, setTabValue] = useState(0);
  const [openUserSheet, setOpenUserSheet] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { loadItemHistory, isLoading } = useHistory();

  useEffect(() => {
    setTabValue(0);
    // Si on ouvre la fiche et qu'un item est sélectionné, précharger son historique
    if (open && item) {
      loadItemHistory(item.id);
    }
  }, [item, open, loadItemHistory]);

  if (!item) return null;

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
          {item.category === 'BOOK' && item.coverImageUrl && (typeof item.coverImageUrl === 'string') && item.coverImageUrl.trim() && (
            <Box sx={{ mr: 2, minWidth: 80, minHeight: 110, display: { xs: 'none', sm: 'block' } }}>
              <Box
                component="img"
                src={item.coverImageUrl}
                alt={item.name}
                sx={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 1, boxShadow: 2, bgcolor: '#f5f5f5' }}
                onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/file.svg'; }}
              />
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5, wordBreak: 'break-word' }}>{item.name}</Typography>
            <Chip
              label={item.category === 'BOOK' ? 'Livre' : 'Matériel'}
              color={item.category === 'BOOK' ? 'primary' : 'secondary'}
              size="small"
              sx={{ mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ display: 'inline' }}>
              Code barre : <strong>{item.customId}</strong>
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
          aria-label="onglets fiche produit"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Détails" id="tab-0" aria-controls="tabpanel-0" />
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
              {item.description && (
                <Typography variant="body2">Description : <strong>{item.description}</strong></Typography>
              )}
              {/* Afficher la catégorie de service si disponible */}
              {item.serviceCategory && (
                <Typography variant="body2">Catégorie de service : <strong>{item.serviceCategory}</strong></Typography>
              )}
              {item.category === 'BOOK' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="body2">Auteur : <strong>{item.author || '-'}</strong></Typography>
                  <Typography variant="body2">ISBN : <strong>{item.isbn || '-'}</strong></Typography>
                  <Typography variant="body2">Éditeur : <strong>{item.publisher || '-'}</strong></Typography>
                  <Typography variant="body2">Année : <strong>{item.yearPublished || '-'}</strong></Typography>
                </Box>
              )}
              {item.category === 'EQUIPMENT' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="body2">Marque : <strong>{item.brand || '-'}</strong></Typography>
                  <Typography variant="body2">Modèle : <strong>{item.model || '-'}</strong></Typography>
                  <Typography variant="body2">Numéro de série : <strong>{item.serialNumber || '-'}</strong></Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body2">Statut :</Typography>
                <StatusBadge status={item.reservationStatus as StatusType} />
              </Box>
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
              type="item" 
              id={item.id} 
              title={`Historique de ${item.name}`} 
              maxHeight="100%" 
              showPerformedBy={true}
            />
          </Box>
        )}
      </div>

      <UserSheet open={openUserSheet} user={selectedUser} onClose={() => setOpenUserSheet(false)} getHistory={getUserHistory} />
    </DialogLayout>
  );
};

export default ProductSheet;
