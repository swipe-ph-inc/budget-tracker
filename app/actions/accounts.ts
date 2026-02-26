"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

type AccountRow = Database["public"]["Tables"]["account"]["Row"]
type AccountInsert = Database["public"]["Tables"]["account"]["Insert"]
type AccountUpdate = Database["public"]["Tables"]["account"]["Update"]

export type CreateAccountResult =
    | { success: true; data?: { id: string } }
    | { success: false; error: string }

function parseBalance(value: string): number {
    const cleaned = value.replace(/,/g, "")
    const parsed = parseFloat(cleaned)
    return Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
}

export async function createAccount(
    values: {
        accountName: string
        bankName: string
        maskedIdentifier: string
        totalBalance: string
        currency: string
        accountType: string
        cardType: string
        isHidden: boolean
    }
): Promise<CreateAccountResult> {
    const supabase = await createClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: "You must be signed in to add an account." }
    }

    const name = values.accountName?.trim()
    if (!name) {
        return { success: false, error: "Account name is required." }
    }

    const maskedIdentifier = values.maskedIdentifier?.trim()
    if (!maskedIdentifier) {
        return { success: false, error: "Masked Identifie is required." }
    }

    const bankNameTrimmed = values.bankName?.trim() || null
    const payload: AccountInsert & { bank_name?: string | null } = {
        user_id: user.id,
        account_type: values.accountType as "savings" | "current" | "checking" | "e_wallet" | "cash" | "other",
        name,
        masked_identifier: maskedIdentifier,
        currency: values.currency || "PHP",
        balance: parseBalance(values.totalBalance),
        hidden: values.isHidden,
        card_type: values.cardType === "none" ? "visa" : values.cardType,
    }
    if (bankNameTrimmed != null) payload.bank_name = bankNameTrimmed

    const { data, error } = await supabase
        .from("account")
        .insert(payload)
        .select("id")
        .single()

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, data: { id: data.id } }
}

export async function getAccounts(): Promise<AccountRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("account")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        throw new Error(error?.message);
    }

    return data ?? []
}