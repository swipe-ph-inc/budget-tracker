import { createHash, createHmac, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

// ─── Type helpers ─────────────────────────────────────────────────────────────

interface LSSubscriptionAttributes {
  status: string
  cancelled: boolean
  pause: null | { mode: string }
  ends_at: string | null
  renews_at: string | null
  trial_ends_at: string | null
  first_subscription_item?: {
    price_id?: number
    variant_id?: number
  }
  variant_id: number
  product_id: number
  order_id: number
  customer_id: number
  user_email: string
  custom_data?: {
    supabase_user_id?: string
  }
  urls: {
    customer_portal: string
    update_payment_method: string
  }
}

interface LSWebhookPayload {
  meta: {
    event_name: string
    custom_data?: {
      supabase_user_id?: string
    }
  }
  data: {
    id: string
    attributes: LSSubscriptionAttributes
  }
}

// ─── Signature verification ───────────────────────────────────────────────────

function verifySignature(body: string, signature: string | null): boolean {
  if (!webhookSecret || !signature) return false
  try {
    const hmac = createHmac("sha256", webhookSecret)
    const digest = Buffer.from(hmac.update(body).digest("hex"), "utf8")
    const sig = Buffer.from(signature, "utf8")
    if (digest.length !== sig.length) return false
    return timingSafeEqual(digest, sig)
  } catch {
    return false
  }
}

// ─── Status mapping ───────────────────────────────────────────────────────────

type SubStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused"

function mapStatus(attrs: LSSubscriptionAttributes): SubStatus {
  if (attrs.status === "on_trial") return "trialing"
  if (attrs.status === "active" && attrs.pause) return "paused"
  if (attrs.status === "active") return "active"
  if (attrs.status === "past_due") return "past_due"
  if (attrs.status === "unpaid") return "unpaid"
  if (attrs.status === "cancelled" || attrs.cancelled) return "canceled"
  if (attrs.status === "expired") return "canceled"
  if (attrs.status === "paused") return "paused"
  return "incomplete"
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertSubscription(
  adminSupabase: ReturnType<typeof createAdminClient>,
  payload: LSWebhookPayload,
  supabaseUserId: string,
) {
  const { id: lemonSubId, attributes: attrs } = payload.data
  const status = mapStatus(attrs)

  const lemonVariantId = String(attrs.variant_id)
  const lemonProductId = String(attrs.product_id)
  const lemonOrderId = String(attrs.order_id)
  const lemonCustomerId = String(attrs.customer_id)

  // Look up the matching subscription_plan by lemon_variant_id
  const { data: planRow, error: planErr } = await adminSupabase
    .from("subscription_plan")
    .select("id")
    .eq("lemon_variant_id", lemonVariantId)
    .maybeSingle()

  if (planErr) {
    console.error("[ls/webhook] plan lookup failed", planErr)
  }

  const cancelAtPeriodEnd = attrs.cancelled && status !== "canceled"

  const { error } = await adminSupabase.from("subscription").upsert(
    {
      user_id: supabaseUserId,
      lemon_subscription_id: lemonSubId,
      lemon_customer_id: lemonCustomerId,
      lemon_variant_id: lemonVariantId,
      lemon_order_id: lemonOrderId,
      lemon_product_id: lemonProductId,
      // Keep stripe_price_id non-null by using variant id as fallback
      stripe_price_id: lemonVariantId,
      plan_id: planRow?.id ?? null,
      status,
      cancel_at_period_end: cancelAtPeriodEnd,
      current_period_start: attrs.renews_at ?? null,
      current_period_end: attrs.ends_at ?? attrs.renews_at ?? null,
      trial_start: null,
      trial_end: attrs.trial_ends_at ?? null,
      canceled_at: status === "canceled" ? new Date().toISOString() : null,
    },
    { onConflict: "lemon_subscription_id" },
  )

  if (error) {
    console.error("[ls/webhook] upsertSubscription failed", error)
  }

  // Also persist lemon_customer_id on user_profile
  const { error: profileErr } = await adminSupabase
    .from("user_profile")
    .upsert({ id: supabaseUserId, lemon_customer_id: lemonCustomerId }, { onConflict: "id" })

  if (profileErr) {
    console.error("[ls/webhook] profile upsert failed", profileErr)
  }
}

async function updateSubscriptionStatus(
  adminSupabase: ReturnType<typeof createAdminClient>,
  payload: LSWebhookPayload,
) {
  const { id: lemonSubId, attributes: attrs } = payload.data
  const status = mapStatus(attrs)
  const cancelAtPeriodEnd = attrs.cancelled && status !== "canceled"

  const { error } = await adminSupabase
    .from("subscription")
    .update({
      status,
      cancel_at_period_end: cancelAtPeriodEnd,
      current_period_end: attrs.ends_at ?? attrs.renews_at ?? null,
      canceled_at: status === "canceled" ? new Date().toISOString() : null,
    })
    .eq("lemon_subscription_id", lemonSubId)

  if (error) {
    console.error("[ls/webhook] updateSubscriptionStatus failed", error)
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("[ls/webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not set")
    return new NextResponse("Webhook secret not configured", { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get("x-signature")

  if (!verifySignature(body, signature)) {
    console.error("[ls/webhook] invalid signature")
    return new NextResponse("Invalid signature", { status: 401 })
  }

  const adminSupabase = createAdminClient()

  // Idempotency: SHA-256 of the raw body uniquely identifies this exact payload.
  // If the same event is delivered more than once, skip reprocessing and return 200
  // so LemonSqueezy does not keep retrying.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webhookEventsTable = (adminSupabase as any).from("webhook_events")
  const eventId = createHash("sha256").update(body).digest("hex")
  // TODO: run `pnpm db:types` after applying migration 20260331000000_create_webhook_events.sql
  // to remove the cast above and restore full type safety.
  const { error: dupeError } = await webhookEventsTable
    .insert({ source: "lemonsqueezy", event_id: eventId })

  if (dupeError) {
    if (dupeError.code === "23505") {
      // Unique constraint violation — already processed this event.
      return NextResponse.json({ received: true })
    }
    // Non-fatal: log and continue so the event is still processed.
    console.error("[ls/webhook] failed to record event for idempotency", dupeError)
  }

  let payload: LSWebhookPayload
  try {
    payload = JSON.parse(body) as LSWebhookPayload
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 })
  }

  const eventName = payload.meta.event_name
  const supabaseUserId =
    payload.meta.custom_data?.supabase_user_id ??
    payload.data.attributes.custom_data?.supabase_user_id

  try {
    switch (eventName) {
      case "subscription_created": {
        if (!supabaseUserId) {
          console.warn("[ls/webhook] subscription_created missing supabase_user_id", {
            subId: payload.data.id,
          })
          break
        }
        await upsertSubscription(adminSupabase, payload, supabaseUserId)
        break
      }

      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_unpaused": {
        if (supabaseUserId) {
          await upsertSubscription(adminSupabase, payload, supabaseUserId)
        } else {
          await updateSubscriptionStatus(adminSupabase, payload)
        }
        break
      }

      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_paused": {
        await updateSubscriptionStatus(adminSupabase, payload)
        break
      }

      case "subscription_payment_failed": {
        const { id: lemonSubId } = payload.data
        const { error } = await adminSupabase
          .from("subscription")
          .update({ status: "past_due" })
          .eq("lemon_subscription_id", lemonSubId)
        if (error) {
          console.error("[ls/webhook] payment_failed status update failed", error)
        }
        break
      }

      case "subscription_payment_success":
      case "subscription_payment_recovered": {
        const { id: lemonSubId } = payload.data
        const { error } = await adminSupabase
          .from("subscription")
          .update({ status: "active" })
          .eq("lemon_subscription_id", lemonSubId)
        if (error) {
          console.error("[ls/webhook] payment_success status update failed", error)
        }
        break
      }

      default:
        // Unhandled events — return 200 so LemonSqueezy doesn't retry
        break
    }
  } catch (err) {
    console.error("[ls/webhook] unhandled error processing event", eventName, err)
    // Return 200 to prevent LemonSqueezy retries for logic errors
  }

  return NextResponse.json({ received: true })
}
