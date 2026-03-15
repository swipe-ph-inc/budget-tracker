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

function subFields(sub: Stripe.Subscription) {
  const item = sub.items.data[0]
  const priceId = item?.price.id ?? ""
  return {
    priceId,
    status: sub.status,
    // In Stripe API 2026-02-25.clover, period fields moved from Subscription to SubscriptionItem
    current_period_start: toIso(item?.current_period_start),
    current_period_end: toIso(item?.current_period_end),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: toIso(sub.canceled_at ?? undefined),
    trial_start: toIso(sub.trial_start ?? undefined),
    trial_end: toIso(sub.trial_end ?? undefined),
  }
}

async function upsertSubscription(
  adminSupabase: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription,
  supabaseUserId: string,
) {
  const { priceId, ...fields } = subFields(sub)
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id

  const { data: planRow, error: planErr } = await adminSupabase
    .from("subscription_plan")
    .select("id")
    .eq("stripe_price_id", priceId)
    .maybeSingle()

  if (planErr) {
    console.error("[stripe/webhook] plan lookup failed", planErr)
  }

  const { error } = await adminSupabase.from("subscription").upsert(
    {
      user_id: supabaseUserId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan_id: planRow?.id ?? null,
      ...fields,
    },
    { onConflict: "stripe_subscription_id" },
  )

  if (error) {
    console.error("[stripe/webhook] upsertSubscription failed", error)
  }
}

async function updateSubscription(
  adminSupabase: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription,
) {
  const { priceId, ...fields } = subFields(sub)

  const { data: planRow, error: planErr } = await adminSupabase
    .from("subscription_plan")
    .select("id")
    .eq("stripe_price_id", priceId)
    .maybeSingle()

  if (planErr) {
    console.error("[stripe/webhook] plan lookup failed", planErr)
  }

  const { error } = await adminSupabase
    .from("subscription")
    .update({ stripe_price_id: priceId, plan_id: planRow?.id ?? null, ...fields })
    .eq("stripe_subscription_id", sub.id)

  if (error) {
    console.error("[stripe/webhook] updateSubscription failed", error)
  }
}

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    return new NextResponse("Stripe is not configured", { status: 500 })
  }

  const sig = req.headers.get("stripe-signature")
  if (!sig) {
    return new NextResponse("Missing stripe-signature header", { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err instanceof Error ? err.message : err)
    return new NextResponse("Webhook signature error", { status: 400 })
  }

  const adminSupabase = createAdminClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        const supabaseUserId = session.metadata?.supabase_user_id
        if (!supabaseUserId) {
          console.warn("[stripe/webhook] checkout.session.completed missing supabase_user_id", { sessionId: session.id })
          break
        }

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer as Stripe.Customer | null)?.id

        if (!customerId) {
          console.warn("[stripe/webhook] checkout.session.completed missing customerId", { sessionId: session.id })
          break
        }

        // Persist stripe_customer_id on the user profile
        const { error: profileErr } = await adminSupabase
          .from("user_profile")
          .upsert({ id: supabaseUserId, stripe_customer_id: customerId }, { onConflict: "id" })

        if (profileErr) {
          console.error("[stripe/webhook] profile upsert failed", profileErr)
        }

        // Retrieve the full subscription object from Stripe and write it to the DB
        const stripeSubId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as Stripe.Subscription | null)?.id

        if (!stripeSubId) {
          console.warn("[stripe/webhook] checkout.session.completed missing subscriptionId", { sessionId: session.id })
          break
        }

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)
        await upsertSubscription(adminSupabase, stripeSub, supabaseUserId)
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription

        const { data: existingRow, error: lookupErr } = await adminSupabase
          .from("subscription")
          .select("user_id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle()

        if (lookupErr) {
          console.error("[stripe/webhook] subscription lookup failed", lookupErr)
          break
        }

        if (!existingRow) {
          console.warn("[stripe/webhook] customer.subscription.updated — no matching row", { subId: sub.id })
          break
        }

        await updateSubscription(adminSupabase, sub)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription

        const { error } = await adminSupabase
          .from("subscription")
          .update({
            status: "canceled",
            canceled_at: toIso(sub.canceled_at ?? undefined) ?? new Date().toISOString(),
            cancel_at_period_end: false,
          })
          .eq("stripe_subscription_id", sub.id)

        if (error) {
          console.error("[stripe/webhook] subscription delete-update failed", error)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        // In Stripe API 2026-02-25.clover, subscription is under parent.subscription_details
        const subRef = invoice.parent?.subscription_details?.subscription
        const stripeSubId = typeof subRef === "string" ? subRef : subRef?.id

        if (!stripeSubId) break

        const { error } = await adminSupabase
          .from("subscription")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", stripeSubId)

        if (error) {
          console.error("[stripe/webhook] invoice.payment_failed status update failed", error)
        }
        break
      }

      case "invoice.paid": {
        // When a past_due invoice is paid, Stripe also fires customer.subscription.updated
        // with status "active" — that handler covers the status update. Nothing extra needed.
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error("[stripe/webhook] unhandled error processing event", event.type, err)
    // Return 200 so Stripe doesn't keep retrying on our logic errors.
    // Stripe retries on 4xx/5xx; returning 200 with an internal log is correct here.
  }

  return NextResponse.json({ received: true })
}
