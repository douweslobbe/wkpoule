"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { postPoolMessage } from "@/lib/actions"

export function MessageForm({ poolId }: { poolId: string }) {
  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const MAX = 500
  const remaining = MAX - content.length

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!content.trim()) return
    setError("")
    const fd = new FormData()
    fd.set("poolId", poolId)
    fd.set("content", content)
    startTransition(async () => {
      const result = await postPoolMessage(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setContent("")
        router.refresh()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Schrijf een bericht..."
          maxLength={MAX}
          rows={3}
          className="pixel-input w-full px-3 py-2 resize-none"
          style={{ fontSize: "9px", lineHeight: "1.8" }}
        />
        <span
          className="absolute bottom-2 right-3 font-pixel"
          style={{ fontSize: "6px", color: remaining < 50 ? "#ff6666" : "var(--c-text-5)" }}
        >
          {remaining}
        </span>
      </div>

      {error && (
        <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#ff4444" }}>
          ❌ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="mt-2 px-4 py-2 font-pixel disabled:opacity-40"
        style={{
          background: "#FF6200",
          color: "white",
          border: "3px solid #000",
          boxShadow: "3px 3px 0 #000",
          fontSize: "8px",
        }}
      >
        {isPending ? "PLAATSEN..." : "PLAATSEN ▶"}
      </button>
    </form>
  )
}
