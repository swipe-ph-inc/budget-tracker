"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

type RecipientRow = Database["public"]["Tables"]["recipient"]["Row"]
type RecipientInsert = Database["public"]["Tables"]["recipient"]["Insert"]

export type Recipient = RecipientRow

export type GetRecipientsResult =
  | { success: true; data: Recipient[] }
  | { success: false; error: string }

export async function getRecipients(): Promise<GetRecipientsResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to view recipients." }
  }

  const { data, error } = await supabase
    .from("recipient")
    .select("*")
    .eq("user_id", user.id)
    .order("display_name", { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data ?? [] }
}

export type CreateRecipientParams = {
  displayName: string
  accountNumber: string
  bankCode?: string | null
  bankName?: string | null
  countryCode?: string | null
  currency?: string | null
}

export type CreateRecipientResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string }

export async function createRecipient(
  params: CreateRecipientParams
): Promise<CreateRecipientResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to add a recipient." }
  }

  const displayName = params.displayName?.trim()
  const accountNumber = params.accountNumber?.trim()

  if (!displayName) {
    return { success: false, error: "Display name is required." }
  }

  if (!accountNumber) {
    return { success: false, error: "Account number is required." }
  }

  const payload: RecipientInsert = {
    user_id: user.id,
    display_name: displayName,
    account_number: accountNumber,
    bank_code: params.bankCode?.trim() || null,
    bank_name: params.bankName?.trim() || null,
    country_code: params.countryCode?.trim() || null,
    currency: params.currency?.trim() || null,
  }

  const { data, error } = await supabase
    .from("recipient")
    .insert(payload)
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: { id: data.id } }
}
