"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deletePoolMessage } from "@/lib/actions"

export function DeleteButton({ messageId }: { messageId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    const fd = new FormData()
    fd.set("messageId", messageId)
    startTransition(async () => {
      await deletePoolMessage(fd)
      router.refresh()
    })
  }

  if (confirm) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="font-pixel px-1.5 py-0.5"
          style={{ fontSize: "6px", color: "#fff", background: "#cc2222", border: "1px solid #000", cursor: "pointer" }}
        >
          {isPending ? "..." : "✕ WEG"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="font-pixel px-1.5 py-0.5"
          style={{ fontSize: "6px", color: "var(--c-text-3)", background: "var(--c-surface-deep)", border: "1px solid var(--c-border)", cursor: "pointer" }}
        >
          NEE
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title="Verwijderen"
      className="font-pixel opacity-30 hover:opacity-90 transition-opacity"
      style={{ fontSize: "8px", color: "#ff4444", background: "none", border: "none", cursor: "pointer" }}
    >
      ✕
    </button>
  )
}
