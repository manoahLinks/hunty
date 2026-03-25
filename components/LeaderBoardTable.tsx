"use client"

import { ReactNode, useEffect, useState, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { get_hunt_leaderboard } from "@/lib/contracts/hunt"
import Medal from "@/components/icons/Medal"
import type { LeaderboardDisplayEntry } from "@/lib/types"

interface LeaderboardTableProps {
  huntId?: number
  data?: LeaderboardDisplayEntry[]
  isLoading?: boolean
}

export function LeaderboardTable({ huntId, data: initialData, isLoading: initialLoading = false }: LeaderboardTableProps) {
  const [data, setData] = useState<LeaderboardDisplayEntry[]>(initialData || [])
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)

  const truncateAddress = (address: string) => {
    if (address.length <= 8) return address
    return `${address.slice(0, 3)}...${address.slice(-3)}`
  }

  const fetchLeaderboard = useCallback(async () => {
    if (huntId === undefined) return

    try {
      // Only set loading on initial fetch to avoid flickering during polling
      if (data.length === 0) setIsLoading(true)

      const rawData = await get_hunt_leaderboard(huntId)

      // Sort by points descending (Requirement: Do not assume contract returns pre-sorted)
      const sortedData = [...rawData].sort((a, b) => b.points - a.points)

      // Map to UI-friendly format (Requirement: Truncate wallet if no name)
      const mappedData: LeaderboardDisplayEntry[] = sortedData.map((entry, index) => ({
        position: index + 1,
        name: entry.name || truncateAddress(entry.address),
        points: entry.points,
        icon: <Medal position={index + 1} /> // Requirement: Top 3 Highlighting via Medal icons
      }))

      setData(mappedData)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err)
      setError("Failed to load leaderboard data.")
    } finally {
      setIsLoading(false)
    }
  }, [huntId, data.length])

  useEffect(() => {
    if (huntId !== undefined) {
      fetchLeaderboard()
      const interval = setInterval(fetchLeaderboard, 30000) // Requirement: 30-second polling
      return () => clearInterval(interval)
    }
  }, [huntId, fetchLeaderboard])

  const containerClass = "rounded-none max-w-2xl mx-auto";

  if (error) {
    return (
      <div className={`${containerClass} p-8 text-center bg-white rounded-xl border border-red-200`}>
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => fetchLeaderboard()}
          className="mt-4 text-sm text-[#3737A4] hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!isLoading && data.length === 0) {
    return (
      <div className={`${containerClass} p-12 text-center bg-white rounded-xl border border-dashed border-slate-300`}>
        <p className="text-slate-500 font-medium">No players on the leaderboard yet. Be the first!</p>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <table className="w-full rounded-none border-l border-[#808080] border-collapse">
        <thead>
          <tr className="bg-gradient-to-b from-[#3737A4] to-[#0C0C4F] text-white">
            <th className="px-4 py-2 text-center border border-r-2 border-white">Position</th>
            <th className="px-4 py-2 text-left border border-r-2 border-white">Display Name / Wallet Address</th>
            <th className="px-4 py-2 text-center">Points Won</th>
          </tr>
        </thead>
        <tbody>
          {(isLoading && data.length === 0) ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="bg-white">
                <td className="px-4 py-3 flex items-center justify-center gap-2 text-center border-r-2 border-[#808080] border-b-2">
                  <Skeleton className="w-6 h-6 rounded-full bg-slate-200" />
                  <Skeleton className="w-4 h-5 bg-slate-200" />
                </td>
                <td className="px-4 py-3 border-r-2 border-[#808080] border-b-2">
                  <Skeleton className="w-1/2 h-5 bg-slate-200" />
                </td>
                <td className="px-4 py-3 text-center border border-b-2 border-[#808080]">
                  <Skeleton className="w-8 h-5 mx-auto bg-slate-200" />
                </td>
              </tr>
            ))
          ) : (
            data.map((entry, index) => {
              // Requirement: Visually distinguish rank 1, 2, and 3
              const isTop3 = entry.position <= 3;
              const rowClass = isTop3 ? "bg-slate-50 font-bold" : "bg-white";

              return (
                <tr key={index} className={rowClass}>
                  <td className="px-4 py-2 flex items-center justify-center gap-2 text-center border-r-2 border-[#808080] border-b-2 ">
                    <span>{entry.icon}</span>
                    <span className="text-[16px] bg-gradient-to-b from-[#576065] to-[#787884] bg-clip-text text-transparent">{entry.position}</span>
                  </td>
                  <td className="px-4 py-2 border-r-2 border-[#808080] border-b-2 text-[16px] bg-gradient-to-b from-[#576065] to-[#787884] bg-clip-text text-transparent">{entry.name}</td>
                  <td className="px-4 py-2 text-center border border-b-2 border-[#808080] text-[16px] bg-gradient-to-b from-[#576065] to-[#787884] bg-clip-text text-transparent">{entry.points}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
