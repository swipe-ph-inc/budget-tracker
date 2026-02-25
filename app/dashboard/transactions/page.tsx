"use client"

import { TopHeader } from "@/components/top-header"
import { Download, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Calendar, TrendingUp, ShoppingCart, Zap, Briefcase, ShoppingBag, Dumbbell, Home, Shield, Smartphone, Tv, Clapperboard, Plane } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

const transactions = [
  { name: "Bonus Payment", category: "Income", icon: TrendingUp, account: "Platinum Plus Visa", accountType: "visa", txId: "4567890135", date: "2024-09-25", time: "11:00 AM", amount: "+$500.00", note: "Annual performance bonus", status: "Completed" },
  { name: "Stock Dividends", category: "Investments", icon: TrendingUp, account: "Freedom Unlimited Mastercard", accountType: "mastercard", txId: "4567890136", date: "2024-09-24", time: "09:00 AM", amount: "+$300.00", note: "Quarterly stock dividend", status: "Completed" },
  { name: "Comcast Bill Payment", category: "Utilities", icon: Tv, account: "Platinum Plus Visa", accountType: "visa", txId: "4567890123", date: "2024-09-24", time: "10:30 AM", amount: "-$150.00", note: "Monthly internet and TV bill", status: "Completed" },
  { name: "Freelance Project", category: "Income", icon: Briefcase, account: "Platinum Plus Visa", accountType: "visa", txId: "4567890137", date: "2024-09-23", time: "01:30 PM", amount: "+$1,200.00", note: "Payment for freelance design work", status: "Completed" },
  { name: "Amazon Purchase", category: "Food & Dining", icon: ShoppingCart, account: "Freedom Unlimited Mastercard", accountType: "mastercard", txId: "4567890124", date: "2024-09-23", time: "03:45 PM", amount: "-$80.95", note: "Purchased kitchen appliances", status: "Completed" },
  { name: "Gym Membership", category: "Healthcare", icon: Dumbbell, account: "Platinum Plus Visa", accountType: "visa", txId: "567890123", date: "2024-09-22", time: "07:00 AM", amount: "-$45.00", note: "Monthly gym fee for health", status: "Pending" },
  { name: "Rental Income", category: "Real Estate", icon: Home, account: "Freedom Unlimited Mastercard", accountType: "mastercard", txId: "4567890138", date: "2024-09-22", time: "08:00 AM", amount: "+$2,500.00", note: "Monthly rent from property", status: "Completed" },
  { name: "State Farm Insurance", category: "Investments", icon: Shield, account: "Freedom Unlimited Mastercard", accountType: "mastercard", txId: "4567890126", date: "2024-09-21", time: "02:15 PM", amount: "-$125.00", note: "Car insurance premium investment", status: "Completed" },
  { name: "Verizon Bill", category: "Utilities", icon: Smartphone, account: "Platinum Plus Visa", accountType: "visa", txId: "4567890127", date: "2024-09-20", time: "11:00 AM", amount: "-$60.00", note: "Mobile phone bill", status: "Pending" },
  { name: "Electricity Bill", category: "Utilities", icon: Zap, account: "Freedom Unlimited Mastercard", accountType: "mastercard", txId: "4567890128", date: "2024-09-19", time: "08:20 AM", amount: "-$70.00", note: "Home electricity bill", status: "Completed" },
  { name: "Netflix Subscription", category: "Entertainment", icon: Clapperboard, account: "Platinum Plus Visa", accountType: "visa", txId: "4567890129", date: "2024-09-18", time: "05:45 PM", amount: "-$17.99", note: "Monthly entertainment subscription", status: "Completed" },
  { name: "Flight Booking", category: "Investments", icon: Plane, account: "Elite Traveler Mastercard", accountType: "mastercard", txId: "4567890130", date: "2024-09-17", time: "09:30 AM", amount: "-$350.00", note: "Business trip expense", status: "Pending" },
]

export default function TransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <>
      <TopHeader title="Transactions" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="rounded-xl border border-border bg-card">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-4">
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search transaction" className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-52" />
              </div>
              <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none">
                <option>All Category</option>
                <option>Income</option>
                <option>Investments</option>
                <option>Utilities</option>
                <option>Food & Dining</option>
                <option>Healthcare</option>
                <option>Entertainment</option>
              </select>
              <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none">
                <option>All Account</option>
                <option>Platinum Plus Visa</option>
                <option>Freedom Unlimited Mastercard</option>
                <option>Elite Traveler Mastercard</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground hover:bg-muted">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">1-30 September 2028</span>
                <span className="sm:hidden">Date</span>
              </button>
              <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Transaction Name <ChevronUp className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Account <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Transaction ID <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      {"Date & Time"} <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Amount <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Note <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Status <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => {
                  const Icon = tx.icon
                  return (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                            <Icon className="h-4 w-4 text-accent-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{tx.name}</p>
                            <p className="text-xs text-muted-foreground">{tx.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {tx.accountType === "visa" ? (
                            <span className="rounded bg-[hsl(220,60%,25%)] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[hsl(0,0%,100%)]">VISA</span>
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(150,30%,30%)]">
                              <span className="h-2 w-2 rounded-full bg-[hsl(145,50%,50%)]" />
                            </span>
                          )}
                          <span className="text-card-foreground">{tx.account}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{tx.txId}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-card-foreground">{tx.date}</p>
                        <p className="text-xs text-muted-foreground">{tx.time}</p>
                      </td>
                      <td className={`px-4 py-3.5 font-medium ${tx.amount.startsWith("+") ? "text-primary" : "text-destructive"}`}>
                        {tx.amount}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground max-w-[200px] truncate">{tx.note}</td>
                      <td className="px-4 py-3.5">
                        <Badge className={`rounded-full px-3 py-1 text-xs font-medium ${
                          tx.status === "Completed"
                            ? "bg-primary/10 text-primary hover:bg-primary/10"
                            : "bg-warning/10 text-warning hover:bg-warning/10"
                        }`}>
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row lg:px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing</span>
              <select className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none">
                <option>12</option>
                <option>24</option>
                <option>48</option>
              </select>
              <span>out of 512</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-muted disabled:opacity-50" disabled>
                <ChevronLeft className="h-4 w-4" />
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-muted"
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-1 text-muted-foreground">...</span>
              <button
                onClick={() => setCurrentPage(16)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 16
                    ? "bg-primary text-primary-foreground"
                    : "border border-input text-foreground hover:bg-muted"
                }`}
              >
                16
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-muted">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
