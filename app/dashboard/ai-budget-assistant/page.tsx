import Link from "next/link"
import { Lock, Sparkles, Zap } from "lucide-react"
import { getActiveSubscription } from "@/app/actions/billing"
import { listThreads } from "@/app/actions/chat-threads"
import { AIBudgetAssistantClient } from "@/components/dashboard/ai-budget-assistant-client"

function UpgradeGate() {
  return (
    <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
        {/* Icon stack */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-9 w-9 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-background">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">AI Budget Assistant</h1>
          <p className="text-sm text-muted-foreground">
            This feature is available on the{" "}
            <span className="font-medium text-foreground">Pro plan</span>. Upgrade to
            chat with an AI that can read and manage your accounts, transactions, saving
            plans, and more — without manually filling out forms.
          </p>
        </div>

        {/* Feature highlights */}
        <ul className="w-full space-y-2 text-left">
          {[
            "Ask about your balances and spending",
            "Create saving plans and log contributions",
            "Record payments and transfers by chat",
            "Custom AI model & system prompt",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/dashboard/subscription"
          className="flex w-full items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Upgrade to Pro
        </Link>

        <p className="text-xs text-muted-foreground">
          Already subscribed?{" "}
          <Link href="/dashboard/subscription" className="underline underline-offset-2 hover:text-foreground">
            View your plan
          </Link>
        </p>
      </div>
    </div>
  )
}

export default async function AIBudgetAssistantPage() {
  const [subscription, threads] = await Promise.all([
    getActiveSubscription(),
    listThreads().catch(() => []),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {subscription ? (
        <AIBudgetAssistantClient initialThreads={threads} />
      ) : (
        <UpgradeGate />
      )}
    </div>
  )
}
