"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

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
    return { success: false, error: incomeError.message }
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
    return { success: false, error: updateFromError.message }
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
    return { success: false, error: updateToError.message }
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
    return { success: false, error: transferError.message }
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
    return { success: false, error: updateError.message }
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
    return { success: false, error: transferError.message }
  }

  return { success: true, data: { transferId: transfer.id } }
}

export type PaymentResult =
  | { success: true; data?: { paymentId: string } }
  | { success: false; error: string }

type RecurrenceFrequency = Database["public"]["Enums"]["recurrence_frequency_enum"]

export async function createPayment(params: {
  fromAccountId: string
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

  if (!params.fromAccountId) {
    return { success: false, error: "Account ID is required." }
  }

  if (!params.merchantId) {
    return { success: false, error: "Merchant is required." }
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return { success: false, error: "Amount must be greater than zero." }
  }

  const feeAmount = params.feeAmount ?? 0
  const feeCurrency = params.feeCurrency ?? params.currency ?? "PHP"

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

  const { data: merchant, error: merchantError } = await supabase
    .from("merchant")
    .select("id")
    .eq("id", params.merchantId)
    .single()

  if (merchantError || !merchant) {
    return { success: false, error: "Merchant not found." }
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
    return { success: false, error: updateError.message }
  }

  const now = new Date().toISOString()
  const isRecurring = params.isRecurring ?? false
  const paymentPayload: PaymentInsert = {
    user_id: user.id,
    from_account_id: params.fromAccountId,
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
    invoice_id: null,
    from_credit_card_id: null,
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
      .eq("id", params.fromAccountId)
    return { success: false, error: paymentError.message }
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
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
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
}

export type GetPaymentsFilters = {
  status?: string
  fromAccountId?: string
  merchantId?: string
  dateFrom?: string
  dateTo?: string
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
      merchant_id,
      from_account_id,
      merchant:merchant(name),
      from_account:account!from_account_id(name, masked_identifier)
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
  if (filters?.merchantId && filters.merchantId !== "all") {
    query = query.eq("merchant_id", filters.merchantId)
  }
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
  }
  if (filters?.dateTo) {
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte("created_at", endOfDay.toISOString())
  }

  const { data: payments, error } = await query

  if (error) {
    return []
  }

  return (payments ?? []).map((p) => {
    const merchant = p.merchant as { name?: string } | null
    const fromAccount = p.from_account as
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
      fromAccountName: fromAccount?.name ?? null,
      fromAccountMasked: fromAccount?.masked_identifier ?? null,
      paidAt: p.paid_at,
      createdAt: p.created_at,
      feeAmount: p.fee_amount ?? 0,
      note: p.note,
      virtualAccount: p.virtual_account,
    }
  })
}
