import { TopHeader } from "@/components/top-header"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { StatCards } from "@/components/dashboard/stat-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DailyLimit } from "@/components/dashboard/daily-limit"
import { SavingPlans } from "@/components/dashboard/saving-plans"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { StatisticPanel } from "@/components/dashboard/statistic-panel"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default function DashboardPage() {
  return (
    <>
      <TopHeader title="Dashboard" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col xl:flex-row">
          {/* Main Content - Left + Center */}
          <div className="flex flex-1 flex-col lg:flex-row gap-5 p-4 lg:p-6">
            {/* Left Column */}
            <div className="flex w-full lg:w-[280px] shrink-0 flex-col gap-5">
              <BalanceCard />
              <QuickActions />
              <DailyLimit />
              <SavingPlans />
            </div>

            {/* Center Column */}
            <div className="flex flex-1 flex-col gap-5">
              <StatCards />
              <CashflowChart />
              <RecentTransactions />
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full xl:w-[280px] shrink-0 border-t xl:border-t-0 xl:border-l border-border p-4 lg:p-6">
            <div className="flex flex-col gap-5 sm:flex-row xl:flex-col">
              <div className="flex-1">
                <StatisticPanel />
              </div>
              <div className="flex-1">
                <RecentActivity />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border px-4 py-4 lg:px-6">
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <p>Copyright 2024 Peterdraw</p>
            <div className="flex gap-4 lg:gap-6">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Term and conditions</a>
              <a href="#" className="hover:text-foreground">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
