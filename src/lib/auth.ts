import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { SubscriptionTier } from "@prisma/client";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "@auth/core/adapters";
import type { User } from "@prisma/client";

interface ExtendedUser extends AdapterUser {
  username: string;
  subscriptionTier: SubscriptionTier;
}

declare module "next-auth" {
  interface User extends ExtendedUser {}
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      subscriptionTier: SubscriptionTier;
      name?: string | null;
      image?: string | null;
      emailVerified: Date | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    username: string;
    subscriptionTier: SubscriptionTier;
    name?: string | null;
    image?: string | null;
    emailVerified: Date | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authConfig = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          console.error("Invalid credentials:", parsedCredentials.error);
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            image: true,
            username: true,
            subscriptionTier: true,
            emailVerified: true,
          },
        });

        if (!user?.password) return null;

        const isValid = await compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
          subscriptionTier: user.subscriptionTier,
          emailVerified: user.emailVerified || null,
        } as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as User;
        return {
          ...token,
          id: typedUser.id,
          email: typedUser.email,
          username: typedUser.username,
          subscriptionTier: typedUser.subscriptionTier,
          name: typedUser.name,
          image: typedUser.image,
          emailVerified: typedUser.emailVerified || null,
        };
      }
      return {
        ...token,
        emailVerified: token.emailVerified || null,
      };
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          id: token.id,
          email: token.email,
          username: token.username,
          subscriptionTier: token.subscriptionTier,
          name: token.name,
          image: token.image,
          emailVerified: token.emailVerified || null,
        };
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.email) {
        console.log("User signed in:", user.email);
      }
    },
    async signOut() {
      console.log("User signed out");
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig); 