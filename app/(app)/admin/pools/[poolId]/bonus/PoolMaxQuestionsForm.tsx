"use client"

import { useState, useTransition } from "react"
import { updatePoolQuestionLimits } from "@/lib/actions"

export function PoolMaxQuestionsForm({
  poolId,
  maxQuestionsTotal,
  maxQuestionsOpen,
  maxQuestionsEst,
  maxQuestionsStmt,
  currentCounts,
}: {
  poolId: string
  maxQuestionsTotal: number
  maxQuestionsOpen: number
  maxQuestionsEst: number
  maxQuestionsStmt: number
  currentCounts: { total: number; OPEN: number; ESTIMATION: number; STATEMENT: number }
}) {
  const [total, setTotal] = useState(maxQuestionsTotal.toString())
  const [open, setOpen]   = useState(maxQuestionsOpen.toString())
  const [est, setEst]     = useState(maxQuestionsEst.toString())
  const [stmt, setStmt]   = useState(maxQuestionsStmt.toString())
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError("")
    setStatus("saving")
    const fd = new FormData()
    fd.set("poolId", poolId)
    fd.set("maxQuestionsTotal", total)
    fd.set("maxQuestionsOpen", open)
    fd.set("maxQuestionsEst", est)
    fd.set("maxQuestionsStmt", stmt)
    startTransition(async () => {
      const result = await updatePoolQuestionLimits(fd)
      if (result?.error) {
        setError(result.error)
        setStatus("error")
      } else {
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      }
    })
  }

  const openN  = parseInt(open, 10) || 0
  const estN   = parseInt(est, 10) || 0
  const stmtN  = parseInt(stmt, 10) || 0
  const totalN = parseInt(total, 10) || 0
  const sumTypes = openN + estN + stmtN
  const valid = sumTypes <= totalN && totalN >= 0 && openN >= 0 && estN >= 0 && stmtN >= 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Totaal */}
        <div>
          <label className="font-pixel block mb-1" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
            TOTAAL MAX
          </label>
          <input
            type="number" min={0} max={99} value={total}
            onChange={(e) => { setTotal(e.target.value); setStatus("idle") }}
            className="pixel-input w-full text-center font-bold"
            style={{ fontSize: "14px", padding: "6px 0" }}
          />
          <div className="font-pixel mt-1 text-center" style={{ fontSize: "6px", color: "var(--c-text-5)" }}>
            {currentCounts.total} huidig
          </div>
        </div>

        {/* Open */}
        <div>
          <label className="font-pixel block mb-1" style={{ fontSize: "7px", color: "#4499ff" }}>
            OPEN MAX
          </label>
          <input
            type="number" min={0} max={99} value={open}
            onChange={(e) => { setOpen(e.target.value); setStatus("idle") }}
            className="pixel-input w-full text-center font-bold"
            style={{ fontSize: "14px", padding: "6px 0" }}
          />
          <div className="font-pixel mt-1 text-center" style={{ fontSize: "6px", color: "var(--c-text-5)" }}>
            {currentCounts.OPEN} huidig
          </div>
        </div>

        {/* Schatting */}
        <div>
          <label className="font-pixel block mb-1" style={{ fontSize: "7px", color: "#FFD700" }}>
            SCHATTING MAX
          </label>
          <input
            type="number" min={0} max={99} value={est}
            onChange={(e) => { setEst(e.target.value); setStatus("idle") }}
            className="pixel-input w-full text-center font-bold"
            style={{ fontSize: "14px", padding: "6px 0" }}
          />
          <div className="font-pixel mt-1 text-center" style={{ fontSize: "6px", color: "var(--c-text-5)" }}>
            {currentCounts.ESTIMATION} huidig
          </div>
        </div>

        {/* Stelling */}
        <div>
          <label className="font-pixel block mb-1" style={{ fontSize: "7px", color: "#4af56a" }}>
            STELLING MAX
          </label>
          <input
            type="number" min={0} max={99} value={stmt}
            onChange={(e) => { setStmt(e.target.value); setStatus("idle") }}
            className="pixel-input w-full text-center font-bold"
            style={{ fontSize: "14px", padding: "6px 0" }}
          />
          <div className="font-pixel mt-1 text-center" style={{ fontSize: "6px", color: "var(--c-text-5)" }}>
            {currentCounts.STATEMENT} huidig
          </div>
        </div>
      </div>

      {/* Validatie-hint */}
      <div className="font-pixel" style={{ fontSize: "7px", color: !valid ? "#ff4444" : "var(--c-text-4)" }}>
        Som per type: {sumTypes} / totaal: {totalN}
        {!valid && sumTypes > totalN ? " — som overschrijdt totaal!" : ""}
      </div>

      {error && (
        <p className="font-pixel" style={{ fontSize: "7px", color: "#ff4444" }}>{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || !valid}
        className="pixel-btn px-4 py-2 font-pixel"
        style={{
          background: status === "saved" ? "#16a34a" : "#FF6200",
          color: "white",
          fontSize: "7px",
          opacity: (!valid || isPending) ? 0.6 : 1,
          cursor: (!valid || isPending) ? "not-allowed" : "pointer",
        }}
      >
        {isPending || status === "saving" ? "OPSLAAN..." : status === "saved" ? "✓ OPGESLAGEN" : "LIMIETEN OPSLAAN"}
      </button>
    </div>
  )
}
