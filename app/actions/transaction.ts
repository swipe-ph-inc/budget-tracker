"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"
import { getActiveSubscription } from "@/app/actions/billing"

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

type IncomeInsert = Database["public"]["Tables"]["income"]["Insert"]
type TransferInsert = Database["public"]["Tables"]["transfer"]["Insert"]
type PaymentInsert = Database["public"]["Tables"]["payment"]["Insert"]

export type TopUpResult =
  | { success: true; data?: { incomeId: string } }
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

  const { data: account, error: accountError } = await supabase
    .from("account")
    .select("id, user_id")
    .eq("id", params.accountId)
    .single()

  if (accountError || !account) {
    return { success: false, error: "Account not found." }
  }

  if (account.user_id !== user.id) {
    return { success: false, error: "You do not have access to this account." }
  }

  const incomePayload: IncomeInsert = {
    user_id: user.id,
    account_id: params.accountId,
    amount: params.amount,
    currency,
    source: "other",
    note: params.note?.trim() || null,
  }

  const { data: income, error: incomeError } = await supabase
    .from("income")
    .insert(incomePayload)
    .select("id")
    .single()

  if (incomeError) {
    console.error('[transaction] createTopUp income insert failed', incomeError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, data: { incomeId: income.id } }
}

export type TransferResult =
  | { success: true; data?: { transferId: string } }
  | { success: false; error: string }

