// Script simple pour corriger le statut d'un item spécifique
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSpecificItem() {
  try {
    // Mettre à jour l'item spécifique qui est bloqué en statut "BORROWED"
    const updatedItem = await prisma.item.update({
      where: {
        id: '8caf1e75-79f1-4c99-9625-9a4101de4f2f' // ID de l'item "La femme de ménage"
      },
      data: {
        reservationStatus: 'AVAILABLE'
      }
    });

    console.log(`✅ Item mis à jour avec succès:`);
    console.log(`Nom: ${updatedItem.name}`);
    console.log(`Ancien statut: BORROWED`);
    console.log(`Nouveau statut: ${updatedItem.reservationStatus}`);

    // Vérifier s'il y a d'autres items dans la même situation
    const otherIncorrectItems = await prisma.item.findMany({
      where: {
        reservationStatus: 'BORROWED'
      },
      include: {
        loans: {
          where: {
            status: { in: ['ACTIVE', 'OVERDUE'] },
            returnedAt: null
          }
        }
      }
    });

    const remainingIncorrect = otherIncorrectItems.filter(item => item.loans.length === 0);
    
    if (remainingIncorrect.length > 0) {
      console.log(`\n⚠️ Attention: ${remainingIncorrect.length} autres items sont toujours marqués comme empruntés sans prêt actif:`);
      for (const item of remainingIncorrect) {
        console.log(`- ${item.id}: ${item.name}`);
      }
    } else {
      console.log("\n✅ Tous les items ont maintenant un statut correct!");
    }

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'item:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificItem();