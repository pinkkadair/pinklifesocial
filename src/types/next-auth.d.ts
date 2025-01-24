import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      subscriptionTier: 'FREE' | 'PINKU' | 'VIP';
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    subscriptionTier: 'FREE' | 'PINKU' | 'VIP';
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    subscriptionTier: 'FREE' | 'PINKU' | 'VIP';
  }
} 