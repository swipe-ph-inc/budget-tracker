"use client"

import { Plus, ArrowLeftRight, HandCoins, Clock } from "lucide-react"

const actions = [
  { label: "Top Up", icon: Plus },
  { label: "Transfer", icon: ArrowLeftRight },
  { label: "Request", icon: HandCoins },
  { label: "History", icon: Clock },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {actions.map((action) => (
        <button
          key={action.label}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 transition-colors hover:bg-accent sm:px-5 sm:py-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <action.icon className="h-5 w-5 text-foreground" />
          </div>
          <span className="text-xs font-medium text-foreground">{action.label}</span>
        </button>
      ))}
    </div>
  )
}
