"use client"

import { useTransition } from "react"
import { logout } from "@/lib/actions"

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="px-2 py-1 font-bold transition-colors disabled:opacity-50"
      style={{ fontFamily: "var(--font-pixel)", fontSize: "7px", color: "#666688", border: "1px solid #2d2d50" }}
    >
      {isPending ? "..." : "UIT"}
    </button>
  )
}
