import { PrismaClient } from '@prisma/client';

// Instancier le client Prisma
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Création d\'un utilisateur administrateur en cours...');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'admin@cikatio.fr',
      },
    });
    
    if (existingUser) {
      console.log('Un utilisateur avec cet email existe déjà.');
      return;
    }
    
    // Créer l'utilisateur administrateur
    const admin = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'System',
        email: 'admin@cikatio.fr',
        isAdmin: true,
        // Pas de mot de passe hashé initialement - utilisera le flux "mot de passe oublié"
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log('Utilisateur administrateur créé avec succès:');
    console.log(admin);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur administrateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la fonction
createAdmin();