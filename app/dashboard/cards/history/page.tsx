"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { TopHeader } from "@/components/top-header"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ChevronLeft, ChevronRight, ChevronDown, Wallet, Receipt } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getPayments, getCardPayments, type PaymentListItem } from "@/app/actions/transaction"
import { getCreditCards } from "@/app/actions/credit-cards"
import type { Tables } from "@/lib/supabase/database.types"

const PAGE_SIZE = 20

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "charge", label: "Charges only" },
  { value: "payment", label: "Payments only" },
] as const

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
] as const

type CreditCardRow = Tables<"credit_card">

function formatAmount(amount: number, currency: string, signed = false): string {
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
  if (signed && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`
  }
  return formatted
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

function formatTime(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

type HistoryRow = {
  id: string
  date: string
  description: string
  category: string
  amountSigned: number
  currency: string
  status: string
  note: string | null
  source: "charge" | "payment"
}

function chargeToRow(p: PaymentListItem): HistoryRow {
  const date = p.paidAt ?? p.createdAt ?? ""
  const isSubscription = p.paymentType === "subscription"
  const isInstallment = p.paymentType === "installment"
  const category =
    isSubscription ? "Subscription" : isInstallment ? "Installment" : "Purchase"
  return {
    id: p.id,
    date,
    description: p.merchantName ?? "—",
    category,
    amountSigned: -p.amount,
    currency: p.currency ?? "PHP",
    status: p.status,
    note: p.note,
    source: "charge",
  }
}

function cardPaymentToRow(p: PaymentListItem): HistoryRow {
  const date = p.paidAt ?? p.createdAt ?? ""
  return {
    id: p.id,
    date,
    description: p.merchantName ?? "Payment",
    category: p.merchantName?.includes("Installment") ? "Installment payment" : "Card payment",
    amountSigned: p.amount,
    currency: p.currency ?? "PHP",
    status: p.status,
    note: p.note,
    source: "payment",
  }
}

export default function CardHistoryPage() {
  const searchParams = useSearchParams()
  const cardId = searchParams.get("cardId")

  const [card, setCard] = useState<CreditCardRow | null>(null)
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<"all" | "charge" | "payment">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const loadData = useCallback(async () => {
    if (!cardId) {
      setCard(null)
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [cards, charges, payments] = await Promise.all([
        getCreditCards(),
        getPayments({ fromCreditCardId: cardId, limit: 200 }),
        getCardPayments({ creditCardId: cardId, limit: 200 }),
      ])
      const found = (cards ?? []).find((c) => c.id === cardId) ?? null
      setCard(found)

      const combined: HistoryRow[] = [
        ...(charges ?? []).map(chargeToRow),
        ...(payments ?? []).map(cardPaymentToRow),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setRows(combined)
    } finally {
      setLoading(false)
    }
  }, [cardId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    let list = rows
    if (typeFilter !== "all") {
      list = list.filter((r) => r.source === typeFilter)
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status.toLowerCase() === statusFilter)
    }
    if (dateFrom) {
      list = list.filter((r) => r.date >= dateFrom)
    }
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      list = list.filter((r) => new Date(r.date) <= end)
    }
    return list
  }, [rows, typeFilter, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, statusFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  if (!cardId) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeader title="Card History" />
        <main className="w-full px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
          <div className="mx-auto max-w-screen-2xl">
            <section className="rounded-2xl border border-border bg-card p-8 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No card selected. Open history from a card’s details.
              </p>
              <Link
                href="/dashboard/cards"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Back to Credit Cards
              </Link>
            </section>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopHeader title="Card History" />
      <main className="w-full px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 lg:p-5">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/cards">Credit Cards</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {loading ? "…" : card ? `${card.name ?? "Card"} · History` : "History"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <header>
              <h2 className="text-sm font-semibold text-card-foreground">
                Transaction history
              </h2>
              <p className="text-xs text-muted-foreground">
                {card
                  ? `Charges and payments for ${card.name ?? "this card"} (${card.masked_identifier ?? "••••"}).`
                  : "Loading…"}
              </p>
            </header>

            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
              <p className="text-xs font-medium text-muted-foreground">Filters</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:gap-4">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                  <label htmlFor="history-type" className="text-xs text-muted-foreground sm:w-16">
                    Type
                  </label>
                  <select
                    id="history-type"
                    value={typeFilter}
                    onChange={(e) =>
                      setTypeFilter(e.target.value as "all" | "charge" | "payment")
                    }
                    className="h-9 min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:min-w-[140px]"
                  >
                    {TYPE_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                  <label htmlFor="history-status" className="text-xs text-muted-foreground sm:w-16">
                    Status
                  </label>
                  <select
                    id="history-status"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as "all" | "completed" | "pending")
                    }
                    className="h-9 min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:min-w-[140px]"
                  >
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                  <label htmlFor="history-date-from" className="text-xs text-muted-foreground sm:w-16">
                    From
                  </label>
                  <input
                    id="history-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:min-w-[140px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                  <label htmlFor="history-date-to" className="text-xs text-muted-foreground sm:w-16">
                    To
                  </label>
                  <input
                    id="history-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:min-w-[140px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("all")
                    setStatusFilter("all")
                    setDateFrom("")
                    setDateTo("")
                    setCurrentPage(1)
                  }}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring lg:ml-auto"
                >
                  Clear filters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left">
                      <span className="flex items-center gap-1 font-medium text-muted-foreground">
                        Transaction <ChevronDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Date & time
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                        {filtered.length === 0 && rows.length > 0
                          ? "No transactions match the current filters."
                          : "No transactions for this card."}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((row) => {
                      const Icon = row.source === "payment" ? Receipt : Wallet
                      return (
                        <tr
                          key={`${row.source}-${row.id}`}
                          className="border-b border-border last:border-0 transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                                <Icon className="h-4 w-4 text-accent-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-card-foreground">
                                  {row.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {row.category}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-card-foreground">{formatDate(row.date)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(row.date)}
                            </p>
                          </td>
                          <td
                            className={`px-4 py-3.5 font-medium ${
                              row.amountSigned >= 0 ? "text-primary" : "text-destructive"
                            }`}
                          >
                            {formatAmount(row.amountSigned, row.currency, true)}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                row.status.toLowerCase() === "completed"
                                  ? "bg-primary/10 text-primary hover:bg-primary/10"
                                  : "bg-warning/10 text-warning hover:bg-warning/10"
                              }`}
                            >
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row lg:px-6">
              <div className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
