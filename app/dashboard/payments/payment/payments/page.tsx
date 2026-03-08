"use client"

import { useCallback, useEffect, useState } from "react"
import { TopHeader } from "@/components/top-header"
import { CreditCard } from "lucide-react"
import Link from "next/link"
import {
  getPayments,
  getCardPayments,
  type PaymentListItem,
  type GetPaymentsFilters,
} from "@/app/actions/transaction"
import { getAccounts } from "@/app/actions/accounts"
import { getMerchants } from "@/app/actions/merchants"
import type { Database } from "@/lib/supabase/database.types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type AccountRow = Database["public"]["Tables"]["account"]["Row"]
type MerchantOption = { id: string; name: string }

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
]

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase()
  const variant =
    lower === "completed"
      ? "border-primary/30 bg-primary/10 text-primary"
      : lower === "failed" || lower === "cancelled"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-warning/30 bg-warning/10 text-warning"
  return (
    <Badge variant="outline" className={`text-[10px] ${variant}`}>
      {status}
    </Badge>
  )
}

function paymentTypeLabel(p: PaymentListItem): string {
  if (p.source === "card_payment") {
    return p.merchantName.includes("Installment") ? "Installment" : "Credit card"
  }
  switch (p.paymentType) {
    case "subscription":
      return "Subscription"
    case "installment":
      return "Installment"
    default:
      return "Payment"
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([])
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [merchants, setMerchants] = useState<MerchantOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<GetPaymentsFilters>({
    status: "all",
    fromAccountId: "all",
    merchantId: "all",
    dateFrom: "",
    dateTo: "",
  })

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const [paymentsData, cardPaymentsData] = await Promise.all([
        getPayments(filters),
        getCardPayments({
          status: filters.status,
          fromAccountId: filters.fromAccountId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          limit: filters.limit ?? 100,
        }),
      ])
      const combined: PaymentListItem[] = [
        ...(paymentsData ?? []),
        ...(cardPaymentsData ?? []),
      ].sort((a, b) => {
        const dateA = new Date(a.paidAt ?? a.createdAt).getTime()
        const dateB = new Date(b.paidAt ?? b.createdAt).getTime()
        return dateB - dateA
      })
      setPayments(combined)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchAccounts = useCallback(async () => {
    const data = await getAccounts()
    setAccounts(data ?? [])
  }, [])

  const fetchMerchants = useCallback(async () => {
    try {
      const data = await getMerchants()
      setMerchants(data ?? [])
    } catch {
      setMerchants([])
    }
  }, [])

  useEffect(() => {
    void fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    void fetchAccounts()
    void fetchMerchants()
  }, [fetchAccounts, fetchMerchants])

  const handleFilterChange = <K extends keyof GetPaymentsFilters>(
    key: K,
    value: GetPaymentsFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <TopHeader title="Payments" />
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-6xl min-w-0 space-y-4 sm:space-y-5">
          {/* Breadcrumb / Back */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/dashboard/payments/payment"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Payment
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">All payments</span>
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <h3 className="mb-3 text-sm font-medium text-card-foreground sm:mb-4">
              Filters
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs">
                  Status
                </Label>
                <Select
                  value={filters.status ?? "all"}
                  onValueChange={(v) => handleFilterChange("status", v)}
                >
                  <SelectTrigger id="status" className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account" className="text-xs">
                  From account
                </Label>
                <Select
                  value={filters.fromAccountId ?? "all"}
                  onValueChange={(v) => handleFilterChange("fromAccountId", v)}
                >
                  <SelectTrigger id="account" className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All accounts</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant" className="text-xs">
                  Merchant
                </Label>
                <Select
                  value={filters.merchantId ?? "all"}
                  onValueChange={(v) => handleFilterChange("merchantId", v)}
                >
                  <SelectTrigger id="merchant" className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All merchants</SelectItem>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="text-xs">
                  From date
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom ?? ""}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value || undefined)
                  }
                  className="w-full sm:w-[140px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-xs">
                  To date
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo ?? ""}
                  onChange={(e) =>
                    handleFilterChange("dateTo", e.target.value || undefined)
                  }
                  className="w-full sm:w-[140px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    status: "all",
                    fromAccountId: "all",
                    merchantId: "all",
                    dateFrom: "",
                    dateTo: "",
                  })
                }
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="min-w-0 rounded-xl border border-border bg-card">
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-base font-semibold text-card-foreground">
                  Payment history
                </h3>
              </div>
            </div>
            <div className="min-w-0 overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  Loading payments...
                </div>
              ) : payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <p>No payments found.</p>
                  <Link
                    href="/dashboard/payments/payment"
                    className="text-primary hover:underline"
                  >
                    Make a payment
                  </Link>
                </div>
              ) : (
                <>
                {/* Desktop table */}
                <div className="hidden md:block min-w-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Merchant / Description</TableHead>
                      <TableHead>From account</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Ref #</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(p.paidAt ?? p.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="text-xs">{paymentTypeLabel(p)}</span>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-[160px] truncate font-medium text-card-foreground">
                            {p.merchantName}
                          </p>
                        </TableCell>
                        <TableCell>
                          {p.fromAccountName ? (
                            <div>
                              <p className="max-w-[140px] truncate font-medium text-card-foreground">
                                {p.fromAccountName}
                              </p>
                              <p className="max-w-[140px] truncate text-xs text-muted-foreground">
                                {p.fromAccountMasked ?? "—"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-card-foreground">
                          {formatAmount(p.amount, p.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.feeAmount > 0
                            ? formatAmount(p.feeAmount, p.currency)
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-[100px] truncate text-muted-foreground">
                          {p.virtualAccount ?? "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                {/* Mobile card layout */}
                <div className="md:hidden divide-y divide-border">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-2 px-3 py-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-card-foreground truncate">
                            {p.merchantName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {paymentTypeLabel(p)}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatDate(p.paidAt ?? p.createdAt)}</span>
                        <span className="font-semibold text-card-foreground">
                          {formatAmount(p.amount, p.currency)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>From: {p.fromAccountName ?? "—"}</span>
                        {p.feeAmount > 0 && (
                          <span>Fee: {formatAmount(p.feeAmount, p.currency)}</span>
                        )}
                        {p.virtualAccount && (
                          <span>Ref: {p.virtualAccount}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
