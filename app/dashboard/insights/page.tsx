"use client"

import { TopHeader } from "@/components/top-header"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts"

const monthlyData = [
  { month: "Sep", income: 5200, expense: 3800 },
  { month: "Oct", income: 6100, expense: 4200 },
  { month: "Nov", income: 5800, expense: 3900 },
  { month: "Dec", income: 7200, expense: 5100 },
  { month: "Jan", income: 6500, expense: 4300 },
  { month: "Feb", income: 7000, expense: 4000 },
]

const savingsData = [
  { month: "Sep", amount: 12000 },
  { month: "Oct", amount: 14500 },
  { month: "Nov", amount: 16200 },
  { month: "Dec", amount: 18400 },
  { month: "Jan", amount: 21000 },
  { month: "Feb", amount: 24500 },
]

const insights = [
  { type: "success", icon: CheckCircle2, title: "Savings on track", description: "You're saving 18% more than your monthly target. Keep it up!" },
  { type: "warning", icon: AlertTriangle, title: "Dining expenses high", description: "Your dining expenses are 35% higher than the last 3-month average." },
  { type: "tip", icon: Lightbulb, title: "Investment opportunity", description: "Based on your savings rate, you could invest an additional $500/month." },
  { type: "success", icon: TrendingUp, title: "Income growth", description: "Your income has grown 12% over the past 6 months. Great progress!" },
]

export default function InsightsPage() {
  return (
    <>
      <TopHeader title="Insights" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs lg:text-sm text-muted-foreground">Avg Income</p>
            </div>
            <p className="mt-1 text-xl lg:text-2xl font-bold text-card-foreground">$6,300</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-xs lg:text-sm text-muted-foreground">Avg Expense</p>
            </div>
            <p className="mt-1 text-xl lg:text-2xl font-bold text-card-foreground">$4,217</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <p className="text-xs lg:text-sm text-muted-foreground">Savings Rate</p>
            <p className="mt-1 text-xl lg:text-2xl font-bold text-primary">33.1%</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <p className="text-xs lg:text-sm text-muted-foreground">Financial Score</p>
            <p className="mt-1 text-xl lg:text-2xl font-bold text-card-foreground">82/100</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expense Trend */}
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <h3 className="text-sm font-semibold text-card-foreground lg:text-base">Income vs Expense Trend</h3>
            <div className="mt-4 h-[200px] lg:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(120,10%,89%)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(150,5%,45%)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(150,5%,45%)" }} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(120,10%,89%)", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="income" fill="hsl(145,50%,25%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(145,30%,70%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Growth */}
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <h3 className="text-sm font-semibold text-card-foreground lg:text-base">Savings Growth</h3>
            <div className="mt-4 h-[200px] lg:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(120,10%,89%)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(150,5%,45%)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(150,5%,45%)" }} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(120,10%,89%)", borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(145,50%,25%)" strokeWidth={2} dot={{ fill: "hsl(145,50%,25%)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Smart Insights</h2>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-border p-3 lg:p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  insight.type === "success" ? "bg-primary/10 text-primary" :
                  insight.type === "warning" ? "bg-warning/10 text-warning" :
                  "bg-accent text-accent-foreground"
                }`}>
                  <insight.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{insight.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
