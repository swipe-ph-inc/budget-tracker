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
    hidden?: boolean
    cardType?: string | null
    backgroundImgUrl?: string | null
    cardNetworkUrl?: string | null
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

    // account.user_id FK references user_profile(id), not auth.users alone. Ensure a row exists
    // (e.g. user created before the on_auth_user_created trigger, or migrations not applied).
    const { data: existingProfile } = await supabase
        .from("user_profile")
        .select("id")
        .eq("id", user.id)
        .maybeSingle()

    if (!existingProfile) {
        const { error: profileInsertError } = await supabase
            .from("user_profile")
            .insert({ id: user.id })

        if (profileInsertError) {
            console.error("[accounts] ensure user_profile failed", profileInsertError)
            return { success: false, error: GENERIC_ERROR_MESSAGE }
        }
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
    if (name.length > 100) {
        return { success: false, error: "Account name must be 100 characters or less." }
    }

    const maskedIdentifier = values.maskedIdentifier?.trim()
    if (!maskedIdentifier) {
        return { success: false, error: "Masked identifier is required." }
    }
    if (maskedIdentifier.length > 50) {
        return { success: false, error: "Masked identifier must be 50 characters or less." }
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

type AccountUpdateFields = {
    name?: string
    balance?: number
    account_type?: AccountRow["account_type"]
    masked_identifier?: string
    currency?: string
    bank_name?: string | null
    hidden?: boolean
    card_type?: string | null
    background_img_url?: string | null
    card_network_url?: string | null
}

export async function updateAccount(values: UpdateAccountValues): Promise<CreateAccountResult> {
    const supabase = await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: "You must be signed in to update an account." }
    }

    const { accountId } = values
    if (!accountId) {
        return { success: false, error: "Account ID is required." }
    }

    // Build update payload with only non-undefined fields
    const updateFields: AccountUpdateFields = {}

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
    if (values.hidden !== undefined) {
        updateFields.hidden = values.hidden
    }
    if (values.cardType !== undefined) {
        updateFields.card_type = values.cardType
    }
    if (values.backgroundImgUrl !== undefined) {
        updateFields.background_img_url = values.backgroundImgUrl
    }
    if (values.cardNetworkUrl !== undefined) {
        updateFields.card_network_url = values.cardNetworkUrl
    }

    if (Object.keys(updateFields).length === 0) {
        return { success: false, error: "No update fields provided." }
    }

    const { data, error } = await supabase
        .from("account")
        .update(updateFields)
        .eq("id", accountId)
        .eq("user_id", user.id)
        .select("id")
        .single()

    if (error) {
        console.error('[accounts] updateAccount failed', error)
        return { success: false, error: 'Something went wrong. Please try again.' }
    }

    return { success: true, data: { id: data.id } }
}

/** Which rows to include when listing accounts (e.g. Account page filter). */
export type AccountListScope = "active" | "non_deleted" | "all"

export async function getAccounts(
    scope: AccountListScope = "active"
): Promise<AccountRow[]> {
    const supabase = await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return []
    }

    let q = supabase
        .from("account")
        .select("*")
        .eq("user_id", user.id)

    if (scope === "active") {
        q = q.eq("is_deleted", false).eq("is_active", true)
    } else if (scope === "non_deleted") {
        q = q.eq("is_deleted", false)
    }

    const { data, error } = await q.order("created_at", { ascending: false })

    if (error) {
        console.error('[accounts] getAccounts failed', error)
        return []
    }

    return data ?? []
}

/** Count of accounts that count toward the free-tier limit (active, not deleted). */
export async function getActiveAccountCount(): Promise<number> {
    const supabase = await createClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return 0

    const { count, error } = await supabase
        .from("account")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .eq("is_active", true)

    if (error) return 0
    return count ?? 0
}

export async function deactivateAccount(accountId: string): Promise<DeactivateAccountResult> {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: "You must be signed in to deactivate an account." }
    }

    const { data, error } = await supabase
        .from("account")
        .update({ is_active: false })
        .eq("id", accountId)
        .eq("user_id", user.id)
        .select("id, is_active")
        .single();

    if (error) {
        console.error('[accounts] deactivateAccount failed', error)
        return { success: false, error: 'Something went wrong. Please try again.' };
    }

    return { success: true, message: "Account successfully deactivated." };
}

export async function deleteAccount(accountId: string): Promise<DeactivateAccountResult> {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: "You must be signed in to delete an account." }
    }

    const { data, error } = await supabase
        .from("account")
        .update({ is_deleted: true })
        .eq("id", accountId)
        .eq("user_id", user.id)
        .select("id, is_deleted")
        .single();

    if (error) {
        console.error('[accounts] deleteAccount failed', error)
        return { success: false, error: 'Something went wrong. Please try again.' };
    }

    return { success: true, message: "Account successfully deleted." };
}