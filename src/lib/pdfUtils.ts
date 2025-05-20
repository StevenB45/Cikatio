import { jsPDF } from 'jspdf';
import { LoanContext } from '@prisma/client';
import 'jspdf-autotable'; // Import pour des fonctionnalités supplémentaires si nécessaire

// Define types for better code clarity
interface Borrower {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface Item {
  name: string;
  customId: string;
  description?: string;
}

// Labels en français pour les contextes
export const contextLabels: Record<LoanContext, string> = {
  CONFERENCE_FINANCEURS: "Conférence des financeurs",
  APPUIS_SPECIFIQUES: "Appuis spécifiques",
  PLATEFORME_AGEFIPH: "Plateforme Agefiph",
  AIDANTS: "Aidants",
  RUNE: "RUNE",
  PNT: "PNT",
  SAVS: "SAVS",
  CICAT: "CICAT",
  LOGEMENT_INCLUSIF: "Logement inclusif"
};

// Configuration constants for PDF generation
const PDF_CONFIG = {
  margin: { top: 25, right: 20, bottom: 25, left: 20 },
  fontSize: { title: 16, subtitle: 12, normal: 10, small: 8 },
  lineHeight: 6,
  colors: { 
    primary: '#003366', 
    secondary: '#4F81BD', 
    dark: '#333333', 
    light: '#CCCCCC', 
    background: '#F8F8F8' 
  },
  pageWidth: 210,
  pageHeight: 297,
};

// Helper function to format dates
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Helper function to add header to each page
const addDocumentHeader = (doc: jsPDF, title: string, logoUrl?: string): number => {
  const pageWidth = PDF_CONFIG.pageWidth;
  let yPos = PDF_CONFIG.margin.top;

  // Optional Logo
  if (logoUrl) {
    // Assuming logo is square, adjust dimensions as needed
    // doc.addImage(logoUrl, 'PNG', PDF_CONFIG.margin.left, yPos - 15, 20, 20);
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_CONFIG.fontSize.title);
  doc.setTextColor(PDF_CONFIG.colors.primary);
  doc.text(title, pageWidth / 2, yPos, { align: 'center' });
  yPos += PDF_CONFIG.lineHeight * 2; // Space after title

  // Decorative line
  doc.setDrawColor(PDF_CONFIG.colors.secondary);
  doc.setLineWidth(0.5);
  doc.line(PDF_CONFIG.margin.left, yPos, pageWidth - PDF_CONFIG.margin.right, yPos);
  yPos += PDF_CONFIG.lineHeight * 1.5; // Space after line

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_CONFIG.fontSize.normal);
  doc.setTextColor(PDF_CONFIG.colors.dark);

  return yPos;
};


