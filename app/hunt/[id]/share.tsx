"use client";

import { HuntControls } from "@/components/HuntControls";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { QrCodeModal } from "@/components/QrCodeModal";
import type { StoredHunt } from "@/lib/types";
import { updateHuntStatus } from "@/lib/huntStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { RegistrationButton } from "@/components/RegistrationButton";
import { PlayInterfaceGuard } from "@/components/PlayInterfaceGuard";
import { 
  checkRegistrationStatus, 
  registerPlayer, 
  clearRegistrationCache,
  isWalletAvailable,
  RegistrationStatus 
} from "@/lib/contracts/player-registration";

interface HuntDetailProps {
  hunt: StoredHunt;
}

export default function HuntShare({ hunt }: HuntDetailProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [connectedPublicKey, setConnectedPublicKey] = useState<string | undefined>(undefined);
  const [walletCheckComplete, setWalletCheckComplete] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>({
    isRegistered: false,
    loading: true,
  });
  const [qrOpen, setQrOpen] = useState(false);

  // Check wallet availability and connection on mount
  useEffect(() => {
    // Check if wallet is available
    if (!isWalletAvailable()) {
      setWalletCheckComplete(true);
      setRegistrationStatus({
        isRegistered: false,
        loading: false,
        error: "No wallet detected. Please install Freighter or another Soroban-compatible wallet.",
      });
      return;
    }

    // Try to get connected wallet address
    const win = window as Window & {
      freighter?: { getPublicKey?: () => Promise<string> };
      soroban?: { getPublicKey?: () => Promise<string> };
      sorobanWallet?: { getPublicKey?: () => Promise<string> };
    };
    const wallet = win.freighter ?? win.soroban ?? win.sorobanWallet;
    
    if (wallet?.getPublicKey) {
      wallet.getPublicKey()
        .then((key) => {
          setConnectedPublicKey(key);
          setWalletCheckComplete(true);
        })
        .catch(() => {
          setWalletCheckComplete(true);
          setRegistrationStatus({
            isRegistered: false,
            loading: false,
            error: "Please connect your wallet to continue",
          });
        });
    } else {
      setWalletCheckComplete(true);
      setRegistrationStatus({
        isRegistered: false,
        loading: false,
        error: "Please connect your wallet to continue",
      });
    }
  }, []);

  // Check registration status when wallet is connected (Requirement 1.1, 2.3)
  useEffect(() => {
    async function checkStatus() {
      if (!walletCheckComplete) {
        return;
      }

      if (!connectedPublicKey) {
        setRegistrationStatus({
          isRegistered: false,
          loading: false,
          error: "Please connect your wallet to continue",
        });
        return;
      }

      // Set loading state
      setRegistrationStatus({
        isRegistered: false,
        loading: true,
      });

      const status = await checkRegistrationStatus(hunt.id, connectedPublicKey);
      setRegistrationStatus(status);
    }

    checkStatus();
  }, [hunt.id, connectedPublicKey, walletCheckComplete]);

  // Handle player registration (Requirements 1.3, 1.4, 1.5)
  const handleRegister = async () => {
    if (!connectedPublicKey) {
      return;
    }

    const result = await registerPlayer(hunt.id, connectedPublicKey);
    
    if (result.success) {
      // Clear cache and refresh registration status after successful registration
      clearRegistrationCache(hunt.id, connectedPublicKey);
      const updatedStatus = await checkRegistrationStatus(hunt.id, connectedPublicKey);
      setRegistrationStatus(updatedStatus);
    } else {
      // Error is already handled by RegistrationButton component
      throw new Error(result.error || "Registration failed");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/hunt/${hunt.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markHuntCancelled = (huntId: number) => {
    updateHuntStatus(huntId, "Cancelled");
  };

  const huntUrl = typeof window !== "undefined" ? `${window.location.origin}/hunt/${hunt.id}` : "";

  return (
    <div className="space-y-6">
      {/* Registration Section */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Registration Button - Requirements 1.2, 2.1 */}
        {connectedPublicKey ? (
          <div className="flex-1 w-full">
            <RegistrationButton
              huntId={hunt.id}
              playerAddress={connectedPublicKey}
              registrationStatus={registrationStatus}
              onRegister={handleRegister}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold text-base px-8 py-4 rounded-2xl">
            Please connect your wallet to join this hunt
          </div>
        )}

        {/* Share button */}

        <div className="flex gap-2">
          <Button onClick={handleShare}>
            {copied ? (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setQrOpen(true)} title="Show QR Code">
            <QrCode className="w-4 h-4" />
          </Button>
        </div>
  <QrCodeModal open={qrOpen} onClose={() => setQrOpen(false)} url={huntUrl} />

        <HuntControls
          hunt={hunt}
          connectedPublicKey={connectedPublicKey}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onCancelled={(huntId, txHash) => {
            markHuntCancelled(huntId)
            router.push("/hunts")
          }}
        />
      </div>

      {/* Play Interface Section - Protected by PlayInterfaceGuard (Requirements 3.1, 3.2, 3.3) */}
      {connectedPublicKey && (
        <PlayInterfaceGuard
          huntId={hunt.id}
          playerAddress={connectedPublicKey}
          onRegister={handleRegister}
        >
          <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Hunt Clues</h2>
            <p className="text-zinc-400">
              You are registered for this hunt! The clues and play interface will appear here.
            </p>
            {/* Future: Add actual clue interface here */}
          </div>
        </PlayInterfaceGuard>
      )}
    </div>
  );
}