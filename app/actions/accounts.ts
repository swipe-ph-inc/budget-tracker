"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"
import { getActiveSubscription } from "@/app/actions/billing"

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

type AccountRow = Database["public"]["Tables"]["account"]["Row"]
type AccountInsert = Database["public"]["Tables"]["account"]["Insert"]

export type CreateAccountResult =
    | { success: true; data?: { id: string } }
    | { success: false; error: string }

export type DeactivateAccountResult =
    | { success: true; message: string }
    | { success: false; error: string }

function parseBalance(value: string): number {
    const cleaned = value.replace(/,/g, "")
    const parsed = parseFloat(cleaned)
    return Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
}


type UpdateAccountValues = {
    accountId: string
    accountName?: string
    totalBalance?: string
    accountType?: "savings" | "current" | "checking" | "e_wallet" | "cash" | "other"
    maskedIdentifier?: string
    currency?: string
    bankName?: string | null
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
        background: string
        cardNetworkUrl: string
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

    // Free plan: max 3 accounts. Pro (active subscription) = unlimited.
    const subscription = await getActiveSubscription()
    if (!subscription) {
        const { count, error: countError } = await supabase
            .from("account")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_deleted", false)
            .eq("is_active", true)

        if (!countError && (count ?? 0) >= 3) {
            return {
                success: false,
                error: "Free plan allows up to 3 accounts. Upgrade to Pro for unlimited accounts.",
            }
        }
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
        background_img_url: values.background,
        card_network_url: values.cardNetworkUrl
    }
    if (bankNameTrimmed != null) payload.bank_name = bankNameTrimmed

    const { data, error } = await supabase
        .from("account")
        .insert(payload)
        .select("id")
        .single()

    if (error) {
        console.error('[accounts] createAccount failed', error)
        return { success: false, error: 'Something went wrong. Please try again.' }
    }

    return { success: true, data: { id: data.id } }
}

export async function updateAccount(values: UpdateAccountValues): Promise<CreateAccountResult> {
    const supabase = await createClient()
    const { accountId } = values
    if (!accountId) {
        return { success: false, error: "Account ID is required." }
    }

    // Build update payload with only non-undefined fields
    const updateFields: any = {}

    if (typeof values.accountName === "string") {
        updateFields.name = values.accountName.trim()
    }
    if (values.totalBalance !== undefined) {
        updateFields.balance = parseBalance(values.totalBalance)
    }
    if (values.accountType) {
        updateFields.account_type = values.accountType
    }
    if (typeof values.maskedIdentifier === "string") {
        updateFields.masked_identifier = values.maskedIdentifier.trim()
    }
    if (typeof values.currency === "string") {
        updateFields.currency = values.currency
    }
    // Null or string for bank name
    if ("bankName" in values) {
        updateFields.bank_name =
            values.bankName === null
                ? null
                : (values.bankName?.trim?.() ?? null)
    }

    if (Object.keys(updateFields).length === 0) {
        return { success: false, error: "No update fields provided." }
    }

    const { data, error } = await supabase
        .from("account")
        .update(updateFields)
        .eq("id", accountId)
        .select("id")
        .single()

    if (error) {
        console.error('[accounts] updateAccount failed', error)
        return { success: false, error: 'Something went wrong. Please try again.' }
    }

    return { success: true, data: { id: data.id } }
}

export async function getAccounts(): Promise<AccountRow[]> {
    const supabase = await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return []
    }

    const { data, error } = await supabase
        .from("account")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

    if (error) {
        throw new Error(GENERIC_ERROR_MESSAGE);
    }

    return data ?? []
}

export async function deactivateAccount(accountId: string): Promise<DeactivateAccountResult> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("account")
        .update({ is_active: false })
        .eq("id", accountId)
        .select("id, is_active")
        .single();

    if (error) {
        console.error('[accounts] deactivateAccount failed', error)
        return { success: false, error: 'Something went wrong. Please try again.' };
    }

    return { success: true, message: "Account successfully Deactivated!!" };
}

export async function deleteAccount(accountId: string): Promise<DeactivateAccountResult> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("account")
        .update({ is_deleted: true })
        .eq("id", accountId)
        .select("id, is_deleted")
        .single();

    if (error) {
        console.error('[accounts] deleteAccount failed', error)
        return { success: false, error: 'Something went wrong. Please try again.' };
    }

    return { success: true, message: "Account successfully Deactivated!!" };
}