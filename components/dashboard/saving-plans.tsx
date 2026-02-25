"use client"

import { Plus, MoreVertical, ShieldAlert, Palmtree, Home } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const plans = [
  {
    name: "Emergency Fund",
    icon: ShieldAlert,
    saved: 5000,
    target: 10000,
    percent: 50,
  },
  {
    name: "Vacation Fund",
    icon: Palmtree,
    saved: 3000,
    target: 5000,
    percent: 60,
  },
  {
    name: "Home Down Payment",
    icon: Home,
    saved: 7250,
    target: 20000,
    percent: 36.25,
  },
]

export function SavingPlans() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">Saving Plans</h3>
        <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
          <Plus className="h-4 w-4" /> Add Plan
        </button>
      </div>
      <div className="mt-1">
        <p className="text-xs text-muted-foreground">Total Savings</p>
        <p className="text-2xl font-bold text-card-foreground">$84,500</p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <plan.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-card-foreground">{plan.name}</span>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <Progress
              value={plan.percent}
              className="mt-3 h-2 bg-secondary [&>div]:bg-primary"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-card-foreground">
                  ${plan.saved.toLocaleString()}
                </span>{" "}
                {plan.percent}%
              </span>
              <span>Target: ${plan.target.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
