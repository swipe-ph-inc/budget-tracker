"use client"

import { MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const activities = {
  Today: [
    {
      name: "Jamie Smith",
      action: "updated account settings",
      time: "16:05",
      initials: "JS",
      color: "bg-primary/20 text-primary",
    },
    {
      name: "Alex Johnson",
      action: "logged in",
      time: "13:05",
      initials: "AJ",
      color: "bg-accent text-accent-foreground",
    },
    {
      name: "Morgan Lee",
      action: "added a new savings goal for vacation",
      time: "02:05",
      initials: "ML",
      color: "bg-secondary text-secondary-foreground",
    },
  ],
  Yesterday: [
    {
      name: "Taylor Green",
      action: "reviewed recent transactions",
      time: "21:05",
      initials: "TG",
      color: "bg-primary/20 text-primary",
    },
    {
      name: "Wilson Baptista",
      action: "transferred funds to emergency fund",
      time: "09:05",
      initials: "WB",
      color: "bg-accent text-accent-foreground",
    },
  ],
}

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">Recent Activity</h3>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {Object.entries(activities).map(([day, items]) => (
        <div key={day} className="mt-4">
          <p className="mb-3 text-sm font-semibold text-card-foreground">{day}</p>
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div key={`${item.name}-${item.time}`} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={`text-[10px] font-medium ${item.color}`}>
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-card-foreground">
                    <span className="font-medium">{item.name}</span>{" "}
                    {item.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
