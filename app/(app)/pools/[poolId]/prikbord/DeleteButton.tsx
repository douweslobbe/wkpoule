"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { deletePoolMessage } from "@/lib/actions"

export function DeleteButton({ messageId }: { messageId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm("Bericht verwijderen?")) return
    const fd = new FormData()
    fd.set("messageId", messageId)
    startTransition(async () => {
      await deletePoolMessage(fd)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Verwijderen"
      className="font-pixel opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20"
      style={{ fontSize: "8px", color: "#ff4444", background: "none", border: "none", cursor: "pointer" }}
    >
      {isPending ? "..." : "✕"}
    </button>
  )
}
