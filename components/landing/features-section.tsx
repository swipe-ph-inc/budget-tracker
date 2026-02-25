import {
  BarChart3,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  TrendingUp,
  Bell,
} from "lucide-react"

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description:
      "Get a comprehensive overview of your finances with live charts, balance tracking, and cashflow analysis at a glance.",
  },
  {
    icon: ArrowLeftRight,
    title: "Instant Transfers",
    description:
      "Send and receive money instantly with local and international transfers. Track all your payment history in one place.",
  },
  {
    icon: Wallet,
    title: "Smart Payments",
    description:
      "Pay bills, subscriptions, and services effortlessly. Manage multiple payment accounts and virtual cards securely.",
  },
  {
    icon: PiggyBank,
    title: "Saving Plans",
    description:
      "Set savings goals and track progress automatically. Create multiple plans for emergencies, vacations, or big purchases.",
  },
  {
    icon: TrendingUp,
    title: "Investment Tracking",
    description:
      "Monitor your investment portfolio performance with detailed analytics, market trends, and smart allocation insights.",
  },
  {
    icon: Bell,
    title: "Smart Insights",
    description:
      "AI-powered spending analysis gives you personalized recommendations to optimize your budget and grow your wealth.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Features</p>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Everything you need to manage your money
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            From everyday payments to long-term investments, COINEST gives you the tools to make smarter financial decisions.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 sm:p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-colors group-hover:bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
