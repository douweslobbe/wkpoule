"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Ververs het prikbord automatisch elke 30 seconden
export function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router])

  return null
}
