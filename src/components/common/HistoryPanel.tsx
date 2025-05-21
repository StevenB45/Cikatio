import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  HistoryOutlined as HistoryIcon,
  CheckCircleOutlined as CheckIcon,
  ErrorOutlineOutlined as ErrorIcon,
  AccessTimeOutlined as PendingIcon,
  EventBusyOutlined as CanceledIcon
} from '@mui/icons-material';
import { useHistory } from '@/lib/context';
import { HistoryItem } from '@/lib/historyUtils';
import { StatusBadge } from '@/components/items/statusBadges';

interface HistoryPanelProps {
  title?: string;
  type: 'item' | 'user';
  id?: string;
  maxHeight?: number | string;
  showPerformedBy?: boolean; // Paramètre pour afficher qui a effectué l'action
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  title = 'Historique', 
  type, 
  id, 
  maxHeight = 400,
  showPerformedBy = true // Activer par défaut l'affichage de l'administrateur qui a effectué l'action
}) => {
  const { itemHistory, userHistory, isLoading, loadItemHistory, loadUserHistory } = useHistory();
  
  // Déterminer l'historique à afficher en fonction du type
  const history = type === 'item' ? itemHistory : userHistory;

  // Charger les données au montage si un ID est fourni
  React.useEffect(() => {
    if (id) {
      if (type === 'item') {
        loadItemHistory(id);
      } else {
        loadUserHistory(id);
      }
    }
  }, [id, type, loadItemHistory, loadUserHistory]);

  // Fonction pour obtenir l'icône en fonction du statut
  const getStatusIcon = (status: string, rawStatus?: string) => {
    const statusLower = (rawStatus || status).toLowerCase();
    
    if (statusLower.includes('returned') || statusLower.includes('retour')) {
      return <CheckIcon color="success" />;
    } else if (statusLower.includes('overdue') || statusLower.includes('retard')) {
      return <ErrorIcon color="error" />;
    } else if (statusLower.includes('cancelled') || statusLower.includes('annul')) {
      return <CanceledIcon color="warning" />;
    } else {
      return <PendingIcon color="primary" />;
    }
  };
  
  // Nouvelle fonction pour formater le texte secondaire de manière compacte
  const formatSecondaryText = (item: HistoryItem) => {
    const parts = [];
    
    // Ajouter le nom de l'item s'il existe
    if (item.itemName) {
      parts.push(item.itemName);
    }
    
    // Ajouter le nom de l'utilisateur s'il existe
    if (item.user) {
      parts.push(item.user);
    }
    
    // Ajouter la date
    if (item.date) {
      parts.push(item.date);
    }
    
    // Ajouter la date de retour si elle existe et n'est pas déjà mentionnée
    if (item.returnedAt && !item.comment?.includes(item.returnedAt) && item.action === 'Retour') {
      parts.push(`Retourné le ${item.returnedAt}`);
    }
    
    // Ajouter l'information sur qui a effectué l'action si elle existe et est demandée
    if (showPerformedBy && item.performedBy && typeof item.performedBy === 'object') {
      const name = `${item.performedBy.firstName} ${item.performedBy.lastName}`.trim();
      if (name && !item.comment?.includes(name)) {
        // Distinction entre emprunt et réservation pour l'affichage
        if (item.action === 'Emprunt' || item.rawStatus === 'ACTIVE') {
          parts.push(`Prêt enregistré par ${name}`);
        } else if (item.action === 'Retour' || item.rawStatus === 'RETURNED') {
          parts.push(`Retour enregistré par ${name}`);
        } else if (item.action.includes('Réservation')) {
          parts.push(`Réservation enregistrée par ${name}`);
        } else {
          parts.push(`Effectué par ${name}`);
        }
      }
    }
    
    // Ajouter le commentaire uniquement s'il apporte une information supplémentaire
    if (item.comment && 
        !item.comment.includes(item.date) &&
        (item.action !== 'Retour' || !item.comment.startsWith('Retourné le'))) {
      parts.push(item.comment);
    }
    
    return parts.join(' - ');
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <HistoryIcon sx={{ mr: 1 }} />
        <Typography variant="h6">{title}</Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      ) : history.length === 0 ? (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Aucun historique disponible
          </Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight, overflow: 'auto' }}>
          <List dense>
            {history.map((item: HistoryItem) => (
              <ListItem 
                key={item.id} 
                divider
                sx={{ 
                  py: 1,
                  backgroundColor: item.rawStatus?.toLowerCase().includes('overdue') 
                    ? 'rgba(255, 0, 0, 0.03)' 
                    : 'transparent'
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getStatusIcon(item.status, item.rawStatus)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {item.action}
                      </Typography>
                      {/* Utiliser StatusBadge au lieu d'un Chip personnalisé */}
                      {item.rawStatus && item.action !== item.status && (
                        <StatusBadge 
                          status={item.rawStatus}
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem', 
                            minWidth: 'auto', 
                            maxWidth: 'none',
                            width: 'auto'
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" noWrap component="div" sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatSecondaryText(item)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default HistoryPanel;