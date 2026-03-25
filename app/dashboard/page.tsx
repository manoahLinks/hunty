"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import { HuntDashboard } from "@/components/HuntDashboard"
import type { StoredHunt } from "@/lib/types"
import { getCreatorHunts, updateHuntStatus, saveClueLocally } from "@/lib/huntStore"
import { activateHunt, addClue } from "@/lib/contracts/hunt"
import { withTransactionToast } from "@/lib/txToast"

export default function DashboardPage() {
  const [hunts, setHunts] = useState<StoredHunt[]>([])

  const refresh = useCallback(() => {
    setHunts(getCreatorHunts())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleActivate = useCallback(async (huntId: number) => {
    await withTransactionToast(
      () => activateHunt(huntId),
      {
        loading: "Confirming in Wallet...",
        submitted: "Transaction Submitted",
        success: "Hunt activated. It is now visible in the Game Arcade.",
      }
    )
    updateHuntStatus(huntId, "Active")
  }, [])

  const handleSaveClues = useCallback(
    async (huntId: number, clues: { question: string; answer: string; points: number }[]) => {
      for (const clue of clues) {
        const normalizedAnswer = clue.answer.trim().toLowerCase()
        await withTransactionToast(
          () => addClue(huntId, clue.question.trim(), normalizedAnswer, clue.points),
          {
            loading: `Adding clue "${clue.question.trim().slice(0, 30)}..."`,
            submitted: "Clue submitted",
            success: "",
          }
        )
        saveClueLocally({ huntId, question: clue.question.trim(), answer: normalizedAnswer, points: clue.points })
      }
    },
    []
  )

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-purple-100 to-[#f9f9ff] pb-12">
      <Header balance="24.2453" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            asChild
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Game Arcade
            </Link>
          </Button>
        </div>

        <h1 className="mb-2 text-3xl font-bold bg-linear-to-br from-[#3737A4] to-[#0C0C4F] text-transparent bg-clip-text">
          My Hunts
        </h1>
        <p className="mb-8 text-slate-600">
          Activate a draft hunt so players can see it in the Game Arcade. Active hunts cannot be edited.
        </p>

        <HuntDashboard
          hunts={hunts}
          onActivate={handleActivate}
          onRefresh={refresh}
          onSaveClues={handleSaveClues}
        />
      </div>
    </div>
  )
}
