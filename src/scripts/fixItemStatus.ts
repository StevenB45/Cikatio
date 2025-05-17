// Script pour identifier et corriger les incohérences entre les statuts des items et les prêts actifs
import { PrismaClient } from '@prisma/client';

// Initialiser le client Prisma directement
const prisma = new PrismaClient();

async function main() {
  console.log("Démarrage de la vérification des statuts d'items...");
  
  // 1. Trouver tous les items marqués comme "BORROWED"
  const borrowedItems = await prisma.item.findMany({
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

  console.log(`Trouvé ${borrowedItems.length} items marqués comme empruntés`);

  // 2. Identifier les items marqués comme empruntés mais sans prêt actif
  const incorrectItems = borrowedItems.filter(item => item.loans.length === 0);
  console.log(`Parmi eux, ${incorrectItems.length} n'ont PAS de prêt actif associé (incohérence)`);

  if (incorrectItems.length === 0) {
    console.log("✅ Aucune incohérence détectée. Tous les items marqués comme empruntés ont au moins un prêt actif.");
    return;
  }

  // 3. Afficher les incohérences pour vérification manuelle
  console.log("\n=== Items marqués comme empruntés sans prêt actif ===");
  for (const item of incorrectItems) {
    console.log(`- ID: ${item.id}, Nom: ${item.name}, Statut: ${item.reservationStatus}`);

    // Vérifier les prêts retournés pour cet item
    const returnedLoans = await prisma.loan.findMany({
      where: {
        itemId: item.id,
        returnedAt: { not: null }
      },
      orderBy: {
        returnedAt: 'desc'
      },
      take: 1
    });

    if (returnedLoans.length > 0) {
      const lastReturn = returnedLoans[0];
      console.log(`  Dernier retour: ${lastReturn.returnedAt}, ID prêt: ${lastReturn.id}`);
    } else {
      console.log(`  Aucun historique de retour trouvé`);
    }
  }

  // 4. Proposer la correction automatique
  console.log("\nSouhaitez-vous corriger automatiquement ces statuts ? (oui/non)");
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('> ', async (answer: string) => {
    if (answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      console.log("\nCorrection en cours...");
      
      // Corriger les statuts des items incorrects
      for (const item of incorrectItems) {
        await prisma.item.update({
          where: { id: item.id },
          data: { reservationStatus: 'AVAILABLE' }
        });
        console.log(`✅ Corrigé: "${item.name}" (ID: ${item.id}) - Statut mis à jour: BORROWED → AVAILABLE`);
      }
      
      console.log(`\nCorrection terminée. ${incorrectItems.length} items ont été mis à jour.`);
    } else {
      console.log("Opération annulée. Aucune modification n'a été effectuée.");
    }
    
    readline.close();
    await checkAvailableItems();
  });
}

// 5. Trouver tous les items marqués comme disponibles mais qui ont des prêts actifs
async function checkAvailableItems() {
  const availableItems = await prisma.item.findMany({
    where: {
      reservationStatus: 'AVAILABLE'
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

  const incorrectAvailable = availableItems.filter(item => item.loans.length > 0);
  
  if (incorrectAvailable.length > 0) {
    console.log(`\n⚠️  ATTENTION: ${incorrectAvailable.length} items sont marqués comme AVAILABLE mais ont des prêts actifs:`);
    for (const item of incorrectAvailable) {
      console.log(`- ID: ${item.id}, Nom: ${item.name}, Nombre de prêts actifs: ${item.loans.length}`);
      
      // Afficher les détails des prêts actifs
      for (const loan of item.loans) {
        console.log(`  - Prêt ID: ${loan.id}, Statut: ${loan.status}`);
      }
    }
    
    console.log("\nCes items devraient être marqués comme BORROWED. Voulez-vous corriger ce problème ? (oui/non)");
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('> ', async (answer: string) => {
      if (answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log("\nCorrection en cours...");
        
        for (const item of incorrectAvailable) {
          await prisma.item.update({
            where: { id: item.id },
            data: { reservationStatus: 'BORROWED' }
          });
          console.log(`✅ Corrigé: "${item.name}" (ID: ${item.id}) - Statut mis à jour: AVAILABLE → BORROWED`);
        }
        
        console.log(`\nCorrection terminée. ${incorrectAvailable.length} items ont été mis à jour.`);
      } else {
        console.log("Opération annulée. Aucune modification n'a été effectuée.");
      }
      
      readline.close();
      await prisma.$disconnect();
    });
  } else {
    console.log("✅ Aucun item disponible n'a de prêt actif (c'est normal).");
    await prisma.$disconnect();
  }
}

// Exécution du script principal uniquement (qui appellera checkAvailableItems à son tour)
main()
  .catch(e => {
    console.error("Erreur lors de l'exécution du script:", e);
    prisma.$disconnect();
    process.exit(1);
  });