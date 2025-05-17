import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Token ou mot de passe invalide.' }, { status: 400 });
    }

    // Chercher le token valide
    const passwordToken = await prisma.passwordToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!passwordToken || !passwordToken.user.isAdmin) {
      return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe et supprimer tous les tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordToken.userId },
        data: { hashedPassword }
      }),
      prisma.passwordToken.deleteMany({
        where: { userId: passwordToken.userId }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/auth/set-password error:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
