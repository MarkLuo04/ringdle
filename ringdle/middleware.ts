import NextAuth from "next-auth";
import { authConfig } from "~/server/auth/config";

export const { auth: middleware } = NextAuth(authConfig);

// Middleware configuration
export const config = {
  // Match all routes except those in the list
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register|verify-email).*)"],
};
