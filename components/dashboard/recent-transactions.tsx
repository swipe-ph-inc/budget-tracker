"use client"

import { useCallback, useEffect, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  getRecentTransactionsForDashboard,
  type RecentTransactionItem,
} from "@/app/actions/dashboard"

function formatAmount(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
  return amount >= 0 ? `+${formatted}` : `-${formatted}`
}

function formatDateTime(iso: string): { date: string; time: string } {
  if (!iso) return { date: "—", time: "" }
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString(undefined, { dateStyle: "short" }),
    time: d.toLocaleTimeString(undefined, { timeStyle: "short" }),
  }
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase()
  if (lower === "completed") {
    return (
      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-medium">
        {status}
      </Badge>
    )
  }
  if (lower === "failed") {
    return (
      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-medium">
        {status}
      </Badge>
    )
  }
  if (lower === "pending" || lower === "processing") {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 font-medium dark:text-amber-400">
        {status}
      </Badge>
    )
  }
  return <Badge variant="outline">{status}</Badge>
}

export function RecentTransactions({
  initialData,
}: { initialData?: RecentTransactionItem[] } = {}) {
  const [transactions, setTransactions] = useState<RecentTransactionItem[]>(
    initialData ?? []
  )
  const [loading, setLoading] = useState(!initialData)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRecentTransactionsForDashboard(10)
      setTransactions(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData !== undefined) {
      setTransactions(initialData)
      setLoading(false)
      return
    }
    void load()
  }, [initialData, load])

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Recent Transactions</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground"
            aria-label="Filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Transaction Name</TableHead>
              <TableHead className="text-xs font-medium">Date & Time</TableHead>
              <TableHead className="text-xs font-medium">Amount</TableHead>
              <TableHead className="text-xs font-medium">Note</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No recent transactions
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => {
                const { date, time } = formatDateTime(tx.date)
                return (
                  <TableRow key={tx.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{tx.name}</p>
                        <p className="text-xs text-muted-foreground">{tx.category}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-card-foreground">{date}</p>
                        {time && <p className="text-xs text-muted-foreground">{time}</p>}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-sm font-medium ${tx.amount >= 0 ? "text-primary" : "text-card-foreground"}`}
                    >
                      {formatAmount(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {tx.note ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
