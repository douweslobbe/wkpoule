"use client"

import Link from "next/link"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#3d0000", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel" style={{ fontSize: "9px", color: "#ff4444" }}>💥 ER IS IETS MISGEGAAN</h2>
        </div>
        <div className="p-6 text-center">
          <p className="font-pixel mb-2" style={{ fontSize: "8px", color: "var(--c-text-2)" }}>
            {error.message || "Een onverwachte fout is opgetreden."}
          </p>
          {error.digest && (
            <p className="font-pixel mb-4" style={{ fontSize: "6px", color: "var(--c-text-5)" }}>
              FOUTCODE: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center mt-5">
            <button
              onClick={reset}
              className="pixel-btn px-4 py-2 font-pixel"
              style={{ background: "#FF6200", color: "white", fontSize: "7px" }}
            >
              OPNIEUW PROBEREN
            </button>
            <Link
              href="/dashboard"
              className="pixel-btn px-4 py-2 font-pixel"
              style={{ background: "var(--c-surface-alt)", color: "var(--c-text-2)", fontSize: "7px" }}
            >
              DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
