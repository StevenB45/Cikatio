import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const data = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'ID du prêt manquant' }, { status: 400 });
  }

  if (!data.performedById) {
    return NextResponse.json({ error: 'ID de l\'administrateur manquant' }, { status: 400 });
  }

  console.log(`Handling loan return request for loan ID: ${id}`);

  try {
    // Récupérer le prêt avec ses relations
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { 
        item: true,
        borrower: true
      }
    });

    if (!loan) {
      console.error(`Prêt non trouvé: ${id}`);
      return NextResponse.json({ error: 'Prêt non trouvé' }, { status: 404 });
    }

    console.log(`Processing return for loan: ${JSON.stringify({
      id: loan.id,
      itemId: loan.itemId,
      borrowerId: loan.borrowerId,
      status: loan.status
    })}`);

    try {
      // Using a transaction to ensure all updates happen together
      const updated = await prisma.$transaction(async (tx) => {
        // 1. Update the loan
        const updatedLoan = await tx.loan.update({
          where: { id },
          data: {
            status: 'RETURNED',
            returnedAt: new Date()
          },
          include: {
            item: true,
            borrower: true
          }
        });
        console.log('Loan updated successfully');

        // 2. Create loan history record
        await tx.loanHistory.create({
          data: {
            loanId: updatedLoan.id,
            status: 'RETURNED',
            date: updatedLoan.returnedAt || new Date(),
            userId: updatedLoan.borrowerId,
            performedById: data.performedById,
            comment: 'Retour du prêt par l\'administrateur'
          }
        });
        console.log('Loan history created successfully');

        // 3. Create user action history record
        await tx.userActionHistory.create({
          data: {
            targetUserId: updatedLoan.borrowerId,
            action: 'RETURN_LOAN',
            performerId: data.performedById,
            comment: `Retour du prêt pour l'item ${updatedLoan.item?.customId || updatedLoan.itemId}`
          }
        });
        console.log('User action history created successfully');

        // 4. If there's an item, update its status
        if (updatedLoan.itemId) {
          try {
            // VÉRIFICATION AMÉLIORÉE: Vérifier s'il existe des prêts actifs pour cet item
            // Nous utilisons la transaction (tx) pour avoir l'état le plus récent de la base de données
            const activeLoans = await tx.loan.findMany({
              where: {
                itemId: updatedLoan.itemId,
                id: { not: id }, // Exclure le prêt actuel
                status: { in: ['ACTIVE', 'OVERDUE'] }, // Prêts actifs ou en retard
                returnedAt: null, // Non retournés
              },
              orderBy: { // Ajout de l'ordre pour debugging
                borrowedAt: 'desc'
              }
            });
            
            console.log(`Found ${activeLoans.length} other active/overdue loans for this item`);
            
            // Ne continuer avec la vérification des réservations que si aucun autre prêt actif n'existe
            if (activeLoans.length === 0) {
              // Check for active reservations
              const activeReservations = await tx.reservation.findMany({
                where: {
                  itemId: updatedLoan.itemId,
                  status: 'CONFIRMED',
                  endDate: {
                    gte: new Date() // Only non-expired reservations
                  }
                },
                orderBy: {
                  startDate: 'asc' // Get the nearest one first
                },
                take: 1
              });
              
              // Check for scheduled loans
              const scheduledLoans = await tx.loan.findMany({
                where: {
                  itemId: updatedLoan.itemId,
                  status: 'SCHEDULED',
                  borrowedAt: {
                    gte: new Date()
                  }
                },
                orderBy: {
                  borrowedAt: 'asc'
                },
                take: 1
              });
              
              // Determine the appropriate status
              let newStatus: ReservationStatus = ReservationStatus.AVAILABLE;
              
              if (activeReservations.length > 0) {
                console.log(`Item has active reservations - setting status to RESERVED`);
                newStatus = ReservationStatus.PENDING;
              } else if (scheduledLoans.length > 0) {
                console.log(`Item has scheduled loans - keeping status as BORROWED`);
                newStatus = ReservationStatus.BORROWED;
              } else {
                console.log(`Item has no pending reservations or loans - setting status to AVAILABLE`);
              }
              
              // Effectuer une double vérification juste avant la mise à jour
              // Cette étape est cruciale pour éviter les problèmes de concurrence
              const finalCheck = await tx.loan.count({
                where: {
                  itemId: updatedLoan.itemId,
                  id: { not: id },
                  status: { in: ['ACTIVE', 'OVERDUE'] },
                  returnedAt: null
                }
              });
              
              if (finalCheck > 0) {
                console.log(`DERNIER CONTRÔLE: ${finalCheck} prêts actifs trouvés - l'item reste BORROWED`);
                // Ne pas modifier le statut car il y a encore des prêts actifs
              } else {
                // Update the item status seulement si aucun prêt actif n'existe
                await tx.item.update({
                  where: { id: updatedLoan.itemId },
                  data: { reservationStatus: newStatus }
                });
                console.log(`Item status updated to ${newStatus}`);
              }
            } else {
              console.log(`Item still has ${activeLoans.length} active loans - keeping status as BORROWED`);
              // L'item reste emprunté car il a d'autres prêts actifs
            }
          } catch (itemError) {
            console.error('Error updating item status:', itemError);
            // Ne pas faire échouer toute la transaction pour une erreur de mise à jour de statut d'item
          }
        } else {
          console.log('No itemId found for this loan');
        }

        return updatedLoan;
      });

      console.log(`Loan return completed successfully for loan ID: ${id}`);
      return NextResponse.json(updated);
    } catch (txError) {
      console.error('Transaction error during loan return:', txError);
      throw txError;  // Re-throw to be handled by the outer try/catch
    }
  } catch (err) {
    console.error('Error processing loan return:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorCode = err instanceof Error && 'code' in (err as any) ? (err as any).code : undefined;
    
    // Log détaillé de l'erreur pour le débogage
    console.error('Detailed error information:', {
      message: errorMessage,
      code: errorCode,
      stack: err instanceof Error ? err.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Erreur lors du retour du prêt',
      details: {
        message: errorMessage,
        code: errorCode
      }
    }, { status: 500 });
  }
}