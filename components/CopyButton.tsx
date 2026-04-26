"use client"

import { useState } from "react"

export function CopyButton({ text, label = "KOPIEER" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="font-pixel px-2 py-0.5 transition-all"
      style={{
        background: copied ? "#16a34a" : "#22264a",
        color: copied ? "#4af56a" : "#7070a0",
        border: copied ? "2px solid #16a34a" : "2px solid #3a3a60",
        boxShadow: copied ? "none" : "1px 1px 0 #000",
        fontSize: "7px",
      }}
    >
      {copied ? "✓ GEKOPIEERD" : label}
    </button>
  )
}
