import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Altijd toegankelijk (ook zonder inlog)
  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ]
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))

  // Niet ingelogd en geen publieke route → naar login
  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Ingelogd en op login/register → naar dashboard
  const isAuthOnly = ["/login", "/register"].some((p) => pathname.startsWith(p))
  if (isLoggedIn && isAuthOnly) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
