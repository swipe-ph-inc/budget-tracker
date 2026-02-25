"use client"

import { TopHeader } from "@/components/top-header"
import { Search, SlidersHorizontal, ArrowLeftRight, CreditCard, Plus, MoreHorizontal, Copy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

const paymentTabs = [
  { label: "Transfer", icon: ArrowLeftRight, href: "/dashboard/payments/transfer", active: true },
  { label: "Payment", icon: CreditCard, href: "/dashboard/payments/payment", active: false },
  { label: "Virtual Acc", icon: CreditCard, href: "#", active: false },
  { label: "Top Up", icon: Plus, href: "#", active: false },
]

const recentTransfers = [
  { name: "Bob Johnson", account: "120987654324", amount: "$560", status: "Successful", avatar: "BJ" },
  { name: "Abe Reeves", account: "120987654322", amount: "$1,000", status: "Pending", avatar: "AR" },
  { name: "Miles Sanders", account: "120987654326", amount: "$320", status: "Successful", avatar: "MS" },
]

const recipients = [
  { name: "Abe Reeves", account: "120987654322", avatar: "AR" },
  { name: "Audrey Murphy", account: "120987654328", avatar: "AM" },
  { name: "Bob Johnson", account: "120987654324", avatar: "BJ" },
  { name: "Cho Wan Kim", account: "120987654327", avatar: "CK" },
  { name: "Cyntia Watson", account: "120987654323", avatar: "CW" },
  { name: "Edna Connors", account: "120987654321", avatar: "EC" },
  { name: "Jade Brown", account: "120987654325", avatar: "JB" },
  { name: "Miles Sanders", account: "120987654326", avatar: "MS" },
]

export default function TransferPage() {
  const [transferType, setTransferType] = useState<"local" | "international">("local")

  return (
    <>
      <TopHeader title="Transfer" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Tabs + Recipients */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-5">
            {/* Payment Type Tabs */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-4 gap-3">
                {paymentTabs.map((tab) => (
                  <a
                    key={tab.label}
                    href={tab.href}
                    className={`flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors ${
                      tab.active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <tab.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{tab.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search account"
                  className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Recipients List */}
            <div className="flex flex-col gap-2">
              {recipients.map((r) => (
                <button
                  key={r.account}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${r.name}&backgroundColor=e8f5e9`} alt={r.name} />
                    <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">{r.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.account}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Add New Recipient */}
            <button className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add New Recipient
            </button>
          </div>

          {/* Right Column - Recent Transfers + Transfer Form */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Recent Transfers */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Recent Transfer</h3>
                <button className="text-sm font-medium text-primary hover:text-primary/80">Show More</button>
              </div>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {recentTransfers.map((t) => (
                  <div key={t.account} className="flex min-w-[200px] items-center gap-3 rounded-xl border border-border p-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${t.name}&backgroundColor=e8f5e9`} alt={t.name} />
                      <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">{t.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.account}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-card-foreground">{t.amount}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          t.status === "Successful"
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-warning/30 bg-warning/10 text-warning"
                        }`}
                      >
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer Form */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Transfer Form</h3>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Local / International Toggle */}
              <div className="mt-4 flex rounded-xl bg-secondary p-1">
                <button
                  onClick={() => setTransferType("local")}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                    transferType === "local"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Local
                </button>
                <button
                  onClick={() => setTransferType("international")}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                    transferType === "international"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  International
                </button>
              </div>

              {/* Payment Account */}
              <div className="mt-5">
                <h4 className="text-sm font-medium text-card-foreground">Payment Account</h4>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mastercard */}
                  <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-card p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(145,50%,25%)] to-[hsl(145,60%,18%)]">
                      <CreditCard className="h-6 w-6 text-[hsl(0,0%,100%)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">Elite Traveler Mastercard</p>
                      <p className="text-lg font-bold text-card-foreground">$643,000</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground truncate">5589 9955 7766 3321</p>
                        <button className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                  {/* Visa */}
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <div className="flex h-12 w-8 shrink-0 items-center justify-center">
                      <span className="text-xs font-bold tracking-wider text-primary">VISA</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">Platinum Plus Visa</p>
                      <p className="text-lg font-bold text-card-foreground">$415,000</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground truncate">4532 8723 0045 9967</p>
                        <button className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Select Recipient */}
              <div className="mt-5">
                <h4 className="text-sm font-medium text-card-foreground">Select Recipient</h4>
                <div className="mt-2">
                  <select className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Jade Brown - 120987654325</option>
                    <option>Bob Johnson - 120987654324</option>
                    <option>Abe Reeves - 120987654322</option>
                    <option>Miles Sanders - 120987654326</option>
                  </select>
                </div>
              </div>

              {/* Amount + Transfer Method */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-card-foreground">Amount</h4>
                  <input
                    type="text"
                    defaultValue="$250.00"
                    className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-card-foreground">Transfer Method</h4>
                  <select className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Instant Transfer</option>
                    <option>Standard Transfer</option>
                    <option>Wire Transfer</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div className="mt-5">
                <h4 className="text-sm font-medium text-card-foreground">Note</h4>
                <input
                  type="text"
                  defaultValue="Payment for shared vacation expenses"
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button className="rounded-lg border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  Cancel
                </button>
                <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  Send Money
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
