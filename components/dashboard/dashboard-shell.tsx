"use client"

import { useState, useEffect, type ReactNode } from "react"
import { AppSidebar, SIDEBAR_COLLAPSED_STORAGE_KEY } from "@/components/app-sidebar"
import { cn } from "@/lib/utils"

type DashboardShellProps = {
  hasActiveSubscription: boolean
  children: ReactNode
}

/**
 * Owns desktop sidebar collapse state + persisted preference so the main column
 * margin matches the fixed sidebar width (220px vs 64px) on lg+.
 */
export function DashboardShell({
  hasActiveSubscription,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)
      if (stored !== null) setCollapsed(JSON.parse(stored) as boolean)
    } catch {
      // ignore
    }
  }, [])

  const setCollapsedPersisted = (value: boolean) => {
    setCollapsed(value)
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, JSON.stringify(value))
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        hasActiveSubscription={hasActiveSubscription}
        collapsed={collapsed}
        onCollapsedChange={setCollapsedPersisted}
      />
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ease-out",
          collapsed ? "lg:ml-16" : "lg:ml-[220px]"
        )}
      >
        {children}
      </div>
    </div>
  )
}
