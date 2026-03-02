"use client"

import { useState, useCallback, useEffect } from "react"
import { TopHeader } from "@/components/top-header"
import { Plus, ArrowUpDown, DollarSign, MoreVertical, BookOpen, Tv, Briefcase, ShoppingCart, Dumbbell, Zap, ChevronDown } from "lucide-react"
import { AddCreditCardDialog } from "@/components/credit-card/add-credit-card-dialog"
import { getCreditCards } from "@/app/actions/credit-cards"
import type { Tables } from "@/lib/supabase/database.types"
import { Badge } from "@/components/ui/badge"

type CreditCardRow = Tables<"credit_card">
type CreditCardWithExtras = CreditCardRow & { card_type?: string | null; background_img_url?: string | null }

const CARD_TYPE_LOGOS: Record<string, string> = {
  visa: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/Visa_Inc.-Logo.wine.svg",
  mastercard: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/ma_symbol.svg",
  jcb: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/jcb_logo_color.svg",
  amex: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/Amex_logo_color.svg",
}

const DARK_BACKGROUND_URLS = [
  "photo-1550684376-efcbd6e3f031", // Black
  "premium_photo-1755192700987-cae26287e93c", // Titanium
  "photo-1664044020180-b75bfddf9776", // Diamond
  "kGkSg1v", // Blue (imgur)
  "Zi6v09P", // Orange (imgur)
  "photo-1714548870002", // Platinum
  "photo-1513346940221", // Gold
  "photo-1635151227785", // Silver
]

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

const cashflowData = [
  { month: "Mar", income: 6000, expense: -3000 },
  { month: "Apr", income: 7000, expense: -4500 },
  { month: "May", income: 8000, expense: -6000 },
  { month: "Jun", income: 5000, expense: -3000 },
  { month: "Jul", income: 9500, expense: -5000 },
  { month: "Aug", income: 7500, expense: -4000 },
]

const cardTransactions = [
  { name: "Book Royalties", category: "Income", icon: BookOpen, txId: "4567890139", date: "2028-09-25", time: "11:00 AM", amount: "+$400.00", isIncome: true, note: "Royalties from published book", status: "Completed" },
  { name: "Comcast Bill Payment", category: "Utilities", icon: Tv, txId: "4567890123", date: "2028-09-24", time: "10:30 AM", amount: "$150.00", isIncome: false, note: "Monthly internet and TV bill", status: "Completed" },
  { name: "Consulting Fee", category: "Services", icon: Briefcase, txId: "4567890140", date: "2028-09-24", time: "02:00 PM", amount: "+$1,500.00", isIncome: true, note: "Payment for consulting services", status: "Completed" },
  { name: "Amazon Purchase", category: "Food & Dining", icon: ShoppingCart, txId: "4567890124", date: "2028-09-23", time: "03:45 PM", amount: "$80.95", isIncome: false, note: "Purchased kitchen appliances", status: "Completed" },
  { name: "Gym Membership", category: "Healthcare", icon: Dumbbell, txId: "4567890125", date: "2028-09-22", time: "07:00 AM", amount: "$45.00", isIncome: false, note: "Monthly gym fee for health", status: "Completed" },
  { name: "Electricity Bill", category: "Utilities", icon: Zap, txId: "4567890128", date: "2028-09-19", time: "08:20 AM", amount: "$70.00", isIncome: false, note: "Home electricity bill", status: "Pending" },
]

