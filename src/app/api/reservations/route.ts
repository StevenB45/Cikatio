import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reservations?itemId=xxx ou /api/reservations?userId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');
  
  try {
    // Construire la condition de recherche
    const where: any = {};
    
    // Filtrer par itemId ou userId si spécifiés
    if (itemId) {
      where.itemId = itemId;
    }
    if (userId) {
      where.userId = userId;
    }

    // Si un statut spécifique est demandé, l'ajouter à la condition
    if (status) {
      where.status = status;
    }

    // Si des dates sont spécifiées, ajouter les conditions de date
    if (startDate || endDate) {
      where.OR = [
        {
          startDate: {
            lte: endDate ? new Date(endDate) : undefined
          },
          endDate: {
            gte: startDate ? new Date(startDate) : undefined
          }
        }
      ];
    }

    console.log('Recherche de réservations avec les critères:', where);

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        item: true
      },
      orderBy: { startDate: 'asc' }
    });

    const searchParam = itemId ? `l'item ${itemId}` : userId ? `l'utilisateur ${userId}` : 'tous les critères';
    console.log(`Trouvé ${reservations.length} réservations pour ${searchParam}`);
    return NextResponse.json(reservations);
  } catch (err) {
    console.error('GET /api/reservations error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/reservations
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, userId, startDate, endDate } = body;

    // Validation des données requises
    if (!itemId || !userId || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Données manquantes' 
      }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return NextResponse.json({ 
        error: 'La date de fin doit être après la date de début' 
      }, { status: 400 });
    }

    // Vérification des conflits de réservation
    const existingReservations = await prisma.reservation.findMany({
      where: {
        itemId,
        status: 'CONFIRMED',
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } }
            ]
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } }
            ]
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } }
            ]
          }
        ]
      }
    });

    if (existingReservations.length > 0) {
      return NextResponse.json({ 
        error: 'L\'item est déjà réservé pour cette période' 
      }, { status: 409 });
    }

    // Création de la réservation
    const reservation = await prisma.reservation.create({
      data: {
        itemId,
        userId,
        startDate: start,
        endDate: end,
        status: 'CONFIRMED'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        item: true
      }
    });

    // Ajout dans l'historique des réservations
    const userName = `${reservation.user.firstName} ${reservation.user.lastName}`;
    const itemName = reservation.item?.name || 'Item inconnu';
    const startDateStr = start.toLocaleDateString('fr-FR');
    const endDateStr = end.toLocaleDateString('fr-FR');
    
    await prisma.reservationHistory.create({
      data: {
        itemId,
        userId,
        action: 'RESERVE',
        date: new Date(),
        comment: `Nouvelle réservation - ${itemName} réservé du ${startDateStr} au ${endDateStr} pour ${userName}`
      }
    });

    return NextResponse.json(reservation);
  } catch (err) {
    console.error('POST /api/reservations error:', err);
    return NextResponse.json({ 
      error: 'Erreur lors de la création de la réservation' 
    }, { status: 500 });
  }
}

// DELETE /api/reservations/:id
export async function DELETE(request: Request) {
  try {
    const id = request.url.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    await prisma.reservation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/reservations error:', err);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de la réservation' 
    }, { status: 500 });
  }
}