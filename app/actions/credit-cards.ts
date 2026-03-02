"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

type CreditCardRow = Database["public"]["Tables"]["credit_card"]["Row"]

export type CreateCreditCardResult =
  | { success: true; data?: { id: string } }
  | { success: false; error: string }

export async function createCreditCard(params: {
  name: string
  maskedIdentifier: string
  creditLimit: number
  currency?: string
  balanceOwed?: number
  statementDay?: number | null
  paymentDueDay?: number | null
  cardType?: string | null
  backgroundImgUrl?: string | null
  defaultPaymentAccountId?: string | null
}): Promise<CreateCreditCardResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to add a credit card." }
  }

  const name = params.name?.trim()
  if (!name) {
    return { success: false, error: "Card name is required." }
  }

  const masked = params.maskedIdentifier?.trim()
  if (!masked) {
    return { success: false, error: "Last 4 digits (masked identifier) is required." }
  }

  if (!Number.isFinite(params.creditLimit) || params.creditLimit < 0) {
    return { success: false, error: "Credit limit must be zero or greater." }
  }

  const balanceOwed = params.balanceOwed ?? 0
  if (!Number.isFinite(balanceOwed) || balanceOwed < 0) {
    return { success: false, error: "Balance owed must be zero or greater." }
  }

  if (balanceOwed > params.creditLimit) {
    return { success: false, error: "Balance owed cannot exceed credit limit." }
  }

  const statementDay = params.statementDay
  if (statementDay != null && (statementDay < 1 || statementDay > 28)) {
    return { success: false, error: "Statement day must be between 1 and 28." }
  }

  const paymentDueDay = params.paymentDueDay
  if (paymentDueDay != null && (paymentDueDay < 1 || paymentDueDay > 31)) {
    return { success: false, error: "Payment due day must be between 1 and 31." }
  }

  const currency = params.currency ?? "PHP"

  const { data, error } = await supabase
    .from("credit_card")
    .insert({
      user_id: user.id,
      name,
      masked_identifier: masked,
      credit_limit: params.creditLimit,
      balance_owed: balanceOwed,
      currency,
      statement_day: statementDay ?? null,
      payment_due_day: paymentDueDay ?? null,
      card_type: params.cardType ?? null,
      background_img_url: params.backgroundImgUrl ?? null,
      default_payment_account_id: params.defaultPaymentAccountId ?? null,
      is_active: true,
    })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: { id: data.id } }
}

export async function getCreditCards(): Promise<CreditCardRow[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from("credit_card")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export type CreateInstallmentPlanResult =
  | { success: true }
  | { success: false; error: string }

export async function createInstallmentPlan(params: {
  creditCardId: string
  merchantId: string
  totalAmount: number
  numMonths: number
  firstDueDate: string
  currency: string
}): Promise<CreateInstallmentPlanResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const perMonth = params.totalAmount / params.numMonths
  const firstDue = new Date(params.firstDueDate)

  const paymentRow = {
    user_id: user.id,
    from_account_id: null,
    from_credit_card_id: params.creditCardId,
    merchant_id: params.merchantId,
    amount: params.totalAmount,
    currency: params.currency,
    fee_amount: 0,
    status: "pending" as const,
    paid_at: null,
    is_recurring: false,
    payment_type: "installment" as const,
  }
  const { data: payment, error: paymentError } = await supabase
    .from("payment")
    .insert(paymentRow as never)
    .select("id")
    .single()

  if (paymentError || !payment) {
    return { success: false, error: paymentError?.message ?? "Failed to create installment plan." }
  }

  const installmentRows = Array.from({ length: params.numMonths }, (_, i) => {
    const dueDate = new Date(firstDue)
    dueDate.setMonth(dueDate.getMonth() + i)
    return {
      payment_id: payment.id,
      credit_card_id: params.creditCardId,
      installment_number: i + 1,
      amount: Math.round(perMonth * 100) / 100,
      due_date: dueDate.toISOString().slice(0, 10),
      status: "pending" as const,
    }
  })

  const { error: installmentsError } = await supabase.from("payment_installment").insert(installmentRows)

  if (installmentsError) {
    await supabase.from("payment").delete().eq("id", payment.id)
    return { success: false, error: installmentsError.message }
  }

  return { success: true }
}

export type CreateSubscriptionScheduleResult =
  | { success: true }
  | { success: false; error: string }

function getNextDueDate(billingDay: number): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = d.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const day = Math.min(billingDay, lastDay)
  let next = new Date(year, month, day)
  if (next <= d) {
    next = new Date(year, month + 1, Math.min(billingDay, new Date(year, month + 2, 0).getDate()))
  }
  return next.toISOString().slice(0, 10)
}

export async function createSubscriptionSchedule(params: {
  creditCardId: string
  merchantId: string
  amount: number
  frequency: "monthly" | "quarterly" | "yearly"
  billingDay: number
  currency: string
}): Promise<CreateSubscriptionScheduleResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const nextDueDate = getNextDueDate(params.billingDay)

  // payment_schedule exists in DB; types need regeneration to include it
  const { error } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("payment_schedule")
    .insert({
      user_id: user.id,
      merchant_id: params.merchantId,
      schedule_type: "subscription",
      amount: params.amount,
      currency: params.currency,
      fee_amount: 0,
      recurrence_frequency: params.frequency,
      next_due_date: nextDueDate,
      auto_pay_enabled: false,
      auto_pay_credit_card_id: params.creditCardId,
      status: "active",
    } as never)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
