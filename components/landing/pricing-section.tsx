import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with personal finance tracking.",
    features: [
      "Dashboard overview",
      "Up to 3 payment accounts",
      "30-day transaction history",
      "1 saving plan",
      "Basic invoice management",
    ],
    cta: "Get Started",
    highlighted: false,
    badge: null as string | null,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For users who want full control of their financial life.",
    features: [
      "Everything in Free",
      "Unlimited payment accounts",
      "Full transaction history",
      "Unlimited saving plans",
      "Advanced invoice management",
      "Full analytics & reports",
      "Priority support",
    ],
    cta: "Get Pro",
    highlighted: true,
    badge: null as string | null,
  },
  {
    name: "Pro Annual",
    price: "$90",
    period: "/year",
    description: "Same as Pro, billed annually. Just $7.50/mo — save $18 a year.",
    features: [
      "Everything in Pro",
      "Unlimited payment accounts",
      "Full transaction history",
      "Unlimited saving plans",
      "Advanced invoice management",
      "Full analytics & reports",
      "Priority support",
    ],
    cta: "Get Pro Annual",
    highlighted: false,
    badge: "Save 17%",
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="mt-14 mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 ${
                plan.highlighted
                  ? "border-primary bg-card shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              {(plan.highlighted || plan.badge) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`rounded-full px-4 py-1 text-xs font-semibold ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {plan.highlighted ? "Most Popular" : plan.badge}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/dashboard">
                  <Button
                    className={`w-full text-sm font-semibold ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
