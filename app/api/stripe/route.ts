import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

type UserProfileInsert = Database["public"]["Tables"]["user_profile"]["Insert"]

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe =
  stripeSecretKey &&
  new Stripe(stripeSecretKey, {
    apiVersion: "2026-02-25.clover",
  })

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

  const supabase = await createClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session

      const supabaseUserId =
        (session.metadata && (session.metadata["supabase_user_id"] as string | undefined)) ||
        undefined

      if (!supabaseUserId) {
        break
      }

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer as Stripe.Customer | null)?.id

      if (!customerId) {
        break
      }

      const update: UserProfileInsert = {
        id: supabaseUserId,
        stripe_customer_id: customerId,
      }

      await supabase.from("user_profile").upsert(update, { onConflict: "id" })
      break
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // In the future, handle subscription status / plan changes here.
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}
