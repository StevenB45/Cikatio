import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reservation-history?userId=xxx&itemId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const itemId = searchParams.get('itemId');

  if (!userId && !itemId) {
    return NextResponse.json({ error: 'userId ou itemId requis' }, { status: 400 });
  }

  try {
    const where: any = {};
    if (userId) where.userId = userId;
    if (itemId) where.itemId = itemId;

    const history = await prisma.reservationHistory.findMany({
      where,
      include: {
        item: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    return NextResponse.json(history);
  } catch (err) {
    console.error('GET /api/reservation-history error:', err);
    return NextResponse.json({ 
      error: 'Erreur serveur lors de la récupération de l\'historique des réservations' 
    }, { status: 500 });
  }
}