export default function CardsPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [cards, setCards] = useState<CreditCardWithExtras[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const fetchCards = useCallback(async () => {
    setCardsLoading(true)
    try {
      const data = await getCreditCards()
      setCards((data ?? []) as CreditCardWithExtras[])
      setSelectedCardId((prev) => {
        const list = data ?? []
        if (list.length === 0) return null
        const stillExists = prev && list.some((c) => c.id === prev)
        return stillExists ? prev : list[0]?.id ?? null
      })
    } catch {
      setCards([])
    } finally {
      setCardsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : cards[0] ?? null

  return (
    <>
      <TopHeader title="Credit Cards" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Top Section: 3 columns */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_1fr] xl:grid-cols-[320px_1fr_1fr] lg:gap-5">

          {/* ===== LEFT COLUMN: My Cards ===== */}
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-card-foreground">My Cards</h2>
              <button
                type="button"
                onClick={() => setAddDialogOpen(true)}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {cardsLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  Loading cards...
                </div>
              ) : cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                  <p>No credit cards yet.</p>
                  <button
                    type="button"
                    onClick={() => setAddDialogOpen(true)}
                    className="text-primary font-medium hover:underline"
                  >
                    Add your first card
                  </button>
                </div>
              ) : (
                cards.map((card) => {
                  const cardType = (card as CreditCardWithExtras).card_type
                  const bgUrl = (card as CreditCardWithExtras).background_img_url
                  const hasBg = Boolean(bgUrl)
                  const cardLogoUrl = cardType ? CARD_TYPE_LOGOS[cardType] : null
                  const availableCredit = card.credit_limit - card.balance_owed

                  const needsLightText =
                    !hasBg || DARK_BACKGROUND_URLS.some((id) => bgUrl?.includes(id))
                  const textMuted = needsLightText ? "text-white/70" : "text-card-foreground/80"
                  const textPrimary = needsLightText ? "text-white" : "text-card-foreground"

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCardId(card.id)}
                      className={`relative w-full overflow-hidden rounded-2xl p-5 text-left transition-colors hover:ring-2 hover:ring-primary/50 ${
                        selectedCardId === card.id ? "ring-2 ring-primary" : ""
                      } border border-border ${hasBg ? "" : "bg-gradient-to-br from-[hsl(220,70%,35%)] to-[hsl(220,70%,22%)]"} ${textPrimary}`}
                      style={hasBg ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                    >
                      {/* Card top row */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-xs ${textMuted}`}>
                            {card.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {cardLogoUrl ? (
                            <img src={cardLogoUrl} alt="" className="h-6 w-8 object-contain" />
                          ) : (
                            <div className="flex">
                              <span className={`h-6 w-6 rounded-full ${needsLightText ? "bg-white/50" : "bg-primary/50"}`} />
                              <span className={`-ml-3 h-6 w-6 rounded-full ${needsLightText ? "bg-white/30" : "bg-primary/30"}`} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Balance row */}
                      <div className="mt-4 flex items-end justify-between">
                        <p className={`text-2xl font-bold ${textPrimary}`}>
                          {formatCurrency(card.balance_owed, card.currency)}
                        </p>
                        <span className={`text-sm font-medium ${textMuted}`}>
                          Balance owed
                        </span>
                      </div>

                      {/* Card details row */}
                      <div className={`mt-4 flex items-center justify-between text-xs ${textMuted}`}>
                        <div>
                          <p>Card Number</p>
                          <p className={`mt-0.5 font-medium ${textPrimary}`}>
                            {card.masked_identifier}
                          </p>
                        </div>
                        <div className="text-right">
                          <p>Available</p>
                          <p className={`mt-0.5 font-medium ${textPrimary}`}>
                            {formatCurrency(availableCredit, card.currency)}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ===== MIDDLE COLUMN: Quick Actions + Card Details + Spending Limits ===== */}
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Plus, label: "Top Up" },
                  { icon: ArrowUpDown, label: "Transfer" },
                  { icon: DollarSign, label: "Payment" },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-accent lg:p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
                      <action.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <span className="text-xs font-medium text-card-foreground">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Details */}
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              <p className="text-xs text-muted-foreground">Card Number</p>
              <p className="mt-1 text-xl font-bold tracking-widest text-card-foreground lg:text-2xl">
                {selectedCard ? selectedCard.masked_identifier : "—"}
              </p>
              <div className="mt-5 flex items-center gap-8">
                <div>
                  <p className="text-xs text-muted-foreground">Balance Owed</p>
                  <p className="mt-1 text-sm font-bold text-card-foreground">
                    {selectedCard ? formatCurrency(selectedCard.balance_owed, selectedCard.currency) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Available Credit</p>
                  <p className="mt-1 text-sm font-bold text-card-foreground">
                    {selectedCard ? formatCurrency(selectedCard.credit_limit - selectedCard.balance_owed, selectedCard.currency) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className="mt-1 rounded-md bg-primary/15 px-3 py-0.5 text-xs font-semibold text-primary hover:bg-primary/15">
                    {selectedCard?.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Spending Limits */}
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Spending Limits</h3>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              {/* Multi-segment progress bar */}
              <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-secondary">
                {selectedCard && selectedCard.credit_limit > 0 && (
                  <div
                    className="h-full rounded-l-full bg-[hsl(220,55%,42%)]"
                    style={{ width: `${Math.min(100, (selectedCard.balance_owed / selectedCard.credit_limit) * 100)}%` }}
                  />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold text-card-foreground">
                    {selectedCard ? formatCurrency(selectedCard.balance_owed, selectedCard.currency) : "—"}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    {selectedCard ? `owed of ${formatCurrency(selectedCard.credit_limit, selectedCard.currency)}` : "—"}
                  </span>
                </div>
                <span className="font-bold text-card-foreground">
                  {selectedCard && selectedCard.credit_limit > 0
                    ? `${Math.round((selectedCard.balance_owed / selectedCard.credit_limit) * 100)}%`
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN: Cashflow Chart ===== */}
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-card-foreground">Cashflow</h3>
              <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
                <option>Last 6 Months</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(145,50%,25%)]" />
                <span className="text-muted-foreground">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(145,30%,75%)]" />
                <span className="text-muted-foreground">Expense</span>
              </div>
            </div>
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} barGap={2}>
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
                    tick={{ fontSize: 11, fill: "hsl(150,5%,45%)" }}
                    domain={[-5000, 10000]}
                    tickFormatter={(v: number) => {
                      if (v === 0) return "0"
                      return `${v < 0 ? "-" : ""}${Math.abs(v / 1000)}K`
                    }}
                    ticks={[-5000, 0, 5000, 10000]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0,0%,100%)",
                      border: "1px solid hsl(120,10%,89%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value: number, name: string) => [
                      `$${Math.abs(value).toLocaleString()}`,
                      name === "income" ? "Income" : "Expense",
                    ]}
                    labelFormatter={(label) => `${label} 2028`}
                  />
                  <Bar dataKey="income" fill="hsl(145,50%,25%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(145,30%,75%)" radius={[0, 0, 3, 3]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ===== BOTTOM: Transactions Table ===== */}
        <div className="mt-5 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-6">
            <h3 className="text-base font-semibold text-card-foreground">Transactions</h3>
            <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-10 px-4 py-3 lg:px-5">
                    <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" />
                  </th>
                  {["Transaction Name", "Transaction ID", "Date & Time", "Amount", "Note", "Status"].map((col) => (
                    <th key={col} className="px-4 py-3 text-left lg:px-5">
                      <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                        {col} <ChevronDown className="h-3 w-3" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cardTransactions.map((tx, i) => {
                  const Icon = tx.icon
                  return (
                    <tr key={i} className="border-b border-border last:border-0 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3.5 lg:px-5">
                        <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" />
                      </td>
                      <td className="px-4 py-3.5 lg:px-5">
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
                      <td className="px-4 py-3.5 text-muted-foreground lg:px-5">{tx.txId}</td>
                      <td className="px-4 py-3.5 lg:px-5">
                        <p className="text-card-foreground">{tx.date}</p>
                        <p className="text-xs text-muted-foreground">{tx.time}</p>
                      </td>
                      <td className={`px-4 py-3.5 font-medium lg:px-5 ${tx.isIncome ? "text-primary" : "text-destructive"}`}>
                        {tx.amount}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3.5 text-muted-foreground lg:px-5">{tx.note}</td>
                      <td className="px-4 py-3.5 lg:px-5">
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
        </div>
      </div>

      <AddCreditCardDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCompleted={fetchCards}
      />
    </>
  )
}
