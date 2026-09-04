import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    hotelId: string | null;
    regionId: string | null;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      role: UserRole;
      hotelId: string | null;
      regionId: string | null;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    hotelId: string | null;
    regionId: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
          include: {
            hotel: true,
            region: true,
          },
        });

        if (!user || user.status !== 'ACTIVE') {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          hotelId: user.hotelId,
          regionId: user.regionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name;
        token.role = user.role;
        token.hotelId = user.hotelId;
        token.regionId = user.regionId;
      }
      return token;
    },
    async session({ session, token }) {
      // Cast to any to avoid NextAuth v5 type issues with custom fields
      const customSession = session as any;
      customSession.user = {
        id: token.id,
        username: token.username,
        name: token.name,
        role: token.role,
        hotelId: token.hotelId,
        regionId: token.regionId,
      };
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
});
