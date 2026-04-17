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
    <div className="min-h-screen flex flex-col">
      <header className="bg-orange-500 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <span>⚽</span>
            <span className="hidden sm:inline">WK Poule 2026</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            {pools.map((m) => (
              <Link
                key={m.pool.id}
                href={`/pools/${m.pool.id}`}
                className="px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors truncate max-w-32"
              >
                {m.pool.name}
              </Link>
            ))}
            <Link
              href="/pools/new"
              className="px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
              title="Nieuwe poule"
            >
              +
            </Link>
          </nav>

          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline text-orange-100">{session.user.name}</span>
            {session.user.isAdmin && (
              <Link href="/admin" className="px-2 py-1 bg-orange-700 rounded text-xs hover:bg-orange-800">
                Admin
              </Link>
            )}
            <form action={logout}>
              <button className="px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors">
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        WK Poule 2026 — Hup Holland Hup! 🇳🇱
      </footer>
    </div>
  )
}
