"use client"

import { TopHeader } from "@/components/top-header"
import { Search, SlidersHorizontal, Plus, MoreHorizontal, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home, Dumbbell, Tv, Zap, CreditCard, Shield, BookOpen, Smartphone, Globe, Heart, Plane, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

const invoices = [
  { name: "Monthly Rent Payment", icon: Home, id: "INV-281005-001", amount: "$1,200", date: "October 01, 2028", time: "08:30 AM", status: "Pending" },
  { name: "Gym Membership Renewal", icon: Dumbbell, id: "INV-281005-002", amount: "$600", date: "October 05, 2028", time: "09:45 AM", status: "Overdue" },
  { name: "Cable and Internet Service", icon: Tv, id: "INV-281005-003", amount: "$150", date: "October 10, 2028", time: "07:25 AM", status: "Paid" },
  { name: "Electric Bill", icon: Zap, id: "INV-281005-004", amount: "$90", date: "October 15, 2028", time: "01:15 PM", status: "Pending" },
  { name: "Credit Card Bill", icon: CreditCard, id: "INV-281005-005", amount: "$450", date: "October 20, 2028", time: "09:00 AM", status: "Paid" },
  { name: "Car Insurance Premium", icon: Shield, id: "INV-281005-006", amount: "$220", date: "October 25, 2028", time: "10:30 AM", status: "Unpaid" },
  { name: "Online Learning Subscription", icon: BookOpen, id: "INV-281005-007", amount: "$300", date: "November 01, 2028", time: "12:10 PM", status: "Overdue" },
  { name: "Mobile Phone Service", icon: Smartphone, id: "INV-281005-008", amount: "$85", date: "November 05, 2028", time: "02:40 PM", status: "Unpaid" },
  { name: "Annual Software Subscription", icon: Globe, id: "INV-281005-009", amount: "$120", date: "November 10, 2028", time: "08:30 AM", status: "Paid" },
  { name: "Health Insurance Premium", icon: Heart, id: "INV-281005-010", amount: "$320", date: "November 15, 2028", time: "11:30 AM", status: "Unpaid" },
  { name: "Holiday Travel Booking", icon: Plane, id: "INV-281005-011", amount: "$2,500", date: "November 20, 2028", time: "05:30 PM", status: "Pending" },
]

const statusStyles: Record<string, string> = {
  Pending: "bg-warning/10 text-warning hover:bg-warning/10",
  Overdue: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  Paid: "bg-primary/10 text-primary hover:bg-primary/10",
  Unpaid: "bg-foreground/10 text-foreground hover:bg-foreground/10",
}

const tabs = ["All", "Paid", "Unpaid", "Overdue"]

export default function InvoicePage() {
  const [activeTab, setActiveTab] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredInvoices = activeTab === "All" ? invoices : invoices.filter((inv) => inv.status === activeTab)

  return (
    <>
      <TopHeader title="Invoices" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Invoices */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent">
              <CreditCard className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-xl font-bold text-card-foreground lg:text-2xl">$138,500</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <TrendingUp className="h-3 w-3" /> 8.20 %
              </span>
              <p className="mt-1 text-xs text-muted-foreground">vs last month</p>
              <p className="text-xs text-muted-foreground">$128,000</p>
            </div>
          </div>
          {/* Paid Invoices */}
          <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-accent/50 p-4 lg:p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Paid Invoices</p>
              <p className="text-xl font-bold text-card-foreground lg:text-2xl">$97,400</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <TrendingUp className="h-3 w-3" /> 2.74 %
              </span>
              <p className="mt-1 text-xs text-muted-foreground">vs last month</p>
              <p className="text-xs text-muted-foreground">$94,800</p>
            </div>
          </div>
          {/* Unpaid Invoices */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
              <p className="text-xl font-bold text-card-foreground lg:text-2xl">$41,100</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                <TrendingDown className="h-3 w-3" /> 13.92 %
              </span>
              <p className="mt-1 text-xs text-muted-foreground">vs last month</p>
              <p className="text-xs text-muted-foreground">$47,750</p>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-lg border border-border bg-card p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search invoice" className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-48" />
            </div>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground hover:bg-muted">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Invoice</span>
            </button>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="mt-4 rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Invoice Name <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Invoice ID <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Total Amount <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      {"Date & Time"} <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                      Status <ChevronDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, i) => {
                  const Icon = inv.icon
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
                          <span className="font-medium text-card-foreground">{inv.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{inv.id}</td>
                      <td className="px-4 py-3.5 font-medium text-card-foreground">{inv.amount}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {inv.date} - {inv.time}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[inv.status]}`}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <button className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
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
                <option>11</option>
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
