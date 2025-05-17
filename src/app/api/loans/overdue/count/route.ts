import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Importer { prisma } au lieu de prisma

export async function GET() {
  try {
    const now = new Date(); // Get the current date and time

    // Count loans where the due date is past and the item hasn't been returned yet
    const overdueCount = await prisma.loan.count({
      where: {
        dueAt: {
          lt: now, // Less than the current date/time
        },
        returnedAt: null, // Filter out loans that have already been returned
      },
    });

    return NextResponse.json({ count: overdueCount });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de prêts en retard:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du nombre de prêts en retard' },
      { status: 500 }
    );
  }
}