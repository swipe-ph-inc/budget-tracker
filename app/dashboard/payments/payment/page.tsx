"use client"

import { TopHeader } from "@/components/top-header"
import { Search, SlidersHorizontal, ArrowLeftRight, CreditCard, Plus, ChevronDown, MoreHorizontal, Copy, Globe, Tv, HeartPulse, ShoppingCart, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"

const paymentTabs = [
  { label: "Transfer", icon: ArrowLeftRight, href: "/dashboard/payments/transfer", active: false },
  { label: "Payment", icon: CreditCard, href: "/dashboard/payments/payment", active: true },
  { label: "Virtual Acc", icon: CreditCard, href: "#", active: false },
  { label: "Top Up", icon: Plus, href: "#", active: false },
]

const recentPayments = [
  { name: "Geico Insurance", account: "128477582", amount: "$450", status: "Successful", icon: Shield },
  { name: "DISH Network", account: "88002134", amount: "$890", status: "Successful", icon: Tv },
  { name: "Coursera", account: "229938095", amount: "$120", status: "Successful", icon: Globe },
]

const providerCategories = [
  {
    name: "Healthcare",
    icon: HeartPulse,
    providers: ["CVS Pharmacy", "UnitedHealth Group", "Cigna Healthcare"],
  },
  {
    name: "E-commerce",
    icon: ShoppingCart,
    providers: ["Amazon", "eBay", "Shopify Stores"],
  },
  {
    name: "Internet & Cable TV",
    icon: Tv,
    providers: [
      "Comcast Xfinity",
      "AT&T Internet and Cable",
      "Spectrum Cable Services",
      "Verizon Fios",
      "Cox Communications",
      "DirecTV",
      "DISH Network",
      "Frontier Communications",
    ],
  },
  {
    name: "Insurance",
    icon: Shield,
    providers: ["Geico", "Progressive", "State Farm"],
  },
]

export default function PaymentPage() {
  const [openCategory, setOpenCategory] = useState<string | null>("Internet & Cable TV")

  return (
    <>
      <TopHeader title="Payment" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Tabs + Providers */}
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
                  placeholder="Search providers"
                  className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Provider Categories */}
            <div className="flex flex-col gap-2">
              {providerCategories.map((cat) => {
                const isOpen = openCategory === cat.name
                return (
                  <div key={cat.name}>
                    <button
                      onClick={() => setOpenCategory(isOpen ? null : cat.name)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                        <cat.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-card-foreground">{cat.name}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-border pl-4">
                        {cat.providers.map((p) => (
                          <button
                            key={p}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-secondary">
                              <cat.icon className="h-3 w-3 text-primary" />
                            </div>
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column - Recent Payments + Payment Form */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Recent Payments */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Recent Payments</h3>
                <button className="text-sm font-medium text-primary hover:text-primary/80">Show More</button>
              </div>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {recentPayments.map((p) => (
                  <div key={p.account} className="flex min-w-[200px] items-center gap-3 rounded-xl border border-border p-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
                        <p.icon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.account}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-card-foreground">{p.amount}</p>
                      <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Make a Payment Form */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Make a Payment</h3>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
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
                      <p className="text-sm font-medium text-card-foreground">Freedom Unlimited Mastercard</p>
                      <p className="text-lg font-bold text-card-foreground">$539,000</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground truncate">5582 5574 8376 5487</p>
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

              {/* Service Provider */}
              <div className="mt-5">
                <h4 className="text-sm font-medium text-card-foreground">Service Provider</h4>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Internet & Cable TV</option>
                    <option>Healthcare</option>
                    <option>E-commerce</option>
                    <option>Insurance</option>
                  </select>
                  <select className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Comcast Xfinity</option>
                    <option>AT&T Internet and Cable</option>
                    <option>Spectrum Cable Services</option>
                    <option>Verizon Fios</option>
                    <option>DISH Network</option>
                  </select>
                </div>
              </div>

              {/* Virtual Account */}
              <div className="mt-5">
                <h4 className="text-sm font-medium text-card-foreground">Virtual Account</h4>
                <input
                  type="text"
                  defaultValue="9876543210"
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Amount */}
              <div className="mt-5">
                <h4 className="text-sm font-medium text-card-foreground">Amount</h4>
                <input
                  type="text"
                  defaultValue="$150.00"
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button className="rounded-lg border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  Cancel
                </button>
                <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
