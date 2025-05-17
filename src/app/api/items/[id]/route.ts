import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        reservedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!item) {
      return NextResponse.json({ error: 'Item non trouvé' }, { status: 404 });
    }
    
    return NextResponse.json(item);
  } catch (err) {
    console.error('GET /api/items/:id error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updateData = await request.json();
    
    // Préparer les données pour Prisma
    const prismaUpdateData: any = { ...updateData };
    
    // Gérer la mise à jour des relations
    if ('reservationStatus' in updateData) {
      if (updateData.reservationStatus === 'RESERVED' && updateData.reservedById) {
        // Cas d'une réservation
        prismaUpdateData.reservedBy = { connect: { id: updateData.reservedById } };
        prismaUpdateData.reservedAt = new Date();
      } else if (updateData.reservationStatus === 'AVAILABLE') {
        // Cas d'une remise en disponibilité
        prismaUpdateData.reservedBy = { disconnect: true };
        prismaUpdateData.reservedAt = null;
      }
      
      // Supprimer les champs qui ne sont pas directement dans le modèle Item
      delete prismaUpdateData.reservedById;
      delete prismaUpdateData.previousReservedById;
    }

    // Mise à jour en base de données
    const updated = await prisma.item.update({
      where: { id },
      data: prismaUpdateData,
      include: {
        reservedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Historisation des réservations/annulations
    if (updateData.reservationStatus === 'RESERVED' && updateData.reservedById) {
      await prisma.reservationHistory.create({
        data: {
          itemId: id,
          userId: updateData.reservedById,
          action: 'RESERVE',
          date: new Date(),
        }
      });
    } else if (updateData.reservationStatus === 'AVAILABLE' && updateData.previousReservedById) {
      await prisma.reservationHistory.create({
        data: {
          itemId: id,
          userId: updateData.previousReservedById,
          action: 'CANCEL',
          date: new Date(),
        }
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/items/:id error:', err);
    
    // Gestion des erreurs spécifiques
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return NextResponse.json({ error: 'Item non trouvé' }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    await prisma.item.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/items/:id error:', err);
    
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return NextResponse.json({ error: 'Item non trouvé' }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'item' }, { status: 500 });
  }
}