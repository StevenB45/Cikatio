import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
    }
    // Chercher l'utilisateur admin (email insensible à la casse)
    const user = await prisma.user.findFirst({ 
      where: { 
        email: { equals: email, mode: 'insensitive' },
        isAdmin: true
      }
    });
    
    if (!user || !user.hashedPassword) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!validPassword) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }

    // Authentification réussie
    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin
    });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
