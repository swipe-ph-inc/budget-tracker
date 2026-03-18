"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getActiveSubscription } from "@/app/actions/billing"

const FREE_CHAT_LIMIT = 10
const FREE_RECEIPT_LIMIT = 10

function currentMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

export type AIUsage = {
  chatMessagesUsed: number
  receiptScansUsed: number
  isPro: boolean
  chatLimit: number | null
  receiptLimit: number | null
}

export type LimitCheck = {
  allowed: boolean
  used: number
  limit: number | null // null = unlimited (Pro)
}

async function isProUser(): Promise<boolean> {
  const subscription = await getActiveSubscription()
  return (
    subscription !== null &&
    (subscription.status === "active" || subscription.status === "trialing")
  )
}

/** Returns the current month's AI usage for the authenticated user. */
export async function getAIUsage(): Promise<AIUsage> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pro = user ? await isProUser() : false

  if (!user) {
    return {
      chatMessagesUsed: 0,
      receiptScansUsed: 0,
      isPro: false,
      chatLimit: FREE_CHAT_LIMIT,
      receiptLimit: FREE_RECEIPT_LIMIT,
    }
  }

  const { data } = await supabase
    .from("ai_usage")
    .select("chat_messages_used, receipt_scans_used")
    .eq("user_id", user.id)
    .eq("month_start", currentMonthStart())
    .maybeSingle()

  return {
    chatMessagesUsed: data?.chat_messages_used ?? 0,
    receiptScansUsed: data?.receipt_scans_used ?? 0,
    isPro: pro,
    chatLimit: pro ? null : FREE_CHAT_LIMIT,
    receiptLimit: pro ? null : FREE_RECEIPT_LIMIT,
  }
}

/** Check if the user is allowed to send a chat message. */
export async function checkChatLimit(): Promise<LimitCheck> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { allowed: false, used: 0, limit: FREE_CHAT_LIMIT }

  const pro = await isProUser()
  if (pro) return { allowed: true, used: 0, limit: null }

  const { data } = await supabase
    .from("ai_usage")
    .select("chat_messages_used")
    .eq("user_id", user.id)
    .eq("month_start", currentMonthStart())
    .maybeSingle()

  const used = data?.chat_messages_used ?? 0
  return { allowed: used < FREE_CHAT_LIMIT, used, limit: FREE_CHAT_LIMIT }
}

/** Check if the user is allowed to scan a receipt. */
export async function checkReceiptLimit(): Promise<LimitCheck> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { allowed: false, used: 0, limit: FREE_RECEIPT_LIMIT }

  const pro = await isProUser()
  if (pro) return { allowed: true, used: 0, limit: null }

  const { data } = await supabase
    .from("ai_usage")
    .select("receipt_scans_used")
    .eq("user_id", user.id)
    .eq("month_start", currentMonthStart())
    .maybeSingle()

  const used = data?.receipt_scans_used ?? 0
  return { allowed: used < FREE_RECEIPT_LIMIT, used, limit: FREE_RECEIPT_LIMIT }
}

/** Atomically increment chat message usage (admin client, bypasses RLS). */
export async function incrementChatUsage(userId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.rpc("increment_ai_chat_usage", {
    p_user_id: userId,
    p_month: currentMonthStart(),
  })
}

/** Atomically increment receipt scan usage (admin client, bypasses RLS). */
export async function incrementReceiptUsage(userId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.rpc("increment_ai_receipt_usage", {
    p_user_id: userId,
    p_month: currentMonthStart(),
  })
}
