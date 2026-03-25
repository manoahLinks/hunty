"use client"

import { useState } from "react"
import { Plus, Trash2, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { StoredHunt, ClueRow } from "@/lib/types"
import { ActivateHuntModal } from "@/components/ActivateHuntModal"
import { LeaderboardTable } from "@/components/LeaderBoardTable"
import Link from "next/link"

interface HuntDashboardProps {
  hunts: StoredHunt[]
  onActivate: (huntId: number) => Promise<void>
  onRefresh: () => void
  onSaveClues: (huntId: number, clues: ClueRow[]) => Promise<void>
}

function StatusBadge({ status }: { status: StoredHunt["status"] }) {
  const styles =
    status === "Active"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : status === "Completed"
        ? "bg-slate-100 text-slate-700 border-slate-200"
        : "bg-amber-100 text-amber-800 border-amber-200"
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  )
}

export function HuntDashboard({ hunts, onActivate, onRefresh, onSaveClues }: HuntDashboardProps) {
  const [modalHunt, setModalHunt] = useState<StoredHunt | null>(null)
  const [activatingId, setActivatingId] = useState<number | null>(null)
  const [clueModalHunt, setClueModalHunt] = useState<StoredHunt | null>(null)
  const [leaderboardHunt, setLeaderboardHunt] = useState<StoredHunt | null>(null)
  const [clueRows, setClueRows] = useState<ClueRow[]>([
    { id: 1, question: "", answer: "", points: 10 },
  ])
  const [isSavingClues, setIsSavingClues] = useState(false)

  const handleActivateClick = (hunt: StoredHunt) => {
    setModalHunt(hunt)
  }

  const handleConfirmActivate = async () => {
    if (!modalHunt) return
    setActivatingId(modalHunt.id)
    try {
      await onActivate(modalHunt.id)
      onRefresh()
      setModalHunt(null)
    } finally {
      setActivatingId(null)
    }
  }

  const openClueModal = (hunt: StoredHunt) => {
    setClueRows([{ id: 1, question: "", answer: "", points: 10 }])
    setClueModalHunt(hunt)
  }

  const addClueRow = () => {
    const newId = clueRows.length > 0 ? Math.max(...clueRows.map((r) => r.id)) + 1 : 1
    setClueRows([...clueRows, { id: newId, question: "", answer: "", points: 10 }])
  }

  const removeClueRow = (id: number) => {
    if (clueRows.length > 1) {
      setClueRows(clueRows.filter((r) => r.id !== id))
    }
  }

  const updateClueRow = (id: number, field: keyof Omit<ClueRow, "id">, value: string | number) => {
    setClueRows(clueRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const handleSaveClues = async () => {
    if (!clueModalHunt) return
    const valid = clueRows.filter((r) => r.question.trim() && r.answer.trim())
    if (!valid.length) return

    setIsSavingClues(true)
    try {
      await onSaveClues(clueModalHunt.id, valid)
      onRefresh()
      setClueModalHunt(null)
    } finally {
      setIsSavingClues(false)
    }
  }

  const cluesAreValid = clueRows.some((r) => r.question.trim() && r.answer.trim())

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hunts.map((hunt) => {
          const isDraft = hunt.status === "Draft"
          const isActive = hunt.status === "Active"
          const isCompleted = hunt.status === "Completed"
          const hasClues = hunt.cluesCount > 0
          const canActivate = isDraft && hasClues

          return (
            <Card
              key={hunt.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <Link href={`/hunt/${hunt.id}`}>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">{hunt.title}</CardTitle>
                  <StatusBadge status={hunt.status} />
                </div>
                <CardDescription className="mb-4 line-clamp-3 text-sm text-slate-600">
                  {hunt.description}
                </CardDescription>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    {hunt.cluesCount} {hunt.cluesCount === 1 ? "clue" : "clues"}
                  </span>
                  <div className="flex gap-2">
                    {isDraft && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openClueModal(hunt)}
                        className="border-[#3737A4] text-[#3737A4] hover:bg-[#3737A4] hover:text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Clues
                      </Button>
                    )}
                    {(isActive || isCompleted) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLeaderboardHunt(hunt)}
                        className="border-[#3737A4] text-[#3737A4] hover:bg-[#3737A4] hover:text-white flex items-center gap-1.5"
                      >
                        <Trophy className="w-4 h-4" />
                        Leaderboard
                      </Button>
                    )}
                    {isDraft && (
                      <Button
                        size="sm"
                        onClick={() => handleActivateClick(hunt)}
                        disabled={!canActivate}
                        className="bg-gradient-to-b from-[#39A437] to-[#194F0C] hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
                {isDraft && !hasClues && (
                  <p className="mt-2 text-xs text-amber-600">
                    Add at least one clue to activate.
                  </p>
                )}
              </div>
              </Link>
            </Card>
          )
        })}
      </div>

      <ActivateHuntModal
        isOpen={!!modalHunt}
        onClose={() => setModalHunt(null)}
        onConfirm={handleConfirmActivate}
        huntTitle={modalHunt?.title ?? ""}
        isActivating={activatingId !== null}
      />

      {/* Leaderboard Modal */}
      <Dialog open={!!leaderboardHunt} onOpenChange={(open) => !open && setLeaderboardHunt(null)}>
        <DialogContent showCloseButton className="sm:max-w-2xl bg-[#f9f9ff]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-b from-[#3737A4] to-[#0C0C4F] text-transparent bg-clip-text text-center">
              Leaderboard — {leaderboardHunt?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="bg-white rounded-2xl p-6 shadow-inner border border-slate-100">
            {leaderboardHunt && (
              <LeaderboardTable huntId={leaderboardHunt.id} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Clues Modal */}
      <Dialog open={!!clueModalHunt} onOpenChange={(open) => !open && setClueModalHunt(null)}>
        <DialogContent showCloseButton className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-b from-[#3737A4] to-[#0C0C4F] text-transparent bg-clip-text">
              Add Clues — {clueModalHunt?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-[1fr_1fr_56px_32px] gap-2 px-1">
              <span className="text-xs font-medium text-slate-500">Riddle / Question</span>
              <span className="text-xs font-medium text-slate-500">Answer</span>
              <span className="text-xs font-medium text-slate-500">Points</span>
              <span />
            </div>

            {clueRows.map((row, index) => (
              <div key={row.id} className="grid grid-cols-[1fr_1fr_56px_32px] gap-2 items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 shrink-0 w-4">{index + 1}.</span>
                  <Input
                    placeholder="e.g. What has keys but no locks?"
                    value={row.question}
                    onChange={(e) => updateClueRow(row.id, "question", e.target.value)}
                    className="pl-3 py-2 text-sm"
                  />
                </div>
                <Input
                  placeholder="keyboard"
                  value={row.answer}
                  onChange={(e) => updateClueRow(row.id, "answer", e.target.value)}
                  className="pl-3 py-2 text-sm"
                />
                <Input
                  type="number"
                  placeholder="10"
                  value={row.points}
                  min={1}
                  onChange={(e) => updateClueRow(row.id, "points", parseInt(e.target.value, 10) || 0)}
                  className="pl-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeClueRow(row.id)}
                  disabled={clueRows.length === 1}
                  className="text-red-400 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={addClueRow}
              className="flex items-center gap-1 border-[#3737A4] text-[#3737A4] hover:bg-[#3737A4] hover:text-white"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setClueModalHunt(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveClues}
                disabled={isSavingClues || !cluesAreValid}
                className="bg-gradient-to-b from-[#39A437] to-[#194F0C] hover:bg-green-700 text-white disabled:opacity-50"
              >
                {isSavingClues ? "Saving..." : "Save Clues"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
