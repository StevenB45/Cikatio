import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reservations/:id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const reservation = await prisma.reservation.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        item: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (err) {
    console.error(`GET /api/reservations/${id} error:`, err);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la réservation' },
      { status: 500 }
    );
  }
}

// PUT /api/reservations/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json();
    const { startDate, endDate, status, modifiedById } = body;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (start && end && end <= start) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    // Vérifie si la réservation existe
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        user: true,
        item: true
      }
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // Informations sur l'utilisateur qui effectue la modification
    let modifierInfo = '';
    let isAuthorized = false;
    let userIdForHistory = existingReservation.userId; // Par défaut, l'utilisateur de la réservation
    
    if (modifiedById) {
      // Vérifier si l'utilisateur existe
      const modifyingUser = await prisma.user.findUnique({
        where: { id: modifiedById },
        select: { id: true, firstName: true, lastName: true, isAdmin: true }
      });

      if (modifyingUser) {
        modifierInfo = `par ${modifyingUser.firstName} ${modifyingUser.lastName}`;
        userIdForHistory = modifiedById;
        
        // Vérifier si l'utilisateur a le droit de modifier (admin ou propriétaire de la réservation)
        isAuthorized = modifyingUser.isAdmin || modifiedById === existingReservation.userId;
      } else {
        // L'utilisateur n'existe pas
        return NextResponse.json(
          { error: 'Utilisateur non autorisé' },
          { status: 401 }
        );
      }
    } else {
      // Pas d'ID utilisateur fourni
      return NextResponse.json(
        { error: 'ID utilisateur requis pour la modification' },
        { status: 401 }
      );
    }

    // Si les dates changent, vérifier les conflits
    if ((start && start.getTime() !== new Date(existingReservation.startDate).getTime()) ||
        (end && end.getTime() !== new Date(existingReservation.endDate).getTime())) {
      // Vérification des conflits de réservation
      const existingReservations = await prisma.reservation.findMany({
        where: {
          itemId: existingReservation.itemId,
          status: 'CONFIRMED',
          id: { not: id }, // Exclure la réservation actuelle
          OR: [
            {
              AND: [
                { startDate: { lte: start || existingReservation.startDate } },
                { endDate: { gte: start || existingReservation.startDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: end || existingReservation.endDate } },
                { endDate: { gte: end || existingReservation.endDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: start || existingReservation.startDate } },
                { endDate: { lte: end || existingReservation.endDate } },
              ],
            },
          ],
        },
      });

      if (existingReservations.length > 0) {
        // Enregistrer la tentative échouée de modification due à un conflit
        const itemName = existingReservation.item?.name || 'Item inconnu';
        const oldStartDate = new Date(existingReservation.startDate).toLocaleDateString('fr-FR');
        const oldEndDate = new Date(existingReservation.endDate).toLocaleDateString('fr-FR');
        const newStartDate = start ? new Date(start).toLocaleDateString('fr-FR') : oldStartDate;
        const newEndDate = end ? new Date(end).toLocaleDateString('fr-FR') : oldEndDate;
        const userName = `${existingReservation.user?.firstName || ''} ${existingReservation.user?.lastName || ''}`.trim();
        
        const comment = `Tentative échouée de modification de réservation ${modifierInfo} (conflit) - ${itemName} pour ${userName}, du ${oldStartDate} au ${oldEndDate} vers du ${newStartDate} au ${newEndDate}`;
        
        try {
          await prisma.reservationHistory.create({
            data: {
              itemId: existingReservation.itemId,
              userId: userIdForHistory,
              action: 'MODIFY_FAILED',
              date: new Date(),
              comment: comment
            },
          });
        } catch (historyError) {
          console.error("Erreur lors de la création de l'historique de tentative échouée:", historyError);
        }

        return NextResponse.json(
          { error: "L'item est déjà réservé pour cette période" },
          { status: 409 }
        );
      }
    }

    // Si l'utilisateur n'est pas autorisé, enregistrer la tentative et retourner une erreur
    if (modifiedById && !isAuthorized) {
      const itemName = existingReservation.item?.name || 'Item inconnu';
      const oldStartDate = new Date(existingReservation.startDate).toLocaleDateString('fr-FR');
      const oldEndDate = new Date(existingReservation.endDate).toLocaleDateString('fr-FR');
      const newStartDate = start ? new Date(start).toLocaleDateString('fr-FR') : oldStartDate;
      const newEndDate = end ? new Date(end).toLocaleDateString('fr-FR') : oldEndDate;
      const userName = `${existingReservation.user?.firstName || ''} ${existingReservation.user?.lastName || ''}`.trim();
      
      const comment = `Tentative non autorisée de modification de réservation ${modifierInfo} - ${itemName} pour ${userName}, du ${oldStartDate} au ${oldEndDate} vers du ${newStartDate} au ${newEndDate}`;
      
      try {
        await prisma.reservationHistory.create({
          data: {
            itemId: existingReservation.itemId,
            userId: userIdForHistory,
            action: 'UNAUTHORIZED_MODIFY',
            date: new Date(),
            comment: comment
          },
        });
      } catch (historyError) {
        console.error("Erreur lors de la création de l'historique de tentative non autorisée:", historyError);
      }

      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier cette réservation" },
        { status: 403 }
      );
    }

    // Mise à jour de la réservation puisque tout est en ordre
    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        startDate: start,
        endDate: end,
        status,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        item: true,
      },
    });

    // Enregistrer la modification réussie dans l'historique
    const itemName = existingReservation.item?.name || 'Item inconnu';
    const oldStartDate = new Date(existingReservation.startDate).toLocaleDateString('fr-FR');
    const oldEndDate = new Date(existingReservation.endDate).toLocaleDateString('fr-FR');
    const newStartDate = start ? new Date(start).toLocaleDateString('fr-FR') : oldStartDate;
    const newEndDate = end ? new Date(end).toLocaleDateString('fr-FR') : oldEndDate;
    const userName = `${existingReservation.user?.firstName || ''} ${existingReservation.user?.lastName || ''}`.trim();
    
    const hasDateChanged = oldStartDate !== newStartDate || oldEndDate !== newEndDate;
    const comment = `Réservation modifiée ${modifierInfo} - ${itemName} pour ${userName}${hasDateChanged ? `, du ${oldStartDate} au ${oldEndDate} vers du ${newStartDate} au ${newEndDate}` : ''}`;
    
    try {
      await prisma.reservationHistory.create({
        data: {
          itemId: existingReservation.itemId,
          userId: userIdForHistory,
          action: 'MODIFY',
          date: new Date(),
          comment: comment
        },
      });
    } catch (historyError) {
      console.error("Erreur lors de la création de l'historique de modification:", historyError);
    }

    return NextResponse.json(updatedReservation);
  } catch (err) {
    console.error(`PUT /api/reservations/${id} error:`, err);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la réservation' },
      { status: 500 }
    );
  }
}

