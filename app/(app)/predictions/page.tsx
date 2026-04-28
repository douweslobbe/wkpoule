import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Voorspellingen zijn pool-specifiek. Stuur door naar de eerste pool van de gebruiker.
 * De GlobalNav verwijst nu ook direct naar /pools/[poolId]/predictions.
 */
export default async function PredictionsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; pool?: string; view?: string }>
}) {
  const sp = await searchParams
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Als er een pool-param in de URL zit, gebruik die
  const poolId = sp.pool ?? null

  if (poolId) {
    const membership = await prisma.poolMembership.findUnique({
      where: { userId_poolId: { userId: session.user.id, poolId } },
    })
    if (membership) {
      const qs = new URLSearchParams()
      if (sp.stage) qs.set("stage", sp.stage)
      if (sp.view) qs.set("view", sp.view)
      redirect(`/pools/${poolId}/predictions${qs.toString() ? `?${qs}` : ""}`)
    }
  }

  // Geen pool-param of geen lid: eerste pool van de gebruiker
  const firstMembership = await prisma.poolMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  })

  if (!firstMembership) redirect("/dashboard")

  const qs = new URLSearchParams()
  if (sp.stage) qs.set("stage", sp.stage)
  if (sp.view) qs.set("view", sp.view)
  redirect(`/pools/${firstMembership.poolId}/predictions${qs.toString() ? `?${qs}` : ""}`)
}
