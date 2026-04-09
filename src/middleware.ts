import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't need auth
  const publicPaths = ["/login", "/registro", "/esqueci-senha", "/redefinir-senha", "/verificar-email", "/api/auth", "/api/debug"];

  // Root path: handled in page.tsx (redirects to dashboard if authenticated, else shows landing)
  if (pathname === "/") return NextResponse.next();
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) return NextResponse.next();

  const isSecure = process.env.NODE_ENV === "production";
  // In production (HTTPS) NextAuth prefixes the cookie with __Secure-
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" || pathname === "/registro") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
