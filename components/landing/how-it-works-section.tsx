import { UserPlus, CreditCard, LineChart } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description:
      "Sign up in under 2 minutes. Connect your bank accounts and cards to get a unified view of all your finances.",
  },
  {
    icon: CreditCard,
    step: "02",
    title: "Add Your Accounts",
    description:
      "Add your bank accounts and cards manually. Log transactions, manage virtual cards, and keep all your finances in one place.",
  },
  {
    icon: LineChart,
    step: "03",
    title: "Track & Grow",
    description:
      "Monitor spending, set saving goals, and review analytics to make smarter financial decisions over time.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">How It Works</p>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Get started in three simple steps
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Setting up Budget Partner takes just a few minutes. Here is how you can start managing your finances better today.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-10 hidden h-0.5 w-full bg-border md:block" />
              )}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/20 bg-card">
                <step.icon className="h-8 w-8 text-primary" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {step.step}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
