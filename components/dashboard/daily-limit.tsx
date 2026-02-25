"use client"

import { MoreVertical } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function DailyLimit() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">Daily Limit</h3>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-card-foreground">$2,500.00</span>
          <span className="text-xs text-muted-foreground">spent of $20,000.00</span>
        </div>
        <span className="text-sm font-medium text-card-foreground">12.5%</span>
      </div>
      <Progress value={12.5} className="mt-3 h-2 bg-secondary [&>div]:bg-primary" />
    </div>
  )
}
