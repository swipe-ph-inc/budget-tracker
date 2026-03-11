"use server"

import { getAccounts } from "@/app/actions/accounts"
import { getActiveSubscription } from "@/app/actions/billing"
import {
  getAccountTransactions,
  type AccountTransaction,
} from "@/app/actions/transaction"
import type { Database } from "@/lib/supabase/database.types"

type AccountRow = Database["public"]["Tables"]["account"]["Row"]

export type AccountPageData = {
  accounts: AccountRow[]
  subscription: Awaited<ReturnType<typeof getActiveSubscription>>
  transactionsByAccountId: Record<string, AccountTransaction[]>
}

/**
 * Load all data needed for the Account page in one round-trip:
 * accounts, subscription, and transactions for each account.
 * Renders only after everything is ready so the page appears at once.
 */
export async function getAccountPageData(): Promise<AccountPageData> {
  const [accountsResult, subscription] = await Promise.all([
    getAccounts(),
    getActiveSubscription(),
  ])
  const accounts = accountsResult ?? []
  const transactionsByAccountId: Record<string, AccountTransaction[]> = {}

  if (accounts.length > 0) {
    const txArrays = await Promise.all(
      accounts.map((acc) => getAccountTransactions(acc.id))
    )
    accounts.forEach((acc, i) => {
      transactionsByAccountId[acc.id] = txArrays[i] ?? []
    })
  }

  return {
    accounts,
    subscription: subscription ?? null,
    transactionsByAccountId,
  }
}
