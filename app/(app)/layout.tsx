import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { logout } from "@/lib/actions"
import { prisma } from "@/lib/prisma"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const pools = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: { pool: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  })

  return (
    <div className="min-h-screen flex flex-col pitch-bg">
      {/* Pixel art header */}
      <header className="sticky top-0 z-50" style={{ background: "#0a3d1f", borderBottom: "4px solid #1a1a2e" }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-xl">⚽</span>
            <span className="font-pixel text-white hidden sm:block" style={{ fontSize: "8px", lineHeight: "1.4" }}>
              WK POULE<br/>
              <span style={{ color: "#FFD700" }}>2026</span>
            </span>
          </Link>

          {/* Pool tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto flex-1 justify-center px-2">
            {pools.map((m) => (
              <Link
                key={m.pool.id}
                href={`/pools/${m.pool.id}`}
                className="shrink-0 px-2.5 py-1 text-xs font-bold text-white hover:text-yellow-300 whitespace-nowrap transition-colors"
                style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
              >
                {m.pool.name.toUpperCase()}
              </Link>
            ))}
            <Link
              href="/pools/new"
              className="shrink-0 px-2 py-1 text-green-300 hover:text-yellow-300 font-bold text-sm transition-colors"
              title="Nieuwe poule"
            >
              +
            </Link>
          </nav>

          {/* User / admin */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline text-green-300 text-xs">{session.user.name}</span>
            {session.user.isAdmin && (
              <Link
                href="/admin"
                className="px-2 py-1 text-xs font-bold"
                style={{ background: "#FFD700", color: "#1a1a2e", border: "2px solid #1a1a2e", fontFamily: "var(--font-pixel)", fontSize: "7px" }}
              >
                ADMIN
              </Link>
            )}
            <form action={logout}>
              <button
                className="px-2 py-1 text-xs text-white hover:text-yellow-300 font-bold transition-colors"
                style={{ fontFamily: "var(--font-pixel)", fontSize: "7px" }}
              >
                UIT
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="text-center py-4" style={{ borderTop: "3px solid #1a6b36" }}>
        <span className="font-pixel text-green-500" style={{ fontSize: "7px" }}>
          HUP HOLLAND HUP 🇳🇱 · WK 2026
        </span>
      </footer>
    </div>
  )
}
