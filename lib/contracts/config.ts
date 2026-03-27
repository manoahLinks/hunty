import { getSorobanRpcUrl, getSorobanNetworkPassphrase } from "../soroban/client"

export const SOROBAN_RPC_URL = getSorobanRpcUrl()
export const NETWORK_PASSPHRASE = getSorobanNetworkPassphrase()
export const REWARD_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_REWARD_MANAGER_ADDRESS ?? ""

export function getRequiredRewardManagerAddress(): string {
  if (!REWARD_MANAGER_ADDRESS) {
    throw new Error(
      "Missing RewardManager address. Set NEXT_PUBLIC_REWARD_MANAGER_ADDRESS in your environment.",
    )
  }
  return REWARD_MANAGER_ADDRESS
}
