"use client"

import { useCallback, useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { getStatisticPanelData } from "@/app/actions/dashboard"
import type { StatisticPanelData } from "@/app/actions/dashboard"

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function StatisticPanel() {
  const [data, setData] = useState<StatisticPanelData | null>(null)
  const [period, setPeriod] = useState<"this_month" | "last_month">("this_month")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getStatisticPanelData(period)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    void load()
  }, [load])

  const expenseData = data?.expenseByCategory ?? []
  const hasExpense = (data?.expenseTotal ?? 0) > 0

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">Statistic</h3>
        <select
          className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
          value={period}
          onChange={(e) => setPeriod(e.target.value as "this_month" | "last_month")}
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
        >
          Income ({loading ? "—" : formatAmount(data?.incomeTotal ?? 0, data?.currency ?? "PHP")})
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Expense ({loading ? "—" : formatAmount(data?.expenseTotal ?? 0, data?.currency ?? "PHP")})
        </button>
      </div>

      {/* Donut Chart */}
      <div className="relative mx-auto mt-4 h-[160px] w-[160px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading…
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={hasExpense ? 2 : 0}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground">Total Expense</span>
              <span className="text-lg font-bold text-card-foreground">
                {hasExpense && data ? formatAmount(data.expenseTotal, data.currency) : "—"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-col gap-3">
        {expenseData.length === 0 && !loading && (
          <p className="text-center text-xs text-muted-foreground">No expense by category this period</p>
        )}
        {expenseData.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-card"
                style={{ backgroundColor: item.color }}
              >
                {item.percent}
              </span>
              <span className="text-sm text-card-foreground">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-card-foreground">
              {formatAmount(item.value, data?.currency ?? "PHP")}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
