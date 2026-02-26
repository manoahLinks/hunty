import { toast } from "sonner"
import { parseStellarError } from "@/lib/stellarErrors"

type TxToastMessages = {
  loading?: string
  submitted?: string
  success?: string
}

/**
 * Wraps a blockchain write operation in a three-phase sonner toast lifecycle:
 *
 *   1. **Loading** — shown immediately while the wallet prompt is open.
 *   2. **Submitted / Success** — replaces the loading toast on resolution.
 *   3. **Error** — replaces the loading toast with a human-readable message
 *      parsed by `parseStellarError`. Wallet rejection shows a yellow warning
 *      instead of a red error so the UI never looks broken when the user
 *      simply cancels.
 *
 * The loading toast is always dismissed (via its id) on both success and
 * failure, so the UI never hangs in a "Confirming in Wallet…" state.
 */
export async function withTransactionToast<T>(
  fn: () => Promise<T>,
  messages: TxToastMessages = {}
): Promise<T> {
  const {
    loading = "Confirming in Wallet…",
    submitted = "Transaction Submitted",
    success = "Success!",
  } = messages

  // Show the initial loading toast and keep its id so we can update it.
  const toastId = toast.loading(loading)

  try {
    const result = await fn()

    // Transition to submitted state.
    toast.success(submitted, { id: toastId })

    // Optionally fire a second, distinct success notification.
    if (success && success !== submitted) {
      setTimeout(() => toast.success(success), 600)
    }

    return result
  } catch (err) {
    const parsed = parseStellarError(err)

    if (parsed.code === "WALLET_REJECTED") {
      // Yellow warning — user intentionally cancelled, not an error.
      toast.warning(parsed.message, { id: toastId })
    } else {
      toast.error(parsed.message, { id: toastId })
    }

    // Re-throw so callers can run their own cleanup (e.g. reset isPublishing).
    throw err
  }
}
