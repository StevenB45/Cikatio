// Script pour identifier et corriger les incohérences entre les statuts des items et les prêts actifs
import { prisma } from '@/lib/prisma';

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
    }
  } else {
    console.log("✅ Aucun item disponible n'a de prêt actif (c'est normal).");
  }
}

// Exécution du script
main()
  .then(checkAvailableItems)
  .catch(e => {
    console.error("Erreur lors de l'exécution du script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });