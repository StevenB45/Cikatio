import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../authOptions';

// Méthode GET pour récupérer l'utilisateur actuellement connecté via NextAuth
export async function GET(request: Request) {
  try {
    // Récupérer la session NextAuth
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    // Récupérer l'utilisateur en base (pour infos à jour)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isAdmin: true,
        phone: true,
        address: true,
        departmentCode: true,
        departmentName: true,
      }
    });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    console.error('GET /api/auth/profile error:', err);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, email, password } = await request.json();
    
    if (!id || !email) {
      return NextResponse.json({ error: 'ID et email requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe et est un admin
    const existingUser = await prisma.user.findFirst({
      where: { id, isAdmin: true }  // Utiliser isAdmin au lieu de role
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Administrateur non trouvé' }, { status: 404 });
    }

    // Préparer les données à mettre à jour
    const updateData: any = { email };

    // Si un mot de passe est fourni, le hasher
    if (password && password.trim() !== '') {
      updateData.hashedPassword = await bcrypt.hash(password, 10);
    }

    // Mise à jour de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,  // Utiliser isAdmin au lieu de role
      }
    });

    return NextResponse.json(updatedUser);

  } catch (err) {
    console.error('PUT /api/auth/profile error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}