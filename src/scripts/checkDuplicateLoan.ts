// Script pour diagnostiquer le problème de doublons dans les prêts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== DIAGNOSTIC DES PRÊTS DUPLIQUÉS ===");
  
  // 1. Récupérer l'item "La femme de ménage"
  const item = await prisma.item.findFirst({
    where: { name: "La femme de ménage" },
    include: { loans: true }
  });

  if (!item) {
    console.log("Item 'La femme de ménage' non trouvé.");
    return;
  }

  console.log(`\n=== INFORMATIONS SUR L'ITEM ===`);
  console.log(`ID: ${item.id}`);
  console.log(`Nom: ${item.name}`);
  console.log(`Statut de réservation: ${item.reservationStatus}`);
  console.log(`Nombre de prêts associés: ${item.loans.length}`);

  // 2. Afficher les détails de chaque prêt
  console.log(`\n=== DÉTAILS DES PRÊTS ASSOCIÉS ===`);
  
  for (const loan of item.loans) {
    console.log(`\nPrêt ID: ${loan.id}`);
    console.log(`Status: ${loan.status}`);
    console.log(`Emprunté le: ${loan.borrowedAt}`);
    console.log(`À retourner le: ${loan.dueAt}`);
    console.log(`Retourné le: ${loan.returnedAt || 'Non retourné'}`);
    
    // Récupérer l'emprunteur
    const borrower = await prisma.user.findUnique({ 
      where: { id: loan.borrowerId }
    });
    
    console.log(`Emprunteur: ${borrower ? `${borrower.firstName} ${borrower.lastName}` : 'Inconnu'}`);
  }

  // 3. Vérifier si des prêts virtuels sont générés pour cet item
  console.log(`\n=== VÉRIFICATION DES PRÊTS VIRTUELS ===`);
  
  if (item.reservationStatus === 'BORROWED' && item.loans.every(loan => loan.returnedAt !== null)) {
    console.log(`PROBLÈME DÉTECTÉ: Cet item est marqué comme emprunté mais tous ses prêts sont marqués comme retournés.`);
    console.log(`Cela provoque la génération d'un prêt virtuel dans l'interface, créant ainsi un doublon.`);
  } else {
    console.log(`Aucune condition de génération de prêt virtuel détectée.`);
  }
  
  // 4. Vérifier les données récupérées par l'API de prêts
  console.log(`\n=== SIMULATION DE LA RÉPONSE DE L'API DES PRÊTS ===`);
  
  // Récupérer les prêts réels
  const realLoans = await prisma.loan.findMany({
    where: { itemId: item.id },
    include: { 
      item: true,
      borrower: true
    }
  });
  
  console.log(`Nombre de prêts réels retournés par l'API: ${realLoans.length}`);
  
  // Vérifier si un prêt virtuel serait généré
  const hasActiveOrOverdueLoan = realLoans.some(loan => 
    (loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && loan.returnedAt === null
  );
  
  if (item.reservationStatus === 'BORROWED' && !hasActiveOrOverdueLoan) {
    console.log(`UN PRÊT VIRTUEL SERAIT GÉNÉRÉ pour cet item car:`);
    console.log(`- L'item est marqué comme BORROWED`);
    console.log(`- Aucun prêt actif/en retard n'existe pour cet item`);
    
    // Chercher le dernier prêt pour cet item
    const lastLoan = await prisma.loan.findFirst({
      where: { itemId: item.id },
      orderBy: { createdAt: 'desc' },
      include: { borrower: true }
    });
    
    if (lastLoan) {
      console.log(`\nDernier prêt trouvé:`);
      console.log(`ID: ${lastLoan.id}`);
      console.log(`Status: ${lastLoan.status}`);
      console.log(`Retourné: ${lastLoan.returnedAt ? 'Oui' : 'Non'}`);
    }
  } else {
    console.log(`AUCUN PRÊT VIRTUEL NE SERAIT GÉNÉRÉ car l'une des conditions suivantes n'est pas remplie:`);
    console.log(`- L'item est marqué comme ${item.reservationStatus} (doit être BORROWED)`);
    console.log(`- ${hasActiveOrOverdueLoan ? 'Des prêts actifs/en retard existent' : 'Aucun prêt actif/en retard n\'existe'}`);
  }
  
  // 5. Proposer une correction
  console.log(`\n=== DIAGNOSTIC ET CORRECTION ===`);
  
  if (item.reservationStatus === 'BORROWED' && item.loans.every(loan => loan.returnedAt !== null)) {
    console.log(`SOLUTION: L'item devrait être marqué comme AVAILABLE puisque tous ses prêts sont retournés.`);
    
    const userInput = process.argv.includes('--fix');
    
    if (userInput) {
      try {
        await prisma.item.update({
          where: { id: item.id },
          data: { reservationStatus: 'AVAILABLE' }
        });
        console.log(`✅ L'item a été mis à jour avec succès! Son statut est maintenant AVAILABLE.`);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    } else {
      console.log(`Pour corriger automatiquement, exécutez ce script avec --fix à la fin.`);
    }
  } else if (hasActiveOrOverdueLoan && item.reservationStatus !== 'BORROWED') {
    console.log(`SOLUTION: L'item devrait être marqué comme BORROWED puisqu'il a des prêts actifs.`);
    
    const userInput = process.argv.includes('--fix');
    
    if (userInput) {
      try {
        await prisma.item.update({
          where: { id: item.id },
          data: { reservationStatus: 'BORROWED' }
        });
        console.log(`✅ L'item a été mis à jour avec succès! Son statut est maintenant BORROWED.`);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    } else {
      console.log(`Pour corriger automatiquement, exécutez ce script avec --fix à la fin.`);
    }
  } else {
    console.log(`Aucune incohérence détectée dans les données. Le problème pourrait être au niveau de l'interface utilisateur.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());