"use server"

import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  cancelSubscription,
} from "@lemonsqueezy/lemonsqueezy.js"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

export type ActiveSubscription = {
  status: Database["public"]["Enums"]["subscription_status_enum"]
  planName: string | null
  planSlug: string | null
  interval: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  lemonSubscriptionId: string | null
  customerPortalUrl: string | null
} | null

function setupLemon() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY is not set")
  lemonSqueezySetup({ apiKey })
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  )
}

// ─── Read active subscription ────────────────────────────────────────────────

export async function getActiveSubscription(): Promise<ActiveSubscription> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("subscription")
    .select(
      "status, cancel_at_period_end, current_period_end, lemon_subscription_id, subscription_plan(name, slug, interval)",
    )
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const plan = data.subscription_plan as { name: string; slug: string; interval: string } | null

  // Try to get the customer portal URL from LemonSqueezy
  let customerPortalUrl: string | null = null
  if (data.lemon_subscription_id) {
    try {
      setupLemon()
      const { data: lsSub } = await getSubscription(data.lemon_subscription_id)
      customerPortalUrl = lsSub?.data?.attributes?.urls?.customer_portal ?? null
    } catch {
      // Non-fatal — portal URL is optional
    }
  }

  return {
    status: data.status,
    planName: plan?.name ?? null,
    planSlug: plan?.slug ?? null,
    interval: plan?.interval ?? null,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    lemonSubscriptionId: (data as { lemon_subscription_id?: string | null }).lemon_subscription_id ?? null,
    customerPortalUrl,
  }
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export type CreateCheckoutSessionResult =
  | { success: true; url: string }
  | { success: false; error: string }

/**
 * Create a LemonSqueezy checkout URL for the Pro plan.
 * billingInterval: "month" | "year"
 */
export async function createCheckoutSession(
  billingInterval: "month" | "year" = "month",
): Promise<CreateCheckoutSessionResult> {
  try {
    setupLemon()
  } catch {
    return { success: false, error: "Billing is not configured on the server." }
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId =
    billingInterval === "year"
      ? process.env.LEMONSQUEEZY_VARIANT_ID_PRO_YEAR
      : process.env.LEMONSQUEEZY_VARIANT_ID_PRO_MONTH

  if (!storeId || !variantId) {
    return { success: false, error: "Billing variant is not configured." }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to upgrade your plan." }
  }

  const appUrl = getAppUrl()

  try {
    const { data, error } = await createCheckout(storeId, variantId, {
      checkoutOptions: {
        embed: false,
        media: false,
      },
      checkoutData: {
        email: user.email ?? undefined,
        custom: {
          supabase_user_id: user.id,
        },
      },
      productOptions: {
        redirectUrl: `${appUrl}/dashboard/subscription?status=success`,
        receiptButtonText: "Go to Dashboard",
        receiptThankYouNote: "Thank you for upgrading to Pro!",
      },
    })

    if (error || !data?.data?.attributes?.url) {
      console.error("[billing] createCheckout failed", error)
      return {
        success: false,
        error: "Could not start checkout. Please try again or contact support.",
      }
    }

    return { success: true, url: data.data.attributes.url }
  } catch (err) {
    console.error("[billing] createCheckoutSession threw", err instanceof Error ? err.message : err)
    return {
      success: false,
      error: "We couldn't start your upgrade right now. Please try again.",
    }
  }
}

// ─── Cancel subscription ─────────────────────────────────────────────────────

export type CancelSubscriptionResult =
  | { success: true }
  | { success: false; error: string }

export async function cancelUserSubscription(): Promise<CancelSubscriptionResult> {
  try {
    setupLemon()
  } catch {
    return { success: false, error: "Billing is not configured on the server." }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: subRow } = await supabase
    .from("subscription")
    .select("lemon_subscription_id")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  const lemonSubId = (subRow as { lemon_subscription_id?: string | null } | null)
    ?.lemon_subscription_id

  if (!lemonSubId) {
    return { success: false, error: "No active subscription found." }
  }

  try {
    const { error } = await cancelSubscription(lemonSubId)
    if (error) {
      console.error("[billing] cancelSubscription failed", error)
      return { success: false, error: "Could not cancel subscription. Please try again." }
    }
    return { success: true }
  } catch (err) {
    console.error("[billing] cancelUserSubscription threw", err instanceof Error ? err.message : err)
    return { success: false, error: "Could not cancel subscription. Please try again." }
  }
}

// ─── Portal session (redirect to LemonSqueezy customer portal) ───────────────

export type CreatePortalSessionResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createPortalSession(): Promise<CreatePortalSessionResult> {
  try {
    setupLemon()
  } catch {
    return { success: false, error: "Billing is not configured on the server." }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: subRow } = await supabase
    .from("subscription")
    .select("lemon_subscription_id")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle()

  const lemonSubId = (subRow as { lemon_subscription_id?: string | null } | null)
    ?.lemon_subscription_id

  if (!lemonSubId) {
    return { success: false, error: "No billing account found. Please upgrade first." }
  }

  try {
    const { data, error } = await getSubscription(lemonSubId)
    if (error) {
      console.error("[billing] getSubscription failed", error)
      return { success: false, error: "Could not open billing portal. Please try again." }
    }

    const portalUrl = data?.data?.attributes?.urls?.customer_portal
    if (!portalUrl) {
      return { success: false, error: "Billing portal URL not available." }
    }

    return { success: true, url: portalUrl }
  } catch (err) {
    console.error("[billing] createPortalSession threw", err instanceof Error ? err.message : err)
    return { success: false, error: "Could not open billing portal. Please try again." }
  }
}
