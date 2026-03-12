import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe =
  stripeSecretKey &&
  new Stripe(stripeSecretKey, {
    apiVersion: "2026-02-25.clover",
  })

function toIso(unix: number | null | undefined): string | null {
  return unix ? new Date(unix * 1000).toISOString() : null
}

async function upsertSubscription(
  adminSupabase: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription,
  supabaseUserId: string,
) {
  const priceId = sub.items.data[0]?.price.id ?? ""
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id

  const { data: planRow } = await adminSupabase
    .from("subscription_plan")
    .select("id")
    .eq("stripe_price_id", priceId)
    .maybeSingle()

  await adminSupabase.from("subscription").upsert(
    {
      user_id: supabaseUserId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan_id: planRow?.id ?? null,
      status: sub.status as Stripe.Subscription.Status,
      current_period_start: toIso((sub as any).current_period_start),
      current_period_end: toIso((sub as any).current_period_end),
      cancel_at_period_end: (sub as any).cancel_at_period_end,
      canceled_at: toIso((sub as any).canceled_at),
      trial_start: toIso((sub as any).trial_start),
      trial_end: toIso((sub as any).trial_end),
    },
    { onConflict: "stripe_subscription_id" },
  )
}

async function updateSubscription(
  adminSupabase: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription,
) {
  const priceId = sub.items.data[0]?.price.id ?? ""

  const { data: planRow } = await adminSupabase
    .from("subscription_plan")
    .select("id")
    .eq("stripe_price_id", priceId)
    .maybeSingle()

  await adminSupabase
    .from("subscription")
    .update({
      stripe_price_id: priceId,
      plan_id: planRow?.id ?? null,
      status: sub.status as Stripe.Subscription.Status,
      current_period_start: toIso((sub as any).current_period_start),
      current_period_end: toIso((sub as any).current_period_end),
      cancel_at_period_end: (sub as any).cancel_at_period_end,
      canceled_at: toIso((sub as any).canceled_at),
      trial_start: toIso((sub as any).trial_start),
      trial_end: toIso((sub as any).trial_end),
    })
    .eq("stripe_subscription_id", sub.id)
}

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    return new NextResponse("Stripe is not configured", { status: 500 })
  }

  const sig = req.headers.get("stripe-signature")!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return new NextResponse("Webhook Error", { status: 400 })
  }

  const adminSupabase = createAdminClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session

      const supabaseUserId = session.metadata?.supabase_user_id
      if (!supabaseUserId) break

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer as Stripe.Customer | null)?.id

      if (!customerId) break

      // Persist stripe_customer_id on the user profile
      await adminSupabase
        .from("user_profile")
        .upsert({ id: supabaseUserId, stripe_customer_id: customerId }, { onConflict: "id" })

      // Retrieve the full subscription object from Stripe and write it to the DB
      const stripeSubId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription | null)?.id

      if (!stripeSubId) break

      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)
      await upsertSubscription(adminSupabase, stripeSub, supabaseUserId)
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription

      // Find the user from our subscription table
      const { data: existingRow } = await adminSupabase
        .from("subscription")
        .select("user_id")
        .eq("stripe_subscription_id", sub.id)
        .maybeSingle()

      if (!existingRow) break

      await updateSubscription(adminSupabase, sub)
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription

      await adminSupabase
        .from("subscription")
        .update({
          status: "canceled",
          canceled_at: toIso((sub as any).canceled_at) ?? new Date().toISOString(),
          cancel_at_period_end: false,
        })
        .eq("stripe_subscription_id", sub.id)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
