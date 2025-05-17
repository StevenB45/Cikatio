import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
    }
    // Chercher l'utilisateur admin
    const user = await prisma.user.findFirst({ 
      where: { 
        email: { equals: email, mode: 'insensitive' },
        isAdmin: true 
      } 
    });
    
    if (!user) {
      // Toujours répondre OK pour éviter de révéler l'existence d'un compte
      return NextResponse.json({ success: true });
    }

    // Créer un nouveau token avec expiration dans 24h
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Sauvegarder le token
    await prisma.passwordToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // Vérifier les variables d'environnement requises
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.APP_URL) {
      console.error('Configuration SMTP manquante dans les variables d\'environnement');
      return NextResponse.json({ error: 'Configuration serveur incomplète.' }, { status: 500 });
    }
    
    // Envoyer l'email
    const appUrl = process.env.APP_URL;
    const link = `${appUrl}/auth/set-password?token=${token}`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `Cikatio <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe administrateur',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px">
          <h2>Réinitialisation de votre mot de passe</h2>
          <p>Pour définir un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
          <p style="text-align:center;margin:32px 0">
            <a href="${link}" style="background:#1976d2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Définir mon mot de passe</a>
          </p>
          <p>Ce lien est valable pendant 24 heures.</p>
          <hr style="margin:24px 0" />
          <p style="font-size:13px;color:#888">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
        </div>
      `
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/auth/forgot-password error:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
