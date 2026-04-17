"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addBonusQuestion } from "@/lib/actions"
import { BonusQuestionType } from "@prisma/client"

export function AddQuestionForm({ poolId }: { poolId: string }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    fd.set("poolId", poolId)
    startTransition(async () => {
      const result = await addBonusQuestion(fd)
      if (result?.error) setError(result.error)
      else {
        ;(e.target as HTMLFormElement).reset()
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        <select
          name="type"
          required
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="OPEN">Openvraag</option>
          <option value="ESTIMATION">Benaderingsvraag</option>
          <option value="STATEMENT">Stelling</option>
        </select>
      </div>
      <input
        name="question"
        type="text"
        required
        placeholder="Vraag of stelling..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <input
        name="description"
        type="text"
        placeholder="Toelichting (optioneel)..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm"
      >
        {isPending ? "Toevoegen..." : "Vraag toevoegen"}
      </button>
    </form>
  )
}
