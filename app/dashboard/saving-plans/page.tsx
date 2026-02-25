"use client"

import { TopHeader } from "@/components/top-header"
import {
  ShieldAlert, Palmtree, Landmark, Home, GraduationCap, Car,
  MoreHorizontal, Plus, TrendingUp
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts"

const plans = [
  { name: "Emergency Fund", icon: ShieldAlert, saved: 6000, target: 10000, percent: 60, status: "In Progress" },
  { name: "Vacation Fund", icon: Palmtree, saved: 3000, target: 5000, percent: 60, status: "In Progress" },
  { name: "Retirement Fund", icon: Landmark, saved: 5600, target: 20000, percent: 28, status: "In Progress" },
  { name: "Home Down Payment", icon: Home, saved: 25000, target: 25000, percent: 100, status: "Completed" },
  { name: "Education Fund (for children)", icon: GraduationCap, saved: 6000, target: 15000, percent: 40, status: "In Progress" },
  { name: "Car Replacement Fund", icon: Car, saved: 2000, target: 8000, percent: 25, status: "Behind Schedule" },
]

const balanceData = [
  { month: "Jan", balance: 800 },
  { month: "Feb", balance: 1000 },
  { month: "Mar", balance: 1200 },
  { month: "Apr", balance: 1100 },
  { month: "May", balance: 2200 },
  { month: "Jun", balance: 3875 },
  { month: "Jul", balance: 3500 },
  { month: "Aug", balance: 3200 },
  { month: "Sep", balance: 3600 },
  { month: "Oct", balance: 4000 },
  { month: "Nov", balance: 4200 },
  { month: "Dec", balance: 4500 },
]

const transactions = [
  { type: "Income", person: "Andrew Forbist", date: "2028-09-01", time: "09:00 AM", amount: "+$500", note: "Monthly contribution to fund", isIncome: true },
  { type: "Income", person: "Sarah Connors", date: "2028-09-01", time: "10:15 AM", amount: "+$500", note: "Monthly contribution to fund", isIncome: true },
  { type: "Income", person: "Mike Johnson", date: "2028-09-01", time: "11:30 AM", amount: "+$500", note: "Monthly contribution to fund", isIncome: true },
  { type: "Withdraw", person: "Andrew Forbist", date: "2028-07-15", time: "02:00 PM", amount: "-$200", note: "Used for urgent travel booking", isIncome: false },
]

const members = [
  { name: "Andrew Forbist", img: "" },
  { name: "Sarah Connors", img: "" },
  { name: "Mike Johnson", img: "" },
]

function StatusColor(status: string) {
  if (status === "Completed") return "text-primary"
  if (status === "Behind Schedule") return "text-destructive"
  return "text-muted-foreground"
}

export default function SavingPlansPage() {
  return (
    <>
      <TopHeader title="Saving Plans" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Savings", value: "$47,600", change: "4.20 %" },
            { label: "Total Target", value: "$83,000", change: "2.40 %" },
            { label: "Total Plans", value: "27", change: "8.20 %" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 lg:p-5">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xl font-bold text-card-foreground lg:text-2xl">{stat.value}</p>
                  <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                    <TrendingUp className="h-3 w-3" /> {stat.change}
                  </span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 12h8M8 8h8M8 16h4" /></svg>
              </div>
            </div>
          ))}
        </div>

        {/* Main content: 3-column grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left column - Saving Plans list */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-card-foreground">Saving Plans</h2>
                <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {plans.map((plan) => (
                  <div key={plan.name} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                          <plan.icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold text-card-foreground">{plan.name}</p>
                      </div>
                      <p className="text-sm font-semibold text-card-foreground">{plan.percent}%</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>${plan.saved.toLocaleString()} / ${plan.target.toLocaleString()}</span>
                      <span className={StatusColor(plan.status)}>{plan.status}</span>
                    </div>
                    {/* Multi-segment progress bar */}
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="flex h-full">
                        <div
                          className="h-full bg-[hsl(145,50%,25%)] transition-all"
                          style={{ width: `${Math.min(plan.percent, 60)}%` }}
                        />
                        {plan.percent > 60 && (
                          <div
                            className="h-full bg-[hsl(145,30%,65%)] transition-all"
                            style={{ width: `${plan.percent - 60}%` }}
                          />
                        )}
                        {plan.percent <= 60 && plan.percent > 0 && (
                          <div
                            className="h-full bg-[hsl(145,30%,70%)] transition-all"
                            style={{ width: `${Math.max(0, plan.percent * 0.4)}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary text-sm font-medium text-foreground hover:bg-accent">
                <Plus className="h-4 w-4" /> Add Plan
              </button>
            </div>
          </div>

          {/* Middle column - Plan Detail */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Palmtree className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-card-foreground">Vacation Fund</h2>
              </div>

              <div className="mt-5">
                <p className="text-center text-2xl font-bold text-card-foreground">
                  $3,000<span className="text-base font-normal text-muted-foreground">/$5,000</span>
                </p>
              </div>

              {/* Two-tone progress bar */}
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div className="flex h-full">
                  <div className="h-full bg-[hsl(145,50%,25%)]" style={{ width: "35%" }} />
                  <div className="h-full bg-[hsl(145,30%,65%)]" style={{ width: "25%" }} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-semibold text-card-foreground">60%</span>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-start gap-4">
                  <p className="text-sm text-muted-foreground">Member</p>
                  <div className="flex flex-col gap-2.5">
                    {members.map((m) => (
                      <div key={m.name} className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={m.img} />
                          <AvatarFallback className="bg-secondary text-xs text-foreground">{m.name.split(" ").map((w) => w[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-card-foreground">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="text-sm font-medium text-card-foreground">31 December, 2028</p>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-sm font-medium text-card-foreground">95 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Saving Tips + Balance Chart */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            {/* Saving Tips */}
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              <h3 className="text-base font-semibold text-card-foreground">Saving Tips</h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {[
                  "Mission: Save $21 per day for 95 days to meet goal.",
                  "Cut unnecessary subscriptions, save more.",
                  "Skip eating out twice a week.",
                  "Automate savings from paycheck.",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-card-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Balance Chart */}
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Balance</h3>
                <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
                  <option>This Year</option>
                  <option>Last Year</option>
                </select>
              </div>
              <div className="mt-3 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(120,10%,89%)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(150,5%,45%)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(150,5%,45%)" }} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(120,10%,89%)", backgroundColor: "hsl(145,50%,25%)", color: "#fff", fontSize: 12 }}
                      labelStyle={{ fontWeight: 600, color: "#fff" }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                      labelFormatter={(label) => `${label} 2028`}
                    />
                    <Line type="monotone" dataKey="balance" stroke="hsl(145,50%,25%)" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 5, fill: "hsl(145,50%,25%)", stroke: "#fff", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-card-foreground">Transactions</h2>
            <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Transaction Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date & Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Brief Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tx.isIncome ? "bg-accent text-primary" : "bg-destructive/10 text-destructive"}`}>
                          {tx.isIncome ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14M5 12l7-7 7 7" /></svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 19V5M5 12l7 7 7-7" /></svg>
                          )}
                        </div>
                        <span className="text-card-foreground">
                          {tx.type} - <span className="text-muted-foreground">{tx.person}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{tx.date} - {tx.time}</td>
                    <td className={`px-4 py-3.5 font-medium ${tx.isIncome ? "text-primary" : "text-destructive"}`}>{tx.amount}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{tx.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
