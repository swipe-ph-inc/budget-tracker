"use client"

import { useCallback, useEffect, useState } from "react"
import { TopHeader } from "@/components/top-header"
import { Plus, ArrowUpDown, DollarSign, BookOpen, Tv, Briefcase, ShoppingCart, Dumbbell, Zap, ChevronDown, CreditCard, Wifi } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

type CardVariant = "light" | "dark"

type CardItem = {
  name: string
  displayName?: string[]
  type: string
  badge: string | null
  balance: string
  number: string
  fullNumber?: string
  exp: string
  cvv: string
  variant: CardVariant
  holderName?: string
  gradient: string
}

const cards: CardItem[] = [
  {
    name: "Platinum Plus Visa",
    type: "Debit",
    badge: "VISA",
    balance: "$415,000",
    number: "**** **** **** 9967",
    fullNumber: "5582 5574 8376 9967",
    exp: "12/29",
    cvv: "313",
    variant: "light",
    holderName: "Amanda Oliveira",
    gradient: "from-slate-800 via-indigo-900 to-violet-900",
  },
  {
    name: "Freedom Unlimited\nMastercard",
    displayName: ["Freedom Unlimited", "Mastercard"],
    type: "Credit",
    badge: null,
    balance: "$532,000",
    number: "**** **** **** 5487",
    fullNumber: "4562 1122 4595 7852",
    exp: "05/25",
    cvv: "411",
    variant: "dark",
    holderName: "Jonson",
    gradient: "from-blue-900 via-indigo-900 to-purple-900",
  },
  {
    name: "Elite Traveler\nMastercard",
    displayName: ["Elite Traveler", "Mastercard"],
    type: "Credit",
    badge: null,
    balance: "$430,000",
    number: "**** **** **** 3321",
    fullNumber: "5582 5574 8376 3321",
    exp: "08/29",
    cvv: "672",
    variant: "dark",
    holderName: "Amanda Oliveira",
    gradient: "from-rose-900 via-red-800 to-amber-900",
  },
]

const cardTransactions = [
  { name: "Book Royalties", category: "Income", icon: BookOpen, txId: "4567890139", date: "2028-09-25", time: "11:00 AM", amount: "+$400.00", isIncome: true, note: "Royalties from published book", status: "Completed" },
  { name: "Comcast Bill Payment", category: "Utilities", icon: Tv, txId: "4567890123", date: "2028-09-24", time: "10:30 AM", amount: "$150.00", isIncome: false, note: "Monthly internet and TV bill", status: "Completed" },
  { name: "Consulting Fee", category: "Services", icon: Briefcase, txId: "4567890140", date: "2028-09-24", time: "02:00 PM", amount: "+$1,500.00", isIncome: true, note: "Payment for consulting services", status: "Completed" },
  { name: "Amazon Purchase", category: "Food & Dining", icon: ShoppingCart, txId: "4567890124", date: "2028-09-23", time: "03:45 PM", amount: "$80.95", isIncome: false, note: "Purchased kitchen appliances", status: "Completed" },
  { name: "Gym Membership", category: "Healthcare", icon: Dumbbell, txId: "4567890125", date: "2028-09-22", time: "07:00 AM", amount: "$45.00", isIncome: false, note: "Monthly gym fee for health", status: "Completed" },
  { name: "Electricity Bill", category: "Utilities", icon: Zap, txId: "4567890128", date: "2028-09-19", time: "08:20 AM", amount: "$70.00", isIncome: false, note: "Home electricity bill", status: "Pending" },
]

