"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { getDashboardCashflow, getDashboardTotalBalance } from "@/app/actions/dashboard"
import type { DashboardCashflowMonth } from "@/app/actions/dashboard"

function formatBalance(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function CashflowChart() {
  const [data, setData] = useState<DashboardCashflowMonth[]>([])
  const [balance, setBalance] = useState<{ total: number; currency: string } | null>(null)
  const [period, setPeriod] = useState<"this_year" | "last_year">("this_year")
  const [loading, setLoading] = useState(true)

  const loadCashflow = useCallback(async () => {
    setLoading(true)
    try {
      const [cashflow, balanceRes] = await Promise.all([
        getDashboardCashflow(period),
        getDashboardTotalBalance(),
      ])
      setData(cashflow)
      setBalance(balanceRes)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    void loadCashflow()
  }, [loadCashflow])

  const year = period === "this_year" ? new Date().getFullYear() : new Date().getFullYear() - 1

  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">Cashflow</h3>
          <div className="mt-1">
            <p className="text-xs text-muted-foreground">Total Balance</p>
            <p className="text-xl font-bold text-card-foreground lg:text-2xl">
              {loading || !balance ? "—" : formatBalance(balance.total, balance.currency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="flex items-center gap-3 text-xs lg:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(145,50%,25%)]" />
              <span className="text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(145,30%,70%)]" />
              <span className="text-muted-foreground">Expense</span>
            </div>
          </div>
          <select
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
            value={period}
            onChange={(e) => setPeriod(e.target.value as "this_year" | "last_year")}
          >
            <option value="this_year">This Year</option>
            <option value="last_year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="mt-4 h-[220px] lg:h-[280px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(120,10%,89%)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(150,5%,45%)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(150,5%,45%)" }}
                tickFormatter={(v) => {
                  if (v === 0) return "0"
                  return `${v / 1000}K`
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0,0%,100%)",
                  border: "1px solid hsl(120,10%,89%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  formatBalance(Math.abs(value), "PHP"),
                  name === "income" ? "Income" : "Expense",
                ]}
                labelFormatter={(label) => `${label} ${year}`}
              />
              <Bar dataKey="income" fill="hsl(145,50%,25%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(145,30%,70%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
