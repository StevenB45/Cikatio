import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/authOptions';

// GET /api/maintenance/fix-item-status
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification et les permissions (administrateur uniquement)
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log("Démarrage de la vérification et correction des statuts d'items...");
    
    // 1. Trouver tous les items incorrectement marqués comme empruntés
    const borrowedItems = await prisma.item.findMany({
      where: { reservationStatus: 'BORROWED' },
      include: {
        loans: {
          where: {
            status: { in: ['ACTIVE', 'OVERDUE'] },
            returnedAt: null
          }
        }
      }
    });

    // Identifier les items incorrects et les corriger
    const fixedBorrowed = [];
    for (const item of borrowedItems) {
      if (item.loans.length === 0) {
        // Vérifier s'il existe des réservations actives pour l'item
        const activeReservations = await prisma.reservation.findMany({
          where: {
            itemId: item.id,
            status: 'CONFIRMED',
            endDate: { gte: new Date() }
          },
          take: 1
        });
        
        // Déterminer le nouveau statut
        const newStatus = activeReservations.length > 0 
          ? ReservationStatus.PENDING 
          : ReservationStatus.AVAILABLE;
        
        // Mettre à jour le statut de l'item
        await prisma.item.update({
          where: { id: item.id },
          data: { reservationStatus: newStatus }
        });
        
        fixedBorrowed.push({
          id: item.id,
          name: item.name,
          oldStatus: 'BORROWED',
          newStatus: newStatus
        });
      }
    }

    // 2. Trouver tous les items incorrectement marqués comme disponibles
    const availableItems = await prisma.item.findMany({
      where: { reservationStatus: 'AVAILABLE' },
      include: {
        loans: {
          where: {
            status: { in: ['ACTIVE', 'OVERDUE'] },
            returnedAt: null
          }
        }
      }
    });

    // Corriger les items disponibles qui devraient être empruntés
    const fixedAvailable = [];
    for (const item of availableItems) {
      if (item.loans.length > 0) {
        // Mettre à jour le statut
        await prisma.item.update({
          where: { id: item.id },
          data: { reservationStatus: 'BORROWED' }
        });
        
        fixedAvailable.push({
          id: item.id,
          name: item.name,
          oldStatus: 'AVAILABLE',
          newStatus: 'BORROWED'
        });
      }
    }

    // 3. Retourner un résumé des corrections effectuées
    return NextResponse.json({
      success: true,
      stats: {
        fixedBorrowed: fixedBorrowed.length,
        fixedAvailable: fixedAvailable.length,
        totalFixed: fixedBorrowed.length + fixedAvailable.length
      },
      fixedBorrowed,
      fixedAvailable
    });
    
  } catch (error) {
    console.error('Erreur lors de la correction des statuts:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la correction des statuts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
