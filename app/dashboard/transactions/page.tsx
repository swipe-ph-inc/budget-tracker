"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  getPayments,
  getCardPayments,
  getTransfers,
  getIncome,
  type PaymentListItem,
  type TransferListItem,
  type IncomeListItem,
} from "@/app/actions/transaction"
import { getAccounts } from "@/app/actions/accounts"
import type { Database } from "@/lib/supabase/database.types"
import { Badge } from "@/components/ui/badge"
import { getActiveSubscription } from "@/app/actions/billing"
import {
  Crown,
  Download,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ArrowLeftRight,
  TrendingUp,
  Receipt,
  Wallet,
} from "lucide-react"

type AccountRow = Database["public"]["Tables"]["account"]["Row"]

export type TransactionType =
  | "payment"
  | "subscription"
  | "installment"
  | "credit_card"
  | "transfer"
  | "income"

export type TransactionRow = {
  id: string
  type: TransactionType
  date: string
  name: string
  category: string
  accountDisplay: string
  amount: number
  amountSigned: number
  currency: string
  status: string
  note: string | null
  txId: string
}

const TYPE_OPTIONS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "payment", label: "Payment" },
  { value: "subscription", label: "Subscription" },
  { value: "installment", label: "Installment" },
  { value: "credit_card", label: "Credit card" },
  { value: "transfer", label: "Transfer" },
  { value: "income", label: "Income" },
]

const PAGE_SIZE = 20

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
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(iso))
}

function formatTime(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
  }).format(new Date(iso))
}

function getTypeIcon(type: TransactionType) {
  switch (type) {
    case "income":
      return TrendingUp
    case "transfer":
      return ArrowLeftRight
    case "credit_card":
    case "installment":
      return CreditCard
    case "subscription":
      return Receipt
    default:
      return Wallet
  }
}

function paymentToRow(p: PaymentListItem): TransactionRow {
  const isSubscription = p.paymentType === "subscription"
  const isInstallment = p.paymentType === "installment"
  const isCardPayment = p.source === "card_payment"
  const type: TransactionType = isCardPayment
    ? p.merchantName.includes("Installment")
      ? "installment"
      : "credit_card"
    : isSubscription
      ? "subscription"
      : isInstallment
        ? "installment"
        : "payment"
  const date = p.paidAt ?? p.createdAt
  const category =
    type === "credit_card"
      ? "Credit card payment"
      : type === "installment"
        ? "Installment"
        : type === "subscription"
          ? "Subscription"
          : "Payment"
  const accountDisplay = p.fromAccountName
    ? `${p.fromAccountName} ${p.fromAccountMasked ? `(${p.fromAccountMasked})` : ""}`
    : "—"
  return {
    id: p.id,
    type,
    date: date ?? p.createdAt,
    name: p.merchantName,
    category,
    accountDisplay: accountDisplay.trim(),
    amount: p.amount,
    amountSigned: -p.amount,
    currency: p.currency,
    status: p.status,
    note: p.note,
    txId: p.id.slice(0, 8),
  }
}

function transferToRow(t: TransferListItem): TransactionRow {
  const date = t.completedAt ?? t.createdAt
  return {
    id: `transfer-${t.id}`,
    type: "transfer",
    date,
    name: `Transfer to ${t.toName}`,
    category: "Transfer",
    accountDisplay: `${t.fromAccountName} (${t.fromAccountMasked})`,
    amount: t.amount,
    amountSigned: -t.amount,
    currency: t.currency,
    status: t.status,
    note: t.note,
    txId: t.id.slice(0, 8),
  }
}

