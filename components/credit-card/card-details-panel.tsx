"use client"

import { Badge } from "@/components/ui/badge"
import { formatCurrency, type CreditCardData } from "@/components/credit-card/credit-card-visual"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { CreditCard, TrendingUp, Percent, Shield, FileDown, FileUp, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CardDetailsPanelProps {
  card: CreditCardData | null
}

export function CardDetailsPanel({ card }: CardDetailsPanelProps) {
  const creditUtilizationPercent =
    card && card.credit_limit > 0
      ? Math.min(100, (card.balance_owed / card.credit_limit) * 100)
      : 0

  const spendingData = [
    { name: "Used", value: creditUtilizationPercent },
    { name: "Remaining", value: 100 - creditUtilizationPercent },
  ]

  const utilizationColor =
    creditUtilizationPercent > 75
      ? "oklch(0.58 0.22 25)"
      : creditUtilizationPercent > 50
        ? "oklch(0.75 0.16 65)"
        : "oklch(0.52 0.14 250)"

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center">
        <CreditCard className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Select a card to view details
        </p>
      </div>
    )
  }

  const availableCredit = card.credit_limit - card.balance_owed

  return (
    <div className="rounded-2xl border border-border bg-card p-5 lg:p-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Card Details
          </p>
          <p className="mt-1 text-xl font-bold tracking-widest text-card-foreground lg:text-2xl">
            {card.masked_identifier}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge
            className={
              card.is_active
                ? "inline-flex items-center rounded-full border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success"
                : "inline-flex items-center rounded-full border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive"
            }
          >
            {card.is_active ? "Active" : "Inactive"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="More options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <FileDown className="mr-2 h-4 w-4" />
                Import
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FileUp className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats grid + Utilization chart */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Stats */}
        <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<CreditCard className="h-4 w-4" />}
            label="Balance Owed"
            value={formatCurrency(card.balance_owed, card.currency)}
            variant="default"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Available Credit"
            value={formatCurrency(availableCredit, card.currency)}
            variant="success"
          />
          <StatCard
            icon={<Shield className="h-4 w-4" />}
            label="Credit Limit"
            value={formatCurrency(card.credit_limit, card.currency)}
            variant="default"
          />
          <StatCard
            icon={<Percent className="h-4 w-4" />}
            label="Utilization"
            value={`${Math.round(creditUtilizationPercent)}%`}
            variant={
              creditUtilizationPercent > 75
                ? "danger"
                : creditUtilizationPercent > 50
                  ? "warning"
                  : "success"
            }
          />
        </div>
      </div>

      {/* Spending Limits Section */}
      <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 lg:p-5">
        <h3 className="text-sm font-semibold text-card-foreground">
          Spending Limits
        </h3>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative h-28 w-28 shrink-0 lg:h-32 lg:w-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="85%"
                  paddingAngle={3}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill={utilizationColor} />
                  <Cell fill="oklch(0.93 0.005 250)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-card-foreground">
                {Math.round(creditUtilizationPercent)}%
              </span>
              <span className="text-[10px] text-muted-foreground">used</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Amount Owed</p>
              <p className="text-sm font-bold text-card-foreground">
                {formatCurrency(card.balance_owed, card.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Limit</p>
              <p className="text-sm font-bold text-card-foreground">
                {formatCurrency(card.credit_limit, card.currency)}
              </p>
            </div>
            {/* Utilization bar */}
            <div className="w-40">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${creditUtilizationPercent}%`,
                    backgroundColor: utilizationColor,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode
  label: string
  value: string
  variant: "default" | "success" | "warning" | "danger"
}) {
  const iconBgMap = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 lg:p-4">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBgMap[variant]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-bold tabular-nums text-card-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}