export async function createTransfer(params: {
  fromAccountId: string
  toAccountId: string
  amount: number
  currency?: string
  note?: string
  transferMethod?: Database["public"]["Enums"]["transfer_method_enum"]
  transferType?: Database["public"]["Enums"]["transfer_type_enum"]
  feeAmount?: number
  feeCurrency?: string | null
}): Promise<TransferResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to transfer between accounts." }
  }

  if (!params.fromAccountId || !params.toAccountId) {
    return { success: false, error: "From and to account IDs are required." }
  }

  if (params.fromAccountId === params.toAccountId) {
    return { success: false, error: "Cannot transfer to the same account." }
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return { success: false, error: "Amount must be greater than zero." }
  }

  const feeAmount = params.feeAmount ?? 0
  const feeCurrency = params.feeCurrency ?? params.currency ?? "PHP"
  const transferMethod = params.transferMethod ?? "instaPay"
  const transferType = params.transferType ?? "local"

  const { data: fromAccount, error: fromError } = await supabase
    .from("account")
    .select("id, balance, currency, user_id")
    .eq("id", params.fromAccountId)
    .single()

  if (fromError || !fromAccount) {
    return { success: false, error: "Source account not found." }
  }

  if (fromAccount.user_id !== user.id) {
    return { success: false, error: "You do not have access to the source account." }
  }

  const { data: toAccount, error: toError } = await supabase
    .from("account")
    .select("id, balance, currency, user_id")
    .eq("id", params.toAccountId)
    .single()

  if (toError || !toAccount) {
    return { success: false, error: "Destination account not found." }
  }

  if (toAccount.user_id !== user.id) {
    return { success: false, error: "You do not have access to the destination account." }
  }

  const currency = params.currency ?? fromAccount.currency ?? "PHP"
  if (fromAccount.currency !== toAccount.currency) {
    return { success: false, error: "Source and destination accounts must use the same currency." }
  }

  const totalDebit = params.amount + feeAmount
  if ((fromAccount.balance ?? 0) < totalDebit) {
    return { success: false, error: "Insufficient balance in the source account." }
  }

  const fromNewBalance = (fromAccount.balance ?? 0) - totalDebit
  const toNewBalance = (toAccount.balance ?? 0) + params.amount

  const { error: updateFromError } = await supabase
    .from("account")
    .update({ balance: fromNewBalance })
    .eq("id", params.fromAccountId)

  if (updateFromError) {
    console.error('[transaction] createTransfer from-account update failed', updateFromError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  const { error: updateToError } = await supabase
    .from("account")
    .update({ balance: toNewBalance })
    .eq("id", params.toAccountId)

  if (updateToError) {
    await supabase
      .from("account")
      .update({ balance: fromAccount.balance })
      .eq("id", params.fromAccountId)
    console.error('[transaction] createTransfer to-account update failed', updateToError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  const now = new Date().toISOString()
  const transferPayload: TransferInsert = {
    user_id: user.id,
    from_account_id: params.fromAccountId,
    to_account_id: params.toAccountId,
    to_recipient_id: null,
    amount: params.amount,
    currency,
    fee_amount: feeAmount,
    fee_currency: feeAmount > 0 ? feeCurrency : null,
    transfer_method: transferMethod,
    transfer_type: transferType,
    status: "completed",
    note: params.note?.trim() || null,
    completed_at: now,
    scheduled_at: null,
    reference: null,
  }

  const { data: transfer, error: transferError } = await supabase
    .from("transfer")
    .insert(transferPayload)
    .select("id")
    .single()

  if (transferError) {
    await supabase
      .from("account")
      .update({ balance: fromAccount.balance })
      .eq("id", params.fromAccountId)
    await supabase
      .from("account")
      .update({ balance: toAccount.balance })
      .eq("id", params.toAccountId)
    console.error('[transaction] createTransfer transfer insert failed', transferError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, data: { transferId: transfer.id } }
}

export type TransferToRecipientResult =
  | { success: true; data?: { transferId: string } }
  | { success: false; error: string }

export async function createTransferToRecipient(params: {
  fromAccountId: string
  toRecipientId: string
  amount: number
  currency?: string
  note?: string
  reference?: string | null
  transferMethod?: Database["public"]["Enums"]["transfer_method_enum"]
  transferType?: Database["public"]["Enums"]["transfer_type_enum"]
  feeAmount?: number
  feeCurrency?: string | null
}): Promise<TransferToRecipientResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to transfer." }
  }

  if (!params.fromAccountId || !params.toRecipientId) {
    return { success: false, error: "From account and recipient are required." }
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return { success: false, error: "Amount must be greater than zero." }
  }

  const feeAmount = params.feeAmount ?? 0
  const feeCurrency = params.feeCurrency ?? params.currency ?? "PHP"
  const transferMethod = params.transferMethod ?? "instaPay"
  const transferType = params.transferType ?? "local"

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

  const { data: recipient, error: recipientError } = await supabase
    .from("recipient")
    .select("id, user_id")
    .eq("id", params.toRecipientId)
    .single()

  if (recipientError || !recipient) {
    return { success: false, error: "Recipient not found." }
  }

  if (recipient.user_id !== user.id) {
    return { success: false, error: "You do not have access to this recipient." }
  }

  const currency = params.currency ?? account.currency ?? "PHP"
  const totalDebit = params.amount + feeAmount

  if ((account.balance ?? 0) < totalDebit) {
    return { success: false, error: "Insufficient balance in the account." }
  }

  const newBalance = (account.balance ?? 0) - totalDebit

  const { error: updateError } = await supabase
    .from("account")
    .update({ balance: newBalance })
    .eq("id", params.fromAccountId)

  if (updateError) {
    console.error('[transaction] createTransferToRecipient account update failed', updateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  const now = new Date().toISOString()
  const transferPayload: TransferInsert = {
    user_id: user.id,
    from_account_id: params.fromAccountId,
    to_recipient_id: params.toRecipientId,
    to_account_id: null,
    amount: params.amount,
    currency,
    fee_amount: feeAmount,
    fee_currency: feeAmount > 0 ? feeCurrency : null,
    transfer_method: transferMethod,
    transfer_type: transferType,
    status: "completed",
    note: params.note?.trim() || null,
    reference: params.reference?.trim() || null,
    completed_at: now,
    scheduled_at: null,
  }

  const { data: transfer, error: transferError } = await supabase
    .from("transfer")
    .insert(transferPayload)
    .select("id")
    .single()

  if (transferError) {
    await supabase
      .from("account")
      .update({ balance: account.balance })
      .eq("id", params.fromAccountId)
    console.error('[transaction] createTransferToRecipient transfer insert failed', transferError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, data: { transferId: transfer.id } }
}

export type PaymentResult =
  | { success: true; data?: { paymentId: string } }
  | { success: false; error: string }

type RecurrenceFrequency = Database["public"]["Enums"]["recurrence_frequency_enum"]

export async function createPayment(params: {
  fromAccountId?: string | null
  fromCreditCardId?: string | null
  merchantId: string
  amount: number
  currency?: string
  note?: string
  feeAmount?: number
  feeCurrency?: string | null
  dueDate?: string | null
  virtualAccount?: string | null
  isRecurring?: boolean
  recurrenceFrequency?: RecurrenceFrequency | null
}): Promise<PaymentResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to create a payment." }
  }

  const useAccount = Boolean(params.fromAccountId)
  const useCard = Boolean(params.fromCreditCardId)
  if (!useAccount && !useCard) {
    return { success: false, error: "Please select an account or credit card to pay from." }
  }
  if (useAccount && useCard) {
    return { success: false, error: "Select either an account or a credit card, not both." }
  }

  if (!params.merchantId) {
    return { success: false, error: "Merchant is required." }
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return { success: false, error: "Amount must be greater than zero." }
  }

  const feeAmount = params.feeAmount ?? 0
  const feeCurrency = params.feeCurrency ?? params.currency ?? "PHP"
  const totalCharge = params.amount + feeAmount

  const { data: merchant, error: merchantError } = await supabase
    .from("merchant")
    .select("id")
    .eq("id", params.merchantId)
    .single()

  if (merchantError || !merchant) {
    return { success: false, error: "Merchant not found." }
  }

  const now = new Date().toISOString()
  const isRecurring = params.isRecurring ?? false

  if (useAccount) {
    const { data: account, error: accountError } = await supabase
      .from("account")
      .select("id, balance, currency, user_id")
      .eq("id", params.fromAccountId!)
      .single()

    if (accountError || !account) {
      return { success: false, error: "Account not found." }
    }

    if (account.user_id !== user.id) {
      return { success: false, error: "You do not have access to this account." }
    }

    const currency = params.currency ?? account.currency ?? "PHP"
    if ((account.balance ?? 0) < totalCharge) {
      return { success: false, error: "Insufficient balance in the account." }
    }

    const newBalance = (account.balance ?? 0) - totalCharge

    const { error: updateError } = await supabase
      .from("account")
      .update({ balance: newBalance })
      .eq("id", params.fromAccountId!)

    if (updateError) {
      console.error('[transaction] createPayment account update failed', updateError)
      return { success: false, error: 'Something went wrong. Please try again.' }
    }

    const paymentPayload: PaymentInsert = {
      user_id: user.id,
      from_account_id: params.fromAccountId!,
      from_credit_card_id: null,
      merchant_id: params.merchantId,
      amount: params.amount,
      currency,
      fee_amount: feeAmount,
      fee_currency: feeAmount > 0 ? feeCurrency : null,
      status: "completed",
      paid_at: now,
      due_date: params.dueDate ?? null,
      note: params.note?.trim() || null,
      is_recurring: isRecurring,
      recurrence_frequency: isRecurring ? (params.recurrenceFrequency ?? null) : null,
      virtual_account: params.virtualAccount?.trim() || null,
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payment")
      .insert(paymentPayload)
      .select("id")
      .single()

    if (paymentError) {
      await supabase
        .from("account")
        .update({ balance: account.balance })
        .eq("id", params.fromAccountId!)
      console.error('[transaction] createPayment payment insert (account) failed', paymentError)
      return { success: false, error: 'Something went wrong. Please try again.' }
    }

    return { success: true, data: { paymentId: payment.id } }
  }

  // Payment from credit card
  const { data: card, error: cardError } = await supabase
    .from("credit_card")
    .select("id, balance_owed, credit_limit, currency, user_id")
    .eq("id", params.fromCreditCardId!)
    .single()

  if (cardError || !card) {
    return { success: false, error: "Credit card not found." }
  }

  if (card.user_id !== user.id) {
    return { success: false, error: "You do not have access to this credit card." }
  }

  const currency = params.currency ?? card.currency ?? "PHP"
  const availableCredit = (card.credit_limit ?? 0) - (card.balance_owed ?? 0)
  if (availableCredit < totalCharge) {
    return { success: false, error: "Insufficient available credit on the card." }
  }

  const newBalanceOwed = (card.balance_owed ?? 0) + totalCharge

  const { error: updateError } = await supabase
    .from("credit_card")
    .update({ balance_owed: newBalanceOwed })
    .eq("id", params.fromCreditCardId!)

  if (updateError) {
    console.error('[transaction] createPayment credit card update failed', updateError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  const paymentPayload: PaymentInsert = {
    user_id: user.id,
    from_account_id: null,
    from_credit_card_id: params.fromCreditCardId!,
    merchant_id: params.merchantId,
    amount: params.amount,
    currency,
    fee_amount: feeAmount,
    fee_currency: feeAmount > 0 ? feeCurrency : null,
    status: "completed",
    paid_at: now,
    due_date: params.dueDate ?? null,
    note: params.note?.trim() || null,
    is_recurring: isRecurring,
    recurrence_frequency: isRecurring ? (params.recurrenceFrequency ?? null) : null,
    virtual_account: params.virtualAccount?.trim() || null,
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payment")
    .insert(paymentPayload)
    .select("id")
    .single()

  if (paymentError) {
    await supabase
      .from("credit_card")
      .update({ balance_owed: card.balance_owed })
      .eq("id", params.fromCreditCardId!)
    console.error('[transaction] createPayment payment insert (credit card) failed', paymentError)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, data: { paymentId: payment.id } }
}

export type AccountTransaction = {
  id: string
  type: "payment" | "transfer"
  direction: "in" | "out"
  amount: number
  currency: string
  date: string
  status: string
  note: string | null
  merchantId?: string
  paidAt?: string | null
  fromAccountId?: string
  toAccountId?: string
  transferMethod?: string
  transferType?: string
  completedAt?: string | null
}

export async function getAccountTransactions(
  accountId: string
): Promise<AccountTransaction[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("You must be signed in to view transactions.")
  }

  if (!accountId) {
    return []
  }

  const { data: account, error: accountError } = await supabase
    .from("account")
    .select("id, user_id")
    .eq("id", accountId)
    .single()

  if (accountError || !account) {
    return []
  }

  if (account.user_id !== user.id) {
    throw new Error("You do not have access to this account.")
  }

  const [paymentsResult, transfersResult] = await Promise.all([
    supabase
      .from("payment")
      .select("id, amount, currency, status, note, paid_at, created_at, merchant_id")
      .eq("from_account_id", accountId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("transfer")
      .select("id, amount, currency, status, note, completed_at, created_at, from_account_id, to_account_id, transfer_method, transfer_type")
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  const payments: AccountTransaction[] = (paymentsResult.data ?? []).map(
    (p) => ({
      id: p.id,
      type: "payment" as const,
      direction: "out" as const,
      amount: p.amount,
      currency: p.currency,
      date: p.paid_at ?? (p as { created_at?: string }).created_at ?? "",
      status: p.status ?? "completed",
      note: p.note,
      merchantId: p.merchant_id,
      paidAt: p.paid_at,
    })
  )

  const transfers: AccountTransaction[] = (transfersResult.data ?? []).map(
    (t) => ({
      id: t.id,
      type: "transfer" as const,
      direction:
        t.from_account_id === accountId ? ("out" as const) : ("in" as const),
      amount: t.amount,
      currency: t.currency,
      date: t.completed_at ?? (t as { created_at?: string }).created_at ?? "",
      status: t.status ?? "completed",
      note: t.note,
      fromAccountId: t.from_account_id,
      toAccountId: t.to_account_id ?? undefined,
      transferMethod: t.transfer_method,
      transferType: t.transfer_type,
      completedAt: t.completed_at,
    })
  )

  const combined = [...payments, ...transfers].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime()
    const dateB = new Date(b.date || 0).getTime()
    return dateB - dateA
  })

  return combined
}

export type RecentTransferItem = {
  id: string
  name: string
  account: string
  amount: number
  currency: string
  status: string
}

export async function getRecentTransfers(limit = 10): Promise<RecentTransferItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data: transfers, error } = await supabase
    .from("transfer")
    .select(`
      id,
      amount,
      currency,
      status,
      to_recipient_id,
      to_account_id,
      recipient(display_name, account_number),
      to_account:account!to_account_id(name, masked_identifier)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return []
  }

  return (transfers ?? []).map((t) => {
    const recipient = t.recipient as { display_name?: string; account_number?: string } | null
    const toAccount = t.to_account as { name?: string; masked_identifier?: string } | null
    const name = t.to_recipient_id ? (recipient?.display_name ?? "—") : (toAccount?.name ?? "—")
    const account = t.to_recipient_id ? (recipient?.account_number ?? "—") : (toAccount?.masked_identifier ?? "—")
    const statusDisplay =
      (t.status ?? "pending").charAt(0).toUpperCase() + (t.status ?? "pending").slice(1).toLowerCase()
    return {
      id: t.id,
      name,
      account,
      amount: t.amount,
      currency: t.currency,
      status: statusDisplay,
    }
  })
}

export type TransferListItem = {
  id: string
  amount: number
  currency: string
  status: string
  transferMethod: string
  transferType: string
  completedAt: string | null
  createdAt: string
  toName: string
  toIdentifier: string
  fromAccountName: string
  fromAccountMasked: string
  feeAmount: number
  note: string | null
  reference: string | null
}

export type GetTransfersFilters = {
  status?: string
  transferType?: string
  transferMethod?: string
  fromAccountId?: string
  dateFrom?: string
  dateTo?: string
}

export async function getTransfers(filters?: GetTransfersFilters): Promise<TransferListItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  // Free plan: limit history to last 30 days. Pro: full history.
  const subscription = await getActiveSubscription()
  const isPro = subscription !== null

  let effectiveDateFrom = filters?.dateFrom
  if (!isPro) {
    const now = new Date()
    const past = new Date()
    past.setDate(now.getDate() - 29)
    const cutoff = past.toISOString().slice(0, 10)
    if (!effectiveDateFrom || effectiveDateFrom < cutoff) {
      effectiveDateFrom = cutoff
    }
  }

  let query = supabase
    .from("transfer")
    .select(`
      id,
      amount,
      currency,
      status,
      transfer_method,
      transfer_type,
      completed_at,
      created_at,
      fee_amount,
      note,
      reference,
      from_account_id,
      to_recipient_id,
      to_account_id,
      from_account:account!from_account_id(name, masked_identifier),
      recipient(display_name, account_number),
      to_account:account!to_account_id(name, masked_identifier)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (filters?.status && filters.status !== "all") {
    query = query.eq(
      "status",
      filters.status as Database["public"]["Enums"]["transaction_status_enum"]
    )
  }
  if (filters?.transferType && filters.transferType !== "all") {
    query = query.eq(
      "transfer_type",
      filters.transferType as Database["public"]["Enums"]["transfer_type_enum"]
    )
  }
  if (filters?.transferMethod && filters.transferMethod !== "all") {
    query = query.eq(
      "transfer_method",
      filters.transferMethod as Database["public"]["Enums"]["transfer_method_enum"]
    )
  }
  if (filters?.fromAccountId && filters.fromAccountId !== "all") {
    query = query.eq("from_account_id", filters.fromAccountId)
  }
  if (effectiveDateFrom) {
    query = query.gte("created_at", effectiveDateFrom)
  }
  if (filters?.dateTo) {
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte("created_at", endOfDay.toISOString())
  }

  const { data: transfers, error } = await query

  if (error) {
    return []
  }

  return (transfers ?? []).map((t) => {
    const recipient = t.recipient as { display_name?: string; account_number?: string } | null
    const toAccount = t.to_account as { name?: string; masked_identifier?: string } | null
    const fromAccount = t.from_account as { name?: string; masked_identifier?: string } | null
    const toName = t.to_recipient_id ? (recipient?.display_name ?? "—") : (toAccount?.name ?? "—")
    const toIdentifier = t.to_recipient_id ? (recipient?.account_number ?? "—") : (toAccount?.masked_identifier ?? "—")
    const statusDisplay =
      (t.status ?? "pending").charAt(0).toUpperCase() + (t.status ?? "pending").slice(1).toLowerCase()
    const methodDisplay =
      (t.transfer_method ?? "instaPay")
        .replace(/([A-Z])/g, " $1")
        .trim()
    const typeDisplay =
      (t.transfer_type ?? "local").charAt(0).toUpperCase() + (t.transfer_type ?? "local").slice(1)

    return {
      id: t.id,
      amount: t.amount,
      currency: t.currency,
      status: statusDisplay,
      transferMethod: methodDisplay,
      transferType: typeDisplay,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      toName,
      toIdentifier,
      fromAccountName: fromAccount?.name ?? "—",
      fromAccountMasked: fromAccount?.masked_identifier ?? "—",
      feeAmount: t.fee_amount ?? 0,
      note: t.note,
      reference: t.reference,
    }
  })
}

export type PaymentListItem = {
  id: string
  amount: number
  currency: string
  status: string
  merchantName: string
  fromAccountName: string | null
  fromAccountMasked: string | null
  paidAt: string | null
  createdAt: string
  feeAmount: number
  note: string | null
  virtualAccount: string | null
  /** one_time | recurring | subscription | installment; only for payment table rows */
  paymentType?: string
  /** 'payment' | 'card_payment'; card_payment = credit card payoff or installment payment */
  source?: "payment" | "card_payment"
}

export type GetPaymentsFilters = {
  status?: string
  fromAccountId?: string
  fromCreditCardId?: string
  merchantId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}

export async function getPayments(
  filters?: GetPaymentsFilters
): Promise<PaymentListItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  // Free plan: limit history to last 30 days by default. Pro: full history.
  const subscription = await getActiveSubscription()
  const isPro = subscription !== null

  let effectiveDateFrom = filters?.dateFrom
  if (!isPro) {
    const now = new Date()
    const past = new Date()
    past.setDate(now.getDate() - 29) // inclusive 30-day window
    const cutoff = past.toISOString().slice(0, 10)
    if (!effectiveDateFrom || effectiveDateFrom < cutoff) {
      effectiveDateFrom = cutoff
    }
  }

  let query = supabase
    .from("payment")
    .select(`
      id,
      amount,
      currency,
      status,
      paid_at,
      created_at,
      fee_amount,
      note,
      virtual_account,
      payment_type,
      merchant_id,
      from_account_id,
      from_credit_card_id,
      merchant:merchant(name),
      from_account:account!from_account_id(name, masked_identifier),
      from_credit_card:credit_card!from_credit_card_id(name, masked_identifier)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (filters?.status && filters.status !== "all") {
    query = query.eq(
      "status",
      filters.status as Database["public"]["Enums"]["transaction_status_enum"]
    )
  }
  if (filters?.fromAccountId && filters.fromAccountId !== "all") {
    query = query.eq("from_account_id", filters.fromAccountId)
  }
  if (filters?.fromCreditCardId && filters.fromCreditCardId !== "all") {
    query = query.eq("from_credit_card_id", filters.fromCreditCardId)
  }
  if (filters?.merchantId && filters.merchantId !== "all") {
    query = query.eq("merchant_id", filters.merchantId)
  }
  if (effectiveDateFrom) {
    query = query.gte("created_at", effectiveDateFrom)
  }
  if (filters?.dateTo) {
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte("created_at", endOfDay.toISOString())
  }
  const limit = filters?.limit ?? 50
  query = query.limit(limit)

  const { data: payments, error } = await query

  if (error) {
    return []
  }

  return (payments ?? []).map((p) => {
    const merchant = p.merchant as { name?: string } | null
    const fromAccount = p.from_account as
      | { name?: string; masked_identifier?: string }
      | null
    const fromCreditCard = p.from_credit_card as
      | { name?: string; masked_identifier?: string }
      | null
    const statusDisplay =
      (p.status ?? "pending")
        .charAt(0)
        .toUpperCase() + (p.status ?? "pending").slice(1).toLowerCase()

    return {
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: statusDisplay,
      merchantName: merchant?.name ?? "—",
      fromAccountName: fromAccount?.name ?? fromCreditCard?.name ?? null,
      fromAccountMasked: fromAccount?.masked_identifier ?? fromCreditCard?.masked_identifier ?? null,
      paidAt: p.paid_at,
      createdAt: p.created_at,
      feeAmount: p.fee_amount ?? 0,
      note: p.note,
      virtualAccount: p.virtual_account,
      paymentType: (p as { payment_type?: string }).payment_type ?? undefined,
      source: "payment",
    }
  })
}

export type CardPaymentFilters = {
  status?: string
  creditCardId?: string
  fromAccountId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}

/** Card payments: credit card payoffs and installment payments. Returns same shape as PaymentListItem with source: 'card_payment'. */
export async function getCardPayments(
  filters?: CardPaymentFilters
): Promise<PaymentListItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const subscription = await getActiveSubscription()
  const isPro = subscription !== null

  let effectiveDateFrom = filters?.dateFrom
  if (!isPro) {
    const now = new Date()
    const past = new Date()
    past.setDate(now.getDate() - 29)
    const cutoff = past.toISOString().slice(0, 10)
    if (!effectiveDateFrom || effectiveDateFrom < cutoff) {
      effectiveDateFrom = cutoff
    }
  }

  let query = (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("card_payment")
    .select(
      `
        id,
        amount,
        currency,
        status,
        paid_at,
        created_at,
        note,
        payment_installment_id,
        from_account:from_account_id(name, masked_identifier),
        credit_card:credit_card_id(name, masked_identifier)
      `
    )
    .eq("user_id", user.id)
    .order("paid_at", { ascending: false })

  if (filters?.status && filters.status !== "all") {
    query = query.eq(
      "status",
      filters.status as Database["public"]["Enums"]["transaction_status_enum"]
    )
  }
  if (filters?.creditCardId && filters.creditCardId !== "all") {
    query = query.eq("credit_card_id", filters.creditCardId)
  }
  if (filters?.fromAccountId && filters.fromAccountId !== "all") {
    query = query.eq("from_account_id", filters.fromAccountId)
  }
  if (effectiveDateFrom) {
    query = query.gte("paid_at", effectiveDateFrom)
  }
  if (filters?.dateTo) {
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte("paid_at", endOfDay.toISOString())
  }
  const limit = filters?.limit ?? 100
  query = query.limit(limit)

  const { data: rows, error } = await query

  if (error) {
    return []
  }

  type Row = {
    id: string
    amount: number
    currency: string
    status: string
    paid_at: string | null
    created_at: string
    note: string | null
    payment_installment_id: string | null
    from_account: { name?: string; masked_identifier?: string } | null
    credit_card: { name?: string; masked_identifier?: string } | null
  }

  return (rows ?? []).map((r: unknown) => {
    const row = r as Row
    const statusDisplay =
      (row.status ?? "pending").charAt(0).toUpperCase() +
      (row.status ?? "pending").slice(1).toLowerCase()
    const isInstallment = Boolean(row.payment_installment_id)
    const cardName = row.credit_card?.name ?? "Credit card"
    const merchantName = isInstallment
      ? `${cardName} (Installment)`
      : "Credit card payment"

    return {
      id: `card-${row.id}`,
      amount: row.amount,
      currency: row.currency,
      status: statusDisplay,
      merchantName,
      fromAccountName: row.from_account?.name ?? null,
      fromAccountMasked: row.from_account?.masked_identifier ?? null,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      feeAmount: 0,
      note: row.note,
      virtualAccount: null,
      source: "card_payment",
    }
  })
}

export type IncomeListItem = {
  id: string
  amount: number
  currency: string
  receivedAt: string | null
  createdAt: string
  note: string | null
  source: string
  accountName: string
  accountMasked: string
}

export async function getIncome(filters?: {
  accountId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}): Promise<IncomeListItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const subscription = await getActiveSubscription()
  const isPro = subscription !== null

  let effectiveDateFrom = filters?.dateFrom
  if (!isPro) {
    const now = new Date()
    const past = new Date()
    past.setDate(now.getDate() - 29)
    const cutoff = past.toISOString().slice(0, 10)
    if (!effectiveDateFrom || effectiveDateFrom < cutoff) {
      effectiveDateFrom = cutoff
    }
  }

  let query = supabase
    .from("income")
    .select(
      `
        id,
        amount,
        currency,
        received_at,
        created_at,
        note,
        source,
        account:account_id(name, masked_identifier)
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (filters?.accountId && filters.accountId !== "all") {
    query = query.eq("account_id", filters.accountId)
  }
  if (effectiveDateFrom) {
    query = query.gte("created_at", effectiveDateFrom)
  }
  if (filters?.dateTo) {
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte("created_at", endOfDay.toISOString())
  }
  const limit = filters?.limit ?? 100
  query = query.limit(limit)

  const { data: rows, error } = await query

  if (error) {
    return []
  }

  return (rows ?? []).map((r) => {
    const account = r.account as { name?: string; masked_identifier?: string } | null
    const sourceDisplay =
      (r.source ?? "other").charAt(0).toUpperCase() + (r.source ?? "other").slice(1).toLowerCase()
    return {
      id: r.id,
      amount: r.amount,
      currency: r.currency,
      receivedAt: r.received_at,
      createdAt: r.created_at,
      note: r.note,
      source: sourceDisplay,
      accountName: account?.name ?? "—",
      accountMasked: account?.masked_identifier ?? "—",
    }
  })
}
