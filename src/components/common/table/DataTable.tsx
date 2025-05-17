import React, { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  Typography,
  CircularProgress,
  SxProps,
  Theme
} from '@mui/material';

interface DataTableProps<T> {
  data: T[];
  totalCount: number;
  columns: ReactNode;
  renderRow: (item: T, index: number) => ReactNode;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  emptyMessage?: string;
  paperProps?: SxProps<Theme>;
  tableProps?: SxProps<Theme>;
  rowsPerPageOptions?: number[];
}

/**
 * Composant générique de tableau avec pagination
 */
function DataTable<T>({
  data,
  totalCount,
  columns,
  renderRow,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  emptyMessage = "Aucune donnée disponible",
  paperProps,
  tableProps,
  rowsPerPageOptions = [5, 10, 25, 50]
}: DataTableProps<T>) {
  return (
    <TableContainer component={Paper} sx={{ mb: 4, ...paperProps }}>
      <Table sx={{ minWidth: 650, ...tableProps }} aria-label="tableau de données">
        <TableHead>
          <TableRow>
            {columns}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={100} align="center" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Chargement des données...
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : data.length > 0 ? (
            data.map((item, index) => renderRow(item, index))
          ) : (
            <TableRow>
              <TableCell colSpan={100} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage="Lignes par page :"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
        }
      />
    </TableContainer>
  );
}

export default DataTable;