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
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export type InstallmentPlanListItem = {
  id: string
  merchantName: string
  description: string | null
  amountPerMonth: number
  totalAmount: number
  remainingBalance: number
  currency: string
  months: number
  remainingMonths: number
  nextDueDateLabel: string
  cardId: string
  cardName: string
  cardMaskedIdentifier: string
  status: "ongoing" | "completed"
}

export async function getInstallmentPlans(): Promise<InstallmentPlanListItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from("payment_installment")
    .select(
      `
        id,
        amount,
        due_date,
        installment_number,
        status,
        credit_card:credit_card_id(
          id,
          name,
          masked_identifier
        ),
        payment:payment_id(
          id,
          amount,
          currency,
          payment_type,
          user_id,
          merchant:merchant_id(name)
        )
      `,
    )
    .eq("payment.user_id", user.id)
    .eq("payment.payment_type", "installment")
    .order("due_date", { ascending: true })

  if (error || !data) {
    return []
  }

  type Row = {
    id: string
    amount: number
    due_date: string
    installment_number: number
    status: Database["public"]["Enums"]["transaction_status_enum"]
    credit_card: { id: string; name: string | null; masked_identifier: string } | null
    payment: {
      id: string
      amount: number
      currency: string
      payment_type: Database["public"]["Enums"]["payment_type_enum"]
      user_id: string
      merchant: { name: string | null } | null
    } | null
  }

  const rows = data as unknown as Row[]
  const byPayment = new Map<
    string,
    {
      payment: Row["payment"]
      card: Row["credit_card"]
      installments: { amount: number; dueDate: string; number: number; status: Row["status"] }[]
    }
  >()

  for (const row of rows) {
    if (!row.payment || !row.payment.id) continue
    const key = row.payment.id
    let agg = byPayment.get(key)
    if (!agg) {
      agg = {
        payment: row.payment,
        card: row.credit_card,
        installments: [],
      }
      byPayment.set(key, agg)
    }
    agg.installments.push({
      amount: row.amount,
      dueDate: row.due_date,
      number: row.installment_number,
      status: row.status,
    })
  }

  const plans: InstallmentPlanListItem[] = []

  byPayment.forEach((agg, paymentId) => {
    const { payment, card, installments } = agg
    if (!payment) return
    const months = installments.length || 0
    const remaining = installments.filter((i) => i.status !== "completed").length
    const status: "ongoing" | "completed" = remaining > 0 ? "ongoing" : "completed"

    let nextDueLabel = "Paid off"
    if (remaining > 0) {
      const next = installments
        .filter((i) => i.status !== "completed")
        .map((i) => new Date(i.dueDate))
        .sort((a, b) => a.getTime() - b.getTime())[0]
      if (next) {
        nextDueLabel = next.toLocaleDateString(undefined, {
          month: "short",
          day: "2-digit",
        })
      }
    }

    const amountPerMonth =
      months > 0 ? Math.round((payment.amount / months) * 100) / 100 : payment.amount

    const remainingBalance = installments
      .filter((i) => i.status !== "completed")
      .reduce((sum, i) => sum + i.amount, 0)

    plans.push({
      id: paymentId,
      merchantName: payment.merchant?.name ?? "—",
      description: null,
      amountPerMonth,
      totalAmount: payment.amount,
      remainingBalance,
      currency: payment.currency || "PHP",
      months,
      remainingMonths: remaining,
      nextDueDateLabel: nextDueLabel,
      cardId: card?.id ?? "",
      cardName: card?.name ?? "Credit Card",
      cardMaskedIdentifier: card?.masked_identifier ?? "•••• •••• •••• ••••",
      status,
    })
  })

  plans.sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1
    if (b.status === "completed" && a.status !== "completed") return -1
    return a.nextDueDateLabel.localeCompare(b.nextDueDateLabel)
  })

  return plans
}

export type UpdateCreditCardResult =
  | { success: true }
  | { success: false; error: string }

export async function updateCreditCard(
  creditCardId: string,
  params: {
    name?: string
    maskedIdentifier?: string
    creditLimit?: number
    balanceOwed?: number
    currency?: string
    statementDay?: number | null
    paymentDueDay?: number | null
    defaultPaymentAccountId?: string | null
    backgroundImgUrl?: string | null
    cardType?: string | null
  }
): Promise<UpdateCreditCardResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: card, error: fetchError } = await supabase
    .from("credit_card")
    .select("id, user_id")
    .eq("id", creditCardId)
    .single()

  if (fetchError || !card || card.user_id !== user.id) {
    return { success: false, error: "Credit card not found." }
  }

  const updatePayload: Database["public"]["Tables"]["credit_card"]["Update"] = {}
  if (params.name !== undefined) updatePayload.name = params.name.trim()
  if (params.maskedIdentifier !== undefined)
    updatePayload.masked_identifier = params.maskedIdentifier.trim()
  if (params.creditLimit !== undefined) updatePayload.credit_limit = params.creditLimit
  if (params.balanceOwed !== undefined) updatePayload.balance_owed = params.balanceOwed
  if (params.currency !== undefined) updatePayload.currency = params.currency
  if (params.statementDay !== undefined) updatePayload.statement_day = params.statementDay
  if (params.paymentDueDay !== undefined)
    updatePayload.payment_due_day = params.paymentDueDay
  if (params.defaultPaymentAccountId !== undefined)
    updatePayload.default_payment_account_id = params.defaultPaymentAccountId
  if (params.backgroundImgUrl !== undefined)
    updatePayload.background_img_url = params.backgroundImgUrl
  if (params.cardType !== undefined) updatePayload.card_type = params.cardType

  const { error: updateError } = await supabase
    .from("credit_card")
    .update(updatePayload)
    .eq("id", creditCardId)
    .eq("user_id", user.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

export type BlockCreditCardResult =
  | { success: true }
  | { success: false; error: string }

export async function blockCreditCard(creditCardId: string): Promise<BlockCreditCardResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("credit_card")
    .update({
      is_blocked: true,
      is_blocked_date: now,
      is_unblocked_date: null,
    })
    .eq("id", creditCardId)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export type UnblockCreditCardResult =
  | { success: true }
  | { success: false; error: string }

export async function unblockCreditCard(creditCardId: string): Promise<UnblockCreditCardResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("credit_card")
    .update({
      is_blocked: false,
      is_unblocked_date: now,
    })
    .eq("id", creditCardId)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export type SetTemporarilyBlockedResult =
  | { success: true }
  | { success: false; error: string }

export async function setTemporarilyBlockedCreditCard(
  creditCardId: string,
  blocked: boolean
): Promise<SetTemporarilyBlockedResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const now = new Date().toISOString()
  const updatePayload: Database["public"]["Tables"]["credit_card"]["Update"] = blocked
    ? {
        temporary_blocked: true,
        temporary_blocked_date: now,
        temporary_unblocked_date: null,
      }
    : {
        temporary_blocked: false,
        temporary_unblocked_date: now,
      }
  const { error } = await supabase
    .from("credit_card")
    .update(updatePayload)
    .eq("id", creditCardId)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
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

export type PayNextInstallmentResult =
  | { success: true }
  | { success: false; error: string }

export async function payNextInstallment(params: {
  paymentId: string
  fromAccountId: string
  feeAmount?: number
}): Promise<PayNextInstallmentResult> {
  const supabase = await createClient()
  const feeAmount = Math.max(0, params.feeAmount ?? 0)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payment")
    .select("id, user_id, currency")
    .eq("id", params.paymentId)
    .eq("user_id", user.id)
    .single()

  if (paymentError || !payment) {
    return { success: false, error: "Payment not found." }
  }

  const { data: nextInstallment, error: fetchError } = await supabase
    .from("payment_installment")
    .select("id, amount, credit_card_id")
    .eq("payment_id", params.paymentId)
    .neq("status", "completed")
    .order("due_date", { ascending: true })
    .limit(1)
    .single()

  if (fetchError || !nextInstallment) {
    return { success: false, error: "No pending installment to pay." }
  }

  const creditCardId = nextInstallment.credit_card_id
  if (!creditCardId) {
    return { success: false, error: "Installment is not linked to a credit card." }
  }

  const amount = nextInstallment.amount
  const totalCharge = amount + feeAmount

  const { data: account, error: accountError } = await supabase
    .from("account")
    .select("id, balance, user_id")
    .eq("id", params.fromAccountId)
    .single()

  if (accountError || !account) {
    return { success: false, error: "Account not found." }
  }

  if (account.user_id !== user.id) {
    return { success: false, error: "You do not have access to this account." }
  }

  if ((account.balance ?? 0) < totalCharge) {
    return { success: false, error: "Insufficient balance in the account." }
  }

  const { data: card, error: cardError } = await supabase
    .from("credit_card")
    .select("id, balance_owed, user_id")
    .eq("id", creditCardId)
    .single()

  if (cardError || !card) {
    return { success: false, error: "Credit card not found." }
  }

  if (card.user_id !== user.id) {
    return { success: false, error: "You do not have access to this credit card." }
  }

  const now = new Date().toISOString()
  const newAccountBalance = (account.balance ?? 0) - totalCharge
  const newBalanceOwed = Math.max(0, (card.balance_owed ?? 0) - amount)

  const { error: accountUpdateError } = await supabase
    .from("account")
    .update({ balance: newAccountBalance })
    .eq("id", params.fromAccountId)

  if (accountUpdateError) {
    return { success: false, error: accountUpdateError.message }
  }

  const { error: cardUpdateError } = await supabase
    .from("credit_card")
    .update({ balance_owed: newBalanceOwed })
    .eq("id", creditCardId)

  if (cardUpdateError) {
    await supabase
      .from("account")
      .update({ balance: account.balance })
      .eq("id", params.fromAccountId)
    return { success: false, error: cardUpdateError.message }
  }

  const { error: installmentUpdateError } = await supabase
    .from("payment_installment")
    .update({ status: "completed" as const, paid_at: now })
    .eq("id", nextInstallment.id)

  if (installmentUpdateError) {
    await supabase
      .from("account")
      .update({ balance: account.balance })
      .eq("id", params.fromAccountId)
    await supabase
      .from("credit_card")
      .update({ balance_owed: card.balance_owed })
      .eq("id", creditCardId)
    return { success: false, error: installmentUpdateError.message }
  }

  const { error: cardPaymentError } = await supabase.from("card_payment").insert({
    user_id: user.id,
    from_account_id: params.fromAccountId,
    credit_card_id: creditCardId,
    payment_installment_id: nextInstallment.id,
    amount,
    currency: payment.currency ?? "PHP",
    status: "completed" as const,
    paid_at: now,
  } as Database["public"]["Tables"]["card_payment"]["Insert"])

  if (cardPaymentError) {
    await supabase
      .from("account")
      .update({ balance: account.balance })
      .eq("id", params.fromAccountId)
    await supabase
      .from("credit_card")
      .update({ balance_owed: card.balance_owed })
      .eq("id", creditCardId)
    await supabase
      .from("payment_installment")
      .update({ status: "pending" as const, paid_at: null })
      .eq("id", nextInstallment.id)
    return { success: false, error: cardPaymentError.message }
  }

  if (feeAmount > 0) {
    await supabase.from("transaction_fee").insert({
      amount: feeAmount,
      currency: payment.currency ?? "PHP",
      fee_type: "other" as const,
      payment_id: params.paymentId,
    } as Database["public"]["Tables"]["transaction_fee"]["Insert"])
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
