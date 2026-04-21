import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { logout } from "@/lib/actions"
import { prisma } from "@/lib/prisma"
import { PixelBackground } from "@/components/PixelBackground"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const pools = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: { pool: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  })

  return (
    <div className="min-h-screen flex flex-col pitch-bg scanlines" style={{ position: "relative" }}>
      <PixelBackground />
      {/* SNES-style header */}
      <header className="sticky top-0 z-50" style={{ background: "#071810", borderBottom: "4px solid #000", boxShadow: "0 4px 0 #0a3d1f" }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-xl">⚽</span>
            <div className="hidden lg:block">
              <span className="font-pixel" style={{ fontSize: "5px", lineHeight: "2", display: "block", color: "#aaaaaa" }}>
                DOUWE&apos;S SUPER MEGALOMANE
              </span>
              <span className="font-pixel" style={{ fontSize: "7px", lineHeight: "1.5", display: "block" }}>
                <span style={{ color: "#FF6200" }}>WK</span>{" "}
                <span style={{ color: "#FFD700" }}>POULE</span>{" "}
                <span style={{ color: "#4af56a" }}>2026</span>
              </span>
            </div>
            <div className="hidden sm:block lg:hidden">
              <span className="font-pixel" style={{ fontSize: "7px", lineHeight: "1.5", display: "block" }}>
                <span style={{ color: "#FF6200" }}>WK</span>{" "}
                <span style={{ color: "#FFD700" }}>POULE</span>{" "}
                <span style={{ color: "#4af56a" }}>&apos;26</span>
              </span>
            </div>
          </Link>

          {/* Pool tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto flex-1 justify-center px-2">
            {pools.map((m) => (
              <Link
                key={m.pool.id}
                href={`/pools/${m.pool.id}`}
                className="shrink-0 px-2.5 py-1 font-bold whitespace-nowrap transition-colors"
                style={{
                  fontFamily: "var(--font-pixel), monospace",
                  fontSize: "6px",
                  color: "#8888aa",
                  border: "1px solid #2d2d50",
                  background: "#0d0f1a",
                }}
              >
                {m.pool.name.toUpperCase()}
              </Link>
            ))}
            <Link
              href="/pools/new"
              className="shrink-0 px-2 py-1 font-bold text-sm transition-colors"
              style={{ color: "#4af56a", fontFamily: "var(--font-pixel)", fontSize: "10px" }}
              title="Nieuwe poule"
            >
              +
            </Link>
          </nav>

          {/* User / admin */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline font-pixel" style={{ fontSize: "6px", color: "#4af56a" }}>
              {session.user.name?.toUpperCase()}
            </span>
            {session.user.isAdmin && (
              <Link
                href="/admin"
                className="px-2 py-1 font-bold"
                style={{ background: "#FFD700", color: "#000", border: "2px solid #000", fontFamily: "var(--font-pixel)", fontSize: "7px", boxShadow: "2px 2px 0 #000" }}
              >
                ADMIN
              </Link>
            )}
            <form action={logout}>
              <button
                className="px-2 py-1 font-bold transition-colors"
                style={{ fontFamily: "var(--font-pixel)", fontSize: "7px", color: "#666688", border: "1px solid #2d2d50" }}
              >
                UIT
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6" style={{ position: "relative", zIndex: 1 }}>
        {children}
      </main>

      <footer className="text-center py-4" style={{ borderTop: "3px solid #0a3d1f", position: "relative", zIndex: 1 }}>
        <span className="font-pixel" style={{ fontSize: "7px", color: "#2d6b3d" }}>
          HUP HOLLAND HUP 🇳🇱 · WK 2026
        </span>
      </footer>
    </div>
  )
}
