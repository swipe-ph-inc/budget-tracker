"use client"

import { Wallet, DollarSign, Landmark, TrendingUp, MoreVertical } from "lucide-react"

const stats = [
  {
    label: "Total Income",
    value: "$78,000",
    change: "+178%",
    icon: Wallet,
    bgColor: "bg-card",
    iconBg: "bg-secondary",
  },
  {
    label: "Total Expense",
    value: "$43,000",
    change: "+178%",
    icon: DollarSign,
    bgColor: "bg-accent",
    iconBg: "bg-primary/20",
  },
  {
    label: "Total Savings",
    value: "$56,000",
    change: "+124%",
    icon: Landmark,
    bgColor: "bg-card",
    iconBg: "bg-secondary",
  },
]

export function StatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`relative rounded-xl border border-border ${stat.bgColor} p-5`}
        >
          <div className="flex items-start justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}>
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{stat.change}</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{stat.value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
