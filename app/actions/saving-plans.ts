"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"
import { getActiveSubscription } from "@/app/actions/billing"

type SavingPlanRow = Database["public"]["Tables"]["saving_plan"]["Row"]
type SavingPlanInsert = Database["public"]["Tables"]["saving_plan"]["Insert"]
type SavingPlanContributionRow = Database["public"]["Tables"]["saving_plan_contribution"]["Row"]

export type SavingPlanListItem = {
  id: string
  name: string
  current_amount: number
  target_amount: number
  target_date: string | null
  currency: string
  status: "in_progress" | "completed" | "behind_schedule"
  icon: string | null
  account_id: string | null
  account_name: string | null
  created_at: string
}

export async function getSavingPlans(): Promise<SavingPlanListItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return []

  const { data, error } = await supabase
    .from("saving_plan")
    .select(`
      id,
      name,
      current_amount,
      target_amount,
      target_date,
      currency,
      status,
      icon,
      account_id,
      created_at,
      account:account_id(name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return []

  type Row = SavingPlanRow & { account?: { name: string } | null }
  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    current_amount: Number(row.current_amount),
    target_amount: Number(row.target_amount),
    target_date: row.target_date,
    currency: row.currency ?? "PHP",
    status: row.status as SavingPlanListItem["status"],
    icon: row.icon,
    account_id: row.account_id,
    account_name: row.account?.name ?? null,
    created_at: row.created_at,
  }))
}

export type CreateSavingPlanResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string }

export async function createSavingPlan(params: {
  name: string
  target_amount: number
  target_date?: string | null
  account_id?: string | null
  currency?: string
}): Promise<CreateSavingPlanResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  // Free plan: allow only 1 saving plan. Pro (active subscription) = unlimited.
  const subscription = await getActiveSubscription()
  if (!subscription) {
    const { count, error: countError } = await supabase
      .from("saving_plan")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["in_progress", "behind_schedule"])

    if (!countError && (count ?? 0) >= 1) {
      return {
        success: false,
        error: "Free plan allows 1 saving plan. Upgrade to Pro for unlimited saving plans.",
      }
    }
  }

  const name = params.name?.trim()
  if (!name) return { success: false, error: "Plan name is required." }
  if (!Number.isFinite(params.target_amount) || params.target_amount <= 0) {
    return { success: false, error: "Target amount must be greater than 0." }
  }

  const insert: SavingPlanInsert = {
    user_id: user.id,
    name,
    target_amount: params.target_amount,
    target_date: params.target_date ?? null,
    account_id: params.account_id ?? null,
    currency: params.currency ?? "PHP",
    current_amount: 0,
    status: "in_progress",
  }

  const { data, error } = await supabase
    .from("saving_plan")
    .insert(insert)
    .select("id")
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: { id: data.id } }
}

export type UpdateSavingPlanResult =
  | { success: true }
  | { success: false; error: string }

export async function updateSavingPlan(
  planId: string,
  params: {
    name?: string
    target_amount?: number
    target_date?: string | null
    account_id?: string | null
    currency?: string
  }
): Promise<UpdateSavingPlanResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: plan } = await supabase
    .from("saving_plan")
    .select("id, user_id")
    .eq("id", planId)
    .single()

  if (!plan || plan.user_id !== user.id) {
    return { success: false, error: "Plan not found." }
  }

  const update: Record<string, unknown> = {}
  if (params.name !== undefined) update.name = params.name.trim()
  if (params.target_amount !== undefined) update.target_amount = params.target_amount
  if (params.target_date !== undefined) update.target_date = params.target_date
  if (params.account_id !== undefined) update.account_id = params.account_id
  if (params.currency !== undefined) update.currency = params.currency

  if (Object.keys(update).length === 0) return { success: true }

  const { error } = await supabase
    .from("saving_plan")
    .update(update)
    .eq("id", planId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export type DeleteSavingPlanResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteSavingPlan(planId: string): Promise<DeleteSavingPlanResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: plan } = await supabase
    .from("saving_plan")
    .select("id, user_id")
    .eq("id", planId)
    .single()

  if (!plan || plan.user_id !== user.id) {
    return { success: false, error: "Plan not found." }
  }

  const { error: delContrib } = await supabase
    .from("saving_plan_contribution")
    .delete()
    .eq("saving_plan_id", planId)

  if (delContrib) return { success: false, error: delContrib.message }

  const { error: delPlan } = await supabase.from("saving_plan").delete().eq("id", planId)

  if (delPlan) return { success: false, error: delPlan.message }
  return { success: true }
}

export type ContributionListItem = {
  id: string
  amount: number
  contribution_type: "contribution" | "withdrawal"
  note: string | null
  created_at: string
  from_account_name: string | null
  to_account_name: string | null
}

export async function getContributions(planId: string): Promise<ContributionListItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return []

  const { data: plan } = await supabase
    .from("saving_plan")
    .select("id, user_id")
    .eq("id", planId)
    .single()

  if (!plan || plan.user_id !== user.id) return []

  const { data, error } = await supabase
    .from("saving_plan_contribution")
    .select(`
      id,
      amount,
      contribution_type,
      note,
      created_at,
      from_account:from_account_id(name),
      to_account:to_account_id(name)
    `)
    .eq("saving_plan_id", planId)
    .order("created_at", { ascending: false })

  if (error) return []

  type Row = SavingPlanContributionRow & {
    from_account?: { name: string } | null
    to_account?: { name: string } | null
  }
  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    contribution_type: row.contribution_type,
    note: row.note,
    created_at: row.created_at,
    from_account_name: row.from_account?.name ?? null,
    to_account_name: row.to_account?.name ?? null,
  }))
}

export type AddContributionResult =
  | { success: true }
  | { success: false; error: string }

export async function addContribution(params: {
  saving_plan_id: string
  amount: number
  contribution_type: "contribution" | "withdrawal"
  from_account_id?: string | null
  to_account_id?: string | null
  note?: string | null
}): Promise<AddContributionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: plan } = await supabase
    .from("saving_plan")
    .select("id, user_id")
    .eq("id", params.saving_plan_id)
    .single()

  if (!plan || plan.user_id !== user.id) {
    return { success: false, error: "Plan not found." }
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return { success: false, error: "Amount must be greater than 0." }
  }

  const { error } = await supabase.from("saving_plan_contribution").insert({
    saving_plan_id: params.saving_plan_id,
    amount: params.amount,
    contribution_type: params.contribution_type,
    from_account_id: params.from_account_id ?? null,
    to_account_id: params.to_account_id ?? null,
    note: params.note?.trim() || null,
  } as Database["public"]["Tables"]["saving_plan_contribution"]["Insert"])

  if (error) return { success: false, error: error.message }
  return { success: true }
}
