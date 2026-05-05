import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Publieke routes — geen inlog vereist
  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ]

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )

  const isApiPublic =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/forgot-password") ||
    pathname.startsWith("/api/reset-password")

  if (!isLoggedIn && !isPublic && !isApiPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }
})

export const config = {
  // Alles behalve static bestanden en Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
