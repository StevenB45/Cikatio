import { useState, useCallback } from 'react';
import { Loan, Item, User } from '@/types';
import { useApiCrud } from './useApiCrud';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/common';
import { generateLoanAgreementPDF, downloadPdf } from '../pdfUtils';

export type EditableLoan = Partial<Loan>;

// Hook personnalisé pour gérer les actions sur les prêts
export const useLoanActions = (
  loans: Loan[], 
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>, 
  items: Item[], 
  setItems: React.Dispatch<React.SetStateAction<Item[]>>
) => {
  const [currentLoan, setCurrentLoan] = useState<Partial<Loan>>({});
  const [loanError, setLoanError] = useState<string | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);
  
  // Dialogues
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [openAgreementDialog, setOpenAgreementDialog] = useState(false);
  
  // Récupérer l'API CRUD pour les prêts
  const { updateItem: updateLoan } = useApiCrud<Loan>('/api/loans');
  
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
  
  // Créer un nouveau prêt
  const handleCreateLoan = useCallback(async (newLoan: EditableLoan) => {
    try {
      const createdLoan = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLoan)
      }).then(res => {
        if (!res.ok) throw new Error('Erreur lors de la création du prêt');
        return res.json();
      });
      
      setLoans(prev => [...prev, createdLoan]);
      const borrowedItem = items.find(i => i.id === newLoan.itemId);
      if (borrowedItem) {
        const updatedItem = { ...borrowedItem, reservationStatus: 'BORROWED' };
        setItems(prev => prev.map(item => 
          item.id === borrowedItem.id ? updatedItem : item
        ));
      }
      
      // Ouvrir le dialogue de convention après la création
      setCurrentLoan(createdLoan);
      setOpenLoanDialog(false);
      setOpenAgreementDialog(true);
      return createdLoan;
    } catch (error: any) {
      setLoanError(error.message || 'Une erreur est survenue lors de la création du prêt');
      throw error;
    }
  }, [setLoans, items, setItems]);

  // Traiter le retour d'un prêt
  const handleProcessReturn = useCallback(async () => {
    if (!currentLoan.id) return;
    
    try {
      const response = await fetch(`/api/loans/${currentLoan.id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du retour de l\'item');
      }

      const updatedLoan = await response.json();
      
      // Mettre à jour la liste des prêts
      setLoans(prev => prev.map(loan => 
        loan.id === currentLoan.id ? updatedLoan : loan
      ));

      // L'API s'occupe déjà de la mise à jour du statut de l'item
      // On doit juste rafraîchir notre état local des items
      const itemsResponse = await fetch('/api/items');
      if (itemsResponse.ok) {
        const updatedItems = await itemsResponse.json();
        setItems(updatedItems);
      }

      showNotification('Item retourné avec succès', 'success');
      setOpenReturnDialog(false);
      return true;
    } catch (error) {
      console.error('Erreur lors du retour de l\'item:', error);
      showNotification('Erreur lors du retour de l\'item', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentLoan.id, setLoans, setItems, showNotification]);
  
  // Gérer l'affichage de la convention de prêt
  const handleShowLoanAgreement = useCallback((loan: Loan) => {
    setCurrentLoan(loan);
    setOpenAgreementDialog(true);
  }, []);

  // Fermer le dialogue de convention de prêt
  const handleCloseAgreementDialog = useCallback(() => {
    setOpenAgreementDialog(false);
  }, []);

  const router = useRouter();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  // Naviguer vers les détails d'un item
  const handleItemClick = (item: Item) => {
    router.push(`/items/${item.id}`);
  };

  // Naviguer vers les détails d'un utilisateur
  const handleUserClick = (user: User) => {
    router.push(`/users/${user.id}`);
  };

  // Naviguer vers l'historique d'un prêt
  const handleHistoryClick = (loan: Loan) => {
    router.push(`/items/${loan.itemId}/history`);
  };

  // Retourner un prêt
  const handleReturnItem = async (loan: Loan) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/loans/${loan.id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du retour de l\'item');
      }

      showNotification('Item retourné avec succès', 'success');
      return true;
    } catch (error) {
      console.error('Erreur lors du retour de l\'item:', error);
      showNotification('Erreur lors du retour de l\'item', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Générer et télécharger la convention de prêt
  const handleShowAgreement = async (loan: Loan, options = { download: true }) => {
    setIsLoading(true);
    try {
      const itemResponse = await fetch(`/api/items/${loan.itemId}`);
      const userResponse = await fetch(`/api/users/${loan.borrowerId}`);

      if (!itemResponse.ok || !userResponse.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const item = await itemResponse.json();
      const user = await userResponse.json();

      const pdfBlob = await generateLoanAgreementPDF(loan, item, user);
      
      if (options.download) {
        downloadPdf(pdfBlob, `convention-pret-${loan.id}.pdf`);
      }
      
      return pdfBlob;
    } catch (error) {
      console.error('Erreur lors de la génération de la convention:', error);
      showNotification('Erreur lors de la génération de la convention', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // États
    currentLoan,
    loanError,
    returnError,
    openLoanDialog,
    openReturnDialog,
    openAgreementDialog,
    isLoading,
    
    // Actions
    setCurrentLoan,
    handleOpenNewLoanDialog,
    handleCloseLoanDialog,
    handleOpenReturnDialog,
    handleCloseReturnDialog,
    handleCreateLoan,
    handleProcessReturn,
    handleShowLoanAgreement,
    handleCloseAgreementDialog,
    handleItemClick,
    handleUserClick,
    handleHistoryClick,
    handleReturnItem,
    handleShowAgreement
  };
};

export default useLoanActions;