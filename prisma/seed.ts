import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Supprimer l'utilisateur admin s'il existe déjà
    await prisma.user.deleteMany({
      where: {
        email: 'admin@cikatio.fr'
      }
    });

    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'System',
        email: 'admin@cikatio.fr',
        isAdmin: true,
        hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('=================================');
    console.log('Compte administrateur créé avec succès !');
    console.log('Email: admin@cikatio.fr');
    console.log('Mot de passe: Admin123!');
    console.log('=================================');
    console.log('Veuillez vous connecter avec ces identifiants.');

  } catch (error) {
    console.error('Erreur lors de la création du compte admin:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });