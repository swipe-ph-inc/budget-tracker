"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

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
    console.error('[credit-cards] createCreditCard failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
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

  const { data: rows, error } = await supabase
    .from("credit_card")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error('[credit-cards] getCreditCards failed', error)
    return []
  }

  const cards = rows ?? []
  for (const card of cards) {
    await postDueInstallmentsForCard(card.id)
  }

  const { data: updated, error: refetchError } = await supabase
    .from("credit_card")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (refetchError) return cards
  return updated ?? cards
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
  nextDueDate: string
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

    let nextDueDate = ""
    let nextDueLabel = "Paid off"
    if (remaining > 0) {
      const next = installments
        .filter((i) => i.status !== "completed")
        .map((i) => new Date(i.dueDate))
        .sort((a, b) => a.getTime() - b.getTime())[0]
      if (next) {
        nextDueDate = next.toISOString().slice(0, 10)
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
      nextDueDate,
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

export type SubscriptionScheduleListItem = {
  id: string
  merchantId: string
  merchantName: string
  amount: number
  currency: string
  recurrenceFrequency: string
  nextDueDate: string
  nextDueDateLabel: string
  billingDayLabel: string
  cardId: string
  cardName: string
  cardMaskedIdentifier: string
  status: string
  autoPayEnabled: boolean
}

export async function getSubscriptionSchedules(): Promise<SubscriptionScheduleListItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("payment_schedule")
    .select(
      `
        id,
        merchant_id,
        amount,
        currency,
        next_due_date,
        recurrence_frequency,
        status,
        auto_pay_enabled,
        merchant:merchant_id(name),
        credit_card:auto_pay_credit_card_id(id, name, masked_identifier)
      `,
    )
    .eq("user_id", user.id)
    .eq("schedule_type", "subscription")
    .not("auto_pay_credit_card_id", "is", null)
    .order("next_due_date", { ascending: true })

  if (error || !data) {
    return []
  }

  type Row = {
    id: string
    merchant_id: string
    amount: number
    currency: string
    next_due_date: string
    recurrence_frequency: string
    status: string
    auto_pay_enabled: boolean
    merchant: { name: string | null } | null
    credit_card: { id: string; name: string | null; masked_identifier: string } | null
  }

  const rows = data as unknown as Row[]

  return rows.map((row) => {
    const nextDate = new Date(row.next_due_date)
    const day = nextDate.getDate()
    const billingDayLabel =
      day >= 11 && day <= 13
        ? `Every ${day}th`
        : day % 10 === 1
          ? `Every ${day}st`
          : day % 10 === 2
            ? `Every ${day}nd`
            : day % 10 === 3
              ? `Every ${day}rd`
              : `Every ${day}th`
    const nextDueDateLabel = nextDate.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
    })

    return {
      id: row.id,
      merchantId: row.merchant_id ?? "",
      merchantName: row.merchant?.name ?? "—",
      amount: row.amount,
      currency: row.currency || "PHP",
      recurrenceFrequency: row.recurrence_frequency,
      nextDueDate: row.next_due_date,
      nextDueDateLabel,
      billingDayLabel,
      cardId: row.credit_card?.id ?? "",
      cardName: row.credit_card?.name ?? "Credit Card",
      cardMaskedIdentifier: row.credit_card?.masked_identifier ?? "•••• •••• •••• ••••",
      status: row.status ?? "active",
      autoPayEnabled: row.auto_pay_enabled ?? false,
    }
  })
}

export type UpdateSubscriptionScheduleResult =
  | { success: true }
  | { success: false; error: string }

export async function updateSubscriptionSchedule(
  scheduleId: string,
  params: {
    merchantId?: string
    creditCardId?: string
    amount?: number
    frequency?: "monthly" | "quarterly" | "yearly"
    billingDay?: number
    currency?: string
    autoPayEnabled?: boolean
  }
): Promise<UpdateSubscriptionScheduleResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: schedule, error: fetchError } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("payment_schedule")
    .select("id, user_id")
    .eq("id", scheduleId)
    .single()

  if (fetchError || !schedule) {
    return { success: false, error: "Subscription not found." }
  }
  if (schedule.user_id !== user.id) {
    return { success: false, error: "You do not have access to this subscription." }
  }

  const updatePayload: Record<string, unknown> = {}
  if (params.merchantId !== undefined) updatePayload.merchant_id = params.merchantId
  if (params.creditCardId !== undefined) updatePayload.auto_pay_credit_card_id = params.creditCardId
  if (params.amount !== undefined) updatePayload.amount = params.amount
  if (params.frequency !== undefined) updatePayload.recurrence_frequency = params.frequency
  if (params.currency !== undefined) updatePayload.currency = params.currency
  if (params.autoPayEnabled !== undefined) updatePayload.auto_pay_enabled = params.autoPayEnabled
  if (params.billingDay !== undefined) {
    updatePayload.next_due_date = getNextDueDate(params.billingDay)
  }

  if (Object.keys(updatePayload).length === 0) {
    return { success: true }
  }

  const { error: updateError } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("payment_schedule")
    .update(updatePayload as never)
    .eq("id", scheduleId)
    .eq("user_id", user.id)

  if (updateError) {
    console.error('[credit-cards] updateSubscriptionSchedule failed', updateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
  return { success: true }
}

export type ToggleSubscriptionAutoPayResult =
  | { success: true }
  | { success: false; error: string }

export async function toggleSubscriptionAutoPay(
  scheduleId: string,
  enabled: boolean
): Promise<ToggleSubscriptionAutoPayResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: schedule, error: fetchError } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("payment_schedule")
    .select("id, user_id")
    .eq("id", scheduleId)
    .single()

  if (fetchError || !schedule) {
    return { success: false, error: "Subscription not found." }
  }

  if (schedule.user_id !== user.id) {
    return { success: false, error: "You do not have access to this subscription." }
  }

  const { error: updateError } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("payment_schedule")
    .update({ auto_pay_enabled: enabled })
    .eq("id", scheduleId)
    .eq("user_id", user.id)

  if (updateError) {
    console.error('[credit-cards] toggleSubscriptionAutoPay failed', updateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
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
    console.error('[credit-cards] updateCreditCard failed', updateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
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
    console.error('[credit-cards] blockCreditCard failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
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
    console.error('[credit-cards] unblockCreditCard failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
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
    console.error('[credit-cards] setTemporarilyBlockedCreditCard failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

export type CreateInstallmentPlanResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Returns the total amount of credit "reserved" by pending installment plans per card.
 * Used to compute available credit = credit_limit - balance_owed - reserved.
 */
export async function getInstallmentReservedByCard(): Promise<Record<string, number>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return {}

  const { data, error } = await supabase
    .from("payment")
    .select("from_credit_card_id, amount")
    .eq("user_id", user.id)
    .eq("payment_type", "installment")
    .eq("status", "pending")
    .not("from_credit_card_id", "is", null)

  if (error || !data) return {}

  const reserved: Record<string, number> = {}
  for (const row of data) {
    const id = row.from_credit_card_id!
    reserved[id] = (reserved[id] ?? 0) + Number(row.amount)
  }
  return reserved
}

/** Single-call payload for the Credit Cards page so the whole view loads at once. */
export type CreditCardsPageData = {
  cards: CreditCardRow[]
  reservedByCard: Record<string, number>
}

export async function getCreditCardsPageData(): Promise<CreditCardsPageData> {
  const [cards, reservedByCard] = await Promise.all([
    getCreditCards(),
    getInstallmentReservedByCard(),
  ])
  return {
    cards: cards ?? [],
    reservedByCard: reservedByCard ?? {},
  }
}

const nowIso = () => new Date().toISOString()

/**
 * Posts due installments to the card's balance_owed. For each installment where
 * due_date <= today and posted_at is null and status != 'completed', sets posted_at
 * and adds the amount to the card's balance_owed. Idempotent (only unposted rows are updated).
 */
export async function postDueInstallmentsForCard(creditCardId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { ok: false, error: "Not authenticated." }

  const { data: card, error: cardError } = await supabase
    .from("credit_card")
    .select("id, balance_owed, user_id")
    .eq("id", creditCardId)
    .single()

  if (cardError || !card || card.user_id !== user.id) return { ok: false, error: "Credit card not found." }

  const today = new Date().toISOString().slice(0, 10)

  const { data: dueRows } = await supabase
    .from("payment_installment")
    .select("id, amount")
    .eq("credit_card_id", creditCardId)
    .lte("due_date", today)
    .is("posted_at", null)
    .neq("status", "completed")

  if (!dueRows?.length) return { ok: true }

  let totalToAdd = 0
  for (const row of dueRows) {
    const { data: updated } = await supabase
      .from("payment_installment")
      .update({ posted_at: nowIso() })
      .eq("id", row.id)
      .is("posted_at", null)
      .select("id")
      .maybeSingle()

    if (updated) totalToAdd += Number(row.amount)
  }

  if (totalToAdd > 0) {
    const newBalance = (card.balance_owed ?? 0) + totalToAdd
    const { error: updateErr } = await supabase
      .from("credit_card")
      .update({ balance_owed: newBalance })
      .eq("id", creditCardId)

    if (updateErr) return { ok: false, error: GENERIC_ERROR_MESSAGE }
  }

  return { ok: true }
}

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

  const reservedByCard = await getInstallmentReservedByCard()
  const reserved = reservedByCard[params.creditCardId] ?? 0

  const { data: card, error: cardError } = await supabase
    .from("credit_card")
    .select("id, credit_limit, balance_owed, user_id")
    .eq("id", params.creditCardId)
    .single()

  if (cardError || !card) {
    return { success: false, error: "Credit card not found." }
  }
  if (card.user_id !== user.id) {
    return { success: false, error: "You do not have access to this credit card." }
  }

  const limit = card.credit_limit ?? 0
  const owed = card.balance_owed ?? 0
  const available = limit - owed - reserved
  if (available < params.totalAmount) {
    return {
      success: false,
      error: "Insufficient available credit. Installments reserve the full amount; reduce the total or choose another card.",
    }
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
    console.error('[credit-cards] createInstallmentPlan payment insert failed', paymentError)
    return { success: false, error: 'Something went wrong. Please try again.' }
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
    console.error('[credit-cards] createInstallmentPlan installments insert failed', installmentsError)
    return { success: false, error: 'Something went wrong. Please try again.' }
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

  await postDueInstallmentsForCard(creditCardId)

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
    console.error('[credit-cards] payNextInstallment account update failed', accountUpdateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
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
    console.error('[credit-cards] payNextInstallment card update failed', cardUpdateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
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
    console.error('[credit-cards] payNextInstallment installment update failed', installmentUpdateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
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
    console.error('[credit-cards] payNextInstallment card_payment insert failed', cardPaymentError)
    return { success: false, error: 'Something went wrong. Please try again.' }
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

export type DeleteInstallmentPlanResult =
  | { success: true }
  | { success: false; error: string }

/** Deletes an installment plan (payment + installments). Reverses any posted installments from the card's balance_owed. */
export async function deleteInstallmentPlan(paymentId: string): Promise<DeleteInstallmentPlanResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payment")
    .select("id, user_id, payment_type")
    .eq("id", paymentId)
    .single()

  if (paymentError || !payment) {
    return { success: false, error: "Installment plan not found." }
  }
  if (payment.user_id !== user.id) {
    return { success: false, error: "You do not have access to this plan." }
  }
  if (payment.payment_type !== "installment") {
    return { success: false, error: "Not an installment plan." }
  }

  const { data: installments, error: installmentsError } = await supabase
    .from("payment_installment")
    .select("id, amount, credit_card_id, posted_at")
    .eq("payment_id", paymentId)

  if (installmentsError) {
    console.error('[credit-cards] deleteInstallmentPlan fetch installments failed', installmentsError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  const postedSumByCard: Record<string, number> = {}
  for (const row of installments ?? []) {
    if (row.posted_at && row.credit_card_id) {
      postedSumByCard[row.credit_card_id] = (postedSumByCard[row.credit_card_id] ?? 0) + Number(row.amount)
    }
  }

  const installmentIds = (installments ?? []).map((r) => r.id)

  if (installmentIds.length > 0) {
    const { error: unlinkError } = await supabase
      .from("card_payment")
      .update({ payment_installment_id: null })
      .in("payment_installment_id", installmentIds)

    if (unlinkError) {
      console.error('[credit-cards] deleteInstallmentPlan unlink card_payment failed', unlinkError)
      return { success: false, error: 'Something went wrong. Please try again.' }
    }
  }

  const { error: deleteInstallmentsError } = await supabase
    .from("payment_installment")
    .delete()
    .eq("payment_id", paymentId)

  if (deleteInstallmentsError) {
    console.error('[credit-cards] deleteInstallmentPlan delete installments failed', deleteInstallmentsError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  for (const [cardId, sum] of Object.entries(postedSumByCard)) {
    const { data: card } = await supabase
      .from("credit_card")
      .select("balance_owed")
      .eq("id", cardId)
      .single()

    if (card && card.balance_owed != null) {
      const newBalance = Math.max(0, card.balance_owed - sum)
      await supabase.from("credit_card").update({ balance_owed: newBalance }).eq("id", cardId)
    }
  }

  const { error: deletePaymentError } = await supabase.from("payment").delete().eq("id", paymentId)

  if (deletePaymentError) {
    console.error('[credit-cards] deleteInstallmentPlan delete payment failed', deletePaymentError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

export type PayCreditCardResult =
  | { success: true }
  | { success: false; error: string }

/** Pay off (or partially pay) a credit card from an account. Inserts card_payment and updates account balance and credit_card balance_owed. */
export async function payCreditCard(params: {
  creditCardId: string
  fromAccountId: string
  amount: number
  note?: string | null
}): Promise<PayCreditCardResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  if (!params.creditCardId || !params.fromAccountId) {
    return { success: false, error: "Credit card and payment account are required." }
  }
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return { success: false, error: "Amount must be greater than zero." }
  }

  const { data: account, error: accountError } = await supabase
    .from("account")
    .select("id, balance, currency, user_id")
    .eq("id", params.fromAccountId)
    .single()

  if (accountError || !account) {
    return { success: false, error: "Account not found." }
  }
  if (account.user_id !== user.id) {
    return { success: false, error: "You do not have access to this account." }
  }

  const accountBalance = account.balance ?? 0
  if (accountBalance < params.amount) {
    return { success: false, error: "Insufficient balance in the selected account." }
  }

  const { data: card, error: cardError } = await supabase
    .from("credit_card")
    .select("id, balance_owed, currency, user_id")
    .eq("id", params.creditCardId)
    .single()

  if (cardError || !card) {
    return { success: false, error: "Credit card not found." }
  }
  if (card.user_id !== user.id) {
    return { success: false, error: "You do not have access to this credit card." }
  }

  const balanceOwed = card.balance_owed ?? 0
  const payAmount = Math.min(params.amount, balanceOwed)
  if (payAmount <= 0) {
    return { success: false, error: "This card has no balance to pay." }
  }

  const now = new Date().toISOString()
  const newAccountBalance = accountBalance - payAmount
  const newBalanceOwed = Math.max(0, balanceOwed - payAmount)
  const currency = card.currency ?? account.currency ?? "PHP"

  const { error: accountUpdateError } = await supabase
    .from("account")
    .update({ balance: newAccountBalance })
    .eq("id", params.fromAccountId)
    .eq("user_id", user.id)

  if (accountUpdateError) {
    console.error('[credit-cards] payCreditCard account update failed', accountUpdateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  const { error: cardUpdateError } = await supabase
    .from("credit_card")
    .update({ balance_owed: newBalanceOwed })
    .eq("id", params.creditCardId)
    .eq("user_id", user.id)

  if (cardUpdateError) {
    await supabase
      .from("account")
      .update({ balance: accountBalance })
      .eq("id", params.fromAccountId)
    console.error('[credit-cards] payCreditCard card update failed', cardUpdateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  const { error: insertError } = await supabase.from("card_payment").insert({
    user_id: user.id,
    from_account_id: params.fromAccountId,
    credit_card_id: params.creditCardId,
    payment_installment_id: null,
    amount: payAmount,
    currency,
    status: "completed",
    paid_at: now,
    note: params.note?.trim() || null,
  } as Database["public"]["Tables"]["card_payment"]["Insert"])

  if (insertError) {
    await supabase
      .from("account")
      .update({ balance: accountBalance })
      .eq("id", params.fromAccountId)
    await supabase
      .from("credit_card")
      .update({ balance_owed: balanceOwed })
      .eq("id", params.creditCardId)
    console.error('[credit-cards] payCreditCard card_payment insert failed', insertError)
    return { success: false, error: 'Something went wrong. Please try again.' }
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
  /** Default true. When true, the subscription will be charged automatically on the billing day. */
  autoPayEnabled?: boolean
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
      auto_pay_enabled: params.autoPayEnabled ?? true,
      auto_pay_credit_card_id: params.creditCardId,
      status: "active",
    } as never)

  if (error) {
    console.error('[credit-cards] createSubscriptionSchedule failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
