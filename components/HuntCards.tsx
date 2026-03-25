import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import picture from "@/public/static-images/image1.png";
import { Skeleton } from "@/components/ui/skeleton";
import { submitAnswer, AnswerIncorrectError } from "@/lib/contracts/hunt";
import { resolveImageSrc, GATEWAY_COUNT } from "@/lib/ipfs";
import type { HuntCard as Hunt } from "@/lib/types";

export type { Hunt };

interface HuntCardsProps {
  hunts: Hunt[]; // always an array of one item in active/preview mode
  isActive?: boolean;
  preview?: boolean;
  onUnlock?: () => void;
  currentIndex?: number;
  totalHunts?: number;
  isLoading?: boolean;
  /** Overall game/hunt ID — when provided, answers go to the contract. */
  huntId?: number;
  /** Called with the points awarded after a correct answer. */
  onScoreUpdate?: (points: number) => void;
  /** Point value for this clue. */
  points?: number;
  /** Whether this clue has been solved. */
  solved?: boolean;
}

const DEFAULT_POINTS = 10;

export const HuntCards: React.FC<HuntCardsProps> = ({
  hunts,
  isActive = true,
  preview = false,
  onUnlock,
  currentIndex = 1,
  totalHunts = 1,
  isLoading = false,
  huntId,
  onScoreUpdate,
  points,
  solved = false,
}) => {
  const hunt = hunts && hunts.length > 0 ? hunts[0] : {} as Hunt;
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [imgGatewayIdx, setImgGatewayIdx] = useState(0);
  const [hintRevealed, setHintRevealed] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPending) return;
    setInput(e.target.value);
    setError("");
    setSuccess(false);
  };

  const handleUnlock = async () => {
    if (!isActive || preview || isPending) return;

    if (huntId != null) {
      // Contract path: submit_answer → ClueCompleted | AnswerIncorrect
      setIsPending(true);
      setError("");
      try {
        await submitAnswer(huntId, Number(hunt.id), input);
        // ClueCompleted event received
        setSuccess(true);
        setInput("");
        const actualPoints = Math.max(0, (points ?? DEFAULT_POINTS) - (hintRevealed ? (hunt.hintCost || 0) : 0));
        onScoreUpdate?.(actualPoints);
        setTimeout(() => {
          setSuccess(false);
          onUnlock?.();
        }, 1200);
      } catch (err) {
        if (err instanceof AnswerIncorrectError) {
          setError("Try Again");
        } else {
          setError(err instanceof Error ? err.message : "Submission failed. Try again.");
        }
        setSuccess(false);
      } finally {
        setIsPending(false);
      }
    } else {
      // Local fallback (test / preview mode — no wallet required)
      if (input.trim().toLowerCase() === (hunt.code || "").trim().toLowerCase()) {
        setSuccess(true);
        setError("");
        setInput("");
        const actualPoints = Math.max(0, (points ?? DEFAULT_POINTS) - (hintRevealed ? (hunt.hintCost || 0) : 0));
        onScoreUpdate?.(actualPoints);
        setTimeout(() => {
          setSuccess(false);
          onUnlock?.();
        }, 1200);
      } else {
        setError("Try Again");
        setSuccess(false);
      }
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleUnlock();
  };

  if (isLoading) {
    return (
      <div className={`rounded-2xl shadow-lg w-full max-w-[400px] transition-all duration-300 ${isActive ? "scale-105 border-2 border-blue-400" : preview ? "opacity-70" : "opacity-90"}`}>
        <div className="rounded-t-2xl p-6 bg-gradient-to-b from-[#3737A4] to-[#0C0C4F]">
          <div className="flex justify-end mb-2">
            <Skeleton className="h-4 w-12 bg-white/20" />
          </div>
          <Skeleton className="h-7 w-3/4 mb-2 bg-white/20" />
          <Skeleton className="h-4 w-full mb-2 bg-white/20" />
          <Skeleton className="h-4 w-5/6 mb-4 bg-white/20" />
          <Skeleton className="w-[180px] h-[180px] rounded-md bg-white/20" />
        </div>
        <div className="bg-white flex gap-2 p-6 rounded-b-2xl items-center">
          <Skeleton className="flex-1 h-10 rounded-full bg-gray-200" />
          <Skeleton className="h-10 w-[72px] rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  const isLocked = !isActive || preview || isPending || solved;

  return (
    <div className={`rounded-2xl shadow-lg w-full max-w-[400px] transition-all duration-300 relative ${isActive ? "scale-105 border-2 border-blue-400" : preview ? "opacity-70" : "opacity-90"}`}>
      {solved && (
        <div className="absolute inset-0 bg-green-500/10 rounded-2xl z-20 flex items-center justify-center pointer-events-none">
          <CheckCircle2 className="w-16 h-16 text-green-500 opacity-60" />
        </div>
      )}
      <div className="rounded-t-2xl p-6 text-white bg-gradient-to-b from-[#3737A4] to-[#0C0C4F]">
        <div className="flex justify-between items-center text-sm mb-2">
          {points != null && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">{points} pts</span>
          )}
          <span className="text-[#B3B3E5] ml-auto">{currentIndex}/{totalHunts}</span>
        </div>
        <h3 className="text-xl font-bold mb-2">
          {hunt.title || "Untitled Hunt"}
        </h3>
        <p className="text-sm opacity-90 mb-4">
          {hunt.description || "No description provided."}
        </p>
        {hunt.link || hunt.image ? (
          <Image
            src={resolveImageSrc(hunt.link || hunt.image || "", imgGatewayIdx)}
            alt="hunt"
            width={180}
            height={180}
            onError={() => {
              if (imgGatewayIdx < GATEWAY_COUNT - 1) {
                setImgGatewayIdx((i) => i + 1)
              }
            }}
            unoptimized
          />
        ) : (
          <Image src={picture} alt="hunt" width={180} height={180} />
        )}
      </div>

      {hunt.hint && !solved && (
        <div className="bg-white px-6 py-2 border-b border-gray-100">
          {!hintRevealed ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              onClick={() => setHintRevealed(true)}
              disabled={isLocked}
            >
              Reveal Hint (-{hunt.hintCost || 0} pts)
            </Button>
          ) : (
            <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm border border-blue-100">
              <span className="font-semibold text-blue-900 mr-2">Hint:</span>
              {hunt.hint}
            </div>
          )}
        </div>
      )}

      {/* Input and button only for active, non-preview cards */}
      <div className="bg-white flex gap-2 p-6 rounded-b-2xl items-center">
        <Input
          placeholder={isActive && !preview ? "Enter answer to unlock" : "Locked"}
          className={`flex-1 px-4 py-2 rounded-full transition-colors ${isLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLocked}
        />
        <Button
          className={`bg-gradient-to-b from-[#3737A4] to-[#0C0C4F] hover:bg-purple-700 text-white px-6 py-2 rounded-xl transition-all duration-200 ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleUnlock}
          disabled={isLocked}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Feedback */}
      <div className="bg-white rounded-b-2xl -mt-4 pb-4 px-6 min-h-[36px]">
        {success && (
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-base animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            Correct!
          </div>
        )}
        {!success && isPending && (
          <p className="text-center text-slate-400 text-sm">Verifying on-chain…</p>
        )}
        {!success && !isPending && error && (
          <p className="text-center text-red-500 font-semibold text-sm">{error}</p>
        )}
      </div>
    </div>
  );
};
