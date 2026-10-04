import { type NextRequest, NextResponse } from "next/server"

/**
 * Session detection for routing purposes only.
 *
 * next-auth stores the session JWT in one of these cookies depending on the
 * environment (http vs https). We just need to know if a token *exists* so we
 * can redirect appropriately. The actual session validation (signature check,
 * expiry, etc.) is done server-side in each protected Server Component via
 * `auth()` from lib/auth.ts.
 */
function hasSession(req: NextRequest): boolean {
  return !!(
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token")
  )
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isLoggedIn = hasSession(req)

  // Root always redirects to /pages
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/pages", req.url))
  }

  // Login page: send already-authenticated users straight to /pages
  if (pathname.startsWith("/login")) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/pages", req.url))
    }
    return NextResponse.next()
  }

  // All other routes are protected — redirect to /login if not authenticated
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run on every route except Next.js internals and the NextAuth API
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
