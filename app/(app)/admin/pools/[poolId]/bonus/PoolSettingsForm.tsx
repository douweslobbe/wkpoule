"use client"

import { useState, useTransition } from "react"
import { updatePoolDescription } from "@/lib/actions"

export function PoolSettingsForm({
  poolId,
  currentDescription,
}: {
  poolId: string
  currentDescription: string
}) {
  const [desc, setDesc] = useState(currentDescription)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setStatus("saving")
    const fd = new FormData()
    fd.set("poolId", poolId)
    fd.set("description", desc)
    startTransition(async () => {
      const result = await updatePoolDescription(fd)
      if (result?.error) {
        setStatus("error")
      } else {
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      }
    })
  }

  return (
    <div className="space-y-3">
      <textarea
        value={desc}
        onChange={(e) => { setDesc(e.target.value); setStatus("idle") }}
        placeholder="Bijv: Inzet €5 per persoon · Winnaar krijgt de pot · Verliezer moet rondjes geven 🍺"
        rows={3}
        className="pixel-input w-full px-3 py-2 resize-none"
        style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "8px", lineHeight: "1.9" }}
        maxLength={300}
      />
      <div className="flex items-center justify-between">
        <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
          {desc.length}/300 tekens
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="pixel-btn px-3 py-1.5 font-pixel"
          style={{
            background: status === "saved" ? "#16a34a" : "#FF6200",
            color: "white",
            fontSize: "7px",
          }}
        >
          {isPending || status === "saving"
            ? "OPSLAAN..."
            : status === "saved"
            ? "✓ OPGESLAGEN"
            : status === "error"
            ? "✕ FOUT"
            : "OPSLAAN"}
        </button>
      </div>
    </div>
  )
}
