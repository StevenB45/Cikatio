'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, 
  TableRow, 
  TableCell, 
  Typography,
  LinearProgress,
  Button,
  Dialog, // Ajout de l'import manquant
  DialogTitle,
  DialogContent
} from '@mui/material';
import { 
  Assignment as AssignmentIcon, 
  Warning as WarningIcon, 
  History as HistoryIcon,
  KeyboardReturn as ReturnIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import MainLayout from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/items/statusBadges';
import ProductSheet from '@/components/items/ProductSheet';
import UserForm from '@/components/users/UserForm';
import { Loan, Item, User, ItemType } from '@/types';
import { getItemHistory } from '@/lib/getItemHistory';

// Import des hooks personnalisés
import { 
  useSortable,
  useFilterable,
  useApiCrud,
  useDialog
} from '@/lib/hooks';

// Import des composants communs
import {
  TableHeader,
  FilterTabs,
  FilterTabOption,
  SortableTableHeader,
  DataTable,
  ConfirmDialog,
  ItemTypeChip,
  useNotification
} from '@/components/common';

// Import des composants spécifiques aux prêts
import LoanDialog from '@/components/loans/LoanDialog';
import LoanAgreement from '@/components/loans/LoanAgreement';
import { EditableLoan } from '@/components/loans/LoanForm';

// Page de gestion des prêts (livres et matériel)
// Permet la création, le retour, la recherche, le tri et l'affichage détaillé des prêts
export default function LoansPage() {
  // Hooks pour gérer les données de l'API
  const { items, setItems, fetchItems: fetchItemsData } = useApiCrud<Item>('/api/items');
  const { items: users, setItems: setUsers, fetchItems: fetchUsersData } = useApiCrud<User>('/api/users');
  const { 
    items: loans, 
    setItems: setLoans, 
    fetchItems: fetchLoansData, 
    updateItem: updateLoan 
  } = useApiCrud<Loan>('/api/loans?includeItemWithoutLoan=true'); // Ajouter le paramètre pour inclure les items empruntés sans prêt
  
  // Initialiser les données au chargement de la page
  useEffect(() => {
    const loadData = async () => {
      await fetchItemsData();
      await fetchUsersData();
      await fetchLoansData();
      
      // Le débogage initial peut rester ici si nécessaire, mais il ne sera exécuté qu'une fois
      // console.log('DEBUG - Initial data load complete');
    };
    
    loadData();
    // Retirer items et loans des dépendances pour éviter la boucle infinie
  }, [fetchItemsData, fetchUsersData, fetchLoansData]);
  
  // État pour les filtres de type d'item
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');
  
  // Fonction pour filtrer les prêts
  const filterLoans = useCallback((loan: Loan, filters: Record<string, any>) => {
    const { statusFilter, searchQuery } = filters;
    
    // Vérifier si le prêt existe
    if (!loan) return false;
    
    // Par défaut, filtrer les prêts retournés sauf si on demande explicitement "all"
    if (statusFilter !== 'all' && loan.status === 'RETURNED') {
      return false;
    }
    
    // Filtrer par type d'item si demandé
    if (itemTypeFilter !== 'all') {
      const item = items.find(i => i.id === loan.itemId);
      if (!item || item.category !== itemTypeFilter) return false;
    }
    
    // Filtrer par statut spécifique si demandé
    if (statusFilter !== 'all' && statusFilter) {
      if (loan.status !== statusFilter) return false;
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const item = items.find(i => i.id === loan.itemId);
      const borrower = loan.borrower;
      
      const matchesSearch = 
        loan.id.toLowerCase().includes(query) ||
        item?.name.toLowerCase().includes(query) ||
        item?.customId.toLowerCase().includes(query) ||
        borrower?.firstName?.toLowerCase().includes(query) ||
        borrower?.lastName?.toLowerCase().includes(query) ||
        borrower?.email?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // NOUVELLE VÉRIFICATION: Éliminer les prêts virtuels pour les items qui ont déjà un prêt réel
    if (loan.isVirtual) {
      // Si c'est un prêt virtuel, vérifier si un prêt réel existe pour le même item
      const hasRealLoan = loans.some(otherLoan => 
        // Le même item
        otherLoan.itemId === loan.itemId && 
        // mais pas le même prêt
        otherLoan.id !== loan.id && 
        // et c'est un prêt réel 
        !otherLoan.isVirtual
      );
      
      // Si un prêt réel existe, ne pas afficher le prêt virtuel
      if (hasRealLoan) return false;
    }
    
    return true;
  }, [items, itemTypeFilter, loans]);
  
  // Hook pour gérer le tri des prêts
  const { 
    sortBy, 
    sortDirection, 
    handleSort, 
    getSortedData 
  } = useSortable<Loan>('borrowedAt', 'desc', (a, b, sortKey, direction) => {
    let aValue: any;
    let bValue: any;
    
    // Logique de tri spécifique pour certaines colonnes
    switch (sortKey) {
      case 'item': {
        const itemA = items.find(i => i.id === a.itemId);
        const itemB = items.find(i => i.id === b.itemId);
        
        // Comparer d'abord par customId, puis par nom si les customId sont identiques
        if (itemA && itemB) {
          if (itemA.customId !== itemB.customId) {
            aValue = itemA.customId;
            bValue = itemB.customId;
          } else {
            aValue = itemA.name.toLowerCase();
            bValue = itemB.name.toLowerCase();
          }
        } else {
          // Si un des items n'existe pas, le mettre à la fin
          aValue = itemA ? 0 : 1;
          bValue = itemB ? 0 : 1;
        }
        break;
      }
      case 'borrower': {
        aValue = `${a.borrower?.lastName || ''} ${a.borrower?.firstName || ''}`;
        bValue = `${b.borrower?.lastName || ''} ${b.borrower?.firstName || ''}`;
        break;
      }
      case 'borrowedAt':
      case 'dueAt':
        aValue = new Date(a[sortKey] as any).getTime();
        bValue = new Date(b[sortKey] as any).getTime();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = a[sortKey as keyof Loan];
        bValue = b[sortKey as keyof Loan];
    }
    
    // Comparaison standard
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Hook pour gérer le filtrage des prêts
  const { 
    searchQuery, 
    setSearchQuery, 
    updateFilter, 
    filteredData, 
    paginatedData, 
    page, 
    rowsPerPage, 
    handleChangePage, 
    handleChangeRowsPerPage, 
    totalCount 
  } = useFilterable<Loan>(
    loans, 
    (loan, filters) => { // Utiliser une fonction inline pour le débogage
      const passes = filterLoans(loan, filters);
      // Log pour chaque prêt pour voir s'il passe le filtre
      // console.log(`DEBUG - Filtering loan ${loan.id} (Item: ${loan.itemId}, Status: ${loan.status}, Virtual: ${loan.isVirtual ?? false}): Passes = ${passes}`);
      return passes;
    },
    { statusFilter: 'ACTIVE' }, // Changer la valeur par défaut à 'ACTIVE' au lieu de 'all'
    0,
    10
  );
  
  // Mémoriser les prêts triés
  const sortedLoans = useMemo(() => getSortedData(filteredData), [getSortedData, filteredData]);

  // Log pour voir les données avant et après filtrage/tri/pagination
  useEffect(() => {
    console.log('DEBUG - Raw loans received:', loans);
    console.log('DEBUG - Filtered loans:', filteredData);
    console.log('DEBUG - Sorted loans:', sortedLoans);
    console.log('DEBUG - Paginated loans (displayed):', paginatedData);
  }, [loans, filteredData, sortedLoans, paginatedData]);
  
  // États pour les dialogues
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [selectedItemForDialog, setSelectedItemForDialog] = useState<Item | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [itemHistory, setItemHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // États pour les dialogues de prêt
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [openAgreementDialog, setOpenAgreementDialog] = useState(false);
  const [currentLoan, setCurrentLoan] = useState<Partial<Loan>>({});
  
  // État pour l'ajout d'un nouvel utilisateur
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  
  // État pour les erreurs
  const [loanError, setLoanError] = useState<string | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  // Options pour les onglets de filtrage
  const statusTabOptions: FilterTabOption[] = useMemo(() => [
    { label: "Tous", value: "all" },
    { 
      label: "En cours", 
      value: "ACTIVE",
      icon: <AssignmentIcon />,
      color: 'primary',
      default: true // Marquer cet onglet comme celui par défaut
    },
    { 
      label: "En retard", 
      value: "OVERDUE",
      icon: <WarningIcon />, 
      color: 'error.main'
    }
  ], []);
  
  // État pour le filtre de statut - changé pour 'ACTIVE' par défaut
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  
  // Gestionnaire pour le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    // Vérifier que la valeur est valide avant de mettre à jour le filtre
    if (newValue === 'all' || newValue === 'ACTIVE' || newValue === 'OVERDUE') {
      updateFilter('statusFilter', newValue);
      setStatusFilter(newValue);
    } else {
      // Si une valeur invalide est fournie, revenir à "all"
      updateFilter('statusFilter', 'all');
      setStatusFilter('all');
    }
  };
  
  // Gestionnaire pour la recherche
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  // Gestionnaire pour le filtre par type d'item
  const handleItemTypeFilterChange = () => {
    setItemTypeFilter(prev => prev === 'all' ? 'BOOK' : prev === 'BOOK' ? 'EQUIPMENT' : 'all');
  };
  
  // Obtenir l'historique d'un item
  const handleShowItemHistory = useCallback(async (item: Item) => {
    setSelectedItemForDialog(item);
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const history = await getItemHistory(item.id);
      setItemHistory(history);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique :', error);
      setItemHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);
  
  // Formatage de dates
  const formatDate = useCallback((date: Date | string): string => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  }, []);
  
  // Calculer le nombre de jours restants
  const getDaysRemaining = useCallback((dueAt: Date | string): number => {
    const dueDate = new Date(dueAt);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);
  
  // Calculer le pourcentage de temps écoulé pour un prêt
  const calculateTimeProgress = useCallback((borrowedAt: Date, dueAt: Date) => {
    const now = new Date();
    const start = new Date(borrowedAt);
    const end = new Date(dueAt);
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    
    const progress = (elapsedDuration / totalDuration) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, []);

  // Liste des items disponibles pour un nouveau prêt
  const availableItems = useMemo(() => 
    items.filter(item => item.reservationStatus === 'AVAILABLE'),
  [items]);

  // Gestionnaire pour ouvrir le dialogue de création de prêt
  const handleOpenNewLoanDialog = useCallback(() => {
    setCurrentLoan({});
    setOpenLoanDialog(true);
    setLoanError(null);
  }, []);
  
  // Gestionnaire pour fermer le dialogue de création de prêt
  const handleCloseLoanDialog = useCallback(() => {
    setOpenLoanDialog(false);
    setLoanError(null);
  }, []);
  
  // Gestionnaire pour ouvrir le dialogue de retour
  const handleOpenReturnDialog = useCallback((loan: Loan) => {
    setCurrentLoan(loan);
    setOpenReturnDialog(true);
    setReturnError(null);
  }, []);
  
  // Gestionnaire pour fermer le dialogue de retour
  const handleCloseReturnDialog = useCallback(() => {
    setOpenReturnDialog(false);
    setReturnError(null);
  }, []);
  
  const { showError } = useNotification();

  // Créer un nouveau prêt
  const handleCreateLoan = useCallback(async (newLoan: EditableLoan) => {
    try {
      // S'assurer que les dates sont des objets Date valides
      const borrowedAt = newLoan.borrowedAt ? new Date(newLoan.borrowedAt) : undefined;
      const dueAt = newLoan.dueAt ? new Date(newLoan.dueAt) : undefined;

      console.log('Date validation:', { 
        borrowedAt, 
        borrowedAtValid: borrowedAt ? !isNaN(borrowedAt.getTime()) : false,
        dueAt, 
        dueAtValid: dueAt ? !isNaN(dueAt.getTime()) : false 
      });

      if (!borrowedAt || isNaN(borrowedAt.getTime())) {
        throw new Error("La date de début est invalide");
      }

      if (!dueAt || isNaN(dueAt.getTime())) {
        throw new Error("La date de retour est invalide");
      }

      // Normaliser les contextes
      const normalizedContexts = Array.isArray(newLoan.contexts) 
        ? newLoan.contexts
            .filter(Boolean)
            .map(context => String(context).trim().toUpperCase())
        : [];
      
      // Préparer les données du prêt
      const formattedLoan = {
        itemId: newLoan.itemId,
        borrowerId: newLoan.borrowerId,
        borrowedAt,
        dueAt,
        notes: newLoan.notes || '',
        contexts: normalizedContexts
      };
      
      console.log('Envoi des données au serveur:', JSON.stringify(formattedLoan, null, 2));
      
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedLoan)
      });

      console.log('Réponse reçue:', response);

      const data = await response.json();
      console.log('Données reçues:', data);
      
      if (!response.ok) {
        const errorMsg = data.error || "Une erreur est survenue lors de la création du prêt";
        console.log('Erreur détectée:', errorMsg);
        setLoanError(errorMsg);
        throw new Error(errorMsg);
      }

      // Réinitialiser l'erreur et traiter le succès
      setLoanError(null);

      // Traiter la réponse réussie
      console.log('Prêt créé avec succès:', data);
      
      // Mettre à jour l'état local
      setLoans(prev => [...prev, data]);
      
      // Mettre à jour le statut de l'item
      const borrowedItem = items.find(i => i.id === newLoan.itemId);
      if (borrowedItem) {
        const updatedItem = { ...borrowedItem, reservationStatus: 'BORROWED' };
        await fetch(`/api/items/${borrowedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem)
        });
        
        setItems(prev => prev.map(item => 
          item.id === borrowedItem.id ? updatedItem : item
        ));
      }

      // Réinitialiser l'erreur en cas de succès
      setLoanError(null);
      
      // Ouvrir le dialogue de convention après la création réussie
      setCurrentLoan(data);
      setOpenLoanDialog(false);
      setOpenAgreementDialog(true);
      
    } catch (error: any) {
      console.error('Error in handleCreateLoan:', error);
      // S'assurer que l'erreur est définie si ce n'est pas déjà fait
      if (!loanError) {
        setLoanError(error.message || 'Une erreur est survenue lors de la création du prêt');
      }
      // Ne pas fermer le dialogue en cas d'erreur
      throw error;
    }
  }, [setLoans, items, setItems, loanError]);

  // Traiter le retour d'un prêt
  const handleProcessReturn = useCallback(async () => {
    if (!currentLoan.id) {
      setReturnError("Impossible de traiter le retour : identifiant du prêt manquant");
      return;
    }
    
    try {
      console.log(`Tentative de retour du prêt ${currentLoan.id}`);
      
      // Cas spécial pour les prêts virtuels (qui n'existent pas réellement en base)
      if (currentLoan.id.toString().startsWith('virtual_') && currentLoan.isVirtual) {
        console.log('Retour d\'un prêt virtuel détecté');
        
        // Extraire l'ID de l'item à partir de l'ID du prêt virtuel
        const itemId = currentLoan.id.replace('virtual_', '');
        
        if (!itemId) {
          throw new Error("Identifiant d'item invalide pour ce prêt virtuel");
        }
        
        // Mettre à jour directement le statut de l'item
        const response = await fetch(`/api/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: itemId,
            reservationStatus: 'AVAILABLE' 
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Erreur lors de la mise à jour du statut de l'item: ${errorData.error || response.statusText}`);
        }
        
        // Rafraîchir les données
        await fetchItemsData();
        await fetchLoansData();
        
        setOpenReturnDialog(false);
        return;
      }
      
      // Traitement normal pour les prêts réels
      const response = await fetch(`/api/loans/${currentLoan.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`Statut de la réponse : ${response.status}`);
      
      // Traiter les erreurs HTTP
      if (!response.ok) {
        let errorMessage = `Erreur lors du retour de l'item (${response.status})`;
        
        try {
          const errorData = await response.json();
          console.error('Erreur détaillée:', errorData);
          
          if (errorData && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          }
          if (errorData && errorData.details) {
            console.error('Détails de l\'erreur:', errorData.details);
          }
        } catch (jsonError) {
          console.error('Erreur lors de la lecture de la réponse JSON:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Récupérer le prêt mis à jour
      const updatedLoan = await response.json();
      console.log('Prêt retourné avec succès:', updatedLoan);
      
      // Mettre à jour la liste des prêts localement
      setLoans(prev => prev.map(loan => 
        loan.id === currentLoan.id ? updatedLoan : loan
      ));
      
      // Rafraîchir la liste des items pour obtenir le nouveau statut
      await fetchItemsData();
      
      setOpenReturnDialog(false);
    } catch (error: any) {
      console.error('Erreur lors du traitement du retour:', error);
      setReturnError(error.message || 'Une erreur est survenue lors du traitement du retour');
    }
  }, [currentLoan, setLoans, fetchItemsData, fetchLoansData]);
  
  // Gérer l'affichage de la convention de prêt
  const handleShowLoanAgreement = useCallback(() => {
    setOpenAgreementDialog(true);
  }, []);

  // Identifier les items qui ne sont plus disponibles
  const unavailableSelectedItems = useMemo(() => 
    items.filter(
      item => currentLoan.itemId === item.id && item.reservationStatus !== 'AVAILABLE'
    ),
  [items, currentLoan.itemId]);
  
  const hasUnavailableSelected = unavailableSelectedItems.length > 0;
  
  // Label pour le filtre de type d'item
  const itemFilterLabel = useMemo(() => {
    switch(itemTypeFilter) {
      case 'BOOK': return 'Filtrer: Livres';
      case 'EQUIPMENT': return 'Filtrer: Matériel';
      default: return 'Filtrer par type';
    }
  }, [itemTypeFilter]);

  return (
    <MainLayout>
      {/* En-tête avec titre et recherche */}
      <TableHeader
        title="Gestion des Prêts"
        subtitle="Créez et gérez les prêts de livres et de matériel"
        searchPlaceholder="Rechercher par nom d'item ou d'utilisateur..."
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onAddClick={handleOpenNewLoanDialog}
        addButtonText="Ajouter un prêt"
        renderExtraActions={() => (
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={handleItemTypeFilterChange}
          >
            {itemFilterLabel}
          </Button>
        )}
      />

      {/* Onglets filtres par statut */}
      <FilterTabs
        value={statusFilter}
        onChange={handleTabChange}
        options={statusTabOptions}
        ariaLabel="filtres de statut"
      />

      {/* Tableau des prêts */}
      <DataTable
        data={paginatedData}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        columns={
          <>
            <SortableTableHeader
              label="Item"
              column="item"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHeader
              label="Emprunteur"
              column="borrower"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHeader
              label="Emprunté le"
              column="borrowedAt"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHeader
              label="Date de retour"
              column="dueAt"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHeader
              label="Statut"
              column="status"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <TableCell>Progression</TableCell>
            <TableCell align="right">Actions</TableCell>
          </>
        }
        renderRow={(loan) => {
          const item = items.find(i => i.id === loan.itemId);
          if (!item) return null;
          
          const daysRemaining = getDaysRemaining(loan.dueAt);
          const progress = calculateTimeProgress(loan.borrowedAt, loan.dueAt);
          
          return (
            <TableRow key={loan.id} hover>
              <TableCell>
                <Box 
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedItemForDialog(item);
                    setOpenItemDialog(true);
                    setShowHistory(false);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Voir la fiche de ${item.name}`}
                >
                  <ItemTypeChip itemType={item.category} />
                  <div>
                    <Typography variant="body2" fontWeight="medium">
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.customId}
                    </Typography>
                  </div>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {`${loan.borrower?.firstName || ''} ${loan.borrower?.lastName || ''}` || 'Emprunteur inconnu'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {loan.borrower?.email || 'Email inconnu'}
                </Typography>
              </TableCell>
              <TableCell>{formatDate(loan.borrowedAt)}</TableCell>
              <TableCell>{formatDate(loan.dueAt)}</TableCell>
              <TableCell>
                <StatusBadge status={loan.status} />
              </TableCell>
              <TableCell>
                {loan.status === 'ACTIVE' || loan.status === 'OVERDUE' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        color={loan.status === 'OVERDUE' ? 'error' : progress > 75 ? 'warning' : 'primary'}
                        sx={{ height: 5, borderRadius: 3 }} 
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {loan.status === 'OVERDUE'
                          ? `${daysRemaining}j`
                          : daysRemaining > 0
                            ? `${daysRemaining}j`
                            : ''}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                {(loan.status === 'ACTIVE' || loan.status === 'OVERDUE' || loan.status === 'SCHEDULED') && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ReturnIcon />}
                    onClick={() => handleOpenReturnDialog(loan)}
                  >
                    Retourner
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        }}
      />
      
      {/* Dialogue de création de prêt */}
      <LoanDialog
        open={openLoanDialog}
        onClose={handleCloseLoanDialog}
        onSave={handleCreateLoan}
        title="Nouveau prêt"
        initialLoan={{}}
        items={items}
        users={users}
        submitLabel="Enregistrer le prêt"
        errorMessage={loanError}
        onAddUser={() => {
          setOpenAddUserDialog(true);
          setNewUserFirstName('');
          setNewUserLastName('');
          setNewUserEmail('');
          setNewUserPhone('');
          setNewUserAddress('');
          setNewUserIsAdmin(false);
        }}
      />

      {/* Dialogue de retour */}
      <ConfirmDialog
        open={openReturnDialog}
        title="Confirmer le retour"
        message={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {returnError && (
              <Typography color="error" variant="body1">{returnError}</Typography>
            )}
            <Typography>
              Confirmer le retour de l'item:{' '}
              <strong>{items.find(i => i.id === currentLoan.itemId)?.name}</strong> emprunté par{' '}
              <strong>{currentLoan.borrower?.firstName} {currentLoan.borrower?.lastName}</strong>
            </Typography>
          </Box>
        }
        onConfirm={handleProcessReturn}
        onCancel={handleCloseReturnDialog}
        confirmButtonText="Confirmer le retour"
      />

      {/* Modal d'ajout d'un nouvel usager */}
      <Dialog
        open={openAddUserDialog}
        onClose={() => setOpenAddUserDialog(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { minWidth: 700, minHeight: 500, width: '90vw', height: '90vh', maxWidth: 'none', maxHeight: 'none' } }}
      >
        <DialogTitle>Ajouter un nouvel usager</DialogTitle>
        <DialogContent dividers>
          <UserForm
            initialFirstName={newUserFirstName}
            initialLastName={newUserLastName}
            initialEmail={newUserEmail}
            initialPhone={newUserPhone}
            initialAddress={newUserAddress}
            initialIsAdmin={newUserIsAdmin}
            onSubmit={({ firstName, lastName, email, phone, address, isAdmin }) => {
              const newUser: User = {
                id: Date.now().toString(),
                firstName,
                lastName,
                email,
                phone,
                address,
                createdAt: new Date(),
                isAdmin, // Ajout de la propriété manquante
              };
              setUsers(prevUsers => [...prevUsers, newUser]);
              setCurrentLoan(prev => ({ ...prev, borrowerId: newUser.id }));
              setOpenAddUserDialog(false);
            }}
            onCancel={() => setOpenAddUserDialog(false)}
            submitLabel="Ajouter"
          />
        </DialogContent>
      </Dialog>

      {/* Fiche produit */}
      <ProductSheet
        open={openItemDialog}
        item={selectedItemForDialog as any}
        onClose={() => setOpenItemDialog(false)}
        getHistory={getItemHistory}
        dialogProps={{ maxWidth: 'lg', fullWidth: true }}
      />

      {/* Convention de prêt */}
      {openAgreementDialog && currentLoan.borrowerId && currentLoan.itemId && (
        <LoanAgreement
          open={openAgreementDialog}
          onClose={() => setOpenAgreementDialog(false)}
          borrower={users.find(u => u.id === currentLoan.borrowerId) || null}
          items={items.filter(i => i.id === currentLoan.itemId)}
          startDate={currentLoan.borrowedAt || new Date()}
          dueDate={currentLoan.dueAt || new Date()}
        />
      )}
    </MainLayout>
  );
}