// DELETE /api/reservations/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Récupérer les données du corps de la requête pour l'identité de l'utilisateur qui supprime
    let cancelledById = null;
    let cancellerInfo = '';
    
    try {
      const body = await request.json();
      if (body && body.cancelledById) {
        cancelledById = body.cancelledById;
        // Vérifier si l'utilisateur existe réellement en base
        const userExists = await prisma.user.findUnique({
          where: { id: cancelledById },
          select: { id: true, firstName: true, lastName: true }
        });
        
        if (userExists) {
          cancellerInfo = ` par ${userExists.firstName} ${userExists.lastName}`;
        } else {
          // Si l'utilisateur n'existe pas, ne pas utiliser son ID
          console.warn(`Utilisateur ${cancelledById} non trouvé dans la base de données`);
          cancelledById = null;
        }
      }
    } catch (error) {
      console.warn('Pas de corps de requête ou format invalide:', error);
    }

    // Vérifie si la réservation existe
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        user: true,
        item: true
      }
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // Utiliser l'utilisateur de la réservation s'il n'y a pas d'utilisateur annuleur valide
    const userIdForHistory = cancelledById || existingReservation.userId;
    
    // Message pour l'historique
    const commentBase = !cancelledById || cancelledById === existingReservation.userId
      ? 'Réservation annulée par l\'utilisateur lui-même'
      : `Réservation annulée${cancellerInfo}`;
    
    // Détails de la réservation pour l'historique
    const itemName = existingReservation.item?.name || 'Item inconnu';
    const startDate = new Date(existingReservation.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(existingReservation.endDate).toLocaleDateString('fr-FR');
    const userName = `${existingReservation.user?.firstName || ''} ${existingReservation.user?.lastName || ''}`.trim();
    
    const comment = `${commentBase} - ${itemName} réservé du ${startDate} au ${endDate} pour ${userName}`;

    try {
      // Crée un historique de réservation
      await prisma.reservationHistory.create({
        data: {
          itemId: existingReservation.itemId,
          userId: userIdForHistory,
          action: 'CANCEL',
          date: new Date(),
          comment: comment
        },
      });
    } catch (historyError) {
      console.error("Erreur lors de la création de l'historique:", historyError);
      // Continuer malgré l'erreur d'historique pour permettre la suppression
    }

    // Supprime la réservation
    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/reservations/${id} error:`, err);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la réservation', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}