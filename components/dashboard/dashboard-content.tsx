"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getDashboardPageData,
  type DashboardPageData,
} from "@/app/actions/dashboard"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { StatCards } from "@/components/dashboard/stat-cards"
import { DailyLimit } from "@/components/dashboard/daily-limit"
import { SavingPlans } from "@/components/dashboard/saving-plans"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { StatisticPanel } from "@/components/dashboard/statistic-panel"
import { RecentActivity } from "@/components/dashboard/recent-activity"

function DashboardSkeleton() {
  return (
    <div className="flex flex-col xl:flex-row">
      <div className="flex flex-1 flex-col lg:flex-row gap-5 p-4 lg:p-6">
        <div className="flex w-full lg:w-[280px] shrink-0 flex-col gap-5">
          <div className="h-[180px] animate-pulse rounded-2xl bg-muted" />
          <div className="h-[140px] animate-pulse rounded-xl bg-muted" />
          <div className="h-[240px] animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="flex flex-1 flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-[320px] animate-pulse rounded-xl bg-muted" />
          <div className="h-[280px] animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
      <div className="w-full xl:w-[280px] shrink-0 border-t xl:border-t-0 xl:border-l border-border p-4 lg:p-6">
        <div className="flex flex-col gap-5 sm:flex-row xl:flex-col">
          <div className="h-[320px] animate-pulse rounded-xl bg-muted" />
          <div className="h-[280px] animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardPageData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getDashboardPageData()
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex flex-col xl:flex-row">
      <div className="flex flex-1 flex-col lg:flex-row gap-5 p-4 lg:p-6">
        <div className="flex w-full lg:w-[280px] shrink-0 flex-col gap-5">
          <BalanceCard initialData={{ accounts: data.accounts, profile: data.profile }} />
          <DailyLimit />
          <SavingPlans initialData={data.savingPlans} />
        </div>
        <div className="flex flex-1 flex-col gap-5">
          <StatCards initialData={data.stats} />
          <CashflowChart
            initialData={{ cashflow: data.cashflow, totalBalance: data.totalBalance }}
          />
          <RecentTransactions initialData={data.recentTransactions} />
        </div>
      </div>
      <div className="w-full xl:w-[280px] shrink-0 border-t xl:border-t-0 xl:border-l border-border p-4 lg:p-6">
        <div className="flex flex-col gap-5 sm:flex-row xl:flex-col">
          <div className="flex-1">
            <StatisticPanel initialData={data.statisticPanel} />
          </div>
          <div className="flex-1">
            <RecentActivity initialData={data.recentActivity} />
          </div>
        </div>
      </div>
    </div>
  )
}
