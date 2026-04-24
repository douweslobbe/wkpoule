"use client"

import { useEffect } from "react"

export function PrikbordSeenMarker({ poolId }: { poolId: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(`prikbord_seen_${poolId}`, Date.now().toString())
    } catch {
      // localStorage not available
    }
  }, [poolId])

  return null
}
