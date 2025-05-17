'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  TableCell,
  TableRow,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  Autocomplete,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
  Inventory as EquipmentIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import UserForm from '@/components/users/UserForm';
import { StatusBadge } from '@/components/items/statusBadges';
import type { User, Item, ItemType, ServiceCategory } from '@/types';
import { fetchBookByISBN } from '@/lib/fetchBookByISBN';
import dynamic from 'next/dynamic';
import { getItemStatus } from '@/lib/status';

// Importation de nos nouveaux hooks personnalisés
import {
  useApiCrud,
  useFilterable,
  useSortable,
  useDialog,
  useNotification
} from '@/lib/hooks';

// Importation de nos composants communs
import {
  TableHeader,
  FilterTabs,
  SortableTableHeader,
  DataTable,
  ItemTypeChip,
  CommonDialog
} from '@/components/common';

const ProductSheet = dynamic(() => import('@/components/items/ProductSheet'), { ssr: false });

// Définition du type pour l'élément en cours d'édition/ajout
type EditableItem = Partial<Item & {
  author: string | null;
  publisher: string | null;
  yearPublished: number | null;
  isbn: string | null;
  coverImageUrl: string | null;
  serviceCategory: ServiceCategory | null;
}>;

// Options pour les onglets de filtrage
const tabOptions = [
  { label: "Tous", value: "all" },
  { 
    label: "Livres", 
    value: "book", 
    icon: <BookIcon />, 
    iconPosition: 'start' 
  },
  { 
    label: "Matériel", 
    value: "equipment", 
    icon: <EquipmentIcon />, 
    iconPosition: 'start' 
  }
];

// Page de gestion des items (livres et matériel)
export default function ItemsPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ItemsPageContent />
    </Suspense>
  );
}

function ItemsPageContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  
  // États pour les onglets de filtrage
  const [tabValue, setTabValue] = useState<string>(typeParam || 'all');
  const router = useRouter();
  const pathname = usePathname();
  
  // Utilisation de notre hook useApiCrud pour gérer les opérations CRUD
  const { 
    items,
    setItems,
    loading: itemsLoading,
    error: itemsError,
    fetchItems,
    createItem,
    updateItem,
    deleteItem
  } = useApiCrud<Item>('/api/items');
  
  // Utilisation de notre hook useApiCrud pour gérer les utilisateurs
  const { 
    items: users,
    fetchItems: fetchUsers
  } = useApiCrud<User>('/api/users');
  
  // Chargement initial des données
  useEffect(() => {
    fetchItems();
    fetchUsers();
  }, [fetchItems, fetchUsers]);
  
  // Hook de notification pour les messages de succès/erreur
  const { showNotification } = useNotification();
  
  // Fonction pour filtrer les items
  const filterItems = useCallback((item: Item, filters: Record<string, any>) => {
    const { searchQuery } = filters;
    const category = (item.category || '').toUpperCase();

    if (tabValue === 'book' && category !== 'BOOK') return false;
    if (tabValue === 'equipment' && category !== 'EQUIPMENT') return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(query) ||
        item.customId?.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) || false) ||
        (category === 'BOOK' && (item.author?.toLowerCase().includes(query) || false)) ||
        (category === 'EQUIPMENT' && (item.brand?.toLowerCase().includes(query) || false))
      );
    }
    return true;
  }, [tabValue]); // Ajouter tabValue comme dépendance explicite

  // Utilisation de notre hook useFilterable pour gérer le filtrage
  const {
    searchQuery,
    setSearchQuery,
    filteredData: filteredItems,
    paginatedData,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    totalCount,
    resetFilters
  } = useFilterable<Item>(items, filterItems);
  
  // Utilisation de notre hook useSortable pour gérer le tri
  const { 
    sortBy, 
    sortDirection, 
    handleSort, 
    getSortedData 
  } = useSortable<Item>('name', 'asc', (a, b, sortKey, direction) => {
    let aValue: any;
    let bValue: any;
    
    // Logique de tri spécifique pour certaines colonnes
    switch (sortKey) {
      case 'author':
        aValue = a.category === 'BOOK' ? a.author || '' : '';
        bValue = b.category === 'BOOK' ? a.author || '' : '';
        break;
      case 'publisher':
        aValue = a.category === 'BOOK' ? a.publisher || '' : '';
        bValue = b.category === 'BOOK' ? a.publisher || '' : '';
        break;
      case 'yearPublished':
        aValue = a.category === 'BOOK' ? a.yearPublished || 0 : 0;
        bValue = b.category === 'BOOK' ? a.yearPublished || 0 : 0;
        break;
      case 'brand':
        aValue = a.category === 'EQUIPMENT' ? a.brand || '' : '';
        bValue = b.category === 'EQUIPMENT' ? a.brand || '' : '';
        break;
      case 'model':
        aValue = a.category === 'EQUIPMENT' ? a.model || '' : '';
        bValue = b.category === 'EQUIPMENT' ? a.model || '' : '';
        break;
      case 'serialNumber':
        aValue = a.category === 'EQUIPMENT' ? a.serialNumber || '' : '';
        bValue = b.category === 'EQUIPMENT' ? a.serialNumber || '' : '';
        break;
      default:
        aValue = a[sortKey as keyof Item];
        bValue = b[sortKey as keyof Item];
    }
    
    // Traitement des valeurs pour le tri
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    if (aValue === undefined) aValue = '';
    if (bValue === undefined) bValue = '';
    
    // Comparaison standard
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Mémoriser les items triés
  const sortedItems = useMemo(() => getSortedData(filteredItems), [getSortedData, filteredItems]);
  
  // Sélection multiple d'items
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // Vérifier si tous les items de la page sont sélectionnés
  const isAllSelected = useMemo(() =>
    paginatedData.length > 0 &&
    paginatedData.every(i => selectedItemIds.includes(i.id)),
  [paginatedData, selectedItemIds]);
  
  // Vérifier si certains items de la page sont sélectionnés
  const isIndeterminate = useMemo(() =>
    selectedItemIds.length > 0 &&
    !isAllSelected &&
    paginatedData.some(i => selectedItemIds.includes(i.id)),
  [selectedItemIds, isAllSelected, paginatedData]);

  // Gestion de la sélection de tous les items de la page
  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const pageItemIds = paginatedData.map(i => i.id);
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...pageItemIds])));
    } else {
      const pageItemIds = paginatedData.map(i => i.id);
      setSelectedItemIds(prev => prev.filter(id => !pageItemIds.includes(id)));
    }
  }, [paginatedData]);

  // Gestion de la sélection d'un item
  const handleSelectOne = useCallback((itemId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedItemIds(prev => [...prev, itemId]);
    } else {
      setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    }
  }, []);

  // Synchronisation avec le paramètre d'URL ?type
  useEffect(() => {
    if (typeParam && typeParam !== tabValue) {
      setTabValue(typeParam);
    } else if (!typeParam && tabValue !== 'all') {
      setTabValue('all');
    }
  }, [typeParam, tabValue]);

  // États pour les dialogues
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<EditableItem>({});
  const [isEditing, setIsEditing] = useState(false);
  
  const [openReserveDialog, setOpenReserveDialog] = useState(false);
  const [reserveItemId, setReserveItemId] = useState<string | null>(null);
  const [selectedReserveUser, setSelectedReserveUser] = useState<User | null>(null);
  // Nouvel état pour les dates de réservation
  const [reservationDates, setReservationDates] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null
  });
  
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  
  const [openProductSheet, setOpenProductSheet] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Item | null>(null);
  
  // États pour la recherche par ISBN
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnError, setIsbnError] = useState<string | null>(null);
  const [isbnInputValue, setIsbnInputValue] = useState('');
  const [debouncedIsbn, setDebouncedIsbn] = useState('');
  
  // État pour les erreurs de formulaire
  const [itemError, setItemError] = useState<string | null>(null);
  
  // État pour les erreurs de réservation et les réservations existantes
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  
  // Gestion des onglets
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
    // Mettre à jour l'URL
    const searchParams = new URLSearchParams(window.location.search);
    if (newValue === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', newValue);
    }
    const newUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    router.replace(newUrl);
  }, [pathname, router]);

  // Gestion de la recherche
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Ouvrir le dialogue d'ajout
  const handleOpenAddDialog = useCallback(() => {
    setCurrentItem({ 
      category: tabValue === 'book' ? 'BOOK' : tabValue === 'equipment' ? 'EQUIPMENT' : 'BOOK', 
      reservationStatus: 'AVAILABLE',
      serviceCategory: undefined
    });
    setIsEditing(false);
    setIsbnInputValue('');
    setDebouncedIsbn('');
    setIsbnError(null);
    setOpenItemDialog(true);
  }, [tabValue]);

  // Ouvrir le dialogue d'édition
  const handleOpenEditDialog = useCallback((item: Item) => {
    setCurrentItem({ 
      ...item,
      serviceCategory: item.serviceCategory
     });
    setIsEditing(true);
    setIsbnInputValue(item.isbn || '');
    setDebouncedIsbn(item.isbn?.replace(/[^0-9Xx]/g, '') || '');
    setIsbnError(null);
    setOpenItemDialog(true);
  }, []);

  // Fermer le dialogue d'item
  const handleCloseDialog = useCallback(() => {
    setOpenItemDialog(false);
  }, []);

  // Gérer les changements dans les champs de texte
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  }, []);

  // Gérer les changements dans les sélecteurs
  const handleSelectChange = useCallback((e: any) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
    if (name === 'category') {
      setIsbnError(null);
      setIsbnInputValue('');
      setDebouncedIsbn('');
    }
  }, []);

  // Gérer les changements dans le champ ISBN
  const handleIsbnInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIsbnInputValue(value);
    setCurrentItem(prev => ({ ...prev, isbn: value }));
    setIsbnError(null);
  }, []);

  // Effet pour temporiser la saisie de l'ISBN
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedIsbn(isbnInputValue);
    }, 500);
    
    return () => clearTimeout(handler);
  }, [isbnInputValue]);

  // Effet pour récupérer les informations du livre par ISBN
  useEffect(() => {
    if (!openItemDialog || currentItem.category !== 'BOOK') return;
    
    const cleanIsbn = debouncedIsbn.replace(/[^0-9Xx]/g, '');
    
    if (cleanIsbn && (cleanIsbn.length === 10 || cleanIsbn.length === 13)) {
      setIsbnLoading(true);
      setIsbnError(null);
      
      const fetchBook = async () => {
        const isbnBeingFetched = cleanIsbn;
        try {
          const book = await fetchBookByISBN(isbnBeingFetched);
          
          if (!openItemDialog || currentItem.category !== 'BOOK' || debouncedIsbn.replace(/[^0-9Xx]/g, '') !== isbnBeingFetched) {
            setIsbnLoading(false);
            return;
          }
          
          if (book) {
            setCurrentItem(prev => ({
              ...prev,
              name: book.title || prev.name,
              author: book.author || prev.author,
              publisher: book.publisher || prev.publisher,
              yearPublished: book.yearPublished !== undefined ? book.yearPublished : prev.yearPublished,
              description: book.description || prev.description,
              coverImageUrl: book.cover || prev.coverImageUrl,
            }));
            setIsbnError(null);
          } else {
            setIsbnError('Aucun livre trouvé pour cet ISBN.');
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données du livre:", error);
          if (openItemDialog && currentItem.category === 'BOOK' && debouncedIsbn.replace(/[^0-9Xx]/g, '') === isbnBeingFetched) {
            setIsbnError('Erreur lors de la récupération des données du livre.');
          }
        } finally {
          if (openItemDialog && currentItem.category === 'BOOK' && debouncedIsbn.replace(/[^0-9Xx]/g, '') === isbnBeingFetched) {
            setIsbnLoading(false);
          }
        }
      };
      
      fetchBook();
    } else {
      setIsbnLoading(false);
      if (!cleanIsbn) {
        setIsbnError(null);
      } else if (!isbnLoading) {
        setIsbnError(null);
      }
    }
  }, [debouncedIsbn, openItemDialog, currentItem.category]);

  // Enregistrer un item (création ou modification)
  const handleSaveItem = useCallback(async () => {
    setItemError(null);
    try {
      const itemDataToSend = {
        ...currentItem,
        yearPublished: currentItem.yearPublished ? parseInt(String(currentItem.yearPublished), 10) : null,
        coverImageUrl: currentItem.coverImageUrl || '',
      };
      
      let savedItem: Item;
      
      if (isEditing && itemDataToSend.id) {
        savedItem = await updateItem(itemDataToSend as Item);
      } else {
        savedItem = await createItem(itemDataToSend as Omit<Item, 'id'>);
      }
      
      showNotification(`Item ${isEditing ? 'modifié' : 'créé'} avec succès`, 'success');
      
      handleCloseDialog();
    } catch (err: any) {
      setItemError(err.message || `Erreur ${isEditing ? 'modification' : 'création'} de l'item.`);
    }
  }, [currentItem, isEditing, updateItem, createItem, showNotification, handleCloseDialog]);

  // États pour les dialogues de confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  // Demander la suppression d'un item
  const handleAskDeleteItem = useCallback((id: string) => {
    setItemIdToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  // Confirmer la suppression d'un item
  const handleConfirmDeleteItem = useCallback(async () => {
    if (!itemIdToDelete) return;
    
    try {
      await deleteItem(itemIdToDelete);
      showNotification('Item supprimé avec succès', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Erreur lors de la suppression de l\'item', 'error');
    }
    
    setDeleteDialogOpen(false);
    setItemIdToDelete(null);
  }, [itemIdToDelete, deleteItem, showNotification]);

  // Annuler la suppression d'un item
  const handleCancelDeleteItem = useCallback(() => {
    setDeleteDialogOpen(false);
    setItemIdToDelete(null);
  }, []);
  
  // Demander la suppression de plusieurs items
  const handleAskDeleteMany = useCallback(() => {
    setBulkDeleteDialogOpen(true);
  }, []);
  
  // Annuler la suppression de plusieurs items
  const handleCancelDeleteMany = useCallback(() => {
    setBulkDeleteDialogOpen(false);
  }, []);
  
  // Confirmer la suppression de plusieurs items
  const handleConfirmDeleteMany = useCallback(async () => {
    try {
      await Promise.all(selectedItemIds.map(id => deleteItem(id)));
      
      setSelectedItemIds([]);
      showNotification('Items supprimés avec succès', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Erreur lors de la suppression multiple', 'error');
    }
    
    setBulkDeleteDialogOpen(false);
  }, [selectedItemIds, deleteItem, showNotification]);
  
  // Réserver un item
  const handleReserveItem = useCallback((id: string) => {
    setReserveItemId(id);
    setSelectedReserveUser(null);
    setOpenReserveDialog(true);
  }, []);
  
  // Confirmer la réservation
  const handleConfirmReserve = useCallback(async () => {
    if (reserveItemId && selectedReserveUser && reservationDates.startDate && reservationDates.endDate) {
      try {
        // Validation des dates
        if (reservationDates.endDate <= reservationDates.startDate) {
          setReservationError('La date de fin doit être postérieure à la date de début');
          return;
        }

        // Validation des conflits avant soumission
        const hasConflict = existingReservations.some(reservation => {
          const resStart = new Date(reservation.startDate);
          const resEnd = new Date(reservation.endDate);
          const start = reservationDates.startDate as Date;
          const end = reservationDates.endDate as Date;
          
          return (
            (start >= resStart && start < resEnd) ||
            (end > resStart && end <= resEnd) ||
            (start <= resStart && end >= resEnd)
          );
        });

        if (hasConflict) {
          setReservationError('Cette période chevauche une réservation existante. Veuillez choisir une autre période.');
          return;
        }

        // Création de la réservation via l'API de réservation
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: reserveItemId,
            userId: selectedReserveUser.id,
            startDate: reservationDates.startDate,
            endDate: reservationDates.endDate,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 409) {
            setReservationError('Conflit de réservation : ' + errorData.error);
            return;
          }
          throw new Error(errorData.error || 'Erreur lors de la réservation');
        }

        await response.json();
        showNotification('Item réservé avec succès', 'success');
        
        // Mettre à jour l'item pour refléter le nouvel état
        await fetchItems();
        
        // Fermer le dialogue et réinitialiser les états
        setOpenReserveDialog(false);
        setReserveItemId(null);
        setSelectedReserveUser(null);
        setReservationDates({ startDate: null, endDate: null });
      } catch (err: any) {
        setReservationError(err.message || 'Erreur lors de la réservation');
        showNotification(err.message || 'Erreur lors de la réservation', 'error');
      }
    }
  }, [reserveItemId, selectedReserveUser, reservationDates, existingReservations, fetchItems, showNotification]);
  
  // Annuler la réservation d'un item
  const handleCancelReservation = useCallback(async (id: string) => {
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate || itemToUpdate.reservationStatus !== 'RESERVED') return;
    
    try {
      await updateItem({
        ...itemToUpdate,
        reservationStatus: 'AVAILABLE',
        reservedById: undefined,
        reservedAt: undefined
      });
      
      showNotification('Réservation annulée avec succès', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Erreur lors de l\'annulation de la réservation', 'error');
    }
  }, [items, updateItem, showNotification]);

  // State pour l'historique de l'item sélectionné
  const [selectedProductHistory, setSelectedProductHistory] = useState<any[]>([]);
  
  // Charger l'historique quand un produit est sélectionné
  useEffect(() => {
    if (selectedProduct) {
      fetch(`/api/loans?itemId=${selectedProduct.id}`)
        .then(res => res.json())
        .then((loans) => {
          setSelectedProductHistory(loans.map((l: any) => ({
            action: l.status === 'RETURNED' ? 'Retour' : 'Emprunt',
            user: l.borrower ? `${l.borrower.firstName} ${l.borrower.lastName}` : '',
            userId: l.borrowerId,
            userObj: l.borrower,
            date: l.borrowedAt ? new Date(l.borrowedAt).toLocaleDateString('fr-FR') : '',
            status: l.status,
            returnedAt: l.returnedAt ? new Date(l.returnedAt).toLocaleDateString('fr-FR') : null,
          })));
        });
    } else {
      setSelectedProductHistory([]);
    }
  }, [selectedProduct]);

  // Fonction pour charger l'historique complet d'un item (emprunts et réservations)
  const getItemFullHistory = useCallback(async (itemId: string) => {
    try {
      console.log("Chargement de l'historique pour l'item:", itemId);
      
      // Charger les emprunts
      const loansResponse = await fetch(`/api/loans?itemId=${itemId}`);
      const loans = await loansResponse.json();
      console.log("Emprunts récupérés:", loans.length, loans);

      // Charger les réservations
      const reservationsResponse = await fetch(`/api/reservations?itemId=${itemId}`);
      const reservations = await reservationsResponse.json();
      console.log("Réservations récupérées:", reservations.length, reservations);

      // Traduction des statuts en français
      const translateStatus = (status: string) => {
        const statusMap: Record<string, string> = {
          'ACTIVE': 'Actif',
          'OVERDUE': 'En retard',
          'RETURNED': 'Retourné',
          'CONFIRMED': 'Confirmé',
          'PENDING': 'En attente',
          'CANCELLED': 'Annulé',
          'BORROWED': 'Emprunté',
          'OUT_OF_ORDER': 'Indisponible'
        };
        return statusMap[status] || status;
      };

      // Formater les emprunts pour l'historique
      const loanHistory = loans.map((l: any) => ({
        action: l.status === 'RETURNED' ? 'Retour' : 'Emprunt',
        user: l.borrower ? `${l.borrower.firstName} ${l.borrower.lastName}` : '',
        userId: l.borrowerId,
        userObj: l.borrower,
        date: l.borrowedAt ? new Date(l.borrowedAt).toLocaleDateString('fr-FR') : '',
        status: translateStatus(l.status),
        returnedAt: l.returnedAt ? new Date(l.returnedAt).toLocaleDateString('fr-FR') : null,
      }));

      // Formater les réservations pour l'historique
      const reservationHistory = reservations.map((r: any) => ({
        action: 'Réservation',
        user: r.user ? `${r.user.firstName} ${r.user.lastName}` : '',
        userId: r.userId,
        userObj: r.user,
        date: r.startDate ? new Date(r.startDate).toLocaleDateString('fr-FR') : '',
        endDate: r.endDate ? new Date(r.endDate).toLocaleDateString('fr-FR') : '',
        status: translateStatus(r.status),
      }));

      console.log("Historique des emprunts formaté:", loanHistory);
      console.log("Historique des réservations formaté:", reservationHistory);

      // Combiner les deux types d'historique
      const fullHistory = [...loanHistory, ...reservationHistory];
      
      // Trier par date (du plus récent au plus ancien)
      fullHistory.sort((a, b) => {
        const dateA = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
        const dateB = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log("Historique complet:", fullHistory);
      return fullHistory;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique complet:', error);
      return [];
    }
  }, []);

  // Chargement des réservations existantes pour l'item sélectionné lors de l'ouverture du dialogue de réservation
  useEffect(() => {
    if (openReserveDialog && reserveItemId) {
      // Réinitialiser les erreurs
      setReservationError(null);
      
      // Charger les réservations existantes
      fetch(`/api/reservations?itemId=${reserveItemId}`)
        .then(response => response.json())
        .then(data => {
          setExistingReservations(data);
        })
        .catch(error => {
          console.error('Erreur lors du chargement des réservations:', error);
        });
    } else {
      // Réinitialiser l'état quand le dialogue se ferme
      setExistingReservations([]);
    }
  }, [openReserveDialog, reserveItemId]);

  return (
    <MainLayout>
      {/* En-tête avec titre et recherche */}
      <TableHeader
        title={tabValue === 'book' ? 'Livres' : tabValue === 'equipment' ? 'Matériel' : 'Tous les items'}
        subtitle="Gérez votre collection de livres et de matériel"
        searchPlaceholder="Rechercher par nom, ID ou description..."
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onAddClick={handleOpenAddDialog}
        addButtonText={`Ajouter un ${tabValue === 'book' ? 'livre' : tabValue === 'equipment' ? 'matériel' : 'item'}`}
        renderExtraActions={() => (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={selectedItemIds.length === 0}
            onClick={handleAskDeleteMany}
            sx={{ ml: 1 }}
          >
            Supprimer la sélection
          </Button>
        )}
      />

      {/* Onglets filtres par type */}
      <FilterTabs
        value={tabValue}
        onChange={handleTabChange}
        options={tabOptions}
        ariaLabel="filtres par type d'item"
      />

      {/* Tableau des items */}
      <DataTable
        data={paginatedData}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        columns={
          <>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={handleSelectAll}
                inputProps={{ 'aria-label': 'Sélectionner tous les items' }}
              />
            </TableCell>
            <SortableTableHeader
              label="Code Barre"
              column="customId"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHeader
              label="Nom"
              column="name"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHeader
              label="Catégorie"
              column="category"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHeader
              label="Détails"
              column="author"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHeader
              label="Statut"
              column="reservationStatus"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <TableCell align="right">Actions</TableCell>
          </>
        }
        renderRow={(item) => (
          <TableRow 
            key={item.id} 
            hover 
            selected={selectedItemIds.includes(item.id)} 
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedProduct(item);
              setOpenProductSheet(true);
            }}
          >
            <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
              <Checkbox
                checked={selectedItemIds.includes(item.id)}
                onChange={handleSelectOne(item.id)}
                inputProps={{ 'aria-label': `Sélectionner l'item ${item.name}` }}
              />
            </TableCell>
            <TableCell>{item.customId}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <ItemTypeChip itemType={item.category} />
            </TableCell>
            <TableCell>
              {item.category === 'BOOK' ? (
                <>
                  {item.author}<br />
                  <Typography variant="body2" color="text.secondary">
                    {item.publisher}, {item.yearPublished}
                  </Typography>
                </>
              ) : (
                <>
                  {item.brand} {item.model}<br />
                  <Typography variant="body2" color="text.secondary">
                    S/N: {item.serialNumber}
                  </Typography>
                </>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={getItemStatus({ reservationStatus: item.reservationStatus })} />
            </TableCell>
            <TableCell align="right">
              <IconButton 
                size="small"
                color="primary"
                onClick={e => { e.stopPropagation(); handleOpenEditDialog(item); }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small"
                color="error"
                onClick={e => { e.stopPropagation(); handleAskDeleteItem(item.id); }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              {item.reservationStatus === 'AVAILABLE' && (
                <Button 
                  size="small" 
                  color="warning" 
                  variant="outlined"
                  onClick={e => { e.stopPropagation(); handleReserveItem(item.id); }}
                  sx={{ ml: 1 }}
                >
                  Réserver
                </Button>
              )}
              {item.reservationStatus === 'RESERVED' && (
                <Button 
                  size="small" 
                  color="info" 
                  variant="outlined"
                  onClick={e => { e.stopPropagation(); handleCancelReservation(item.id); }}
                  sx={{ ml: 1 }}
                >
                  Annuler la réservation
                </Button>
              )}
            </TableCell>
          </TableRow>
        )}
        emptyMessage="Aucun élément trouvé"
      />

      {/* Dialog pour ajouter ou éditer un item (livre ou matériel) */}
      <CommonDialog
        open={openItemDialog}
        onClose={handleCloseDialog}
        title={`${isEditing ? 'Modifier un ' : 'Ajouter un '}${currentItem.category === 'BOOK' ? 'livre' : 'matériel'}`}
        confirmLabel="Enregistrer"
        cancelLabel="Annuler"
        onConfirm={handleSaveItem}
        confirmDisabled={!currentItem.name || !currentItem.serviceCategory}
        maxWidth="lg"
        dialogProps={{
          PaperProps: { sx: { borderRadius: 2, boxShadow: 8 } }
        }}
      >
        {itemError && <Alert severity="error" sx={{ mb: 2 }}>{itemError}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {!isEditing && (
            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select
                name="category"
                value={currentItem.category}
                label="Catégorie"
                onChange={handleSelectChange}
              >
                <MenuItem value="BOOK">Livre</MenuItem>
                <MenuItem value="EQUIPMENT">Matériel</MenuItem>
              </Select>
            </FormControl>
          )}
          
          <TextField
            required
            fullWidth
            label="Nom"
            name="name"
            value={currentItem.name || ''}
            onChange={handleInputChange}
            error={!currentItem.name}
            helperText={!currentItem.name && "Ce champ est obligatoire"}
          />
          
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={currentItem.description || ''}
            onChange={handleInputChange}
            multiline
            rows={2}
          />
          
          <TextField
            required
            fullWidth
            label="Code Barre"
            name="customId"
            value={currentItem.customId || ''}
            onChange={handleInputChange}
            error={!currentItem.customId}
            helperText={!currentItem.customId && "Ce champ est obligatoire"}
          />
          
          <FormControl fullWidth required>
            <InputLabel id="service-category-label">Service / Catégorie Spécifique*</InputLabel>
            <Select
              labelId="service-category-label"
              name="serviceCategory"
              value={currentItem.serviceCategory || ''}
              label="Service / Catégorie Spécifique*"
              onChange={handleSelectChange}
              error={!currentItem.serviceCategory}
            >
              <MenuItem value="">
                <em>Sélectionnez une catégorie</em>
              </MenuItem>
              <MenuItem value="RUNE">RUNE</MenuItem>
              <MenuItem value="SAVS">SAVS</MenuItem>
              <MenuItem value="CICAT">CICAT</MenuItem>
              <MenuItem value="PNT">PNT</MenuItem>
              <MenuItem value="LOGEMENT_INCLUSIF">Logement Inclusif</MenuItem>
            </Select>
            {!currentItem.serviceCategory && (
              <FormHelperText error>Ce champ est obligatoire</FormHelperText>
            )}
          </FormControl>

          {currentItem.category === 'BOOK' && (
            <>
              <TextField
                fullWidth
                label="Auteur"
                name="author"
                value={currentItem.author || ''}
                onChange={handleInputChange}
              />
              
              <TextField
                fullWidth
                label="ISBN"
                name="isbn"
                value={isbnInputValue}
                onChange={handleIsbnInputChange}
                InputProps={{
                  endAdornment: isbnLoading ? <InputAdornment position="end"><CircularProgress size={20} /></InputAdornment> : null
                }}
                helperText={isbnError || ''}
                error={!!isbnError}
              />
              
              <TextField
                fullWidth
                label="Éditeur"
                name="publisher"
                value={currentItem.publisher || ''}
                onChange={handleInputChange}
              />
              
              <TextField
                fullWidth
                label="Année de publication"
                name="yearPublished"
                type="number"
                value={currentItem.yearPublished || ''}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </>
          )}
          
          {currentItem.category === 'EQUIPMENT' && (
            <>
              <TextField
                fullWidth
                label="Marque"
                name="brand"
                value={currentItem.brand || ''}
                onChange={handleInputChange}
              />
              
              <TextField
                fullWidth
                label="Modèle"
                name="model"
                value={currentItem.model || ''}
                onChange={handleInputChange}
              />
              
              <TextField
                fullWidth
                label="Numéro de série"
                name="serialNumber"
                value={currentItem.serialNumber || ''}
                onChange={handleInputChange}
              />
            </>
          )}
          
          {/* Champ Disponibilité uniquement lors de l'ajout */}
          {!isEditing && (
            <FormControl fullWidth>
              <InputLabel>Disponibilité</InputLabel>
              <Select
                name="reservationStatus"
                value={currentItem.reservationStatus || 'AVAILABLE'}
                label="Disponibilité"
                onChange={handleSelectChange}
              >
                <MenuItem value="AVAILABLE">Disponible</MenuItem>
                <MenuItem value="RESERVED">Réservé</MenuItem>
                <MenuItem value="BORROWED">Emprunté</MenuItem>
                <MenuItem value="OUT_OF_ORDER">En panne</MenuItem>
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="URL de l'image de couverture"
            name="coverImageUrl"
            value={currentItem.coverImageUrl || ''}
            onChange={handleInputChange}
          />
        </Box>
      </CommonDialog>

      {/* Dialog pour réserver un item à un usager */}
      <CommonDialog
        open={openReserveDialog}
        onClose={() => setOpenReserveDialog(false)}
        title="Réserver un item"
        confirmLabel="Réserver"
        cancelLabel="Annuler"
        onConfirm={handleConfirmReserve}
        confirmDisabled={!selectedReserveUser || !reservationDates.startDate || !reservationDates.endDate}
        maxWidth="md"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Message d'erreur de réservation */}
          {reservationError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {reservationError}
            </Alert>
          )}
          
          <Autocomplete
            options={users}
            getOptionLabel={(option) => typeof option === 'string' ? option : `${option.firstName} ${option.lastName} (${option.email})`}
            value={selectedReserveUser}
            onChange={(e, newValue) => {
              if (typeof newValue === 'string') {
                const nameParts = newValue.split(' ');
                setOpenAddUserDialog(true);
                setNewUserFirstName(nameParts[0] || '');
                setNewUserLastName(nameParts.slice(1).join(' ') || '');
              } else if (newValue && (newValue as any).inputValue) {
                const nameParts = (newValue as any).inputValue.split(' ');
                setOpenAddUserDialog(true);
                setNewUserFirstName(nameParts[0] || '');
                setNewUserLastName(nameParts.slice(1).join(' ') || '');
              } else {
                setSelectedReserveUser(newValue);
              }
            }}
            filterOptions={(options, params) => {
              const filtered = options.filter(option =>
                `${option.firstName} ${option.lastName}`.toLowerCase().includes(params.inputValue.toLowerCase()) ||
                option.email.toLowerCase().includes(params.inputValue.toLowerCase())
              );
              if (params.inputValue !== '' && !options.some(option => 
                `${option.firstName} ${option.lastName}`.toLowerCase() === params.inputValue.toLowerCase())) {
                filtered.push({ inputValue: params.inputValue, firstName: 'Ajouter', lastName: `"${params.inputValue}"`, email: '' } as any);
              }
              return filtered;
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            renderInput={(params) => (
              <TextField {...params} label="Sélectionner ou rechercher un usager" fullWidth required />
            )}
            renderOption={(props, option) => {
              const { key, ...rest } = props as any;
              return (
                <li key={option.id || 'new-user'} {...rest}>
                  {`${option.firstName} ${option.lastName} (${option.email})`}
                </li>
              );
            }}
            freeSolo
          />

          {/* Champs de date améliorés pour la période de réservation */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Date de début"
              type="date"
              fullWidth
              value={reservationDates.startDate ? reservationDates.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setReservationDates(prev => ({ ...prev, startDate: date }));
                // Réinitialiser l'erreur quand l'utilisateur change la date
                setReservationError(null);
              }}
              InputLabelProps={{ shrink: true }}
              required
              error={!!reservationError}
            />
            <TextField
              label="Date de fin"
              type="date"
              fullWidth
              value={reservationDates.endDate ? reservationDates.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setReservationDates(prev => ({ ...prev, endDate: date }));
                // Réinitialiser l'erreur quand l'utilisateur change la date
                setReservationError(null);
              }}
              InputLabelProps={{ shrink: true }}
              required
              error={!!reservationError}
            />
          </Box>
          
          {/* Affichage des réservations existantes pour aider l'utilisateur à choisir une période disponible */}
          {existingReservations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" color="error" gutterBottom>
                Périodes déjà réservées :
              </Typography>
              <Box sx={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                {existingReservations.map((reservation, index) => (
                  <Box 
                    key={reservation.id || index} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 1,
                      mb: 0.5,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      border: '1px solid #f0f0f0'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                        {new Date(reservation.startDate).toLocaleDateString('fr-FR')} au {new Date(reservation.endDate).toLocaleDateString('fr-FR')}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Réservé par: {reservation.user.firstName} {reservation.user.lastName}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Veuillez choisir une période qui ne chevauche pas ces réservations.
              </Typography>
            </Box>
          )}
          
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setOpenAddUserDialog(true);
              setNewUserFirstName('');
              setNewUserLastName('');
              setNewUserEmail('');
            }}
          >
            + Ajouter un usager
          </Button>
        </Box>
      </CommonDialog>

      {/* Dialog pour ajouter un nouvel usager */}
      <CommonDialog
        open={openAddUserDialog}
        onClose={() => setOpenAddUserDialog(false)}
        title="Ajouter un nouvel usager"
        maxWidth="md"
        dividers={true}
        actions={
          // On ne définit pas de boutons standard car UserForm fournit ses propres boutons
          <></> 
        }
      >
        <UserForm
          initialFirstName={newUserFirstName}
          initialLastName={newUserLastName}
          initialEmail={newUserEmail}
          onSubmit={async ({ firstName, lastName, email, phone, address, isAdmin }) => {
            try {
              const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, phone, address, isAdmin })
              });
              
              if (!response.ok) {
                throw new Error('Erreur lors de la création de l\'usager.');
              }
              
              const createdUser = await response.json();
              setSelectedReserveUser(createdUser);
              
              showNotification('Usager créé avec succès', 'success');
              
              setOpenAddUserDialog(false);
              setNewUserFirstName('');
              setNewUserLastName('');
              setNewUserEmail('');
              
              // Rafraîchir la liste des utilisateurs
              fetchUsers();
            } catch (err: any) {
              showNotification(err.message || 'Erreur lors de la création de l\'usager', 'error');
            }
          }}
          onCancel={() => setOpenAddUserDialog(false)}
          submitLabel="Ajouter"
        />
      </CommonDialog>

      {/* Fiche détaillée d'un item */}
      <ProductSheet
        open={openProductSheet}
        item={selectedProduct as any}
        onClose={() => setOpenProductSheet(false)}
        getHistory={getItemFullHistory}
      />

      {/* Dialogue de confirmation de suppression */}
      <CommonDialog
        open={deleteDialogOpen}
        title="Supprimer l'item"
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDeleteItem}
      >
        Êtes-vous sûr de vouloir supprimer cet item ? Cette action est irréversible.
      </CommonDialog>

      {/* Dialogue de confirmation de suppression multiple */}
      <CommonDialog
        open={bulkDeleteDialogOpen}
        title="Supprimer les items sélectionnés"
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleConfirmDeleteMany}
      >
        Êtes-vous sûr de vouloir supprimer les items sélectionnés ? Cette action est irréversible.
      </CommonDialog>
    </MainLayout>
  );
}