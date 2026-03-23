"use client"

import { ReactNode, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { z } from "zod"
import { createHunt } from "@/lib/contracts/hunt"
import { withTransactionToast } from "@/lib/txToast"

import { dynapuff } from "@/lib/font"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight, Plus, QrCode, Download, Printer } from "lucide-react"
import { QrCodeModal } from "@/components/QrCodeModal"
import { Header } from "@/components/Header"
import { CreateGameTabs } from "@/components/CreateGameTabs"
import { HuntForm } from "@/components/HuntForm"
import { RewardsPanel } from "@/components/RewardsPanel"
import { GamePreview } from "@/components/GamePreview"
import { PublishModal } from "@/components/PublishModal"
import { GameCompleteModal } from "@/components/GameCompleteModal"
import { PlayGame } from "@/components/PlayGame"
import Share from "@/components/icons/Share"
import PlayCircle from "@/components/icons/PlayCircle"
import ToggleButton from "@/components/ToggleButton"
import Replay from "@/components/icons/Replay"
import Medal from "@/components/icons/Medal"
import { Reward } from "@/components/RewardsPanel"

interface Hunt {
  id: number;
  title: string;
  description: string;
  link: string;
  code: string;
  image?: string;
}

// interface Reward {
//   place: number
//   amount: number
//   icon: ReactNode
// }

interface LeaderboardEntry {
  position: number;
  name: string;
  points: number;
  icon: ReactNode;
}

