import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Constante de mapping pour les libellés d'actions - cohérent avec getUserHistory.ts
const STATUS_TO_ACTION_LABEL = {
  'RETURNED': 'Retour',           // Modifié pour être cohérent
  'ACTIVE': 'Emprunt',            // Modifié pour être cohérent
  'OVERDUE': 'Retard de prêt',    // Plus clair
  'SCHEDULED': 'Prêt programmé',
  'OUT_OF_ORDER': 'Item indisponible'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const itemId = searchParams.get('itemId');
  
  if (!userId && !itemId) {
    return NextResponse.json({ error: 'userId ou itemId requis' }, { status: 400 });
  }
  
  try {
    // Construit les conditions de recherche plus robustes
    let whereCondition: any = {};
    
    if (userId) {
      whereCondition = {
        OR: [
          { userId: userId },
          { loan: { borrowerId: userId } }
        ]
      };
    }
    
    if (itemId) {
      whereCondition = {
        ...whereCondition,
        loan: {
          ...(whereCondition.loan || {}),
          itemId: itemId
        }
      };
    }
    
    // Récupère les historiques de prêts selon les critères avec une meilleure inclusion des relations
    const loanHistories = await prisma.loanHistory.findMany({
      where: whereCondition,
      include: {
        loan: {
          include: { 
            item: true,
            borrower: true
          }
        },
        user: true,
        performedBy: true
      },
      orderBy: { date: 'desc' }
    });
    
    // Amélioration de la récupération des items et utilisateurs liés aux prêts
    // pour les entrées d'historique qui pourraient manquer de données
    const loanIds = loanHistories.map(lh => lh.loanId).filter(Boolean);
    
    // Préchargement des prêts avec leurs relations complètes
    const loans = loanIds.length > 0 ? await prisma.loan.findMany({
      where: { id: { in: loanIds } },
      include: {
        item: true,
        borrower: true
      }
    }) : [];
    
    // Créer un map pour accès rapide
    const loansMap = loans.reduce((acc, loan) => {
      acc[loan.id] = loan;
      return acc;
    }, {} as Record<string, any>);
    
    // Formate la réponse pour l'UI avec des libellés plus clairs et des données complètes
    const result = loanHistories.map(lh => {
      // Récupérer le prêt complet soit via l'inclusion directe, soit via le map préchargé
      const loanComplete = lh.loan || loansMap[lh.loanId];
      
      // Utiliser le mapping pour l'action selon le statut
      let actionLabel = STATUS_TO_ACTION_LABEL[lh.status] || 'Mise à jour du statut';
      
      // Assurer la cohérence des commentaires avec les actions
      let comment = lh.comment || '';
      
      // Si le commentaire existant contient "Retour" ou "Création", on respecte le format existant
      if (!(lh.comment && (lh.comment.includes('Retour') || lh.comment.includes('Création')))) {
        // Sinon, on assure la cohérence
        if (lh.status === 'RETURNED' && !comment) {
          comment = 'Retour de l\'item';
        } else if (lh.status === 'ACTIVE' && !comment) {
          comment = 'Création du prêt';
        }
      }

      // Déterminer l'utilisateur pertinent (utilisateur de l'historique ou emprunteur du prêt)
      const relevantUser = lh.user || (loanComplete?.borrower);
      const userName = relevantUser ? 
        `${relevantUser.firstName || ''} ${relevantUser.lastName || ''}`.trim() : 
        'Utilisateur inconnu';
      
      // Récupération de l'info sur qui a effectué l'action
      const performedByUser = lh.performedBy;
      const performedByName = performedByUser ? 
        `${performedByUser.firstName || ''} ${performedByUser.lastName || ''}`.trim() : 
        null;
        
      // Améliorer le commentaire avec l'information sur l'administrateur
      if (performedByName && !comment.includes(performedByName)) {
        comment = `${comment} (par ${performedByName})`;
      }
      
      // Vérifier si la date est valide
      let formattedDate = '-';
      if (lh.date) {
        const dateObj = new Date(lh.date);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString('fr-FR');
        }
      }
      
      // Formatage des dates additionnelles si elles existent dans le prêt complet
      let borrowedAtFormatted = 'Non spécifiée';
      let dueAtFormatted = 'Non spécifiée';
      
      // Pour les actions ACTIVE (prêt), utiliser directement la date de l'action
      if (lh.status === 'ACTIVE' && formattedDate !== '-') {
        borrowedAtFormatted = formattedDate;
      }
      // Pour les autres cas, essayer d'utiliser la date du prêt
      else if (loanComplete) {
        try {
          if (loanComplete.borrowedAt) {
            const borrowedDate = new Date(loanComplete.borrowedAt);
            if (!isNaN(borrowedDate.getTime())) {
              borrowedAtFormatted = borrowedDate.toLocaleDateString('fr-FR');
            } else {
              console.warn(`Date d'emprunt invalide pour le prêt ${loanComplete.id}: ${loanComplete.borrowedAt}`);
            }
          }
          
          if (loanComplete.dueAt) {
            const dueDate = new Date(loanComplete.dueAt);
            if (!isNaN(dueDate.getTime())) {
              dueAtFormatted = dueDate.toLocaleDateString('fr-FR');
            } else {
              console.warn(`Date de retour prévue invalide pour le prêt ${loanComplete.id}: ${loanComplete.dueAt}`);
            }
          }
        } catch (error) {
          console.error('Erreur lors du formatage des dates du prêt:', error);
        }
      }
        
      return {
        id: lh.id,
        action: actionLabel,
        itemName: loanComplete?.item?.name || 'Item inconnu',
        itemId: loanComplete?.itemId || lh.loanId,
        userId: lh.userId || loanComplete?.borrowerId,
        user: userName,
        userObj: relevantUser,
        date: formattedDate,
        status: lh.status,
        comment: comment,
        loanId: lh.loanId,
        borrowedAt: borrowedAtFormatted,
        dueAt: dueAtFormatted,
        performedById: lh.performedById,
        performedBy: performedByUser ? {
          firstName: performedByUser.firstName || '',
          lastName: performedByUser.lastName || ''
        } : null
      };
    });
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/loan-history error:', err);
    return NextResponse.json({ error: 'Erreur serveur lors de la récupération de l\'historique des statuts' }, { status: 500 });
  }
}
