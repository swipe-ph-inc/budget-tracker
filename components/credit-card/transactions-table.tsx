"use client"

import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Tv,
  Briefcase,
  ShoppingCart,
  Dumbbell,
  Zap,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"

interface Transaction {
  name: string
  category: string
  icon: LucideIcon
  txId: string
  date: string
  time: string
  amount: string
  isIncome: boolean
  note: string
  status: "Completed" | "Pending"
}

const TRANSACTIONS: Transaction[] = [
  {
    name: "Book Royalties",
    category: "Income",
    icon: BookOpen,
    txId: "4567890139",
    date: "2028-09-25",
    time: "11:00 AM",
    amount: "+$400.00",
    isIncome: true,
    note: "Royalties from published book",
    status: "Completed",
  },
  {
    name: "Comcast Bill Payment",
    category: "Utilities",
    icon: Tv,
    txId: "4567890123",
    date: "2028-09-24",
    time: "10:30 AM",
    amount: "$150.00",
    isIncome: false,
    note: "Monthly internet and TV bill",
    status: "Completed",
  },
  {
    name: "Consulting Fee",
    category: "Services",
    icon: Briefcase,
    txId: "4567890140",
    date: "2028-09-24",
    time: "02:00 PM",
    amount: "+$1,500.00",
    isIncome: true,
    note: "Payment for consulting services",
    status: "Completed",
  },
  {
    name: "Amazon Purchase",
    category: "Food & Dining",
    icon: ShoppingCart,
    txId: "4567890124",
    date: "2028-09-23",
    time: "03:45 PM",
    amount: "$80.95",
    isIncome: false,
    note: "Purchased kitchen appliances",
    status: "Completed",
  },
  {
    name: "Gym Membership",
    category: "Healthcare",
    icon: Dumbbell,
    txId: "4567890125",
    date: "2028-09-22",
    time: "07:00 AM",
    amount: "$45.00",
    isIncome: false,
    note: "Monthly gym fee for health",
    status: "Completed",
  },
  {
    name: "Electricity Bill",
    category: "Utilities",
    icon: Zap,
    txId: "4567890128",
    date: "2028-09-19",
    time: "08:20 AM",
    amount: "$70.00",
    isIncome: false,
    note: "Home electricity bill",
    status: "Pending",
  },
]

const COLUMNS = [
  "Transaction",
  "ID",
  "Date & Time",
  "Amount",
  "Note",
  "Status",
]

export function TransactionsTable() {
  return (
    <div className="rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4 lg:px-6">
        <h3 className="text-sm font-semibold text-card-foreground">
          Recent Transactions
        </h3>
        <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring">
          <option>This Month</option>
          <option>Last Month</option>
          <option>Last 3 Months</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  aria-label="Select all transactions"
                />
              </th>
              {COLUMNS.map((col) => (
                <th key={col} className="px-4 py-3 text-left lg:px-5">
                  <button className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                    {col}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((tx, i) => {
              const Icon = tx.icon
              return (
                <tr
                  key={i}
                  className="group border-b border-border transition-colors last:border-0 hover:bg-muted/20"
                >
                  {/* Checkbox */}
                  <td className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input accent-primary"
                      aria-label={`Select ${tx.name}`}
                    />
                  </td>

                  {/* Transaction name */}
                  <td className="px-4 py-3.5 lg:px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          tx.isIncome
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {tx.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {tx.category}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* TX ID */}
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground lg:px-5">
                    {tx.txId}
                  </td>

                  {/* Date & Time */}
                  <td className="px-4 py-3.5 lg:px-5">
                    <p className="text-card-foreground">{tx.date}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {tx.time}
                    </p>
                  </td>

                  {/* Amount */}
                  <td
                    className={`px-4 py-3.5 font-semibold tabular-nums lg:px-5 ${
                      tx.isIncome ? "text-success" : "text-destructive"
                    }`}
                  >
                    {tx.amount}
                  </td>

                  {/* Note */}
                  <td className="max-w-[180px] truncate px-4 py-3.5 text-muted-foreground lg:px-5">
                    {tx.note}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 lg:px-5">
                    <Badge
                      className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                        tx.status === "Completed"
                          ? "border-success/20 bg-success/10 text-success hover:bg-success/10"
                          : "border-warning/20 bg-warning/10 text-warning hover:bg-warning/10"
                      }`}
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
  )
}
