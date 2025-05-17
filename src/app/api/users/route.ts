import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

function formatName(firstName: string, lastName: string) {
  return {
    firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(),
    lastName: lastName.toUpperCase(),
  };
}

export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ error: 'Erreur lors de la récupération des utilisateurs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();
    if (!data.email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Email, prénom ou nom manquant' }, { status: 400 });
    }
    const formatted = formatName(firstName, lastName);
    // Utiliser isAdmin pour la logique admin
    let passwordToken = undefined;
    if (data.isAdmin) {
      passwordToken = crypto.randomBytes(32).toString('hex');
    }
    // Correction : n'utiliser que les champs du schéma Prisma
    const created = await prisma.user.create({
      data: {
        email: data.email,
        firstName: formatted.firstName,
        lastName: formatted.lastName,
        phone: data.phone || '',
        address: data.address || '',
        isAdmin: !!data.isAdmin,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        departmentCode: data.departmentCode || null,
        departmentName: data.departmentName || null,
        // Pas de hashedPassword ni de role
      }
    });
    // Historique action
    await prisma.userActionHistory.create({
      data: {
        targetUserId: created.id,
        action: 'CREATE',
        performerId: data.adminId || null,
        comment: 'Création de l’usager',
      }
    });
    // Envoi du mail d'activation si admin
    if (data.isAdmin && passwordToken) {
      // Vérifier les variables d'environnement requises
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.APP_URL) {
        console.error('Configuration SMTP manquante dans les variables d\'environnement');
        // Continuer sans envoyer d'email mais logger l'erreur
        console.warn('Impossible d\'envoyer l\'email d\'activation pour le nouvel administrateur');
        return NextResponse.json(created);
      }
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      const appUrl = process.env.APP_URL;
      const link = `${appUrl}/auth/set-password?token=${passwordToken}`;
      await transporter.sendMail({
        from: process.env.MAIL_FROM || `Cikatio <${process.env.SMTP_USER}>`,
        to: data.email,
        subject: 'Bienvenue sur Cikatio – Activez votre accès administrateur',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px">
            <img src="https://ton-domaine.com/logo.png" alt="Cikatio" style="height:40px;margin-bottom:16px" />
            <h2>Bonjour ${formatted.firstName} ${formatted.lastName},</h2>
            <p>Un compte administrateur vient d'être créé pour vous sur <b>Cikatio</b>.</p>
            <p>Pour activer votre accès et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
            <p style="text-align:center;margin:32px 0">
              <a href="${link}" style="background:#1976d2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Définir mon mot de passe</a>
            </p>
            <p>Ce lien est personnel et valable une seule fois.</p>
            <hr style="margin:24px 0" />
            <p style="font-size:13px;color:#888">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.<br>
            Besoin d’aide ? Contactez <a href="mailto:support@ton-domaine.com">support@ton-domaine.com</a></p>
          </div>
        `
      });
    }
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/users error:', err);
    return NextResponse.json({ error: 'Erreur serveur lors de la création de l\'utilisateur' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, firstName, lastName, email, phone, address, isAdmin, dateOfBirth, departmentCode, departmentName } = data;
    if (!id || !firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }
    const formatted = formatName(firstName, lastName);
    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName: formatted.firstName,
        lastName: formatted.lastName,
        email,
        phone,
        address,
        isAdmin: !!isAdmin,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        departmentCode: departmentCode || null,
        departmentName: departmentName || null,
      }
    });
    // Historique action
    await prisma.userActionHistory.create({
      data: {
        targetUserId: id,
        action: 'UPDATE',
        performerId: data.adminId || null,
        comment: 'Modification de l’usager',
      }
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/users error:', err);
    return NextResponse.json({ error: 'Erreur serveur lors de la modification de l\'utilisateur' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
  }
  try {
    // Supprimer tous les prêts liés à cet utilisateur
    await prisma.loan.deleteMany({ where: { borrowerId: id } });
    // Historique action (avant suppression de l'utilisateur)
    await prisma.userActionHistory.create({
      data: {
        targetUser: { connect: { id } },
        action: 'DELETE',
        comment: 'Suppression de l’usager',
      }
    });
    // Puis supprimer l'utilisateur
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/users error:', err);
    // Ajout : renvoyer le message d'erreur détaillé pour le debug
    return NextResponse.json({ error: 'Erreur serveur lors de la suppression', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
