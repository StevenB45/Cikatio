import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const data = await request.json();

    // Récupérer l'ancien prêt pour comparer le statut
    const oldLoan = await prisma.loan.findUnique({
      where: { id },
      include: { item: true }
    });

    if (!oldLoan) {
      return NextResponse.json({ error: 'Prêt non trouvé' }, { status: 404 });
    }

    // Met à jour le prêt (retour ou autre changement de statut)
    const updated = await prisma.loan.update({
      where: { id },
      data: {
        status: data.status,
        returnedAt: data.status === 'RETURNED' ? new Date() : undefined
      },
      include: {
        item: true,
        borrower: true
      }
    });

    // Historiser le changement de statut si différent ET si ce n'est PAS un retour
    // (car l'historique des retours est géré par l'API /api/loans/[id]/return)
    if (oldLoan.status !== data.status && data.status !== 'RETURNED') {
      await prisma.loanHistory.create({
        data: {
          loanId: updated.id,
          status: data.status,
          date: new Date(),
          userId: updated.borrowerId,
          comment: `Changement de statut: ${oldLoan.status} → ${data.status}`
        }
      });
    }

    // Met à jour le statut de l'item si retour
    if (data.status === 'RETURNED' && oldLoan.item) {
      // Vérifier s'il existe des réservations actives pour cet item
      const activeReservations = await prisma.reservation.findMany({
        where: {
          itemId: oldLoan.item.id,
          status: 'CONFIRMED',
          endDate: {
            gte: new Date()  // Uniquement les réservations non expirées
          }
        },
        orderBy: {
          startDate: 'asc'   // Trier par date de début pour obtenir la prochaine réservation
        },
        take: 1  // Prendre uniquement la prochaine réservation
      });

      // Vérifier s'il existe des prêts programmés pour cet item
      const scheduledLoans = await prisma.loan.findMany({
        where: {
          itemId: oldLoan.item.id,
          status: 'SCHEDULED',
          id: { not: id } // Exclure le prêt actuel
        },
        orderBy: {
          borrowedAt: 'asc'
        },
        take: 1
      });

      // Déterminer le statut approprié en fonction des réservations et prêts programmés
      let newStatus: ReservationStatus = ReservationStatus.AVAILABLE;
      
      if (activeReservations.length > 0) {
        newStatus = ReservationStatus.PENDING;
      } else if (scheduledLoans.length > 0) {
        newStatus = ReservationStatus.BORROWED; // Garder comme emprunté car il y a un prêt programmé
      }
      
      await prisma.item.update({
        where: { id: oldLoan.item.id },
        data: { reservationStatus: newStatus }
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/loans/[id] error:', err);
    return NextResponse.json({
      error: 'Erreur lors de la mise à jour du prêt',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}