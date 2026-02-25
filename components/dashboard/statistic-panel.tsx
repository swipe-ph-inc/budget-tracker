"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const expenseData = [
  { name: "Rent & Living", value: 2100, percent: "60%", color: "hsl(145,50%,25%)" },
  { name: "Investment", value: 525, percent: "15%", color: "hsl(145,40%,50%)" },
  { name: "Education", value: 420, percent: "12%", color: "hsl(145,30%,70%)" },
  { name: "Food & Drink", value: 280, percent: "8%", color: "hsl(145,20%,80%)" },
  { name: "Entertainment", value: 175, percent: "5%", color: "hsl(120,10%,89%)" },
]

export function StatisticPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">Statistic</h3>
        <select className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none">
          <option>This Month</option>
          <option>Last Month</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex gap-2">
        <button className="flex-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
          Income ($4,800)
        </button>
        <button className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          Expense ($3,500)
        </button>
      </div>

      {/* Donut Chart */}
      <div className="relative mx-auto mt-4 h-[160px] w-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenseData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
            >
              {expenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted-foreground">Total Expense</span>
          <span className="text-lg font-bold text-card-foreground">$3,500</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-col gap-3">
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
              ${item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
