"use client"

import { useCallback, useEffect, useState } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PaymentHistoryTable } from "@/components/payment/payment-history-table"

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
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-6xl min-w-0 space-y-4 sm:space-y-5">
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

          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <h3 className="mb-3 text-sm font-medium text-card-foreground sm:mb-4">Filters</h3>
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

          <PaymentHistoryTable
            payments={payments}
            loading={loading}
            emptyContent={
              <>
                <p>No payments found.</p>
                <Link href="/dashboard/payments/payment" className="text-primary hover:underline">
                  Make a payment
                </Link>
              </>
            }
          />
        </div>
      </div>
    </>
  )
}
