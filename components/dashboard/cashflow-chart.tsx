"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const data = [
  { month: "Jan", income: 6000, expense: -3000 },
  { month: "Feb", income: 5500, expense: -4000 },
  { month: "Mar", income: 7000, expense: -2500 },
  { month: "Apr", income: 4500, expense: -3500 },
  { month: "May", income: 8000, expense: -5000 },
  { month: "Jun", income: 6000, expense: -4000 },
  { month: "Jul", income: 7500, expense: -3000 },
  { month: "Aug", income: 5000, expense: -4500 },
  { month: "Sep", income: 6500, expense: -2000 },
  { month: "Oct", income: 7000, expense: -3500 },
  { month: "Nov", income: 8000, expense: -4000 },
  { month: "Dec", income: 6000, expense: -3000 },
]

export function CashflowChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">Cashflow</h3>
          <div className="mt-1">
            <p className="text-xs text-muted-foreground">Total Balance</p>
            <p className="text-xl font-bold text-card-foreground lg:text-2xl">$562,000</p>
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
          <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
            <option>This Year</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      <div className="mt-4 h-[220px] lg:h-[280px]">
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
                `$${Math.abs(value).toLocaleString()}`,
                name === "income" ? "Income" : "Expense",
              ]}
              labelFormatter={(label) => `${label} 2029`}
            />
            <Bar dataKey="income" fill="hsl(145,50%,25%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="hsl(145,30%,70%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
