import Server, { Operation, TransactionBuilder } from "@stellar/stellar-sdk"
import { getActiveWalletAdapter } from "@/lib/walletAdapter"
import {
  SOROBAN_RPC_URL,
  NETWORK_PASSPHRASE,
  getRequiredRewardManagerAddress,
} from "./config"

export type ClaimRewardResult = {
  txHash: string
}

export async function claimReward(huntId: number): Promise<ClaimRewardResult> {
  if (typeof window === "undefined") throw new Error("Browser environment required")

  const rewardManagerAddress = getRequiredRewardManagerAddress()
  const wallet = getActiveWalletAdapter()
  const publicKey = await wallet.getPublicKey()

  const server = new Server(SOROBAN_RPC_URL)
  const account = await server.getAccount(publicKey)

  const payload = JSON.stringify({
    action: "claim_reward",
    hunt_id: huntId,
    reward_manager: rewardManagerAddress,
  })

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.manageData({
        name: `claim_reward:${huntId}:${Date.now()}`,
        value: payload,
      }),
    )
    .setTimeout(180)
    .build()

  const signedXdr = await wallet.signTransaction(tx.toXDR())
  const result = await server.submitTransaction(signedXdr)
  if (!result?.hash) throw new Error("Reward claim transaction failed")
  return { txHash: result.hash }
}
