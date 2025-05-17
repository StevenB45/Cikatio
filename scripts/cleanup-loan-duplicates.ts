import { PrismaClient, LoanStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupLoanDuplicates() {
  const items = await prisma.item.findMany({
    select: { id: true, name: true }
  });

  let totalUpdated = 0;

  for (const item of items) {
    // Trouver tous les prêts non retournés pour cet item
    const activeLoans = await prisma.loan.findMany({
      where: {
        itemId: item.id,
        returnedAt: null,
        status: { in: [ 'ACTIVE', 'OVERDUE', 'SCHEDULED' ] }
      },
      orderBy: { borrowedAt: 'desc' }
    });

    if (activeLoans.length > 1) {
      // Garder le plus récent, retourner les autres
      const [mostRecent, ...toReturn] = activeLoans;
      for (const loan of toReturn) {
        await prisma.loan.update({
          where: { id: loan.id },
          data: {
            status: 'RETURNED',
            returnedAt: new Date()
          }
        });
        console.log(`Prêt ${loan.id} (item: ${item.name}) marqué comme RETURNED.`);
        totalUpdated++;
      }
    }
  }
  console.log(`Nettoyage terminé. Prêts mis à jour : ${totalUpdated}`);
}

cleanupLoanDuplicates()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); }); 