// Helper function to add footer to each page
const addPageFooter = (doc: jsPDF, pageNumber: number, totalPages: number): void => {
  const pageWidth = PDF_CONFIG.pageWidth;
  const pageHeight = PDF_CONFIG.pageHeight;
  const footerText = 'CICAT - Fédération des Aveugles et Amblyopes de France Val De Loire - 7 rue Antigna, 45000 Orléans';
  const pageInfo = `Page ${pageNumber} sur ${totalPages}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_CONFIG.fontSize.small);
  doc.setTextColor(PDF_CONFIG.colors.dark);

  // Calculate text width to center it if needed, or split if too long
  const footerTextWidth = doc.getTextWidth(footerText);
  const availableWidth = pageWidth - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right;

  if (footerTextWidth > availableWidth) {
      // Split text if it's too long
      const splitText = doc.splitTextToSize(footerText, availableWidth);
      doc.text(splitText, PDF_CONFIG.margin.left, pageHeight - PDF_CONFIG.margin.bottom + 5, { align: 'left' });
  } else {
      // Center text if it fits
      doc.text(footerText, pageWidth / 2, pageHeight - PDF_CONFIG.margin.bottom + 5, { align: 'center' });
  }


  // Page number on the right
  doc.text(pageInfo, pageWidth - PDF_CONFIG.margin.right, pageHeight - PDF_CONFIG.margin.bottom + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_CONFIG.fontSize.normal);
  doc.setTextColor(PDF_CONFIG.colors.dark);
};


// Utilitaires pour générer des conventions de prêt PDF (version complète et simplifiée)
// Utilise jsPDF pour la génération de documents PDF personnalisés

// Main function to generate the loan agreement PDF
export const generateLoanAgreementPDF = (
  borrower: Borrower, // Use Borrower interface
  items: Item[], // Accept an array of items
  startDate: Date,
  dueDate: Date,
  additionalInfo?: string,
  logoUrl?: string, // Optional logo URL
  contexts: LoanContext[] = [] // Nouveau paramètre pour les contextes
): jsPDF => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    });

    const pageWidth = PDF_CONFIG.pageWidth;
    const pageHeight = PDF_CONFIG.pageHeight;
    let currentPage = 1;

    // --- Page 1 ---
    let yPos = addDocumentHeader(doc, 'CONVENTION DE PRÊT DE MATÉRIEL', logoUrl);

    // Reference and Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_CONFIG.fontSize.normal);
    doc.setTextColor(PDF_CONFIG.colors.dark);
    doc.text(`Référence: PRET-${new Date().getFullYear()}-${items.map(i => i.customId).join(',')}`,
      PDF_CONFIG.margin.left, yPos);
    doc.text(`Date: ${formatDate(new Date())}`, pageWidth - PDF_CONFIG.margin.right, yPos, { align: 'right' });
    yPos += PDF_CONFIG.lineHeight * 1.5; // Reduced spacing

    // Parties Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    doc.setTextColor(PDF_CONFIG.colors.secondary);
    doc.text('ENTRE LES SOUSSIGNÉS', pageWidth / 2, yPos, { align: 'center' });
    yPos += PDF_CONFIG.lineHeight * 1.5; // Reduced spacing

    // Lender and Borrower Info Side-by-Side
    const startYParties = yPos;
    const colWidth = (pageWidth - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right - 10) / 2; // 10mm gap

    // Lender Info (Left Column)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.normal);
    doc.setTextColor(PDF_CONFIG.colors.dark);
    doc.text('Le prêteur:', PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text('CICAT - Fédération des Aveugles et', PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight * 0.8; // Tighter spacing
    doc.text('Amblyopes de France Val De Loire', PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight * 0.8;
    doc.text('7 rue Antigna, 45000 Orléans', PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight * 0.8;
    doc.text('Tél : 02 38 66 35 40', PDF_CONFIG.margin.left, yPos);

    // Borrower Info (Right Column)
    yPos = startYParties; // Reset Y for the second column
    const borrowerX = PDF_CONFIG.margin.left + colWidth + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.normal);
    doc.setTextColor(PDF_CONFIG.colors.dark);
    doc.text("L'emprunteur:", borrowerX, yPos); // Use double quotes
    yPos += PDF_CONFIG.lineHeight * 0.8;
    doc.text(borrower.name, borrowerX, yPos);
    yPos += PDF_CONFIG.lineHeight * 0.8;
    if (borrower.address) {
      const splitAddress = doc.splitTextToSize(borrower.address, colWidth);
      doc.text(splitAddress, borrowerX, yPos);
      yPos += splitAddress.length * PDF_CONFIG.lineHeight * 0.8;
    }
    doc.text(borrower.email, borrowerX, yPos);
    yPos += PDF_CONFIG.lineHeight * 0.8;
    if (borrower.phone) {
      doc.text(`Tél : ${borrower.phone}`, borrowerX, yPos);
      yPos += PDF_CONFIG.lineHeight * 0.8;
    }


    // Adjust yPos to be the max of both columns + spacing
    yPos = Math.max(yPos, startYParties + 5 * PDF_CONFIG.lineHeight) + PDF_CONFIG.lineHeight * 2; // Ensure space after parties


    // Agreement Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    doc.setTextColor(PDF_CONFIG.colors.secondary);
    doc.text('IL A ÉTÉ CONVENU CE QUI SUIT', pageWidth / 2, yPos, { align: 'center' });
    yPos += PDF_CONFIG.lineHeight * 1.5; // Reduced spacing

    // Article 1 - Object
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.normal);
    doc.setTextColor(PDF_CONFIG.colors.dark);
    doc.text('Article 1 - Objet du prêt', PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(`Le prêteur met à disposition de l'emprunteur le(s) matériel(s) suivant(s) :`, PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight * 0.5; // Space before box

    // Material details box for multiple items
    const boxStartY = yPos;
    doc.setDrawColor(PDF_CONFIG.colors.light);
    doc.setFillColor(PDF_CONFIG.colors.background); // Lighter background
    const boxHeight = PDF_CONFIG.lineHeight * (items.length * 1.5 + 1.5); // 1.5 lines per item + header
    doc.roundedRect(
      PDF_CONFIG.margin.left,
      yPos,
      pageWidth - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right,
      boxHeight,
      2,
      2,
      'FD'
    );
    yPos += PDF_CONFIG.lineHeight; // Padding inside box
    doc.setFont('helvetica', 'bold');
    doc.text('Matériels prêtés :', PDF_CONFIG.margin.left + 5, yPos);
    yPos += PDF_CONFIG.lineHeight;
    doc.setFont('helvetica', 'normal');
    items.forEach((item) => {
      doc.text(`Nom : ${item.name}   |   Code barre : ${item.customId}`, PDF_CONFIG.margin.left + 5, yPos);
      yPos += PDF_CONFIG.lineHeight * 0.9;
    });
    yPos = boxStartY + boxHeight + PDF_CONFIG.lineHeight; // Position after box + spacing

    // Article 2 - Duration
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.normal);
    doc.setTextColor(PDF_CONFIG.colors.dark);
    doc.text('Article 2 - Durée du prêt', PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(`Le prêt est consenti pour une durée déterminée, du ${formatDate(startDate)} au ${formatDate(dueDate)}.`, PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight * 1.2; // Réduit l'espace après l'article 2

    // Vérifier si on doit passer à la page suivante
    const pageContentLimit = pageHeight - PDF_CONFIG.margin.bottom - 35; // Réduction de la marge de sécurité à 35mm
    if (yPos > pageContentLimit) {
      addPageFooter(doc, currentPage, 1); // Footer page 1
      doc.addPage();
      currentPage++;
      yPos = addDocumentHeader(doc, 'CONVENTION DE PRÊT DE MATÉRIEL', logoUrl);
    }

    // Ajouter les contextes avant les conditions générales
    if (contexts.length > 0) {
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Contexte de la demande:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      
      const contextTexts = contexts.map(context => `- ${contextLabels[context]}`);
      contextTexts.forEach(text => {
        doc.text(text, 20, yPos);
        yPos += 7;
      });
      yPos += 3;
    }

    // Article 3 - Conditions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.normal);
    doc.setTextColor(PDF_CONFIG.colors.dark);
    doc.text('Article 3 - Conditions générales', PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight;
    doc.setFont('helvetica', 'normal');
    const conditions = [
      "- L'emprunteur s'engage à utiliser le matériel conformément à sa destination.",
      "- L'emprunteur est responsable du matériel prêté et de son entretien.",
      "- En cas de dommage ou de perte, l'emprunteur s'engage à en informer immédiatement le prêteur.",
      "- Le matériel devra être restitué dans l'état dans lequel il a été prêté, exception faite de l'usure normale.",
      "- L'emprunteur s'engage à ne pas céder le matériel à un tiers sans accord préalable du prêteur.",
      "- Le prêteur se réserve le droit de réclamer la restitution du matériel à tout moment en cas de besoin légitime.",
      "- L'emprunteur s'engage à restituer le matériel dans les délais convenus."
    ];
    conditions.forEach((condition) => {
      const splitCondition = doc.splitTextToSize(condition, pageWidth - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right);
      if (yPos + splitCondition.length * PDF_CONFIG.lineHeight * 0.9 > pageContentLimit) {
        addPageFooter(doc, currentPage, 1);
        doc.addPage();
        currentPage++;
        yPos = addDocumentHeader(doc, 'CONVENTION DE PRÊT DE MATÉRIEL', logoUrl);
      }
      doc.text(splitCondition, PDF_CONFIG.margin.left, yPos);
      yPos += splitCondition.length * PDF_CONFIG.lineHeight * 0.9;
    });
    yPos += PDF_CONFIG.lineHeight * 0.5;

    // Additional information if provided
    if (additionalInfo && additionalInfo.trim().length > 0) {
      if (yPos + PDF_CONFIG.lineHeight * 3 > pageContentLimit) {
        addPageFooter(doc, currentPage, 1);
        doc.addPage();
        currentPage++;
        yPos = addDocumentHeader(doc, 'CONVENTION DE PRÊT DE MATÉRIEL', logoUrl);
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Notes complémentaires:', PDF_CONFIG.margin.left, yPos);
      yPos += PDF_CONFIG.lineHeight;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(additionalInfo, pageWidth - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right);
      doc.text(splitNotes, PDF_CONFIG.margin.left, yPos);
      yPos += splitNotes.length * PDF_CONFIG.lineHeight * 0.9 + PDF_CONFIG.lineHeight; // Space after notes
    }

    // Location and Date of Signature
    if (yPos + PDF_CONFIG.lineHeight * 8 > pageContentLimit) {
      addPageFooter(doc, currentPage, 1);
      doc.addPage();
      currentPage++;
      yPos = addDocumentHeader(doc, 'CONVENTION DE PRÊT DE MATÉRIEL', logoUrl);
    }
    doc.setFont('helvetica', 'normal'); // Ensure normal style
    doc.setFontSize(PDF_CONFIG.fontSize.normal); // Ensure normal size
    doc.setTextColor(PDF_CONFIG.colors.dark); // Ensure dark color
    doc.text(`Fait à Orléans, le ${formatDate(new Date())}`, PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight * 2; // Space before signatures

    // Signatures Section (Side-by-Side)
    const signatureY = yPos;
    const signatureLenderX = PDF_CONFIG.margin.left;
    const signatureBorrowerX = PDF_CONFIG.margin.left + colWidth + 10; // Align with borrower info column

    doc.setFont('helvetica', 'bold'); // Bold for labels
    doc.setFontSize(PDF_CONFIG.fontSize.normal); // Normal size for labels
    doc.setTextColor(PDF_CONFIG.colors.dark); // Dark color for labels
    doc.text('Pour le prêteur:', signatureLenderX, yPos);
    doc.text("Pour l'emprunteur:", signatureBorrowerX, yPos); // Use double quotes
    yPos += PDF_CONFIG.lineHeight * 1.5; // Space before signature line

    doc.setFont('helvetica', 'normal'); // Normal style for "Signature:"
    doc.setFontSize(PDF_CONFIG.fontSize.normal); // Normal size for "Signature:"
    doc.setTextColor(PDF_CONFIG.colors.dark); // Dark color for "Signature:"
    doc.text('Signature:', signatureLenderX, yPos);
    doc.text('Signature:', signatureBorrowerX, yPos);
    yPos += PDF_CONFIG.lineHeight * 5; // Plus d'espace après les signatures

    // Return Section Title
    if (yPos + PDF_CONFIG.lineHeight * 5 > pageContentLimit) {
      addPageFooter(doc, currentPage, 1);
      doc.addPage();
      currentPage++;
      yPos = addDocumentHeader(doc, 'CONVENTION DE PRÊT DE MATÉRIEL', logoUrl);
      // Remove the redundant header on the new page if it's just for the return section
      // yPos = PDF_CONFIG.margin.top; // Reset yPos if header is removed
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.subtitle); // Subtitle size for section title
    doc.setTextColor(PDF_CONFIG.colors.secondary); // Secondary color for section title
    doc.text('RESTITUTION DU MATÉRIEL', pageWidth / 2, yPos, { align: 'center' });
    yPos += PDF_CONFIG.lineHeight * 1.5; // Reduced spacing

    // Return Fields
    doc.setFont('helvetica', 'normal'); // Normal style for labels
    doc.setFontSize(PDF_CONFIG.fontSize.normal); // Normal size for labels
    doc.setTextColor(PDF_CONFIG.colors.dark); // Dark color for labels
    doc.text('Matériel restitué le : ____________________', PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight * 1.5; // Reduced spacing
    doc.text('Commentaires :', PDF_CONFIG.margin.left, yPos);
    yPos += PDF_CONFIG.lineHeight;
    doc.setDrawColor(PDF_CONFIG.colors.light);
    doc.line(PDF_CONFIG.margin.left, yPos, pageWidth - PDF_CONFIG.margin.right, yPos); // Line for comments
    yPos += PDF_CONFIG.lineHeight;
    doc.line(PDF_CONFIG.margin.left, yPos, pageWidth - PDF_CONFIG.margin.right, yPos); // Line for comments


    // Footer dernière page
    addPageFooter(doc, currentPage, currentPage);

    return doc;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('Erreur lors de la génération du PDF. Veuillez réessayer.');
  }
};


// Fonction principale : generateLoanAgreementPDF (génère une convention de prêt professionnelle)

// Simplified version (if needed, keep or remove based on usage)
export const generateSimplifiedLoanAgreement = (
  borrowerName: string,
  borrowerEmail: string,
  itemName: string,
  itemId: string,
  startDate: Date,
  dueDate: Date,
  notes?: string
): jsPDF => {
  const doc = new jsPDF();
  // ... (Keep simplified logic or remove if generateLoanAgreementPDF is sufficient)
  // Simplified version might need similar styling updates if kept
  // For now, focusing on the main function based on the image provided.
  // Add title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Convention de prêt simplifiée', 105, 20, { align: 'center' });

  // Add content
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let yPos = 40;
  doc.text(`Emprunteur : ${borrowerName} (${borrowerEmail})`, 20, yPos);
  yPos += 10;
  doc.text(`Objet prêté : ${itemId} - ${itemName}`, 20, yPos);
  yPos += 15;
  doc.text(`Date d\'emprunt : ${formatDate(startDate)}`, 20, yPos); // Escape quote
  yPos += 10;
  doc.text(`Date de retour prévue : ${formatDate(dueDate)}`, 20, yPos);
  yPos += 15;
  doc.text('Conditions :', 20, yPos);
  yPos += 10;
  doc.text("- L\'emprunteur s\'engage à restituer l\'objet en bon état.", 20, yPos); // Escape quotes
  yPos += 7;
  doc.text("- En cas de dommage ou perte, l\'emprunteur est responsable.", 20, yPos); // Escape quote
  yPos += 20;

  if (notes && notes.trim().length > 0) {
    doc.text('Notes :', 20, yPos);
    yPos += 7;
    const splitNotes = doc.splitTextToSize(notes, 170); // A4 width approx 210mm, margins ~20mm each side
    doc.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 7 + 10; // Adjust yPos based on number of lines
  }

  doc.text("Signature de l\'emprunteur : _____________________", 20, yPos); // Escape quote
  yPos += 15;
  doc.text('Date : ' + formatDate(new Date()), 20, yPos);

  return doc;
};

// Fonction simplifiée : generateSimplifiedLoanAgreement (version allégée, rarement utilisée)

// Fonction utilitaire pour télécharger un PDF généré avec jsPDF
export function downloadPdf(doc: any, filename: string) {
  try {
    // Vérifier si doc est une instance de jsPDF
    if (doc && typeof doc.save === 'function') {
      // Utiliser directement la méthode save de jsPDF
      doc.save(filename);
    } 
    // Vérifier si doc est un Blob
    else if (doc instanceof Blob) {
      // Créer un URL pour le Blob
      const url = window.URL.createObjectURL(doc);
      
      // Créer un élément <a> pour déclencher le téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      // Ajouter l'élément au DOM, cliquer dessus, puis le supprimer
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer après un court délai
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } else {
      console.error("Format de document non pris en charge pour le téléchargement");
      throw new Error("Format de document non pris en charge");
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement du PDF:", error);
    throw error;
  }
}