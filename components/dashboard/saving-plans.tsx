"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Plus, MoreVertical, Landmark } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { getSavingPlans } from "@/app/actions/saving-plans"
import type { SavingPlanListItem } from "@/app/actions/saving-plans"

const MAX_PLANS_SHOWN = 3

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function SavingPlans() {
  const [plans, setPlans] = useState<SavingPlanListItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSavingPlans()
      setPlans(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  const totalSavings = plans.reduce((s, p) => s + p.current_amount, 0)
  const primaryCurrency = plans[0]?.currency ?? "PHP"
  const displayPlans = plans.slice(0, MAX_PLANS_SHOWN)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">Saving Plans</h3>
        <Link
          href="/dashboard/saving-plans"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          <Plus className="h-4 w-4" /> Add Plan
        </Link>
      </div>
      <div className="mt-1">
        <p className="text-xs text-muted-foreground">Total Savings</p>
        <p className="text-2xl font-bold text-card-foreground">
          {loading ? "—" : formatAmount(totalSavings, primaryCurrency)}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : displayPlans.length === 0 ? (
          <Link
            href="/dashboard/saving-plans"
            className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground hover:border-primary/50 hover:text-primary"
          >
            No saving plans yet. Add one to get started.
          </Link>
        ) : (
          displayPlans.map((plan) => {
            const percent =
              plan.target_amount > 0
                ? Math.min(100, (plan.current_amount / plan.target_amount) * 100)
                : 0
            return (
              <Link
                key={plan.id}
                href="/dashboard/saving-plans"
                className="block rounded-xl border border-border p-4 transition-colors hover:bg-accent/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <Landmark className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      {plan.name}
                    </span>
                  </div>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
                </div>
                <Progress
                  value={percent}
                  className="mt-3 h-2 bg-secondary [&>div]:bg-primary"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-card-foreground">
                      {formatAmount(plan.current_amount, plan.currency)}
                    </span>{" "}
                    {percent.toFixed(0)}%
                  </span>
                  <span>Target: {formatAmount(plan.target_amount, plan.currency)}</span>
                </div>
              </Link>
            )
          })
        )}
      </div>
      {!loading && plans.length > MAX_PLANS_SHOWN && (
        <Link
          href="/dashboard/saving-plans"
          className="mt-3 block text-center text-sm font-medium text-primary hover:text-primary/80"
        >
          View all {plans.length} plans →
        </Link>
      )}
    </div>
  )
}
