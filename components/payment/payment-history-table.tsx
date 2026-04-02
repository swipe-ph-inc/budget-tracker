"use client"

import { CreditCard } from "lucide-react"
import type { ReactNode } from "react"
import type { PaymentListItem } from "@/app/actions/transaction"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function formatPaymentHistoryAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPaymentHistoryDate(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export function PaymentHistoryStatusBadge({ status }: { status: string }) {
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

export function paymentHistoryTypeLabel(p: PaymentListItem): string {
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

export type PaymentHistoryPagination = {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export interface PaymentHistoryTableProps {
  payments: PaymentListItem[]
  loading: boolean
  title?: string
  emptyContent?: ReactNode
  /** Shown on the right of the title row (e.g. “View all” link) */
  headerExtra?: ReactNode
  /** When false, render only the table body (parent supplies card + title row) */
  wrapInCard?: boolean
  pagination?: PaymentHistoryPagination
}

export function PaymentHistoryTable({
  payments,
  loading,
  title = "Payment history",
  emptyContent,
  headerExtra,
  wrapInCard = true,
  pagination,
}: PaymentHistoryTableProps) {
  const sizeOptions = pagination?.pageSizeOptions ?? [10, 20, 50]
  const inner = (
    <>
      {wrapInCard && (
        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
            </div>
            {headerExtra}
          </div>
        </div>
      )}
      <div className="min-w-0 overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            {emptyContent ?? <p>No payments found.</p>}
          </div>
        ) : (
          <>
            <div className="hidden min-w-0 overflow-x-auto md:block">
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
                    <TableRow key={`${p.source ?? "payment"}-${p.id}`}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatPaymentHistoryDate(p.paidAt ?? p.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="text-xs">{paymentHistoryTypeLabel(p)}</span>
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
                        {formatPaymentHistoryAmount(p.amount, p.currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.feeAmount > 0
                          ? formatPaymentHistoryAmount(p.feeAmount, p.currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate text-muted-foreground">
                        {p.virtualAccount ?? "—"}
                      </TableCell>
                      <TableCell>
                        <PaymentHistoryStatusBadge status={p.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {payments.map((p) => (
                <div key={`${p.source ?? "payment"}-${p.id}`} className="flex flex-col gap-2 px-3 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-card-foreground">{p.merchantName}</p>
                      <p className="text-xs text-muted-foreground">{paymentHistoryTypeLabel(p)}</p>
                    </div>
                    <PaymentHistoryStatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatPaymentHistoryDate(p.paidAt ?? p.createdAt)}</span>
                    <span className="font-semibold text-card-foreground">
                      {formatPaymentHistoryAmount(p.amount, p.currency)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>From: {p.fromAccountName ?? "—"}</span>
                    {p.feeAmount > 0 && (
                      <span>Fee: {formatPaymentHistoryAmount(p.feeAmount, p.currency)}</span>
                    )}
                    {p.virtualAccount && <span>Ref: {p.virtualAccount}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {pagination && !loading && pagination.totalItems > 0 && (
        <div className="flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.totalItems)}
            </span>
            –
            <span className="font-medium text-foreground">
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
            </span>{" "}
            of <span className="font-medium text-foreground">{pagination.totalItems}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows</span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
              >
                <SelectTrigger className="h-9 w-[72px]" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  if (!wrapInCard) {
    return <div className="min-w-0">{inner}</div>
  }

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card">
      {inner}
    </div>
  )
}
