import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions, getServerSession } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    }),
    process.env.NODE_ENV === 'development'
      ? {
        id: 'credentials',
        name: 'Development Login',
        type: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email', placeholder: 'test@example.com' }
        },
        async authorize(credentials: Record<'email', string> | undefined) {
          if (!credentials?.email) return null;

          // In dev mode, auto-create user if they don't exist
          let user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            user = await prisma.user.create({
              data: { email: credentials.email, name: 'Dev User' }
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name
          };
        }
      }
      : null
  ].filter(Boolean) as any,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
};

export const getAuthSession = () => getServerSession(authOptions);
