import { getActiveSubscription } from "@/app/actions/billing"
import { SubscriptionClient } from "./subscription-client"

export default async function SubscriptionPage() {
  const subscription = await getActiveSubscription()

  return (
    <>
      <SubscriptionClient subscription={subscription} />
    </>
  )
}
