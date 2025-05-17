import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Card,
  CardHeader,
  CardContent,
  Divider,
  TextField,
  Box,
  Button,
  Chip,
  Typography
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import * as XLSX from 'xlsx';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string | React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  filename?: string;
  emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  filename = 'export',
  emptyMessage = "Aucune donnée disponible"
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Gestion de la pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Fonction de recherche
  const filteredData = data.filter(item => {
    if (!searchTerm.trim()) return true;
    
    return columns.some(column => {
      const value = item[column.id];
      if (value === null || value === undefined) return false;
      
      return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Fonction d'export en Excel
  const handleExport = () => {
    const exportData = [
      columns.map(col => col.label),
      ...filteredData.map(row => 
        columns.map(col => {
          const value = row[col.id];
          if (React.isValidElement(value)) {
            // Si c'est un composant React, on récupère son texte ou une valeur par défaut
            return value.props.children || value.props.label || '';
          }
          return value;
        })
      )
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Données');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <Card>
      <CardHeader 
        title={title}
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={filteredData.length === 0}
            >
              Exporter
            </Button>
          </Box>
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label={`${title} table`}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    style={{ minWidth: column.minWidth || 'auto' }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align || 'left'}>
                            {column.format ? column.format(value) : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </CardContent>
    </Card>
  );
};

export default DataTable;