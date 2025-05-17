import React, { useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  DialogProps
} from '@mui/material';
import {
  Check as CheckIcon,
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { Item, User } from '@/types';
import { formatDate } from '@/lib/utils';
import { generateLoanAgreementPDF } from '@/lib/pdfUtils';
import { LoanContext } from '@prisma/client';

interface LoanAgreementProps {
  open: boolean;
  onClose: () => void;
  borrower: User | null;
  items: Item[];
  startDate: Date;
  dueDate: Date;
  notes?: string;
  dialogProps?: DialogProps;
  contexts?: LoanContext[]; // Ajout des contextes
}

// Labels en français pour les contextes
const contextLabels: Record<LoanContext, string> = {
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

/**
 * Composant pour afficher et gérer les conventions de prêt
 */
const LoanAgreement: React.FC<LoanAgreementProps> = ({
  open,
  onClose,
  borrower,
  items,
  startDate,
  dueDate,
  notes,
  dialogProps,
  contexts = [], // Valeur par défaut pour les contextes
}) => {
  // État pour le mode d'édition du texte brut
  const [editingRawText, setEditingRawText] = useState(false);
  const [agreementText, setAgreementText] = useState('');
  const [saveConfirmation, setSaveConfirmation] = useState(false);

  // Extraire un texte formaté à partir du contenu du dialogue
  const extractFormattedTextFromDialog = (element: Element): string => {
    // Récupérer les sections principales
    const prêteur = element.querySelector(':scope > div:nth-child(1)')?.textContent?.trim() || '';
    const matériel = element.querySelector(':scope > h6:nth-child(3)')?.textContent?.trim() || '';
    const conditionsTitle = element.querySelector(':scope > h6:nth-child(5)')?.textContent?.trim() || '';
    const conditionsList = Array.from(element.querySelectorAll('ul > li')).map(li => li.textContent?.trim());
    const notes = element.querySelector(':scope > div:nth-child(7) > h6')?.nextSibling?.textContent?.trim();
    
    // Assembler le texte formaté
    let textFormatted = `CONVENTION DE PRÊT DE MATÉRIEL\n\n`;
    textFormatted += `${prêteur}\n\n`;
    textFormatted += `${matériel}\n\n`;
    textFormatted += `${conditionsTitle}\n`;
    conditionsList.forEach(condition => {
      textFormatted += `${condition}\n`;
    });
    
    if (notes) {
      textFormatted += `\nNotes complémentaires:\n${notes}\n`;
    }
    
    return textFormatted;
  };

  // Activer le mode d'édition de texte brut
  const handleEditRaw = () => {
    const dialogContent = document.querySelector('.MuiDialogContent-root');
    if (dialogContent) {
      // Extraire le texte de manière organisée
      const extractedText = extractFormattedTextFromDialog(dialogContent);
      setAgreementText(extractedText);
      setEditingRawText(true);
    }
  };

  // Enregistrer les modifications de texte brut
  const handleSaveRawText = () => {
    setEditingRawText(false);
    setSaveConfirmation(true);
    setTimeout(() => setSaveConfirmation(false), 3000);
  };

  // Télécharger la convention en PDF
  const handleDownloadPDF = async () => {
    if (!borrower) {
      alert("Impossible de générer le PDF : informations de l'emprunteur manquantes");
      return;
    }
    
    if (items.length === 0) {
      alert("Impossible de générer le PDF : aucun item sélectionné");
      return;
    }

    try {
      const borrowerData = {
        name: `${borrower.firstName} ${borrower.lastName}`.trim(),
        email: borrower.email || 'Email non renseigné',
        phone: borrower.phone || undefined,
        address: borrower.address || undefined
      };
      
      if (!borrowerData.name) {
        throw new Error("Nom de l'emprunteur manquant");
      }
      
      const itemsData = items.map(item => ({
        name: item.name || 'Item sans nom',
        customId: item.customId || 'ID non renseigné',
        description: item.description
      }));
      
      const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
        ? startDate : new Date();
      const validDueDate = dueDate instanceof Date && !isNaN(dueDate.getTime()) 
        ? dueDate : new Date(validStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const date = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      const timeStr = `${pad(date.getHours())}h${pad(date.getMinutes())}`;
      const nom = `${borrower.lastName || 'utilisateur'}_${borrower.firstName || ''}`.replace(/\s+/g, '_').toLowerCase();
      const fileName = `convention_pret_${nom}_${dateStr}_${timeStr}.pdf`;

      console.log("Génération du PDF avec les données:", {
        emprunteur: borrowerData,
        items: itemsData,
        dateDebut: validStartDate,
        dateFin: validDueDate,
        contextes: contexts
      });

      const doc = generateLoanAgreementPDF(
        borrowerData,
        itemsData,
        validStartDate,
        validDueDate,
        notes,
        undefined,
        contexts
      );

      if (!doc) {
        throw new Error("La génération du PDF a échoué");
      }

      // Utiliser un délai plus long pour les navigateurs plus lents
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        doc.save(fileName);
        console.log("PDF sauvegardé avec succès");
      } catch (saveError) {
        console.error("Erreur lors de la sauvegarde directe, tentative alternative:", saveError);
        
        try {
          const blob = new Blob([doc.output('blob')], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          
          // Nettoyage après téléchargement
          setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 1000);
        } catch (blobError) {
          console.error("Échec de la méthode alternative:", blobError);
          alert("Impossible de télécharger le PDF. Veuillez vérifier les autorisations de votre navigateur.");
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert(error.message || "Une erreur est survenue lors de la génération du PDF.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      {...dialogProps}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Convention de prêt de matériel</Typography>
          {items.length > 0 && borrower && (
            <Typography variant="caption" color="text.secondary">
              Référence: PRET-{new Date().getFullYear()}-{items[0].customId}
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {editingRawText ? (
          <TextField
            multiline
            fullWidth
            rows={20}
            variant="outlined"
            value={agreementText}
            onChange={(e) => setAgreementText(e.target.value)}
            sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
          />
        ) : (
          <>
            <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}>
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Prêteur:</Typography>
                  <Typography variant="body2">CICAT - Fédération des Aveugles et</Typography>
                  <Typography variant="body2">Amblyopes de France Val De Loire</Typography>
                  <Typography variant="body2">12 rue Jules Simon, 37000 Tours</Typography>
                  <Typography variant="body2">Tél : 02 47 05 23 98</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Emprunteur:</Typography>
                  {borrower && (
                    <>
                      <Typography variant="body2">{borrower.firstName} {borrower.lastName}</Typography>
                      <Typography variant="body2">{borrower.email}</Typography>
                      {borrower.phone && <Typography variant="body2">Tél : {borrower.phone}</Typography>}
                      {borrower.address && <Typography variant="body2">{borrower.address}</Typography>}
                    </>
                  )}
                </Box>
              </Box>
            </Box>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
              Matériel prêté:
            </Typography>
            
            <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              {items.map(item => (
                <Box sx={{ mb: 2 }} key={item.id}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Référence:</Typography>
                      <Typography variant="body2">{item.customId}</Typography>
                    </Box>
                    <Box sx={{ flex: 3 }}>
                      <Typography variant="subtitle2">Description:</Typography>
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">Période de prêt:</Typography>
                    <Typography variant="body2">
                      Du {formatDate(startDate)} au {formatDate(dueDate)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Conditions générales
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" gutterBottom>
                L'emprunteur s'engage à utiliser le matériel conformément à sa destination.
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                L'emprunteur est responsable du matériel prêté et de son entretien.
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                En cas de dommage ou de perte, l'emprunteur s'engage à en informer immédiatement le prêteur.
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                Le matériel devra être restitué dans l'état dans lequel il a été prêté, exception faite de l'usure normale.
              </Typography>
            </Box>
            
            {notes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Notes complémentaires:</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{notes}</Typography>
              </Box>
            )}
            
            {/* Ajout des contextes */}
            {contexts.length > 0 && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Contexte de la demande :
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {contexts.map((context) => (
                    <Box
                      key={context}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                      }}
                    >
                      {contextLabels[context]}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Typography variant="subtitle2">Pour le prêteur:</Typography>
                <Box sx={{ mt: 1, height: '60px', width: '150px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Signature</Typography>
                </Box>
              </div>
              
              <div>
                <Typography variant="subtitle2">Pour l'emprunteur:</Typography>
                <Box sx={{ mt: 1, height: '60px', width: '150px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Signature</Typography>
                </Box>
              </div>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {editingRawText ? (
          <Button
            startIcon={<CheckIcon />}
            onClick={handleSaveRawText}
            variant="contained"
            color="success"
          >
            Enregistrer les modifications
          </Button>
        ) : (
          <>
            {saveConfirmation && (
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                <CheckIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  Modifications enregistrées
                </Typography>
              </Box>
            )}
            <Button
              startIcon={<EditIcon />}
              onClick={handleEditRaw}
              variant="outlined"
            >
              Éditer le texte brut
            </Button>
          </>
        )}
        <Button 
          startIcon={<PdfIcon />}
          onClick={handleDownloadPDF}
          variant="contained"
          color="primary"
        >
          Télécharger en PDF
        </Button>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoanAgreement;