"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Check, Zap, Crown, Building2, ArrowRight, CreditCard, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { createCheckoutSession, createPortalSession } from "@/app/actions/billing"
import { useToast } from "@/hooks/use-toast"
import type { ActiveSubscription } from "@/app/actions/billing"

/** Map a plan slug from the DB (e.g. "pro-monthly", "pro-annual") to a UI plan id ("pro", "business"). */
function slugToPlanId(slug: string | null): string {
  if (!slug) return "pro"
  if (slug.startsWith("business")) return "business"
  if (slug.startsWith("pro")) return "pro"
  return "pro"
}

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "For individuals getting started with basic finance tracking.",
    features: [
      "Dashboard overview",
      "Up to 3 bank accounts",
      "Basic transaction history",
      "1 saving plan",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    description: "Full financial control with advanced analytics and unlimited tools.",
    features: [
      "Everything in Free",
      "Unlimited bank accounts",
      "Full transaction analytics",
      "Unlimited saving plans",
      "Investment tracking",
      "AI-powered insights",
      "Priority support",
      "Export reports (CSV, PDF)",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    icon: Building2,
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    description: "For teams and businesses managing company finances together.",
    features: [
      "Everything in Pro",
      "Multi-user access (up to 10)",
      "Invoice management",
      "Expense reports & approvals",
      "API access",
      "Custom categories & rules",
      "Dedicated account manager",
      "SSO & advanced security",
    ],
  },
]

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll only be charged the prorated difference. When downgrading, the remaining balance is applied as credit.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Yes! All new users get a 14-day free trial of Pro features. No credit card required to start your trial.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Absolutely. You can cancel anytime from your subscription settings. You'll retain access to your paid features until the end of your billing period.",
  },
]

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
}

export function SubscriptionClient({ subscription }: { subscription: ActiveSubscription }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isPortalPending, startPortalTransition] = useTransition()
  const { toast } = useToast()

  const isProActive =
    subscription !== null &&
    (subscription.status === "active" || subscription.status === "trialing")

  const currentPlanId = isProActive ? slugToPlanId(subscription.planSlug) : "free"

  const handleUpgrade = (interval: "monthly" | "yearly") => {
    startTransition(async () => {
      const result = await createCheckoutSession(interval === "monthly" ? "month" : "year")
      if (!result.success) {
        toast({ title: "Upgrade failed", description: result.error })
        return
      }
      window.location.href = result.url
    })
  }

  const handleManageBilling = () => {
    startPortalTransition(async () => {
      const result = await createPortalSession()
      if (!result.success) {
        toast({ title: "Could not open billing portal", description: result.error, variant: "destructive" })
        return
      }
      window.location.href = result.url
    })
  }

  const currentPlanLabel = isProActive
    ? subscription.planName ?? "Pro"
    : "Free"

  const currentPlanDescription = isProActive
    ? subscription.cancelAtPeriodEnd
      ? `Cancels on ${formatDate(subscription.currentPeriodEnd)}`
      : `Renews on ${formatDate(subscription.currentPeriodEnd)}`
    : "You are on the free plan. Upgrade to unlock all features."

  const currentPlanIcon = isProActive ? Crown : Zap

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 pb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Subscription</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Subscription</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your plan and billing preferences</p>
          </div>

          {/* Current plan banner */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                {isProActive ? (
                  <Crown className="h-6 w-6 text-primary" />
                ) : (
                  <Zap className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Current Plan: {currentPlanLabel}
                </p>
                <p className="text-xs text-muted-foreground">{currentPlanDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  subscription?.status === "past_due"
                    ? "bg-destructive/10 text-destructive"
                    : subscription?.cancelAtPeriodEnd
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : "bg-accent text-accent-foreground"
                }`}
              >
                {subscription?.status === "trialing"
                  ? "Trial"
                  : subscription?.status === "past_due"
                    ? "Past Due"
                    : subscription?.cancelAtPeriodEnd
                      ? "Canceling"
                      : "Active"}
              </span>
              {isProActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={isPortalPending}
                  className="text-xs"
                >
                  {isPortalPending ? "Opening…" : "Manage subscription"}
                </Button>
              )}
            </div>
          </div>

          {/* Billing toggle */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground">Choose your plan</h2>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  billing === "monthly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  billing === "yearly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="ml-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {plans.map((plan) => {
              const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
              const PlanIcon = plan.icon
              const isCurrent = plan.id === currentPlanId
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl border p-5 sm:p-6 ${
                    plan.popular
                      ? "border-primary bg-card shadow-lg shadow-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                        Recommended
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        plan.popular ? "bg-primary/10" : "bg-accent"
                      }`}
                    >
                      <PlanIcon className={`h-5 w-5 ${plan.popular ? "text-primary" : "text-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      ${price === 0 ? "0" : price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {price === 0 ? " forever" : billing === "monthly" ? "/month" : "/year"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plan.description}</p>

                  <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {isCurrent ? (
                      <Button
                        variant="outline"
                        className="w-full border-border text-sm font-medium text-muted-foreground"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : plan.id === "business" ? (
                      <Button
                        className="w-full border-border bg-background text-sm font-semibold text-foreground hover:bg-accent"
                        variant="outline"
                        disabled
                      >
                        Contact Sales
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        className={`w-full text-sm font-semibold ${
                          plan.popular
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-border bg-background text-foreground hover:bg-accent"
                        }`}
                        variant={plan.popular ? "default" : "outline"}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUpgrade(billing)}
                      >
                        {isPending ? "Redirecting…" : "Upgrade to Pro"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparison table */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold text-foreground">Feature comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Feature</th>
                    <th className="px-5 py-3 text-center font-medium text-muted-foreground">Free</th>
                    <th className="px-5 py-3 text-center font-medium text-primary">Pro</th>
                    <th className="px-5 py-3 text-center font-medium text-muted-foreground">Business</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Bank accounts", free: "3", pro: "Unlimited", business: "Unlimited" },
                    { feature: "Transaction history", free: "30 days", pro: "Full", business: "Full" },
                    { feature: "Saving plans", free: "1", pro: "Unlimited", business: "Unlimited" },
                    { feature: "Investment tracking", free: false, pro: true, business: true },
                    { feature: "AI insights", free: false, pro: true, business: true },
                    { feature: "Invoice management", free: false, pro: false, business: true },
                    { feature: "Multi-user access", free: false, pro: false, business: "Up to 10" },
                    { feature: "Export reports", free: false, pro: true, business: true },
                    { feature: "API access", free: false, pro: false, business: true },
                    { feature: "Support", free: "Email", pro: "Priority", business: "Dedicated" },
                  ].map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                      <td className="px-5 py-3 font-medium text-foreground">{row.feature}</td>
                      {(["free", "pro", "business"] as const).map((tier) => {
                        const val = row[tier]
                        return (
                          <td key={tier} className="px-5 py-3 text-center">
                            {typeof val === "boolean" ? (
                              val ? (
                                <Check className="mx-auto h-4 w-4 text-primary" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            ) : (
                              <span className={tier === "pro" ? "font-medium text-primary" : "text-foreground"}>
                                {val}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Shield, title: "Secure Payments", desc: "256-bit SSL encryption on all transactions" },
              { icon: CreditCard, title: "Flexible Billing", desc: "Pay monthly or save with annual billing" },
              { icon: Zap, title: "Instant Activation", desc: "Access all features immediately after upgrade" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold text-foreground">Frequently asked questions</h2>
            </div>
            <div className="divide-y divide-border">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-secondary/30"
                  >
                    {faq.q}
                    <svg
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
