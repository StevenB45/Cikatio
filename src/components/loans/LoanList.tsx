import React, { useMemo } from 'react';
import { 
  TableRow, 
  TableCell, 
  Typography,
  Button,
  Box
} from '@mui/material';
import { 
  Assignment as AssignmentIcon, 
  Warning as WarningIcon, 
  History as HistoryIcon,
  KeyboardReturn as ReturnIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Loan, Item, User } from '@/types';
import { StatusBadge } from '@/components/items/statusBadges';
import { ItemTypeChip } from '@/components/common';
import { DataTable, SortableTableHeader } from '@/components/common/table';

interface LoanListProps {
  loans: Loan[];
  items: Item[];
  users: User[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  handleSort: (property: string) => void;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onItemClick: (item: Item) => void;
  onUserClick: (user: User) => void;
  onHistoryClick: (loan: Loan) => void;
  onReturnClick: (loan: Loan) => void;
  onShowAgreementClick: (loan: Loan) => void;
}

export const LoanList: React.FC<LoanListProps> = ({
  loans,
  items,
  users,
  sortBy,
  sortDirection,
  handleSort,
  page,
  rowsPerPage,
  totalCount,
  handleChangePage,
  handleChangeRowsPerPage,
  onItemClick,
  onUserClick,
  onHistoryClick,
  onReturnClick,
  onShowAgreementClick
}) => {
  // Gestionnaire pour afficher le statut correct
  const getLoanStatus = (loan: Loan) => {
    if (loan.status === 'RETURNED') return 'RETURNED';
    
    const dueDate = new Date(loan.dueAt);
    if (dueDate < new Date()) return 'OVERDUE';
    return 'ACTIVE';
  };

  // Obtenir le bon statut pour chaque prêt
  const loansWithCorrectStatus = useMemo(() => 
    loans.map(loan => ({
      ...loan,
      displayStatus: getLoanStatus(loan)
    })),
  [loans]);

  // Colonnes du tableau
  const columns = [
    { 
      id: 'item', 
      label: 'Item', 
      sortable: true,
      width: '25%' 
    },
    { 
      id: 'borrower', 
      label: 'Emprunteur', 
      sortable: true,
      width: '20%' 
    },
    { 
      id: 'borrowedAt', 
      label: 'Emprunté le', 
      sortable: true,
      width: '15%' 
    },
    { 
      id: 'dueAt', 
      label: 'Date de retour', 
      sortable: true,
      width: '15%' 
    },
    { 
      id: 'status', 
      label: 'Statut', 
      sortable: true,
      width: '10%' 
    },
    { 
      id: 'actions', 
      label: 'Actions', 
      sortable: false,
      width: '15%' 
    },
  ];

  // Fonction pour rendre l'en-tête du tableau
  const renderTableHeader = () => (
    <SortableTableHeader
      columns={columns}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSort={handleSort}
    />
  );

  // Fonction pour rendre les lignes du tableau
  const renderTableRows = () => {
    return loansWithCorrectStatus.map((loan) => {
      const item = items.find(i => i.id === loan.itemId);
      const itemType = item?.type || 'BOOK';
      const isOverdue = loan.displayStatus === 'OVERDUE';
      const isActive = loan.status === 'ACTIVE' || loan.displayStatus === 'OVERDUE';

      return (
        <TableRow 
          key={loan.id}
          hover
          sx={isOverdue ? { backgroundColor: 'rgba(255, 0, 0, 0.05)' } : {}}
        >
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ItemTypeChip type={itemType} sx={{ mr: 1 }} />
              <Typography 
                variant="body2" 
                component="span" 
                sx={{ 
                  cursor: 'pointer', 
                  '&:hover': { textDecoration: 'underline' }
                }}
                onClick={() => item && onItemClick(item)}
              >
                {item ? item.name : 'Item inconnu'}
              </Typography>
            </Box>
          </TableCell>

          <TableCell>
            <Typography 
              variant="body2" 
              component="span" 
              sx={{ 
                cursor: 'pointer', 
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => loan.borrower && onUserClick(loan.borrower)}
            >
              {loan.borrower
                ? `${loan.borrower.lastName} ${loan.borrower.firstName}`
                : 'Utilisateur inconnu'}
            </Typography>
          </TableCell>

          <TableCell>
            <Typography variant="body2">
              {format(new Date(loan.borrowedAt), 'dd/MM/yyyy', { locale: fr })}
            </Typography>
          </TableCell>

          <TableCell>
            <Typography variant="body2">
              {loan.status === 'RETURNED' && loan.returnedAt
                ? format(new Date(loan.returnedAt), 'dd/MM/yyyy', { locale: fr })
                : format(new Date(loan.dueAt), 'dd/MM/yyyy', { locale: fr })}
            </Typography>
          </TableCell>

          <TableCell>
            <StatusBadge status={loan.displayStatus} />
          </TableCell>

          <TableCell>
            <Box sx={{ display: 'flex' }}>
              <Button
                size="small"
                onClick={() => onHistoryClick(loan)}
                sx={{ minWidth: 'auto', p: 0.5, mr: 1 }}
                title="Historique"
              >
                <HistoryIcon fontSize="small" />
              </Button>
              
              <Button
                size="small"
                onClick={() => onShowAgreementClick(loan)}
                sx={{ minWidth: 'auto', p: 0.5, mr: 1 }}
                title="Convention de prêt"
              >
                <AssignmentIcon fontSize="small" />
              </Button>
              
              {isActive && (
                <Button
                  size="small"
                  color={isOverdue ? "error" : "primary"}
                  onClick={() => onReturnClick(loan)}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                  title="Retourner l'item"
                >
                  <ReturnIcon fontSize="small" />
                </Button>
              )}
              
              {isOverdue && (
                <Button
                  size="small"
                  color="error"
                  sx={{ minWidth: 'auto', p: 0.5, ml: 1 }}
                  title="En retard"
                >
                  <WarningIcon fontSize="small" />
                </Button>
              )}
            </Box>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <DataTable
      headerComponent={renderTableHeader}
      rowsComponent={renderTableRows}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      emptyMessage="Aucun prêt trouvé"
    />
  );
};

export default LoanList;