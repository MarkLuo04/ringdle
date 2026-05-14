import NextAuth from "next-auth";
import { cache } from "react";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./config";
import { db } from "~/server/db";
import { verifyPassword } from "~/server/auth/utils";

// Create NextAuth instance
const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...authConfig.providers,
    // Credentials provider for email/password authentication
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Authorize user with email and password
      async authorize(credentials) {
        // Get email and password from credentials
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Find user by email
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        // Verify password
        const valid = await verifyPassword(password, user.password);
        if (!valid) return null;

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in.");
        }

        // Return user data
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
});

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
