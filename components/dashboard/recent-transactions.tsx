"use client"

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

const transactions = [
  {
    name: "Electricity Bill",
    category: "Payments",
    date: "2028-03-01",
    time: "04:28:48",
    amount: "$295.81",
    note: "Payment for monthly electricity bill",
    status: "Failed",
  },
  {
    name: "Weekly Groceries",
    category: "Shopping",
    date: "2028-03-04",
    time: "04:28:48",
    amount: "$204.07",
    note: "Groceries shopping at local supermarket",
    status: "Completed",
  },
  {
    name: "Movie Night",
    category: "Entertainment",
    date: "2028-02-27",
    time: "04:28:48",
    amount: "$97.84",
    note: "Tickets for movies and snacks",
    status: "Pending",
  },
  {
    name: "Medical Check-up",
    category: "Healthcare",
    date: "2028-02-07",
    time: "04:28:48",
    amount: "$323.33",
    note: "Routine health check-up and medications",
    status: "Pending",
  },
  {
    name: "Dinner at Italian Restaurant",
    category: "Dining Out",
    date: "2028-02-11",
    time: "04:28:48",
    amount: "$226.25",
    note: "Dining out with family at a local Italian restaurant",
    status: "Pending",
  },
]

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Completed":
      return (
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-medium">
          {status}
        </Badge>
      )
    case "Failed":
      return (
        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-medium">
          {status}
        </Badge>
      )
    case "Pending":
      return (
        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning font-medium">
          {status}
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function RecentTransactions() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Recent Transactions</h3>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
            <option>This Month</option>
            <option>Last Month</option>
          </select>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground">
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
            {transactions.map((tx) => (
              <TableRow key={tx.name} className="hover:bg-muted/50">
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{tx.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.category}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-card-foreground">{tx.date}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-card-foreground">
                  {tx.amount}
                </TableCell>
                <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                  {tx.note}
                </TableCell>
                <TableCell>
                  <StatusBadge status={tx.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
