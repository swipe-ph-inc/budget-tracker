"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

type ActivityInsert = Database["public"]["Tables"]["activity"]["Insert"]

export type TopUpResult =
  | { success: true; data?: { activityId: string } }
  | { success: false; error: string }

export async function createTopUp(params: {
  accountId: string
  amount: number
  currency: string
  note?: string
}): Promise<TopUpResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to top up an account." }
  }

  if (!params.accountId) {
    return { success: false, error: "Account ID is required." }
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return { success: false, error: "Amount must be greater than zero." }
  }

  const currency = params.currency || "PHP"

  // Wrap in a transaction-like flow using Postgrest: read, then update balance, then log activity.
  // Note: In a real system you'd likely use database functions for true atomicity.
  const { data: account, error: accountError } = await supabase
    .from("account")
    .select("id, balance, currency")
    .eq("id", params.accountId)
    .single()

  if (accountError || !account) {
    return { success: false, error: "Account not found." }
  }

  const nextBalance = (account.balance ?? 0) + params.amount

  const { error: updateError } = await supabase
    .from("account")
    .update({
      balance: nextBalance,
    })
    .eq("id", params.accountId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  const activityPayload: ActivityInsert = {
    user_id: user.id,
    activity_type: "income",
    amount: params.amount,
    currency,
    summary: "Account top-up",
    occurred_at: new Date().toISOString(),
    reference_table: "account",
    reference_id: params.accountId,
    metadata: params.note
      ? {
          note: params.note,
        }
      : null,
  }

  const { data: activity, error: activityError } = await supabase
    .from("activity")
    .insert(activityPayload)
    .select("id")
    .single()

  if (activityError) {
    return { success: false, error: activityError.message }
  }

  return { success: true, data: { activityId: activity.id } }
}

