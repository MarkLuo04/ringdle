export { auth as middleware } from "~/server/auth";

// Middleware configuration
export const config = {
  // Match all routes except those in the list
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