export default function CreateGame() {
  const [activeTab, setActiveTab] = useState<"create" | "rewards" | "publish">(
    "create",
  );
  const [hunts, setHunts] = useState<Hunt[]>([
    { id: 1, title: "", description: "", link: "", code: "" },
  ]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [gameName, setGameName] = useState("Hunty");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timer, setTimer] = useState({ minutes: 0, seconds: 15 });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [endTime, setEndTime] = useState("00:00 AM");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showGameCompleteModal, setShowGameCompleteModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPublishing, setIsPublishing] = useState(false);
  const [huntId, setHuntId] = useState<number>(1); // Default to 1 for preview

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const hId = params.get("huntId");
      if (tab === "publish" || tab === "rewards" || tab === "create") {
        setActiveTab(tab as any);
      }
      if (hId) {
        setHuntId(parseInt(hId, 10));
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

  const leaderboardData: LeaderboardEntry[] = [
    { position: 1, name: "JohnDoe", points: 9, icon: <Medal position={1} /> },
    { position: 2, name: "TDH", points: 6, icon: <Medal position={2} /> },
    { position: 3, name: "User904", points: 5, icon: <Medal position={3} /> },
    { position: 4, name: "0xE394fd1329g3a3wh23fH", points: 4, icon: <Medal /> },
    { position: 5, name: "JohnDoe", points: 3, icon: <Medal /> },
  ];

  const addReward = () => {
    setRewards([
      ...rewards,
      {
        place: rewards.length + 1,
        amount: 5.43,
        icon: <Medal position={rewards.length + 1} />,
      },
    ]);
  };

  console.log(rewards);

  const deleteReward = (place: number) => {
    setRewards(rewards.filter((reward) => reward.place !== place));
  };

  // const updateReward = (place: number, amount: number) => {
  //   setRewards(rewards.map((reward) => (reward.place === place ? { ...reward, amount } : reward)))
  // }

  const updateHunt = (id: number, field: keyof Hunt, value: string) => {
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
        reward.place === place ? { ...reward, amount } : reward,
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
          ),
        {
          loading: "Confirming in Wallet...",
          submitted: "Transaction Submitted",
          success: "Success!",
        },
      );

      setHunts((prev) => [
        ...prev,
        { id: Date.now(), title: gameName, description, link: "", code: "" },
      ]);

      setShowPublishModal(false);
      router.push("/hunts");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTest = () => {
    setIsPlaying(true);
  };

  if (isPlaying) {
    return (
      <PlayGame
        hunts={hunts}
        gameName={gameName}
        onExit={() => setIsPlaying(false)}
        onGameComplete={() => setShowGameCompleteModal(true)}
        gameCompleteModal={
          <GameCompleteModal
            isOpen={showGameCompleteModal}
            onClose={() => setShowGameCompleteModal(false)}
            onGoHome={() => {
              setShowGameCompleteModal(false);
              setIsPlaying(false);
            }}
            onReplay={() => setShowGameCompleteModal(false)}
            onViewLeaderboard={() => {
              setShowGameCompleteModal(false);
              window.location.href = "/?tab=leaderboard";
            }}
            reward={5.43}
          />
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 bg-purple-100 to-[#f9f9ff] pb-28">
      <Header balance="24.2453" />

      <div className="max-w-[1500px] mx-40 pb-12 bg-white rounded-4xl  relative ">
        {/* the white background */}
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center gap-4 mb-7">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900 mt-10"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Home
            </Button>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-[#0C0C4F] shadow-lg absolute left-1/2 top-1 -translate-x-1/2 -translate-y-1/2">
              {/* logo */}
              <Image src="/icons/logo.png" alt="Logo" width={96} height={96} />
            </div>
            <h1
              className={`text-4xl md:text-5xl font-bold bg-gradient-to-b from-[#3737A4] to-[#0C0C4F] text-transparent bg-clip-text mb-8 ${dynapuff.variable} antialiased `}
            >
              Create Scavenge Hunt
            </h1>
          </div>

          <div className="grid lg:grid-cols-2 gap-7">
            {/* Left Panel */}
            <div className="">
              <CreateGameTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {activeTab === "create" && (
                <div className="space-y-6">
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
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xl font-extrabold
                     px-6 py-4 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      Next
                      <ArrowRight className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "rewards" && (
                <div className="space-y-6">
                  <RewardsPanel
                    rewards={rewards}
                    onUpdateReward={updateReward}
                    onAddReward={addReward}
                    onDeleteReward={deleteReward}
                    error={errors.rewardPool?.[0]}
                  />

                  <div className="flex justify-between">
                    <Button className="bg-gradient-to-b from-[#576065] to-[#787884] hover:bg-gray-500 text-white px-8 py-2 rounded-xl flex items-center gap-2 text-xl font-black">
                      <ArrowLeft className="w-6 h-6" />
                      Previous
                    </Button>
                    <Button className="bg-gradient-to-b from-[#576065] to-[#787884] hover:bg-gray-500 text-white px-8 py-2 rounded-xl flex items-center gap-2 text-xl font-black">
                      Next
                      <ArrowRight className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "publish" && (
                <div className="space-y-6">
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
                    <ToggleButton />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-xl font-normal text-[#808080]">
                      Start Date
                    </label>
                    <div className="flex flex-col gap-1 items-end">
                      <div className="flex gap-[8px]">
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="h-11 w-[140px] text-center"
                        />
                      </div>
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
                      <div className="flex gap-[8px]">
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="h-11 w-[140px] text-center"
                        />
                      </div>
                      {errors.endDate && (
                        <span className="text-red-500 text-sm">
                          {errors.endDate[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-xl font-normal text-[#808080]">
                      Share Link/Generate QR Code
                    </label>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleShare}
                        className="bg-gradient-to-b from-[#3737A4] to-[#0C0C4F]  hover:bg-slate-700 text-white px-4 py-2 rounded-full flex items-center gap-2"
                      >
                        <Share />
                        Share Now
                      </Button>
                      <Button size="icon" variant="outline" className="rounded-lg border-1 border-transparent bg-white bg-clip-padding shadow-sm hover:bg-slate-50 [background:linear-gradient(white,white)_padding-box,linear-gradient(to_bottom,#3737A4,#0C0C4F)_border-box]" onClick={() => setQrOpen(true)} title="Show QR Code">
                        <QrCode className="w-4 h-4 text-[#0C0C4F]" />
                      </Button>
                    </div>
                  </div>
      <QrCodeModal open={qrOpen} onClose={() => setQrOpen(false)} url={typeof window !== "undefined" ? window.location.href : ""} />

                  <div className="flex items-center justify-between mb-16">
                    <label className="block text-xl font-normal text-[#808080]">
                      Save As Image
                    </label>
                    <div className="flex gap-2">
                      <Button className="bg-gradient-to-b from-[#3737A4] to-[#0C0C4F] hover:bg-slate-700 text-white px-4 py-2 rounded-full flex items-center gap-2">
                        <Download className="w-4 h-4 " />
                        Download
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-lg border-1 border-transparent bg-white bg-clip-padding shadow-sm hover:bg-slate-50 [background:linear-gradient(white,white)_padding-box,linear-gradient(to_bottom,#3737A4,#0C0C4F)_border-box]"
                      >
                        <Printer className="w-4 h-4 text-[#0C0C4F]" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between pb-12">
                    <Button className="bg-gradient-to-b from-[#576065] to-[#787884] hover:bg-gray-500 text-white text-xl px-8 py-2 rounded-lg flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4 " />
                      Previous
                    </Button>
                    <Button
                      onClick={() => setShowPublishModal(true)}
                      disabled={!isFormValid}
                      className="bg-gradient-to-b from-[#39A437] to-[#194F0C] hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl px-6 py-3 rounded-lg flex items-center gap-2"
                    >
                      <span>
                        <PlayCircle />
                      </span>
                      Publish Game
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Live Preview */}
            <GamePreview hunts={hunts} />
          </div>
        </div>
      </div>

      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        gameName={gameName}
      />
    </div>
  );
}
