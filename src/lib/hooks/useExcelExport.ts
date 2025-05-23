import { useState } from 'react';
import ExcelJS from 'exceljs';
import { DatePeriod, Item, Loan, User, LoanContext } from '@/types';
import { GlobalStats } from './useGlobalStats';
import { getDateRangeForPeriod, formatDateToLocal, getPeriodLabel } from '@/lib/utils/dateUtils';
import { contextLabels } from '@/lib/pdfUtils';

export interface ExportConfig {
  filename: string;
  period: DatePeriod;
  customStart?: Date | null;
  customEnd?: Date | null;
}

interface ExportResult {
  isExporting: boolean;
  error: string | null;
  exportData: () => Promise<void>;
}

export const useExcelExport = (
  filteredLoans: Loan[],
  items: Item[],
  users: User[],
  globalStats: GlobalStats,
  config: ExportConfig,
  reservations: any[] = []
): ExportResult => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Statistiques détaillées');
      
      // Style des colonnes
      worksheet.columns = [
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Date début', key: 'startDate', width: 20 },
        { header: 'Date fin', key: 'endDate', width: 20 },
        { header: 'Date retour effective', key: 'returnDate', width: 20 },
        { header: 'Durée (jours)', key: 'duration', width: 15 },
        { header: 'Statut', key: 'status', width: 15 },
        { header: 'Référence item', key: 'itemRef', width: 20 },
        { header: 'Nom item', key: 'itemName', width: 40 },
        { header: 'Catégorie', key: 'itemType', width: 15 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'Contextes', key: 'contexts', width: 40 },
        { header: 'Nom utilisateur', key: 'userName', width: 30 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Administrateur', key: 'admin', width: 30 }
      ];

      // Titre du rapport directement en A1
      worksheet.getCell('A1').value = `Rapport statistique Cikatio - Généré le ${formatDateToLocal(new Date())}`;
      worksheet.mergeCells('A1:N1');
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      worksheet.getRow(1).height = 30;
      worksheet.getColumn('A').width = 100;

      // En-tête des statistiques
      const dateRange = getDateRangeForPeriod(config.period, config.customStart, config.customEnd);
      const periodeLabel = `(du ${formatDateToLocal(dateRange.start)} au ${formatDateToLocal(dateRange.end)})`;

      // En-tête des statistiques avec la période sur la ligne 2
      const statsHeader = worksheet.addRow([`Statistiques générales ${periodeLabel}`, 'Valeur']);
      statsHeader.font = { bold: true };
      worksheet.mergeCells('A2:B2');
      statsHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' }
      };
      statsHeader.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' }
      };

      // Calcul des stats sur la période filtrée
      const borrowedItemIds = new Set(filteredLoans.map(l => l.itemId));
      const reservedItemIds = new Set(reservations.map(r => r.itemId));
      const itemsBorrowedInPeriod = items.filter(i => borrowedItemIds.has(i.id)).length;
      const itemsReservedInPeriod = items.filter(i => reservedItemIds.has(i.id)).length;
      const itemsAvailableInPeriod = items.length - itemsBorrowedInPeriod - itemsReservedInPeriod;
      const totalLoansInPeriod = filteredLoans.length;
      const loansActiveInPeriod = filteredLoans.filter(l => l.status === 'ACTIVE').length;
      const loansOverdueInPeriod = filteredLoans.filter(l => l.status === 'OVERDUE').length;
      const loansReturnedInPeriod = filteredLoans.filter(l => l.status === 'RETURNED').length;
      const loansLostInPeriod = filteredLoans.filter(l => l.status === 'LOST').length;
      const totalUsersInPeriod = new Set(filteredLoans.map(l => l.borrowerId)).size;

      // Statistiques (labels sans la période)
      const stats = [
        ['Total des items', items.length],
        ['Items empruntés', itemsBorrowedInPeriod],
        ['Items réservés', itemsReservedInPeriod],
        ['Items disponibles', itemsAvailableInPeriod],
        ['Total des prêts', totalLoansInPeriod],
        ['Prêts en cours', loansActiveInPeriod],
        ['Prêts en retard', loansOverdueInPeriod],
        ['Prêts retournés', loansReturnedInPeriod],
        ['Prêts perdus', loansLostInPeriod],
        ['Total des utilisateurs', totalUsersInPeriod]
      ];

      stats.forEach(([label, value]) => {
        const row = worksheet.addRow([label, value]);
        row.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
        row.getCell(2).alignment = { horizontal: 'right' };
      });

      worksheet.addRow([]);

      // Période analysée
      const periodLabelFr = getPeriodLabel(config.period, config.customStart, config.customEnd);
      const periodRow = worksheet.addRow(['Période analysée', periodLabelFr]);
      periodRow.font = { bold: true };
      worksheet.mergeCells('A15:B15');
      worksheet.addRow([]);

      // Ajout des en-têtes de colonnes
      const headerRow = worksheet.addRow([
        'Type',
        'Date début',
        'Date fin',
        'Date retour effective',
        'Durée (jours)',
        'Statut',
        'Référence item',
        'Nom item',
        'Catégorie',
        'Service',
        'Contextes',
        'Nom utilisateur',
        'Email',
        'Administrateur'
      ]);

      // Style de l'en-tête des colonnes (appliqué uniquement sur les cellules d'en-tête)
      headerRow.eachCell((cell, colNumber) => {
        if (colNumber <= 14) { // Appliquer le style uniquement sur les 14 colonnes d'en-tête
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });

      // Données des prêts
      filteredLoans.forEach((loan, index) => {
        const item = items.find(i => i.id === loan.itemId);
        const user = users.find(u => u.id === loan.borrowerId);
        const admin = loan.performedById ? users.find(u => u.id === loan.performedById) : null;
        
        const duration = loan.returnedAt ? 
          Math.ceil((new Date(loan.returnedAt).getTime() - new Date(loan.borrowedAt).getTime()) / (1000 * 60 * 60 * 24)) :
          null;

        const row = worksheet.addRow([
          'Prêt',
          formatDateToLocal(loan.borrowedAt),
          formatDateToLocal(loan.dueAt),
          loan.returnedAt ? formatDateToLocal(loan.returnedAt) : '',
          duration || '',
          getStatusLabel(loan.status),
          item?.customId || '',
          item?.name || '',
          item?.category === 'BOOK' ? 'Livre' : 'Matériel',
          item?.serviceCategory || 'Non défini',
          Array.isArray(loan.contexts) && loan.contexts.length > 0 ? (loan.contexts as LoanContext[]).map((c) => contextLabels[c] || c).join(', ') : 'Non défini',
          user ? `${user.firstName} ${user.lastName}` : '',
          user?.email || '',
          admin ? `${admin.firstName} ${admin.lastName}` : ''
        ]);

        // Style alterné pour les lignes
        if (index % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          });
        }

        // Bordures pour toutes les cellules
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
        });
      });

      // Données des réservations
      reservations.forEach((reservation, index) => {
        const item = items.find(i => i.id === reservation.itemId);
        const user = users.find(u => u.id === reservation.userId);
        const admin = reservation.performedById ? users.find(u => u.id === reservation.performedById) : null;
        
        const duration = Math.ceil((new Date(reservation.endDate).getTime() - new Date(reservation.startDate).getTime()) / (1000 * 60 * 60 * 24));

        const row = worksheet.addRow([
          'Réservation',
          formatDateToLocal(reservation.startDate),
          formatDateToLocal(reservation.endDate),
          '',
          duration,
          getReservationStatusLabel(reservation.status),
          item?.customId || '',
          item?.name || '',
          item?.category === 'BOOK' ? 'Livre' : 'Matériel',
          item?.serviceCategory || 'Non défini',
          '',
          user ? `${user.firstName} ${user.lastName}` : '',
          user?.email || '',
          admin ? `${admin.firstName} ${admin.lastName}` : ''
        ]);

        // Style alterné pour les lignes
        if ((filteredLoans.length + index) % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          });
        }

        // Bordures pour toutes les cellules
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
        });
      });

      // Ajout des filtres automatiques après toutes les données
      const lastRow = worksheet.lastRow?.number || 17;
      worksheet.autoFilter = {
        from: { row: 17, column: 1 },
        to: { row: lastRow, column: 14 } // La colonne 14 correspond à la colonne "Administrateur"
      };

      // Génération du fichier
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.filename}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      setError("Erreur lors de l'export Excel");
      console.error('Erreur export Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, error, exportData };
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'En cours',
    'OVERDUE': 'En retard',
    'RETURNED': 'Retourné',
    'LOST': 'Perdu'
  };
  return statusMap[status] || status;
};

const getReservationStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'CONFIRMED': 'Confirmée',
    'PENDING': 'En attente',
    'CANCELLED': 'Annulée',
    'EXPIRED': 'Expirée'
  };
  return statusMap[status] || status;
};