function CarouselCard({ card, isCenter }: { card: CardItem; isCenter: boolean }) {
  const isDark = card.variant === "dark"
  return (
    <div
      className={cn(
        "relative min-h-[200px] w-full overflow-hidden rounded-2xl bg-gradient-to-br p-5 shadow-lg transition-all duration-300",
        card.gradient,
        isCenter ? "scale-100 opacity-100 ring-2 ring-primary/50" : "scale-90 opacity-70"
      )}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      {/* Top row: chip / bank vs type + contactless */}
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-10 items-center justify-center rounded-md border border-white/30 bg-white/10">
            <CreditCard className="h-4 w-4 text-white" aria-hidden />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-white/90">
            {card.badge ?? card.type}
          </span>
        </div>
        <Wifi className="h-5 w-5 text-white/90" aria-hidden />
      </div>

      {/* Card number */}
      <div className="relative mt-6">
        <p className="font-mono text-lg font-semibold tracking-[0.2em] text-white sm:text-xl">
          {card.number}
        </p>
      </div>

      {/* Bottom row: Valid thru, CVV, name, brand */}
      <div className="relative mt-6 flex items-end justify-between">
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/70">Valid thru</p>
            <p className="font-semibold text-white">{card.exp}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/70">CVV</p>
            <p className="font-semibold text-white">{card.cvv}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-white/90">{card.holderName ?? "Cardholder"}</p>
          {card.badge ? (
            <span className="mt-1 inline-block text-sm font-bold italic tracking-wider text-white">
              {card.badge}
            </span>
          ) : (
            <div className="mt-1 flex justify-end gap-0.5">
              <span className="h-5 w-5 rounded-full bg-red-500/90" />
              <span className="h-5 w-5 rounded-full bg-amber-400/90 -ml-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const updateSelected = useCallback((emblaApi: CarouselApi | undefined) => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!api) return
    updateSelected(api)
    api.on("select", updateSelected)
    return () => {
      api.off("select", updateSelected)
    }
  }, [api, updateSelected])

  const selectedCard = cards[selectedIndex] ?? cards[0]

  return (
    <>
      <TopHeader title="Account" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* ===== MOBILE-FIRST: Card carousel at top, center = selected ===== */}
        <section className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between px-1 pb-3">
            <h2 className="text-base font-semibold text-card-foreground">My Cards</h2>
            <button type="button" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          <div className="relative mx-auto max-w-[min(100%,420px)]">
            <Carousel
              setApi={setApi}
              opts={{
                align: "center",
                loop: true,
                dragFree: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 flex items-stretch md:-ml-4">
                {cards.map((card, index) => (
                  <CarouselItem
                    key={index}
                    className="basis-[85%] pl-2 md:basis-[80%] md:pl-4"
                  >
                    <div className="flex h-full items-center">
                      <CarouselCard card={card} isCenter={selectedIndex === index} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Pagination dots (same behavior as carousel-sample: center = selected) */}
            <div className="mt-4 flex justify-center gap-2">
              {cards.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Go to card ${index + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === selectedIndex
                      ? "w-6 bg-foreground"
                      : "w-2 border border-border bg-transparent"
                  )}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ===== BELOW: Same content as previous right column (details + transactions) ===== */}
        <div className="flex flex-col gap-4 lg:gap-5">
          {/* Card Details + Quick Actions */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:p-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Card Number</p>
              <p className="mt-1 text-xl font-bold tracking-widest text-card-foreground lg:text-2xl">
                {selectedCard.fullNumber ?? selectedCard.number}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-6 gap-y-4 lg:gap-8">
                <div>
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <p className="mt-1 text-sm font-bold text-card-foreground">{selectedCard.exp}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CVC</p>
                  <p className="mt-1 text-sm font-bold text-card-foreground">{selectedCard.cvv}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className="mt-1 rounded-md bg-primary/15 px-3 py-0.5 text-xs font-semibold text-primary hover:bg-primary/15">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 lg:gap-3">
              {[
                { icon: Plus, label: "Top Up" },
                { icon: ArrowUpDown, label: "Transfer" },
                { icon: DollarSign, label: "Payment" },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  title={action.label}
                  className="flex items-center justify-center rounded-xl border border-border bg-background p-3 transition-colors hover:bg-accent lg:p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
                    <action.icon className="h-5 w-5 text-foreground" aria-hidden />
                  </div>
                  <span className="sr-only">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 lg:px-6">
              <h3 className="text-base font-semibold text-card-foreground">Transactions</h3>
              <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
                <option>This Month</option>
                <option>Last Month</option>
              </select>
            </div>
            <div className="h-[490px] min-h-0 overflow-auto overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="sticky top-0 z-10 bg-card shadow-sm">
                  <tr className="border-b border-border">
                    <th className="w-10 bg-card px-4 py-3 lg:px-5">
                      <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" aria-label="Select all" />
                    </th>
                    {["Transaction Name", "Transaction ID", "Date & Time", "Amount", "Note", "Status"].map((col) => (
                      <th key={col} className="bg-card px-4 py-3 text-left lg:px-5">
                        <button type="button" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
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
                          <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" aria-label={`Select ${tx.name}`} />
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
                          <Badge
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-medium",
                              tx.status === "Completed"
                                ? "bg-primary/10 text-primary hover:bg-primary/10"
                                : "bg-warning/10 text-warning hover:bg-warning/10"
                            )}
                          >
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
      </div>
    </>
  )
}
