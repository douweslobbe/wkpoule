"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Ververs het prikbord automatisch elke 30 seconden + scroll naar onderste bericht bij laden
export function AutoRefresh() {
  const router = useRouter()

  // Scroll naar laatste bericht bij eerste render
  useEffect(() => {
    const lastMsg = document.querySelector("[data-last-message]")
    if (lastMsg) {
      lastMsg.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [])

  // Refresh elke 30 seconden
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router])

  return null
}
