import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, ReservationStatus } from '@prisma/client'; 
import { ServiceCategory } from '@/types'; // Importer depuis notre définition de type
import { canModifyStatus, getItemStatus } from '@/lib/status';

export async function GET(req: Request) {
  try {
    const items = await prisma.item.findMany({
      include: {
        loans: {
          where: {
            OR: [
              { status: 'ACTIVE' },
              { status: 'OVERDUE' },
              { status: 'SCHEDULED' }
            ],
            returnedAt: null
          }
        }
      }
    });
    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('GET /api/items error:', err);
    return NextResponse.json({ error: 'Erreur lors de la récupération des items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validation des données requises
    if (data.name && data.category) {
      // Validation du code barre (customId)
      if (!data.customId || typeof data.customId !== 'string' || !data.customId.trim()) {
        return NextResponse.json({ error: 'Le code barre (customId) est obligatoire.' }, { status: 400 });
      }
      
      // Validation du serviceCategory
      if (!data.serviceCategory) {
        return NextResponse.json({ error: 'La catégorie de service est obligatoire.' }, { status: 400 });
      }
    }

    // Préparation des données pour Prisma avec valeurs par défaut appropriées
    const itemData = {
      customId: data.customId ? String(data.customId).trim() : "",
      name: data.name ? String(data.name) : "",
      description: data.description || null,
      category: data.category || "BOOK",
      serviceCategory: String(data.serviceCategory).toUpperCase() as any, // Conversion explicite pour assurer la compatibilité avec l'enum Prisma
      available: data.reservationStatus === 'AVAILABLE',
      reservationStatus: data.reservationStatus || 'AVAILABLE',
      author: data.author || null,
      isbn: data.isbn || null,
      publisher: data.publisher || null,
      yearPublished: data.yearPublished ? parseInt(String(data.yearPublished), 10) : null,
      serialNumber: data.serialNumber || null,
      brand: data.brand || null,
      model: data.model || null,
      coverImageUrl: data.coverImageUrl || null,
    };

    // Création de l'item
    const created = await prisma.item.create({ data: itemData });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/items error:', err);
    
    // Gestion des erreurs de validation Prisma
    if (err instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ 
        error: 'Validation Prisma échouée', 
        details: err.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Erreur serveur lors de la création de l\'item'
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
    // Vérifier s'il existe un prêt NON retourné (statut différent de 'RETURNED')
    const activeLoanCount = await prisma.loan.count({ where: { itemId: id, status: { not: 'RETURNED' } } });
    if (activeLoanCount > 0) {
      return NextResponse.json({ error: 'Impossible de supprimer un item qui a un prêt en cours.' }, { status: 400 });
    }
    // Détacher tous les prêts retournés (statut RETURNED) en mettant itemId à NULL
    await prisma.loan.updateMany({ where: { itemId: id, status: 'RETURNED' }, data: { itemId: null } });
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/items error:', err);
    return NextResponse.json({ error: 'Erreur serveur lors de la suppression' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, available, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ 
        error: 'ID manquant pour la mise à jour',
        details: 'L\'identifiant de l\'item est requis pour effectuer la mise à jour'
      }, { status: 400 });
    }

    // Vérifier si l'item existe avant toute modification
    const existingItem = await prisma.item.findUnique({
      where: { id },
      include: {
        loans: {
          where: {
            OR: [
              { status: 'ACTIVE' },
              { status: 'OVERDUE' },
              { status: 'SCHEDULED' }
            ],
            returnedAt: null
          }
        }
      }
    });

    if (!existingItem) {
      return NextResponse.json({ 
        error: 'Item non trouvé',
        details: `Aucun item trouvé avec l'identifiant ${id}`
      }, { status: 404 });
    }

    // Préparer les données pour Prisma
    const prismaUpdateData: Prisma.ItemUpdateInput = {};

    // Traiter les champs textuels
    if (updateData.customId !== undefined) prismaUpdateData.customId = updateData.customId;
    if (updateData.name !== undefined) prismaUpdateData.name = updateData.name;
    prismaUpdateData.description = updateData.description || null;
    if (updateData.category !== undefined) prismaUpdateData.category = updateData.category;
    
    // Champs spécifiques aux livres
    prismaUpdateData.author = updateData.author || null;
    prismaUpdateData.isbn = updateData.isbn || null;
    prismaUpdateData.publisher = updateData.publisher || null;
    prismaUpdateData.yearPublished = updateData.yearPublished ? parseInt(String(updateData.yearPublished), 10) : null;
    
    // Champs spécifiques aux équipements
    prismaUpdateData.serialNumber = updateData.serialNumber || null;
    prismaUpdateData.brand = updateData.brand || null;
    prismaUpdateData.model = updateData.model || null;
    
    // Champ d'image de couverture
    if (updateData.coverImageUrl !== undefined) prismaUpdateData.coverImageUrl = updateData.coverImageUrl || null;
    
    // Catégorie de service avec conversion explicite
    if (updateData.serviceCategory !== undefined) {
      prismaUpdateData.serviceCategory = String(updateData.serviceCategory).toUpperCase() as any;
    }

    // Gestion du statut de réservation
    if (updateData.reservationStatus !== undefined) {
      if (!canModifyStatus(existingItem)) {
        return NextResponse.json({ 
          error: "Impossible de modifier le statut",
          details: "Le statut ne peut pas être modifié car l'item est actuellement en prêt"
        }, { status: 400 });
      }

      prismaUpdateData.reservationStatus = updateData.reservationStatus as ReservationStatus;
      prismaUpdateData.available = updateData.reservationStatus === 'AVAILABLE';
      
      if (updateData.reservationStatus === 'RESERVED' && updateData.reservedById) {
        // Cas d'une réservation
        prismaUpdateData.reservedBy = { connect: { id: updateData.reservedById } };
        prismaUpdateData.reservedAt = new Date();
      } else if (updateData.reservationStatus === 'AVAILABLE') {
        // Cas d'une remise en disponibilité
        prismaUpdateData.reservedBy = { disconnect: true };
        prismaUpdateData.reservedAt = null;
      }
    }

    try {
      // Mise à jour en base de données
      const updated = await prisma.item.update({
        where: { id },
        data: prismaUpdateData,
        include: {
          loans: {
            where: {
              OR: [
                { status: 'ACTIVE' },
                { status: 'OVERDUE' },
                { status: 'SCHEDULED' }
              ],
              returnedAt: null
            }
          }
        }
      });

      // Synchroniser le statut avec les prêts actifs
      const correctStatus = getItemStatus(updated);
      if (correctStatus !== updated.reservationStatus) {
        await prisma.item.update({
          where: { id },
          data: {
            reservationStatus: correctStatus,
            available: correctStatus === 'AVAILABLE'
          }
        });
      }

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
    } catch (updateError) {
      console.error('Erreur lors de la mise à jour de l\'item:', updateError);
      
      if (updateError instanceof Prisma.PrismaClientKnownRequestError) {
        if (updateError.code === 'P2002') {
          return NextResponse.json({ 
            error: 'Erreur de validation',
            details: 'Un item avec ce code barre existe déjà'
          }, { status: 400 });
        }
      }
      
      throw updateError; // Propager l'erreur pour la gestion globale
    }
  } catch (err) {
    console.error('PUT /api/items error:', err);
    
    // Gestion des erreurs spécifiques
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return NextResponse.json({ 
          error: 'Item non trouvé',
          details: 'L\'item que vous essayez de modifier n\'existe plus'
        }, { status: 404 });
      }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: err.message
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour',
      details: 'Une erreur inattendue s\'est produite lors de la mise à jour de l\'item'
    }, { status: 500 });
  }
}