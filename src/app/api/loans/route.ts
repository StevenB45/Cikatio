import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LoanStatus, LoanContext, Loan } from '@prisma/client';

type LoanWithDates = {
  returnedAt: Date | null;
  lostAt?: Date | null;
  borrowedAt: Date | null;
  dueAt: Date | null;
}

// Définir des types personnalisés pour gérer LOST qui n'existe pas dans l'enum
type ExtendedLoanStatus = LoanStatus | 'LOST';

function computeLoanStatus(loan: LoanWithDates): LoanStatus {
  if (loan.returnedAt) return 'RETURNED';
  // Si l'item est marqué comme perdu mais que ce n'est pas un statut officiel, traiter comme OUT_OF_ORDER
  if (loan.lostAt) return 'OUT_OF_ORDER';
  // Vérifier si le prêt est programmé dans le futur
  if (loan.borrowedAt && new Date(loan.borrowedAt) > new Date()) return 'SCHEDULED';
  if (loan.dueAt && new Date(loan.dueAt) < new Date()) return 'OVERDUE';
  return 'ACTIVE';
}

export async function GET(req: Request) {
  try {
    console.log('API GET /loans: Début de la récupération des prêts');
    // Extraction des paramètres de requête
    const url = new URL(req.url);
    const itemId = url.searchParams.get('itemId');
    const includeItemWithoutLoan = url.searchParams.get('includeItemWithoutLoan') === 'true';
    console.log(`API GET /loans: Paramètres - itemId: ${itemId}, includeItemWithoutLoan: ${includeItemWithoutLoan}`);
    
    // Création d'un filtre conditionnel pour Prisma
    const where = itemId ? { itemId } : {};

    // Récupération des prêts réels
    let loans = [];
    try {
      loans = await prisma.loan.findMany({ 
        where,
        include: { 
          item: true, 
          borrower: true 
        } 
      });
      console.log(`API GET /loans: ${loans.length} prêts réels récupérés.`);
    } catch (error) {
      console.error("API GET /loans: Erreur lors de la récupération des prêts réels:", error);
      throw new Error("Erreur Prisma lors de la récupération des prêts réels"); // Re-throw pour être attrapé par le catch externe
    }
    
    // Calculer le statut pour chaque prêt réel
    const loansWithStatus = loans.map(loan => {
      const computedStatus = computeLoanStatus(loan);
      return { 
        ...loan, 
        status: loan.status ? loan.status : computedStatus, // Respect du statut existant s'il existe
        computedStatus // Ajouter le statut calculé pour diagnostic
      };
    });
    
    let result = [...loansWithStatus];
    
    // Si demandé, ajouter des prêts virtuels
    if (includeItemWithoutLoan || !itemId) {
      console.log('API GET /loans: Tentative de récupération des items empruntés sans prêt actif.');
      let borrowedItems = [];
      try {
        // Récupérer tous les items BORROWED avec leurs prêts associés
        borrowedItems = await prisma.item.findMany({
          where: {
            reservationStatus: 'BORROWED'
          },
          include: { 
            loans: {
              where: {
                // Seule condition: prêt non retourné (car lostAt n'existe pas dans le modèle)
                returnedAt: null,
                // Optionnellement, filtrer par statut si nécessaire
                status: {
                  in: ['ACTIVE', 'OVERDUE', 'SCHEDULED']
                }
              },
              select: { 
                id: true,
                status: true,
                returnedAt: true,
                borrowedAt: true,
                dueAt: true
              } 
            }
          }
        });
        
        console.log(`API GET /loans: ${borrowedItems.length} items BORROWED récupérés initialement.`);

        // Filtrer en JavaScript pour ne garder que ceux sans prêt ACTIVE ou OVERDUE
        const itemsWithoutActiveLoan = borrowedItems.filter(item => {
          // Un item n'a pas de prêt actif si:
          // - Il n'a pas de prêts du tout, OU
          // - Tous ses prêts sont soit SCHEDULED (futur) soit retournés
          const hasActiveOrOverdueLoan = item.loans.some(loan => 
            (loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && loan.returnedAt === null
          );
          return !hasActiveOrOverdueLoan;
        });

        console.log(`API GET /loans: ${itemsWithoutActiveLoan.length} items réellement sans prêt actif/en retard trouvés après filtrage JS.`);
        borrowedItems = itemsWithoutActiveLoan; // Utiliser la liste filtrée
        
      } catch (error) {
        // Log de l'erreur Prisma originale
        console.error("API GET /loans: Erreur Prisma lors de la récupération des items empruntés:", error);
        throw new Error("Erreur Prisma lors de la récupération des items empruntés");
      }
      
      // Créer des prêts virtuels pour ces items (borrowedItems contient maintenant la liste filtrée)
      for (const item of borrowedItems) {
        console.log(`API GET /loans: Traitement de l'item emprunté ${item.id} pour prêt virtuel.`);
        try {
          // Chercher le dernier prêt (même retourné) pour cet item pour trouver l'emprunteur
          const lastLoan = await prisma.loan.findFirst({
            where: { itemId: item.id },
            orderBy: { createdAt: 'desc' },
            include: { borrower: true }
          });
          console.log(`API GET /loans: Dernier prêt trouvé pour item ${item.id}: ${lastLoan ? lastLoan.id : 'aucun'}`);
          
          // Créer un prêt virtuel pour cet item
          const virtualLoan = {
            id: `virtual_${item.id}`,
            itemId: item.id,
            item: { ...item, loans: undefined }, // Exclure les relations pour éviter les objets circulaires
            borrowerId: lastLoan?.borrowerId || null,
            borrower: lastLoan?.borrower || null,
            // Utiliser la date de mise à jour de l'item comme date d'emprunt si pas de dernier prêt
            borrowedAt: lastLoan?.borrowedAt || item.updatedAt || new Date(), 
            // Mettre une date de retour par défaut si pas de dernier prêt
            dueAt: lastLoan?.dueAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
            returnedAt: null,
            createdAt: lastLoan?.createdAt || item.createdAt || new Date(),
            updatedAt: item.updatedAt || new Date(),
            notes: "Prêt virtuel généré automatiquement - item marqué comme emprunté sans prêt actif.",
            status: 'ACTIVE', // Statut par défaut pour un prêt virtuel
            computedStatus: 'ACTIVE',
            isVirtual: true // Indicateur que ce prêt est virtuel
          };
          
          console.log(`API GET /loans: Prêt virtuel créé pour item ${item.id}`);
          result.push(virtualLoan);
          
        } catch (error) {
          console.error(`API GET /loans: Erreur lors de la création du prêt virtuel pour l'item ${item.id}:`, error);
          // Ne pas bloquer toute la requête si un seul prêt virtuel échoue
          // On pourrait ajouter un marqueur d'erreur sur l'item si nécessaire
        }
      }
    }
    
    console.log(`API GET /loans: Nombre total de prêts (réels + virtuels) retournés: ${result.length}`);
    const response = new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store', // Désactiver le cache pour le débogage
      },
    });
    return response;
    
  } catch (error) {
    console.error("API GET /loans: Erreur globale dans le handler GET:", error);
    // Log plus détaillé de l'erreur
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    };
    console.error("API GET /loans: Détails de l'erreur globale:", JSON.stringify(errorDetails, null, 2));
    
    return NextResponse.json({ 
      error: "Erreur interne du serveur lors de la récupération des prêts.",
      details: errorDetails.message // Fournir un message simple au client
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('API POST /loans: données reçues:', JSON.stringify(data, null, 2));
    
    // Validation des champs requis
    if (!data.itemId || !data.borrowerId) {
      console.log('API erreur: itemId ou borrowerId manquant');
      return NextResponse.json({ 
        error: "L'item et l'emprunteur sont requis",
        details: { itemId: !data.itemId, borrowerId: !data.borrowerId }
      }, { status: 400 });
    }
    
    // Validation des dates
    if (!data.borrowedAt || !data.dueAt) {
      console.log('API erreur: dates manquantes');
      return NextResponse.json({ 
        error: "Les dates de début et de fin sont requises",
        details: { borrowedAt: !data.borrowedAt, dueAt: !data.dueAt }
      }, { status: 400 });
    }
    
    // Assurer que les dates sont correctement formatées en objets Date
    let borrowedAt, dueAt;
    
    try {
      borrowedAt = new Date(data.borrowedAt);
      dueAt = new Date(data.dueAt);
      
      console.log('API dates parsées:', {
        borrowedAt: borrowedAt.toISOString(),
        borrowedAtValid: !isNaN(borrowedAt.getTime()),
        dueAt: dueAt.toISOString(),
        dueAtValid: !isNaN(dueAt.getTime())
      });
    } catch (error) {
      console.error('API erreur: conversion de dates:', error);
      return NextResponse.json({ 
        error: "Format de date invalide",
        details: { error: error.message }
      }, { status: 400 });
    }
    
    if (isNaN(borrowedAt.getTime())) {
      return NextResponse.json({ 
        error: "La date de début est invalide",
        details: { providedDate: data.borrowedAt }
      }, { status: 400 });
    }

    if (isNaN(dueAt.getTime())) {
      return NextResponse.json({ 
        error: "La date de retour est invalide",
        details: { providedDate: data.dueAt }
      }, { status: 400 });
    }
    
    try {
      // Vérification du statut de l'item
      const item = await prisma.item.findUnique({ 
        where: { id: data.itemId } 
      });
      
      if (!item) {
        return NextResponse.json({ 
          error: "Item introuvable",
          details: { itemId: data.itemId }
        }, { status: 404 });
      }
      
      if (item.reservationStatus === 'BORROWED' || item.reservationStatus === 'OUT_OF_ORDER') {
        return NextResponse.json({ 
          error: "Cet item n'est pas disponible pour un prêt",
          details: { currentStatus: item.reservationStatus }
        }, { status: 400 });
      }

      // Vérification de l'emprunteur
      const borrower = await prisma.user.findUnique({
        where: { id: data.borrowerId }
      });

      if (!borrower) {
        return NextResponse.json({ 
          error: "Emprunteur introuvable",
          details: { borrowerId: data.borrowerId }
        }, { status: 404 });
      }

      // Vérifier s'il existe déjà des prêts planifiés pour cet item sur la période demandée
      const existingLoans = await prisma.loan.findMany({
        where: {
          itemId: data.itemId,
          status: {
            in: [LoanStatus.ACTIVE, LoanStatus.SCHEDULED, LoanStatus.OVERDUE]
          },
          returnedAt: null,
          AND: [
            { borrowedAt: { lt: dueAt } },  // Le prêt existant commence avant la fin du nouveau prêt
            { dueAt: { gt: borrowedAt } }   // Le prêt existant finit après le début du nouveau prêt
          ]
        },
        include: {
          borrower: true
        }
      });
      
      if (existingLoans.length > 0) {
        const conflictingLoans = existingLoans.map(loan => ({
          id: loan.id, // Ajout de l'ID du prêt pour la navigation
          startDate: loan.borrowedAt.toLocaleDateString('fr-FR'),
          endDate: loan.dueAt.toLocaleDateString('fr-FR'),
          userName: `${loan.borrower.firstName} ${loan.borrower.lastName}`
        }));
        
        return NextResponse.json({ 
          error: "Cet item est déjà prêté ou programmé pour un prêt sur la période demandée",
          details: { 
            conflictingReservations: conflictingLoans
          }
        }, { status: 409 });
      }

      // NOUVELLE VÉRIFICATION : Vérifier s'il existe des réservations pour cet item sur la période demandée
      const existingReservations = await prisma.reservation.findMany({
        where: {
          itemId: data.itemId,
          status: 'CONFIRMED',
          OR: [
            // Réservation qui commence pendant la période du prêt demandé
            {
              startDate: {
                gte: borrowedAt,
                lte: dueAt
              }
            },
            // Réservation qui finit pendant la période du prêt demandé
            {
              endDate: {
                gte: borrowedAt,
                lte: dueAt
              }
            },
            // Réservation qui englobe la période du prêt demandé
            {
              startDate: {
                lte: borrowedAt
              },
              endDate: {
                gte: dueAt
              }
            }
          ]
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      
      if (existingReservations.length > 0) {
        // Formatage des informations pour un message d'erreur plus détaillé
        const formattedReservations = existingReservations.map(r => {
          const startDate = new Date(r.startDate).toLocaleDateString('fr-FR');
          const endDate = new Date(r.endDate).toLocaleDateString('fr-FR');
          const userName = `${r.user.firstName} ${r.user.lastName}`;
          return { 
            id: r.id, // Ajout de l'ID de la réservation pour la navigation
            startDate, 
            endDate, 
            userName 
          };
        });
        
        return NextResponse.json({ 
          error: "Cet item est déjà réservé pour la période demandée",
          details: { 
            conflictingReservations: formattedReservations
          }
        }, { status: 409 });
      }

      // Préparer les données du prêt
      const status = borrowedAt > new Date() ? 'SCHEDULED' : 'ACTIVE';
      
      // Format the contexts properly
      let contexts = [];
      if (Array.isArray(data.contexts) && data.contexts.length > 0) {
        contexts = data.contexts
          .filter(Boolean)
          .map(c => String(c).trim().toUpperCase())
          .filter(c => 
            ['CONFERENCE_FINANCEURS', 'APPUIS_SPECIFIQUES', 'PLATEFORME_AGEFIPH', 'AIDANTS', 'RUNE', 'PNT', 'SAVS', 'CICAT', 'LOGEMENT_INCLUSIF'].includes(c)
          );
      }

      console.log('Création du prêt avec les données:', {
        itemId: data.itemId,
        borrowerId: data.borrowerId,
        borrowedAt,
        dueAt,
        status,
        notes: data.notes || '',
        contexts
      });

      // Créer le prêt sans transaction d'abord
      const loan = await prisma.loan.create({
        data: {
          itemId: data.itemId,
          borrowerId: data.borrowerId,
          borrowedAt,
          dueAt,
          status,
          notes: data.notes || '',
          contexts: contexts
        },
        include: {
          item: true,
          borrower: true
        }
      });
      console.log('Prêt créé avec succès, ID:', loan.id);

      // Créer l'historique
      await prisma.loanHistory.create({
        data: {
          loanId: loan.id,
          status: loan.status,
          date: loan.borrowedAt,
          userId: loan.borrowerId,
          performedById: data.performedById || loan.borrowerId,
          comment: `Création du prêt${loan.status === 'SCHEDULED' ? ' programmé' : ''}`,
        }
      });
      console.log('Historique du prêt créé');

      // Mettre à jour le statut de l'item
      await prisma.item.update({
        where: { id: data.itemId },
        data: { reservationStatus: 'BORROWED' }
      });
      console.log('Statut de l\'item mis à jour');

      return NextResponse.json(loan);
    } catch (error: any) {
      console.error('Erreur lors de la création du prêt:', error);
      
      const errorResponse = {
        error: `Erreur lors de la création du prêt: ${error.message || 'Erreur inconnue'}`,
        details: {
          message: error.message,
          code: error.code,
          meta: error.meta
        }
      };

      return NextResponse.json(errorResponse, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erreur lors du parsing de la requête:', error);
    return NextResponse.json({
      error: `Erreur lors du traitement de la requête: ${error.message || 'Erreur inconnue'}`,
      details: { message: error.message }
    }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) {
      return NextResponse.json({ error: 'ID du prêt manquant' }, { status: 400 });
    }

    // Récupérer l'ancien prêt pour comparer le statut
    const oldLoan = await prisma.loan.findUnique({ 
      where: { id: data.id },
      include: { item: true }
    });

    if (!oldLoan) {
      return NextResponse.json({ error: 'Prêt non trouvé' }, { status: 404 });
    }

    // Met à jour le prêt (retour ou autre changement de statut)
    const updated = await prisma.loan.update({
      where: { id: data.id },
      data: {
        status: data.status as LoanStatus, // Ensure status is treated as LoanStatus
        returnedAt: data.status === LoanStatus.RETURNED ? new Date() : undefined // Use enum
      },
      include: {
        item: true,
        borrower: true
      }
    });

    // Historiser le changement de statut si différent ET si ce n'est PAS un retour
    // (car l'historique des retours est géré par l'API /api/loans/[id]/return)
    if (oldLoan.status !== data.status && data.status !== LoanStatus.RETURNED) {
      await prisma.loanHistory.create({
        data: {
          loanId: updated.id,
          status: data.status as LoanStatus,
          date: new Date(),
          userId: updated.borrowerId,
          comment: `Changement de statut: ${oldLoan.status} → ${data.status}`
        }
      });
    }

    // Met à jour le statut de l'item en 'AVAILABLE' si retour
    if (data.status === LoanStatus.RETURNED && oldLoan.item) { // Use enum
      await prisma.item.update({ 
        where: { id: oldLoan.item.id }, 
        data: { reservationStatus: 'AVAILABLE' } 
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/loans error:', err);
    return NextResponse.json({ 
      error: 'Erreur serveur lors de la mise à jour du prêt',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
  }
  try {
    await prisma.loan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/loans error:', err);
    return NextResponse.json({ error: 'Erreur serveur lors de la suppression' }, { status: 500 });
  }
}
