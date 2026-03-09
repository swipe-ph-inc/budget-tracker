"use client"

import { useCallback, useEffect, useState } from "react"
import { Wallet, DollarSign, Landmark, MoreVertical } from "lucide-react"
import { getDashboardStats } from "@/app/actions/dashboard"

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

const STAT_CONFIG = [
  {
    key: "income" as const,
    label: "Total Income",
    icon: Wallet,
    bgColor: "bg-card",
    iconBg: "bg-secondary",
  },
  {
    key: "expense" as const,
    label: "Total Expense",
    icon: DollarSign,
    bgColor: "bg-accent",
    iconBg: "bg-primary/20",
  },
  {
    key: "savings" as const,
    label: "Total Savings",
    icon: Landmark,
    bgColor: "bg-card",
    iconBg: "bg-secondary",
  },
]

export function StatCards() {
  const [stats, setStats] = useState<{ totalIncome: number; totalExpense: number; totalSavings: number; currency: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getDashboardStats()
      setStats(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const getValue = (key: "income" | "expense" | "savings") => {
    if (!stats) return "—"
    const amount = key === "income" ? stats.totalIncome : key === "expense" ? stats.totalExpense : stats.totalSavings
    return formatAmount(amount, stats.currency)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STAT_CONFIG.map((stat) => (
        <div
          key={stat.label}
          className={`relative rounded-xl border border-border ${stat.bgColor} p-5`}
        >
          <div className="flex items-start justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}>
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="More">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-4 text-2xl font-bold text-card-foreground">
            {loading ? "—" : getValue(stat.key)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
