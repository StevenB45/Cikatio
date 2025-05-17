import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Box 
} from '@mui/material';
import {
  CheckCircleOutline as ReturnIcon,
  BookmarkBorder as ReservationIcon,
  HistoryToggleOff as HistoryIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { StatusBadge } from './statusBadges';

export interface HistoryRow {
  // Ajoute une index signature pour permettre l'accès dynamique dans le tri
  [key: string]: any;
  action: string;
  itemName: string;
  itemId: string;
  date: string;
  endDate?: string; // Ajout de la date de fin pour les réservations
  dueDate?: string; // Ajout de la date d'échéance pour les prêts
  status: string;
  statusLabel?: string;
  statusColor?: string;
  statusIcon?: React.ReactElement;
  returnedAt?: string | null;
  rawStatus?: string; // Ajout du champ rawStatus qui contient la valeur brute du statut
  type?: string; // Type d'événement (loan, reservation, loan_status_change, etc.)
  comment?: string; // Commentaire associé à l'événement
}

interface HistoryTableProps {
  rows: HistoryRow[];
  columns?: Array<'action'|'user'|'itemName'|'date'|'endDate'|'dueDate'|'status'|'returnedAt'>;
  emptyText?: string;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ rows, columns = ['action','user','date','status','returnedAt'], emptyText }) => {
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (!rows || rows.length === 0) {
    return <Typography variant="body2" color="text.secondary">{emptyText || 'Aucune action trouvée.'}</Typography>;
  }

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDirection('asc');
    }
  };

  // Fonction pour obtenir une icône en fonction de l'action
  const getActionIcon = (row: HistoryRow) => {
    const action = row.action?.toLowerCase() || '';
    
    // Détecter les retours de prêts
    if (action.includes('retour') || (row.status === 'RETURNED')) {
      return <ReturnIcon color="success" />;
    }
    
    // Détecter les réservations
    if (action.includes('réservation')) {
      return <ReservationIcon color="primary" />;
    }
    
    // Pour les prêts programmés
    if (action.includes('programmé') || row.status === 'SCHEDULED') {
      return <CalendarIcon color="info" />;
    }
    
    // Par défaut
    return <HistoryIcon color="action" />;
  };

  const sortedRows = [...rows].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';
    if (sortBy === 'date' || sortBy === 'returnedAt' || sortBy === 'endDate' || sortBy === 'dueDate') {
      // Dates au format DD/MM/YYYY ou '-'
      const parseDate = (d: string) => {
        if (!d || d === '-') return 0;
        const [day, month, year] = d.split('/').map(Number);
        return new Date(year, month - 1, day).getTime();
      };
      aValue = parseDate(aValue);
      bValue = parseDate(bValue);
    } else {
      aValue = (aValue || '').toString().toLowerCase();
      bValue = (bValue || '').toString().toLowerCase();
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.includes('action') && (
              <TableCell onClick={() => handleSort('action')} style={{ cursor: 'pointer' }}>
                Action {sortBy === 'action' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
            )}
            {columns.includes('user') && (
              <TableCell onClick={() => handleSort('user')} style={{ cursor: 'pointer' }}>
                Utilisateur {sortBy === 'user' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
            )}
            {columns.includes('itemName') && (
              <TableCell onClick={() => handleSort('itemName')} style={{ cursor: 'pointer' }}>
                Item {sortBy === 'itemName' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
            )}
            {columns.includes('date') && (
              <TableCell onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                Date {sortBy === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
            )}
            {columns.includes('endDate') && (
              <TableCell onClick={() => handleSort('endDate')} style={{ cursor: 'pointer' }}>
                Date fin {sortBy === 'endDate' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
            )}
            {columns.includes('dueDate') && (
              <TableCell onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>
                Date de retour prévue {sortBy === 'dueDate' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
            )}
            {columns.includes('status') && (
              <TableCell onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                Statut {sortBy === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
            )}
            {columns.includes('returnedAt') && (
              <TableCell onClick={() => handleSort('returnedAt')} style={{ cursor: 'pointer' }}>
                Retour {sortBy === 'returnedAt' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRows.map((row, idx) => (
            <TableRow 
              key={idx}
              // Mettre en évidence les lignes correspondant aux retours
              sx={{ 
                backgroundColor: row.action?.toLowerCase().includes('retour') || row.status === 'RETURNED' 
                  ? 'rgba(76, 175, 80, 0.08)' // Teinte légère de vert pour les retours
                  : 'inherit'
              }}
            >
              {columns.includes('action') && (
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getActionIcon(row)}
                    <Typography variant="body2">{row.action}</Typography>
                  </Box>
                </TableCell>
              )}
              {columns.includes('user') && <TableCell>{row.user || ''}</TableCell>}
              {columns.includes('itemName') && <TableCell>{row.itemName || ''}</TableCell>}
              {columns.includes('date') && <TableCell>{row.date}</TableCell>}
              {columns.includes('endDate') && <TableCell>{row.endDate || ''}</TableCell>}
              {columns.includes('dueDate') && <TableCell>{row.dueDate || ''}</TableCell>}
              {columns.includes('status') && (
                <TableCell>
                  <StatusBadge 
                    status={row.rawStatus || row.status} 
                    sx={{ minWidth: 'auto', maxWidth: 'none', width: 'auto' }}
                  />
                  {row.comment && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {row.comment}
                    </Typography>
                  )}
                </TableCell>
              )}
              {columns.includes('returnedAt') && (
                <TableCell>
                  {row.returnedAt && (
                    <StatusBadge 
                      status="RETURNED"
                      label={`Retourné le ${row.returnedAt}`}
                      sx={{ minWidth: 'auto', maxWidth: 'none', width: 'auto' }}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
