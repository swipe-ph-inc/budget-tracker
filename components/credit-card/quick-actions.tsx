"use client"

import { DollarSign, CalendarRange, Calendar, ArrowRightLeft } from "lucide-react"

const ACTIONS = [
  {
    icon: DollarSign,
    label: "Payment",
    description: "Make a payment",
  },
  {
    icon: CalendarRange,
    label: "Subscription",
    description: "Manage subscriptions",
  },
  {
    icon: Calendar,
    label: "Installment",
    description: "View installments",
  },
  {
    icon: ArrowRightLeft,
    label: "Transfer",
    description: "Transfer balance",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm lg:p-5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <action.icon className="h-5 w-5" />
          </div>
          <div className="text-center">
            <span className="text-xs font-semibold text-card-foreground">
              {action.label}
            </span>
            <p className="mt-0.5 hidden text-[10px] text-muted-foreground lg:block">
              {action.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
