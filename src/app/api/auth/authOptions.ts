import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email et mot de passe',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@cikatio.fr' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Tentative de connexion avec :', credentials);
        if (!credentials?.email || !credentials?.password) {
          console.log('Email ou mot de passe manquant');
          throw new Error('Email et mot de passe requis');
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        console.log('Utilisateur trouvé :', user);
        if (!user || !user.hashedPassword) {
          console.log('Aucun utilisateur ou mot de passe non défini');
          throw new Error('Identifiants invalides');
        }
        const isValid = await compare(credentials.password, user.hashedPassword);
        console.log('Mot de passe valide ?', isValid);
        if (!isValid) {
          console.log('Mot de passe invalide');
          throw new Error('Identifiants invalides');
        }
        console.log('Connexion réussie pour :', user.email);
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async jwt({ token, user }: { token: any, user?: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          firstName: token.firstName,
          lastName: token.lastName,
          isAdmin: token.isAdmin,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string, baseUrl: string }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 