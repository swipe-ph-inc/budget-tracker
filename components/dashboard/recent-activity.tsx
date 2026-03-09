"use client"

import { useCallback, useEffect, useState } from "react"
import { MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getRecentActivityForDashboard } from "@/app/actions/dashboard"
import type { RecentActivityItem } from "@/app/actions/dashboard"

const TYPE_COLORS: Record<RecentActivityItem["type"], string> = {
  income: "bg-primary/20 text-primary",
  payment: "bg-accent text-accent-foreground",
  transfer: "bg-secondary text-secondary-foreground",
}

function getInitials(label: string): string {
  const words = label.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words[0]) return words[0].slice(0, 2).toUpperCase()
  return "—"
}

export function RecentActivity() {
  const [activities, setActivities] = useState<RecentActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRecentActivityForDashboard(15)
      setActivities(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const byDay = activities.reduce<Record<string, RecentActivityItem[]>>((acc, item) => {
    const day = item.sublabel
    if (!acc[day]) acc[day] = []
    acc[day].push(item)
    return acc
  }, {})
  const sortedDays: string[] = []
  const seen = new Set<string>()
  for (const item of activities) {
    if (!seen.has(item.sublabel)) {
      seen.add(item.sublabel)
      sortedDays.push(item.sublabel)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">Recent Activity</h3>
        <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="More">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : sortedDays.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No recent activity</p>
      ) : (
        sortedDays.map((day) => (
          <div key={day} className="mt-4">
            <p className="mb-3 text-sm font-semibold text-card-foreground">{day}</p>
            <div className="flex flex-col gap-4">
              {byDay[day].map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={`text-[10px] font-medium ${TYPE_COLORS[item.type]}`}>
                      {getInitials(item.label)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-card-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