function incomeToRow(i: IncomeListItem): TransactionRow {
  const date = i.receivedAt ?? i.createdAt
  return {
    id: `income-${i.id}`,
    type: "income",
    date,
    name: i.source,
    category: "Income",
    accountDisplay: `${i.accountName} (${i.accountMasked})`,
    amount: i.amount,
    amountSigned: i.amount,
    currency: i.currency,
    status: "Completed",
    note: i.note,
    txId: i.id.slice(0, 8),
  }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] =
    useState<Awaited<ReturnType<typeof getActiveSubscription>> | undefined>(
      undefined
    )
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all")
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const isPro = subscription !== null

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const sub = await getActiveSubscription()
      setSubscription(sub ?? null)

      const isProLocal = sub !== null
      const maxFreeDays = 30
      let effectiveDateFrom = dateFrom || undefined
      if (!isProLocal) {
        const now = new Date()
        const past = new Date()
        past.setDate(now.getDate() - maxFreeDays + 1)
        const cutoff = past.toISOString().slice(0, 10)
        if (!effectiveDateFrom || effectiveDateFrom < cutoff) {
          effectiveDateFrom = cutoff
        }
      }

      const baseFilters = {
        dateFrom: effectiveDateFrom,
        dateTo: dateTo || undefined,
        fromAccountId: accountFilter !== "all" ? accountFilter : undefined,
      }
      const [paymentsData, cardPaymentsData, transfersData, incomeData] =
        await Promise.all([
          getPayments({
            ...baseFilters,
            limit: 200,
          }),
          getCardPayments({
            ...baseFilters,
            fromAccountId: accountFilter !== "all" ? accountFilter : undefined,
            limit: 200,
          }),
          getTransfers({
            ...baseFilters,
            fromAccountId: accountFilter !== "all" ? accountFilter : undefined,
          }),
          getIncome({
            accountId: accountFilter !== "all" ? accountFilter : undefined,
            dateFrom: effectiveDateFrom,
            dateTo: dateTo || undefined,
            limit: 200,
          }),
        ])

      const rows: TransactionRow[] = [
        ...(paymentsData ?? []).map(paymentToRow),
        ...(cardPaymentsData ?? []).map(paymentToRow),
        ...(transfersData ?? []).map(transferToRow),
        ...(incomeData ?? []).map(incomeToRow),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setTransactions(rows)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, accountFilter])

  const fetchAccounts = useCallback(async () => {
    const data = await getAccounts()
    setAccounts(data ?? [])
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    void fetchAccounts()
  }, [fetchAccounts])

  const filtered = useMemo(() => {
    let list = transactions
    if (typeFilter !== "all") {
      list = list.filter((t) => t.type === typeFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.note?.toLowerCase().includes(q) ?? false) ||
          t.txId.toLowerCase().includes(q)
      )
    }
    return list
  }, [transactions, typeFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, searchQuery, accountFilter, dateFrom, dateTo])

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto min-w-0 max-w-7xl space-y-3 sm:space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Transactions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {!isPro && subscription !== undefined && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <Crown className="h-4 w-4 shrink-0 text-amber-500" />
              <span>
                <span className="font-medium">Free plan:</span> transaction history is limited to the last 30 days.{" "}
                <Link href="/dashboard/subscription" className="font-medium underline underline-offset-2 hover:text-amber-800 dark:hover:text-amber-300">
                  Upgrade to Pro
                </Link>{" "}
                for full history.
              </span>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card">
            {/* Filters - responsive stack */}
            <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-4">
              <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search transaction"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-52"
                  />
                </div>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-auto sm:min-w-[120px]"
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as TransactionType | "all")
                  }
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-auto sm:min-w-[140px]"
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                >
                  <option value="all">All accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground hover:bg-muted sm:flex-initial"
                    onClick={() => {
                      setDateFrom("")
                      setDateTo("")
                      setAccountFilter("all")
                      setTypeFilter("all")
                      setSearchQuery("")
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:flex-initial"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
                {!isPro && (
                  <div className="text-right text-[11px] text-muted-foreground">
                    Free plan shows the last 30 days of transactions.{" "}
                    <Link
                      href="/dashboard/subscription"
                      className="font-medium text-primary hover:underline"
                    >
                      Upgrade for full history
                    </Link>
                    .
                  </div>
                )}
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left">
                      <span className="flex items-center gap-1 font-medium text-muted-foreground">
                        Transaction <ChevronDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Date & time
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Note
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((tx) => {
                      const Icon = getTypeIcon(tx.type)
                      return (
                        <tr
                          key={tx.id}
                          className="border-b border-border last:border-0 transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                                <Icon className="h-4 w-4 text-accent-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-card-foreground">
                                  {tx.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {tx.category}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[180px] truncate px-4 py-3.5 text-muted-foreground">
                            {tx.accountDisplay}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                            {tx.txId}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-card-foreground">
                              {formatDate(tx.date)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(tx.date)}
                            </p>
                          </td>
                          <td
                            className={`px-4 py-3.5 font-medium ${
                              tx.amountSigned >= 0
                                ? "text-primary"
                                : "text-destructive"
                            }`}
                          >
                            {formatAmount(tx.amountSigned, tx.currency, true)}
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3.5 text-muted-foreground">
                            {tx.note ?? "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                tx.status.toLowerCase() === "completed"
                                  ? "bg-primary/10 text-primary hover:bg-primary/10"
                                  : "bg-warning/10 text-warning hover:bg-warning/10"
                              }`}
                            >
                              {tx.status}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden">
              {loading ? (
                <div className="px-3 py-12 text-center text-sm text-muted-foreground">
                  Loading transactions...
                </div>
              ) : paginated.length === 0 ? (
                <div className="px-3 py-12 text-center text-sm text-muted-foreground">
                  No transactions found.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {paginated.map((tx) => {
                    const Icon = getTypeIcon(tx.type)
                    return (
                      <div
                        key={tx.id}
                        className="flex flex-col gap-2 px-3 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                              <Icon className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-card-foreground">
                                {tx.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tx.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-0.5">
                            <span
                              className={`font-semibold ${
                                tx.amountSigned >= 0
                                  ? "text-primary"
                                  : "text-destructive"
                              }`}
                            >
                              {formatAmount(tx.amountSigned, tx.currency, true)}
                            </span>
                            <Badge
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                tx.status.toLowerCase() === "completed"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-warning/10 text-warning"
                              }`}
                            >
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-[52px] text-xs text-muted-foreground">
                          <span>{formatDate(tx.date)}</span>
                          <span className="truncate max-w-[140px]">
                            {tx.accountDisplay}
                          </span>
                          {tx.note && (
                            <span className="w-full truncate sm:max-w-[200px]">
                              {tx.note}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-3 py-3 sm:flex-row sm:px-4 lg:px-6">
              <div className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
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
                <span className="flex items-center gap-1 px-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
