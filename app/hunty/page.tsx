"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useLocalStorage } from "@/hooks/useLocalStorage"

import { z } from "zod"
import { createHunt } from "@/lib/contracts/hunt"
import { withTransactionToast } from "@/lib/txToast"

import { dynapuff } from "@/lib/font"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight, Plus, QrCode, Download, Printer, PlayCircle, Share } from "lucide-react"
import { QrCodeModal } from "@/components/QrCodeModal"
import { Header } from "@/components/Header"
import { CreateGameTabs } from "@/components/CreateGameTabs"
import { HuntForm } from "@/components/HuntForm"
import { RewardsPanel } from "@/components/RewardsPanel"
import { GamePreview } from "@/components/GamePreview"
import { PublishModal } from "@/components/PublishModal"
import ToggleButton from "@/components/ToggleButton"
import type { Reward } from "@/lib/types"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface Hunt {
  id: number
  title: string
  description: string
  link: string
  code: string
  image?: string
}

export default function CreateGame() {  
  const [activeTab, setActiveTab] = useState<"create" | "rewards" | "publish" | "leaderboard">("create")
  const [hunts, setHunts] = useLocalStorage<Hunt[]>("draft-hunts", [{ id: 1, title: "", description: "", link: "", code: "" }])
  const [rewards, setRewards] = useLocalStorage<Reward[]>("draft-rewards", []);
  const [gameName, setGameName] = useLocalStorage("draft-gameName", "Hunty")
  const [startDate, setStartDate] = useLocalStorage("draft-startDate", "")
  const [endDate, setEndDate] = useLocalStorage("draft-endDate", "")
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [direction, setDirection] = useState(0)
  const [creatorEmail, setCreatorEmail] = useState("")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter()



  const tabToIndex = { create: 0, rewards: 1, publish: 2, leaderboard: 3 }

  const handleTabChange = (newTab: "create" | "rewards" | "publish" | "leaderboard") => {
    const newIdx = tabToIndex[newTab]
    const oldIdx = tabToIndex[activeTab]
    setDirection(newIdx > oldIdx ? 1 : -1)
    setActiveTab(newTab)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "publish" || tab === "rewards" || tab === "create") {
        setActiveTab(tab as "publish" | "rewards" | "create");
      }
    }
  }, []);

  const rewardPool = rewards.reduce((sum, r) => sum + r.amount, 0);

  const formSchema = z
    .object({
      title: z.string().min(4, "Title length must be > 3 chars."),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid or empty start date."),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid or empty end date."),
      rewardPool: z.number().min(0, "Reward Pool must be >= 0."),
    })
    .refine(
      (data) => {
        const s = new Date(data.startDate);
        const e = new Date(data.endDate);
        if (!isNaN(s.getTime()) && !isNaN(e.getTime())) return s < e;
        return true;
      },
      {
        message: "Start Date must be before End Date.",
        path: ["startDate"],
      },
    )
    .refine(
      (data) => {
        const e = new Date(data.endDate);
        if (!isNaN(e.getTime())) return e > new Date();
        return true;
      },
      {
        message: "End Date must be in the future.",
        path: ["endDate"],
      },
    );

  const validationResult = formSchema.safeParse({
    title: gameName,
    startDate,
    endDate,
    rewardPool,
  });

  const errors = validationResult.success
    ? {}
    : validationResult.error.flatten().fieldErrors;
  const isFormValid = validationResult.success;

  const addReward = () => {
    setRewards([
      ...rewards,
      {
        place: rewards.length + 1,
        amount: 5.43,
        icon: undefined,
      },
    ]);
  };

  const deleteReward = (place: number) => {
    setRewards(rewards.filter((reward) => reward.place !== place));
  };

  const updateHunt = (id: number, field: string, value: string) => {
    setHunts(
      hunts.map((hunt) =>
        hunt.id === id ? { ...hunt, [field]: value } : hunt,
      ),
    );
  };

  const addHunt = () => {
    const newId = Math.max(...hunts.map((h) => h.id)) + 1;
    setHunts([
      ...hunts,
      { id: newId, title: "", description: "", link: "", code: "" },
    ]);
  };

  const removeHunt = (id: number) => {
    if (hunts.length > 1) {
      setHunts(hunts.filter((hunt) => hunt.id !== id));
    }
  };

  const updateReward = (place: number, amount: number) => {
    setRewards(
      rewards.map((reward) =>
        reward.place === place ? { ...reward, amount, icon: undefined } : reward,
      ),
    );
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const start_time = Math.floor(Date.now() / 1000);
      let endMs = Date.now() + 60 * 60 * 1000;
      if (endDate) {
        const parsed = new Date(endDate);
        if (!isNaN(parsed.getTime())) endMs = parsed.getTime();
      }
      const end_time = Math.floor(endMs / 1000);

      const description = hunts
        .map((h) => `${h.title}: ${h.description}`)
        .join("\n");
      // Use the first hunt's image CID (if uploaded to IPFS) as the game cover.
      const coverImageCid = hunts[0]?.image?.startsWith("ipfs://")
        ? hunts[0].image
        : undefined;

      await withTransactionToast(
        () =>
          createHunt(
            "",
            gameName,
            description,
            start_time,
            end_time,
            coverImageCid,
            creatorEmail,
            emailNotifications,
          ),
        {
          loading: "Confirming in Wallet...",
          submitted: "Transaction Submitted",
          success: "Success!",
        },
      );

      setShowPublishModal(false);
      router.push("/hunts");
    } catch (error) {
       console.error("Publish failed:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast here if you have a toast system
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-tr from-blue-100 bg-purple-100 to-[#f9f9ff] pb-28">
        <Header balance="24.2453" />

        <div className="max-w-[1500px] mx-auto px-40 pb-12 bg-white rounded-4xl relative mt-4">
          <div className="pt-24 px-12 pb-12">
            <div className="flex justify-between items-center mb-10">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="flex items-center gap-2 border-[#3737A4] text-[#3737A4] hover:bg-[#3737A4] hover:text-white transition-all duration-300 rounded-full px-6"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Arcade
              </Button>
            </div>
            {/* Title */}
            <div className="text-center mb-12 relative">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-[#0C0C4F] shadow-lg absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <Image src="/icons/logo.png" alt="Logo" width={96} height={96} />
              </div>
              <h1
                className={`text-4xl md:text-5xl font-bold bg-gradient-to-b from-[#3737A4] to-[#0C0C4F] text-transparent bg-clip-text mt-8 ${dynapuff.variable} antialiased `}
              >
                Create Scavenge Hunt
              </h1>
            </div>

            <div className="grid lg:grid-cols-2 gap-7">
              {/* Left Panel */}
              <div className="">
                <CreateGameTabs
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />

                <div className="relative overflow-hidden min-h-[400px]">
                <AnimatePresence mode="wait" custom={direction}>
                  {activeTab === "create" && (
                    <motion.div
                      key="create"
                      custom={direction}
                      initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      {hunts.map((hunt) => (
                        <HuntForm
                          key={hunt.id}
                          hunt={hunt}
                          onUpdate={(field, value) =>
                            updateHunt(hunt.id, field, value)
                          }
                          onRemove={() => removeHunt(hunt.id)}
                        />
                      ))}

                      <div className="inline-block p-[1px] rounded-2xl bg-gradient-to-b from-[#4A4AFF] to-[#0C0C4F]">
                        <Button
                          onClick={addHunt}
                          className="flex items-center gap-2 bg-white text-[#0C0C4F] font-bold text-xl px-5 py-3 rounded-2xl "
                        >
                          <Plus className="w-6 h-6 text-[#0C0C4F]" />
                          Add
                        </Button>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleTabChange("rewards")}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-xl font-extrabold
                         px-6 py-4 rounded-xl flex items-center gap-2 cursor-pointer"
                        >
                          Next
                          <ArrowRight className="w-6 h-6" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "rewards" && (
                    <motion.div
                      key="rewards"
                      custom={direction}
                      initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      <RewardsPanel
                        rewards={rewards}
                        onUpdateReward={updateReward}
                        onAddReward={addReward}
                        onDeleteReward={deleteReward}
                        error={errors.rewardPool?.[0]}
                      />

                      <div className="flex justify-between">
                        <Button 
                          onClick={() => handleTabChange("create")}
                          className="bg-gradient-to-b from-[#576065] to-[#787884] hover:bg-gray-500 text-white px-8 py-2 rounded-xl flex items-center gap-2 text-xl font-black"
                        >
                          <ArrowLeft className="w-6 h-6" />
                          Previous
                        </Button>
                        <Button 
                          onClick={() => handleTabChange("publish")}
                          className="bg-gradient-to-b from-[#576065] to-[#787884] hover:bg-gray-500 text-white px-8 py-2 rounded-xl flex items-center gap-2 text-xl font-black"
                        >
                          Next
                          <ArrowRight className="w-6 h-6" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "publish" && (
                    <motion.div
                      key="publish"
                      custom={direction}
                      initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <label className="block text-xl font-normal text-[#808080]">
                          Give It A Name
                        </label>
                        <div className="flex flex-col gap-1 items-end">
                          <Input
                            value={gameName}
                            placeholder="Hunty"
                            onChange={(e) => setGameName(e.target.value)}
                            className="w-[230px] [&::placeholder]:bg-gradient-to-r [&::placeholder]:from-[#3737A4] [&::placeholder]:to-[#0C0C4F] [&::placeholder]:bg-clip-text [&::placeholder]:text-transparent text-[16px]"
                          />
                          {errors.title && (
                            <span className="text-red-500 text-sm">
                              {errors.title[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="block text-xl font-normal text-[#808080]">
                          Set Timeframe
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="p-0.5 bg-gradient-to-b from-[#2D4FEB] to-[#0C0C4F] rounded-lg">
                              <Input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="00"
                                className="w-full text-center text-lg font-medium bg-white rounded-lg px-3 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
                              />
                            </div>
                          </div>
                          <span className="text-2xl bg-gradient-to-b from-[#3737A4] to-[#0C0C4F] font-medium bg-clip-text text-transparent">
                            :
                          </span>
                          <div className="relative">
                            <div className="p-0.5 bg-gradient-to-b from-[#2D4FEB] to-[#0C0C4F] rounded-lg">
                              <Input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="00"
                                className="w-full text-center text-lg font-medium bg-white rounded-lg px-3 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-xl font-normal text-[#808080]">
                            Timer
                          </label>
                          <ToggleButton isActive={timerEnabled} onClick={() => setTimerEnabled(!timerEnabled)} />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-xl font-normal text-[#808080]">
                            Start Date
                          </label>
                          <div className="flex flex-col gap-1 items-end">
                            <Input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="h-11 w-[140px] text-center"
                            />
                            {errors.startDate && (
                              <span className="text-red-500 text-sm">
                                {errors.startDate[0]}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-xl font-normal text-[#808080]">
                            End Date
                          </label>
                          <div className="flex flex-col gap-1 items-end">
                            <Input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="h-11 w-[140px] text-center"
                            />
                            {errors.endDate && (
                              <span className="text-red-500 text-sm">
                                {errors.endDate[0]}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-xl font-normal text-[#808080]">Email Notifications</label>
                          <div className="flex items-center gap-4">
                            <Input
                              type="email"
                              placeholder="creator@example.com"
                              value={creatorEmail}
                              onChange={(e) => setCreatorEmail(e.target.value)}
                              className="w-[230px] text-[16px]"
                            />
                            <ToggleButton isActive={emailNotifications} onClick={() => setEmailNotifications(!emailNotifications)} />
                          </div>
                        </div>

                      <div className="flex items-center justify-between">
                        <label className="block text-xl font-normal text-[#808080]">
                          Share Link/Generate QR Code
                        </label>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={handleShare}
                                className="bg-gradient-to-b from-[#3737A4] to-[#0C0C4F]  hover:bg-slate-700 text-white px-4 py-2 rounded-full flex items-center gap-2"
                              >
                                <Share />
                                Share Now
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy Share Link</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="rounded-lg border-1 border-transparent bg-white bg-clip-padding shadow-sm hover:bg-slate-50 [background:linear-gradient(white,white)_padding-box,linear-gradient(to_bottom,#3737A4,#0C0C4F)_border-box]"
                                onClick={() => setQrOpen(true)}
                                title="Show QR Code"
                              >
                                <QrCode className="w-4 h-4 text-[#0C0C4F]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generate QR Code</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <QrCodeModal open={qrOpen} onClose={() => setQrOpen(false)} url={typeof window !== "undefined" ? window.location.href : ""} />

                      <div className="flex items-center justify-between mb-16">
                        <label className="block text-xl font-normal text-[#808080]">
                          Save As Image
                        </label>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button className="bg-gradient-to-b from-[#3737A4] to-[#0C0C4F] hover:bg-slate-700 text-white px-4 py-2 rounded-full flex items-center gap-2">
                                <Download className="w-4 h-4 " />
                                Download
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download Scavenge Image</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="rounded-lg border-1 border-transparent bg-white bg-clip-padding shadow-sm hover:bg-slate-50 [background:linear-gradient(white,white)_padding-box,linear-gradient(to_bottom,#3737A4,#0C0C4F)_border-box]"
                              >
                                <Printer className="w-4 h-4 text-[#0C0C4F]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Print Page</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="flex justify-between pb-12">
                        <Button 
                          onClick={() => handleTabChange("rewards")}
                          className="bg-gradient-to-b from-[#576065] to-[#787884] hover:bg-gray-500 text-white text-xl px-8 py-2 rounded-lg flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4 " />
                          Previous
                        </Button>
                        <Button
                          onClick={() => setShowPublishModal(true)}
                          disabled={!isFormValid || isPublishing}
                          className="bg-gradient-to-b from-[#39A437] to-[#194F0C] hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl px-6 py-3 rounded-lg flex items-center gap-2"
                        >
                          <span>
                            <PlayCircle />
                          </span>
                          Publish Game
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/* Right Panel - Live Preview */}
              <div className="hidden lg:block">
                <GamePreview hunts={hunts} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        gameName={gameName}
      />
      <QrCodeModal open={qrOpen} onClose={() => setQrOpen(false)} url={typeof window !== "undefined" ? window.location.href : ""} />
    </TooltipProvider>
  );
}
