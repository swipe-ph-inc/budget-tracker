"use server"

import { createClient } from "@/lib/supabase/server"

/** Invoice row as returned from DB (includes reference_type, reference_id after migration). */
export type InvoiceListItem = {
  id: string
  user_id: string
  merchant_id: string | null
  merchant_name: string | null
  invoice_number: string | null
  amount: number
  currency: string
  invoice_date: string
  due_date: string | null
  status: "draft" | "pending" | "paid" | "overdue" | "unpaid"
  reference_type: "subscription" | "installment" | "recurring_payment" | null
  reference_id: string | null
  created_at: string
}

const REFERENCE_TYPES = ["subscription", "installment", "recurring_payment"] as const

/**
 * Ensures invoices exist for the current user's:
 * - Active subscriptions (one per schedule's next_due_date)
 * - Unpaid installments (one per installment)
 * - Recurring payments (one per payment)
 * Idempotent: does not duplicate thanks to unique (user_id, reference_type, reference_id, due_date).
 */
export async function ensureInvoicesForUser(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false, error: "Not authenticated." }
  }

  const today = new Date().toISOString().slice(0, 10)

  // 1) Subscriptions: active schedules with next_due_date
  const { data: schedules } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("payment_schedule")
    .select("id, next_due_date, amount, currency, merchant_id")
    .eq("user_id", user.id)
    .eq("schedule_type", "subscription")
    .eq("status", "active")

  for (const row of schedules ?? []) {
    const dueDate = row.next_due_date
    if (!dueDate) continue

    const { data: existing } = await supabase
      .from("invoice")
      .select("id")
      .eq("user_id", user.id)
      .eq("reference_type", "subscription")
      .eq("reference_id", row.id)
      .eq("due_date", dueDate)
      .maybeSingle()

    if (existing) continue

    const status = dueDate < today ? "overdue" : "pending"
    const payload = {
      user_id: user.id,
      merchant_id: row.merchant_id ?? null,
      amount: Number(row.amount),
      currency: row.currency ?? "PHP",
      invoice_date: dueDate,
      due_date: dueDate,
      status,
      reference_type: "subscription",
      reference_id: row.id,
    }
    const { error: ins } = await supabase.from("invoice").insert(payload as never)
    if (ins) {
      if (ins.code === "23505") continue
      return { ok: false, error: ins.message }
    }
  }

  // 2) Installments: unpaid installments (join payment for user_id, merchant_id)
  const { data: installments } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("payment_installment")
    .select(`
      id,
      due_date,
      amount,
      payment:payment_id(user_id, merchant_id)
    `)
    .neq("status", "completed")

  for (const row of installments ?? []) {
    const payment = row.payment as { user_id: string; merchant_id: string | null } | null
    if (!payment || payment.user_id !== user.id) continue

    const { data: existing } = await supabase
      .from("invoice")
      .select("id")
      .eq("user_id", user.id)
      .eq("reference_type", "installment")
      .eq("reference_id", row.id)
      .maybeSingle()

    if (existing) continue

    const dueDate = row.due_date
    const status = dueDate < today ? "overdue" : "pending"
    const payload = {
      user_id: user.id,
      merchant_id: payment.merchant_id ?? null,
      amount: Number(row.amount),
      currency: "PHP",
      invoice_date: dueDate,
      due_date: dueDate,
      status,
      reference_type: "installment",
      reference_id: row.id,
    }
    const { error: ins } = await supabase.from("invoice").insert(payload as never)
    if (ins) {
      if (ins.code === "23505") continue
      return { ok: false, error: ins.message }
    }
  }

  // 3) Recurring payments: one invoice per payment
  const { data: recurringPayments } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> })
    .from("payment")
    .select("id, due_date, amount, currency, merchant_id, status")
    .eq("user_id", user.id)
    .eq("is_recurring", true)

  for (const row of recurringPayments ?? []) {
    const dueDate = row.due_date
    if (!dueDate) continue

    const { data: existing } = await supabase
      .from("invoice")
      .select("id")
      .eq("user_id", user.id)
      .eq("reference_type", "recurring_payment")
      .eq("reference_id", row.id)
      .maybeSingle()

    if (existing) continue

    const status =
      row.status === "completed"
        ? "paid"
        : dueDate < today
          ? "overdue"
          : "pending"
    const payload = {
      user_id: user.id,
      merchant_id: row.merchant_id ?? null,
      amount: Number(row.amount),
      currency: row.currency ?? "PHP",
      invoice_date: dueDate,
      due_date: dueDate,
      status,
      reference_type: "recurring_payment",
      reference_id: row.id,
    }
    const { error: ins } = await supabase.from("invoice").insert(payload as never)
    if (ins) {
      if (ins.code === "23505") continue
      return { ok: false, error: ins.message }
    }
  }

  return { ok: true }
}

/**
 * Returns invoices for the current user. Runs ensureInvoicesForUser() first so
 * subscription, installment, and recurring-payment invoices are present.
 */
export async function getInvoices(): Promise<InvoiceListItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  await ensureInvoicesForUser()

  const { data, error } = await supabase
    .from("invoice")
    .select(`
      id,
      user_id,
      merchant_id,
      invoice_number,
      amount,
      currency,
      invoice_date,
      due_date,
      status,
      created_at,
      reference_type,
      reference_id,
      merchant:merchant_id(name)
    `)
    .eq("user_id", user.id)
    .order("due_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) return []

  type Row = (typeof data)[0] & {
    merchant?: { name: string | null } | null
    reference_type?: (typeof REFERENCE_TYPES)[number] | null
    reference_id?: string | null
  }

  const rows = (data ?? []) as Row[]

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    merchant_id: r.merchant_id ?? null,
    merchant_name: r.merchant?.name ?? null,
    invoice_number: r.invoice_number ?? null,
    amount: Number(r.amount),
    currency: r.currency ?? "PHP",
    invoice_date: r.invoice_date,
    due_date: r.due_date ?? null,
    status: r.status as InvoiceListItem["status"],
    reference_type: r.reference_type ?? null,
    reference_id: r.reference_id ?? null,
    created_at: r.created_at,
  }))
}
