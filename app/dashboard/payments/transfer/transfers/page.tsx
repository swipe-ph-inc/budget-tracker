"use client"

import { useCallback, useEffect, useState } from "react"
import { TopHeader } from "@/components/top-header"
import { ArrowLeftRight } from "lucide-react"
import Link from "next/link"
import { getTransfers, type TransferListItem, type GetTransfersFilters } from "@/app/actions/transaction"
import { getAccounts } from "@/app/actions/accounts"
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

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
]

const TRANSFER_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "local", label: "Local" },
  { value: "international", label: "International" },
]

const TRANSFER_METHOD_OPTIONS = [
  { value: "all", label: "All methods" },
  { value: "instaPay", label: "InstaPay" },
  { value: "pesoNet", label: "PesoNet" },
  { value: "wire", label: "Wire" },
  { value: "cash", label: "Cash" },
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

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<TransferListItem[]>([])
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<GetTransfersFilters>({
    status: "all",
    transferType: "all",
    transferMethod: "all",
    fromAccountId: "all",
    dateFrom: "",
    dateTo: "",
  })

  const fetchTransfers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTransfers(filters)
      setTransfers(data)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchAccounts = useCallback(async () => {
    const data = await getAccounts()
    setAccounts(data ?? [])
  }, [])

  useEffect(() => {
    void fetchTransfers()
  }, [fetchTransfers])

  useEffect(() => {
    void fetchAccounts()
  }, [fetchAccounts])

  const handleFilterChange = <K extends keyof GetTransfersFilters>(
    key: K,
    value: GetTransfersFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <TopHeader title="Transfers" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-6xl space-y-5">
          {/* Breadcrumb / Back */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/dashboard/payments/transfer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Transfer
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">All transfers</span>
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-medium text-card-foreground">Filters</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs">Status</Label>
                <Select
                  value={filters.status ?? "all"}
                  onValueChange={(v) => handleFilterChange("status", v)}
                >
                  <SelectTrigger id="status" className="w-[140px]">
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
                <Label htmlFor="type" className="text-xs">Type</Label>
                <Select
                  value={filters.transferType ?? "all"}
                  onValueChange={(v) => handleFilterChange("transferType", v)}
                >
                  <SelectTrigger id="type" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFER_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="method" className="text-xs">Method</Label>
                <Select
                  value={filters.transferMethod ?? "all"}
                  onValueChange={(v) => handleFilterChange("transferMethod", v)}
                >
                  <SelectTrigger id="method" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFER_METHOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account" className="text-xs">From account</Label>
                <Select
                  value={filters.fromAccountId ?? "all"}
                  onValueChange={(v) => handleFilterChange("fromAccountId", v)}
                >
                  <SelectTrigger id="account" className="w-[180px]">
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
                <Label htmlFor="dateFrom" className="text-xs">From date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom ?? ""}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value || undefined)}
                  className="w-[140px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-xs">To date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo ?? ""}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value || undefined)}
                  className="w-[140px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    status: "all",
                    transferType: "all",
                    transferMethod: "all",
                    fromAccountId: "all",
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
          <div className="rounded-xl border border-border bg-card">
            <div className="p-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-base font-semibold text-card-foreground">Transfer history</h3>
              </div>
            </div>
            <div className="min-w-0 overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  Loading transfers...
                </div>
              ) : transfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <p>No transfers found.</p>
                  <Link
                    href="/dashboard/payments/transfer"
                    className="text-primary hover:underline"
                  >
                    Make a transfer
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(t.completedAt ?? t.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-card-foreground truncate max-w-[140px]">
                              {t.fromAccountName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {t.fromAccountMasked}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-card-foreground truncate max-w-[140px]">
                              {t.toName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {t.toIdentifier}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-card-foreground">
                          {formatAmount(t.amount, t.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.feeAmount > 0 ? formatAmount(t.feeAmount, t.currency) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{t.transferMethod}</TableCell>
                        <TableCell className="text-muted-foreground">{t.transferType}</TableCell>
                        <TableCell>
                          <StatusBadge status={t.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
