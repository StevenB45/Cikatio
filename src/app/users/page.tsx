'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import UserForm from '@/components/users/UserForm';
import UserSheet from '@/components/users/UserSheet';
import {
  Box, Typography, TextField, Button, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Dialog, DialogContent, DialogTitle,
  InputAdornment, IconButton, Grid, Paper, Chip, Tab, Tabs
} from '@mui/material';
import { 
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, 
  Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon, Home as HomeIcon, 
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor } from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import { getStatusBadgeProps, StatusType } from '@/components/items/statusBadges'; // Importer le helper
import { getUserHistory } from '@/lib/getUserHistory';
import { formatDate, getInitials } from '@/lib/utils';
import { RoleBadge } from '@/components/users/RoleBadge';
import { CommonDialog } from '@/components/common';

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  isAdmin: boolean;
}

// Page de gestion des usagers (utilisateurs)
// Permet la recherche, le tri, l'ajout, la modification et l'affichage détaillé des usagers
// Utilise les données récupérées via API
export default function UsersPage() {
  // État pour les filtres et la pagination
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // État pour le modal d'ajout/édition
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Erreurs de validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);

  const [openUserSheet, setOpenUserSheet] = useState(false);
  const [selectedUserSheet, setSelectedUserSheet] = useState<User | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'success' });

  // Ajout état pour la confirmation de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);

  // Tri des usagers
  const [sortBy, setSortBy] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  const sortedUsers = React.useMemo(() => {
    const usersToSort = [...filteredUsers];
    usersToSort.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      switch (sortBy) {
        case 'lastName':
          aValue = a.lastName + ' ' + a.firstName;
          bValue = b.lastName + ' ' + b.firstName;
          break;
        case 'createdAt':
          aValue = a.createdAt?.getTime?.() || 0;
          bValue = b.createdAt?.getTime?.() || 0;
          break;
        case 'isAdmin':
          aValue = a.isAdmin ? 1 : 0;
          bValue = b.isAdmin ? 1 : 0;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'phone':
          aValue = a.phone;
          bValue = b.phone;
          break;
        default:
          aValue = '';
          bValue = '';
      }
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return usersToSort;
  }, [filteredUsers, sortBy, sortDirection]);

  // Sélection multiple
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const isAllSelected =
    sortedUsers.length > 0 &&
    sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).every(u => selectedUserIds.includes(u.id));
  const isIndeterminate =
    selectedUserIds.length > 0 &&
    !isAllSelected &&
    sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).some(u => selectedUserIds.includes(u.id));

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const pageUserIds = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(u => u.id);
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...pageUserIds])));
    } else {
      const pageUserIds = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(u => u.id);
      setSelectedUserIds(prev => prev.filter(id => !pageUserIds.includes(id)));
    }
  };

  const handleSelectOne = (userId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  // Initialiser le filtre et la recherche à partir des paramètres d'URL
  useEffect(() => {
    // Récupérer les paramètres de la requête URL
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    const searchParam = urlParams.get('search');
    
    // Si un paramètre de rôle est défini dans l'URL, utiliser cette valeur
    if (roleParam) {
      setRoleFilter(roleParam);
    }
    
    // Si un paramètre de recherche est défini dans l'URL, utiliser cette valeur
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, []);

  // Charger les usagers depuis l'API
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then((data: any[]) => {
        // Les utilisateurs ont déjà firstName et lastName
        const mapped = data.map(u => ({
          ...u,
          phone: u.phone || '',
          address: u.address || '',
          isAdmin: u.isAdmin, // Correction : utiliser la valeur de la BDD
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        }));
        setUsers(mapped);
        setFilteredUsers(mapped);
      });
  }, []);

  // Filtrer les utilisateurs selon les critères
  useEffect(() => {
    let filtered = users;
    
    // Filtre par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        roleFilter === 'admin' ? user.isAdmin : !user.isAdmin
      );
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(query) || 
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.address.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  // Gestionnaires d'événements
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setRoleFilter(newValue);
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestionnaires d'événements pour le modal
  const handleOpenAddDialog = () => {
    setCurrentUser({ isAdmin: false }); // Par défaut, utilisateur standard
    setIsEditing(false);
    setErrors({});
    setOpenUserDialog(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setCurrentUser({ ...user });
    setIsEditing(true);
    setErrors({});
    setOpenUserDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenUserDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({ ...prev, [name]: value }));
    
    // Réinitialiser l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!currentUser.firstName || currentUser.firstName.trim() === '') {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    if (!currentUser.lastName || currentUser.lastName.trim() === '') {
      newErrors.lastName = 'Le nom est requis';
    }
    
    if (!currentUser.email || currentUser.email.trim() === '') {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(currentUser.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!currentUser.phone || currentUser.phone.trim() === '') {
      newErrors.phone = 'Le téléphone est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveUser = async (userData: { firstName: string; lastName: string; email: string; phone: string; address: string; isAdmin: boolean }) => {
    // Afficher les données reçues du formulaire pour débogage
    console.log("Données reçues du formulaire:", userData);
    
    try {
      if (isEditing && currentUser.id) {
        const resp = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...userData, id: currentUser.id })
        });
        if (resp.ok) {
          const updated = await resp.json();
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          setSnackbar({ open: true, message: 'Utilisateur modifié avec succès', severity: 'success' });
        } else {
          const errorText = await resp.text();
          setSnackbar({ open: true, message: `Erreur modification : ${errorText || resp.status}`, severity: 'error' });
        }
      } else {
        const resp = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        if (resp.ok) {
          const created = await resp.json();
          const mapped = {
            ...created,
            phone: created.phone || '',
            address: created.address || '',
            isAdmin: created.isAdmin, // Correction ici : on utilise le booléen isAdmin
            createdAt: created.createdAt ? new Date(created.createdAt) : new Date(),
          };
          setUsers(prev => [...prev, mapped]);
          setSnackbar({ open: true, message: 'Utilisateur créé avec succès', severity: 'success' });
        } else {
          const errorText = await resp.text();
          setSnackbar({ open: true, message: `Erreur création : ${errorText || resp.status}`, severity: 'error' });
        }
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Erreur réseau lors de la sauvegarde de l\'usager.', severity: 'error' });
    }
    handleCloseDialog();
  };

  const handleAskDeleteUser = (id: string) => {
    setUserIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Nouvelle fonction pour confirmer la suppression
  const handleConfirmDeleteUser = async () => {
    if (userIdToDelete === adminId) {
      setSnackbar({ open: true, message: 'Vous ne pouvez pas supprimer votre propre compte.', severity: 'error' });
      setDeleteDialogOpen(false);
      return;
    }
    try {
      const resp = await fetch(`/api/users?id=${userIdToDelete}`, { method: 'DELETE' });
      if (resp.ok) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userIdToDelete));
        setSnackbar({ open: true, message: 'Utilisateur supprimé avec succès', severity: 'success' });
      } else {
        const errorText = await resp.text();
        setSnackbar({ open: true, message: `Erreur lors de la suppression : ${errorText || resp.status}`, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Erreur réseau lors de la suppression.', severity: 'error' });
    }
    setDeleteDialogOpen(false);
    setUserIdToDelete(null);
  };

  const handleCancelDeleteUser = () => {
    setDeleteDialogOpen(false);
    setUserIdToDelete(null);
  };

  // Gérer le changement de rôle
  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentUser(prev => ({ ...prev, isAdmin: e.target.value === 'admin' }));
  };

  // Suppression multiple
  const [deleteManyDialogOpen, setDeleteManyDialogOpen] = useState(false);
  const handleAskDeleteMany = () => setDeleteManyDialogOpen(true);
  const handleCancelDeleteMany = () => setDeleteManyDialogOpen(false);
  const handleConfirmDeleteMany = async () => {
    try {
      // Filtrer pour ne pas supprimer l'utilisateur connecté
      const idsToDelete = selectedUserIds.filter(id => id !== adminId);
      await Promise.all(idsToDelete.map(id =>
        fetch(`/api/users?id=${id}`, { method: 'DELETE' })
      ));
      setUsers(prev => prev.filter(user => !idsToDelete.includes(user.id)));
      setFilteredUsers(prev => prev.filter(user => !idsToDelete.includes(user.id)));
      setSelectedUserIds([]);
      setSnackbar({ open: true, message: 'Usagers supprimés avec succès', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Erreur lors de la suppression multiple.', severity: 'error' });
    }
    setDeleteManyDialogOpen(false);
  };

  // Calcul des compteurs pour les onglets
  const adminCount = users.filter(user => user.isAdmin).length;
  const standardCount = users.filter(user => !user.isAdmin).length;

  // Récupérer l'admin connecté (pour empêcher sa suppression)
  const [adminId, setAdminId] = useState<string | null>(null);
  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        setAdminId(parsed.id);
      } catch {}
    }
  }, []);

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Gestion des Usagers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez les informations de contact des usagers.
        </Typography>
      </Box>

      {/* Filtres et actions */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Rechercher par nom, email, téléphone..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              sx={{ mr: 1 }}
            >
              Ajouter un usager
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={selectedUserIds.length === 0}
              onClick={handleAskDeleteMany}
            >
              Supprimer la sélection
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Onglets filtres par rôle */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={roleFilter} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          aria-label="filtres de rôle"
        >
          <Tab label={`Tous (${users.length})`} value="all" />
          <Tab 
            label={`Utilisateurs (${standardCount})`} 
            value="standard"
            icon={<PersonIcon />}
            iconPosition="start"
          />
          <Tab 
            label={`Administrateurs (${adminCount})`} 
            value="admin"
            icon={<AdminIcon color="info" />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tableau des usagers */}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table sx={{ minWidth: 650 }} aria-label="table des usagers">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  inputProps={{ 'aria-label': 'Sélectionner tous les usagers' }}
                />
              </TableCell>
              <TableCell onClick={() => handleSort('lastName')} style={{ cursor: 'pointer' }}>
                Usager {sortBy === 'lastName' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
              <TableCell onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                Email {sortBy === 'email' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
              <TableCell onClick={() => handleSort('phone')} style={{ cursor: 'pointer' }}>
                Téléphone {sortBy === 'phone' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
              <TableCell onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                Date d'ajout {sortBy === 'createdAt' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
              <TableCell onClick={() => handleSort('isAdmin')} style={{ cursor: 'pointer' }}>
                Rôle {sortBy === 'isAdmin' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow 
                  key={user.id} 
                  hover 
                  selected={selectedUserIds.includes(user.id)}
                  onClick={() => { setSelectedUserSheet(user); setOpenUserSheet(true); }}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onChange={handleSelectOne(user.id)}
                      inputProps={{ 'aria-label': `Sélectionner l'usager ${user.firstName} ${user.lastName}` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: `hsl(${user.firstName.length * 10}, 70%, 60%)`
                        }}
                      >
                        {getInitials(`${user.firstName} ${user.lastName}`)}
                      </Avatar>
                      <div style={{ textAlign: 'left' }}>
                        <Typography variant="body2" fontWeight="medium">{`${user.firstName} ${user.lastName}`}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.address || 'Adresse non renseignée'}
                        </Typography>
                      </div>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <RoleBadge isAdmin={user.isAdmin} />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditDialog(user);
                      }}
                      sx={{ mr: 1 }}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAskDeleteUser(user.id);
                      }}
                      disabled={adminId === user.id}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Aucun usager trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page :"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`}
        />
      </TableContainer>

      {/* Modal d'ajout/édition d'utilisateur */}
      <CommonDialog
        open={openUserDialog}
        onClose={handleCloseDialog}
        title={`${isEditing ? 'Modifier' : 'Ajouter'} un utilisateur`}
        maxWidth="xl"
        dividers={true}
        actions={
          // Pas de boutons standard car UserForm fournit ses propres boutons
          <></>
        }
        dialogProps={{
          PaperProps: { 
            sx: { 
              minWidth: 700, 
              minHeight: 500, 
              width: '90vw', 
              height: '90vh', 
              maxWidth: 'none', 
              maxHeight: 'none' 
            } 
          }
        }}
      >
        <UserForm
          initialFirstName={currentUser.firstName || ''}
          initialLastName={currentUser.lastName || ''}
          initialEmail={currentUser.email || ''}
          initialPhone={currentUser.phone || ''}
          initialAddress={currentUser.address || ''}
          initialIsAdmin={currentUser.isAdmin || false}
          onSubmit={handleSaveUser}
          onCancel={handleCloseDialog}
          submitLabel={isEditing ? 'Mettre à jour' : 'Ajouter'}
        />
      </CommonDialog>

      <UserSheet open={openUserSheet} user={selectedUserSheet as any} onClose={() => setOpenUserSheet(false)} getHistory={getUserHistory} />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert elevation={6} variant="filled" severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>

      {/* Dialog de confirmation de suppression */}
      <CommonDialog
        open={deleteDialogOpen}
        onClose={handleCancelDeleteUser}
        title="Confirmer la suppression"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDeleteUser}
        maxWidth="sm"
        ariaLabelledby="delete-user-dialog-title"
        dialogProps={{ 
          PaperProps: { 
            sx: { 
              '& .MuiButton-containedPrimary': { 
                bgcolor: 'error.main', 
                '&:hover': { 
                  bgcolor: 'error.dark' 
                } 
              } 
            } 
          } 
        }}
      >
        <Typography>Êtes-vous sûr de vouloir supprimer cet utilisateur&nbsp;?</Typography>
      </CommonDialog>

      {/* Dialog de confirmation de suppression multiple */}
      <CommonDialog
        open={deleteManyDialogOpen}
        onClose={handleCancelDeleteMany}
        title="Confirmer la suppression"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDeleteMany}
        maxWidth="sm"
        ariaLabelledby="delete-many-users-dialog-title"
        dialogProps={{ 
          PaperProps: { 
            sx: { 
              '& .MuiButton-containedPrimary': { 
                bgcolor: 'error.main', 
                '&:hover': { 
                  bgcolor: 'error.dark' 
                } 
              } 
            } 
          } 
        }}
      >
        <Typography>
          Êtes-vous sûr de vouloir supprimer {selectedUserIds.length} usager(s) sélectionné(s)&nbsp;?
        </Typography>
      </CommonDialog>
    </MainLayout>
  );
}