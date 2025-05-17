import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Trouver toutes les réservations expirées (date de fin passée)
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        endDate: {
          lt: new Date() // Moins que la date actuelle
        },
        status: 'CONFIRMED'
      },
      include: {
        user: true,
        item: true
      }
    });

    // Pour chaque réservation expirée
    for (const reservation of expiredReservations) {
      const startDate = new Date(reservation.startDate).toLocaleDateString('fr-FR');
      const endDate = new Date(reservation.endDate).toLocaleDateString('fr-FR');
      const userName = `${reservation.user.firstName} ${reservation.user.lastName}`;
      const itemName = reservation.item?.name || 'Item inconnu';

      // Créer une entrée dans l'historique
      await prisma.reservationHistory.create({
        data: {
          itemId: reservation.itemId,
          userId: reservation.userId,
          action: 'EXPIRED',
          date: new Date(),
          comment: `Réservation expirée automatiquement - ${itemName} réservé du ${startDate} au ${endDate} pour ${userName}`
        }
      });

      // Supprimer la réservation
      await prisma.reservation.delete({
        where: { id: reservation.id }
      });
    }

    return NextResponse.json({
      success: true,
      count: expiredReservations.length
    });
  } catch (err) {
    console.error('POST /api/reservations/cleanup error:', err);
    return NextResponse.json({ 
      error: 'Erreur lors du nettoyage des réservations expirées' 
    }, { status: 500 });
  }
}