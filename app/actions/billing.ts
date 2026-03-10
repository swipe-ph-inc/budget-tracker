"use server"

import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

type UserProfileRow = Database["public"]["Tables"]["user_profile"]["Row"]
type UserProfileInsert = Database["public"]["Tables"]["user_profile"]["Insert"]

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  // In server actions we can't throw at import time safely for env issues,
  // but we still guard Stripe usage inside the action.
}

const stripe =
  stripeSecretKey &&
  new Stripe(stripeSecretKey, {
    apiVersion: "2026-02-25.clover",
  })

export type CreateCheckoutSessionResult =
  | { success: true; url: string }
  | { success: false; error: string }

/**
 * Create a Stripe Checkout Session for upgrading to Pro.
 * billingInterval: "month" | "year" (maps to STRIPE_PRICE_PRO_MONTH / STRIPE_PRICE_PRO_YEAR).
 */
export async function createCheckoutSession(billingInterval: "month" | "year" = "month"): Promise<CreateCheckoutSessionResult> {
  if (!stripe) {
    return { success: false, error: "Stripe is not configured on the server." }
  }

  const priceId =
    billingInterval === "year"
      ? process.env.STRIPE_PRICE_PRO_YEAR
      : process.env.STRIPE_PRICE_PRO_MONTH

  if (!priceId) {
    return { success: false, error: "Stripe price ID is not configured." }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to upgrade your plan." }
  }

  // Load existing profile to reuse stripe_customer_id if present
  const { data: profileRow } = await supabase
    .from("user_profile")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  const profile = profileRow as UserProfileRow | null

  let stripeCustomerId = profile?.stripe_customer_id ?? null

  // Create a new customer in Stripe if needed
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    stripeCustomerId = customer.id

    // Persist the customer id back to Supabase
    const upsertPayload: UserProfileInsert = {
      id: user.id,
      stripe_customer_id: stripeCustomerId,
    }

    await supabase.from("user_profile").upsert(upsertPayload, { onConflict: "id" })
  }

  // Compute base URL for redirect
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const successUrl = `${appUrl}/dashboard/subscription?status=success`
  const cancelUrl = `${appUrl}/dashboard/subscription?status=cancelled`

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    if (!session.url) {
      return { success: false, error: "Failed to create Stripe Checkout session." }
    }

    return { success: true, url: session.url }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message ?? "Unexpected error while creating Stripe Checkout session.",
    }
  }
}

