"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, type CreditCardData } from "@/components/credit-card/credit-card-visual"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { CreditCard, TrendingUp, Percent, Shield, FileDown, FileUp, MoreHorizontal, Pencil, Ban, Lock, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  blockCreditCard,
  unblockCreditCard,
  setTemporarilyBlockedCreditCard,
} from "@/app/actions/credit-cards"
import { EditCreditCardDialog } from "@/components/credit-card/edit-credit-card-dialog"
import { toast } from "@/hooks/use-toast"

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return "th"
  const d = n % 10
  if (d === 1) return "st"
  if (d === 2) return "nd"
  if (d === 3) return "rd"
  return "th"
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`font-medium tabular-nums ${valueClassName ?? "text-card-foreground"}`}
      >
        {value}
      </dd>
    </div>
  )
}

interface CardDetailsPanelProps {
  card: CreditCardData | null
  onCardUpdated?: () => void
}

export function CardDetailsPanel({ card, onCardUpdated }: CardDetailsPanelProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false)
  const [tempBlockConfirmOpen, setTempBlockConfirmOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
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
      <div className="flex min-h-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center">
        <CreditCard className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Select a card to view details
        </p>
      </div>
    )
  }

  const reserved = card.installment_reserved ?? 0
  const availableCredit = Math.max(0, card.credit_limit - card.balance_owed - reserved)

  return (
    <div className="flex min-h-full flex-col overflow-y-auto rounded-2xl border border-border bg-card p-5 lg:p-6">
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
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/cards/history?cardId=${card.id}`} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FileDown className="h-4 w-4" />
                Import
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FileUp className="h-4 w-4" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Action buttons: Update, Block, Temporarily block */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditDialogOpen(true)}
          className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
        >
          <Pencil className="h-3.5 w-3.5" />
          Update card
        </Button>
        {card.is_blocked ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={actionLoading}
            onClick={async () => {
              setActionLoading(true)
              const result = await unblockCreditCard(card.id)
              setActionLoading(false)
              if (result.success) {
                toast({ title: "Card unblocked", description: "The card is active again." })
                onCardUpdated?.()
              } else {
                toast({ title: "Failed to unblock", description: result.error, variant: "destructive" })
              }
            }}
            className="gap-2 text-success border-success/40"
          >
            <Ban className="h-3.5 w-3.5" />
            Unblock card
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBlockConfirmOpen(true)}
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <Ban className="h-3.5 w-3.5" />
            Block card
          </Button>
        )}
        {card.is_temporary_blocked ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={actionLoading}
            onClick={async () => {
              setActionLoading(true)
              const result = await setTemporarilyBlockedCreditCard(card.id, false)
              setActionLoading(false)
              if (result.success) {
                toast({ title: "Temporary block removed", description: "The card can be used again." })
                onCardUpdated?.()
              } else {
                toast({ title: "Failed", description: result.error, variant: "destructive" })
              }
            }}
            className="gap-2 text-success border-success/40"
          >
            <Lock className="h-3.5 w-3.5" />
            Remove temporary block
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTempBlockConfirmOpen(true)}
            className="gap-2 border-warning/40 text-warning hover:bg-warning/10"
          >
            <Lock className="h-3.5 w-3.5" />
            Temporarily block
          </Button>
        )}
      </div>

      {/* Block confirmation */}
      <AlertDialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this card?</AlertDialogTitle>
            <AlertDialogDescription>
              The card will be blocked and cannot be used for payments until you unblock it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setActionLoading(true)
                const result = await blockCreditCard(card.id)
                setActionLoading(false)
                setBlockConfirmOpen(false)
                if (result.success) {
                  toast({ title: "Card blocked", description: "The card has been blocked." })
                  onCardUpdated?.()
                } else {
                  toast({ title: "Failed to block", description: result.error, variant: "destructive" })
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Block card
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Temporarily block confirmation */}
      <AlertDialog open={tempBlockConfirmOpen} onOpenChange={setTempBlockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Temporarily block this card?</AlertDialogTitle>
            <AlertDialogDescription>
              The card will be temporarily blocked. You can remove the block later without fully unblocking the card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setActionLoading(true)
                const result = await setTemporarilyBlockedCreditCard(card.id, true)
                setActionLoading(false)
                setTempBlockConfirmOpen(false)
                if (result.success) {
                  toast({ title: "Card temporarily blocked", description: "You can remove the block from this panel." })
                  onCardUpdated?.()
                } else {
                  toast({ title: "Failed", description: result.error, variant: "destructive" })
                }
              }}
            >
              Temporarily block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditCreditCardDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        card={card}
        onCompleted={onCardUpdated}
      />

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

      {/* Spending Limits + Billing & status row (50/50 on large screens) */}
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Spending Limits Section — 50% */}
        <div className="min-w-0 flex-1 rounded-xl border border-border bg-muted/30 p-4 lg:w-1/2 lg:p-5">
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

        {/* Billing & status — 50% */}
        <div className="min-w-0 flex-1 rounded-xl border border-border bg-muted/30 p-4 lg:w-1/2 lg:p-5">
          <h3 className="text-sm font-semibold text-card-foreground">
            Billing & status
          </h3>
          <dl className="mt-4 space-y-3">
            <DetailRow
              label="Statement date"
              value={
                card.statement_day != null
                  ? `${card.statement_day}${ordinal(card.statement_day)} of month`
                  : "—"
              }
            />
            <DetailRow
              label="Payment due date"
              value={
                card.payment_due_day != null
                  ? `${card.payment_due_day}${ordinal(card.payment_due_day)} of month`
                  : "—"
              }
            />
            <DetailRow label="Currency" value={card.currency || "—"} />
            <DetailRow
              label="Blocked"
              value={
                card.is_blocked === true
                  ? "Yes"
                  : card.is_blocked === false
                    ? "No"
                    : "—"
              }
              valueClassName={
                card.is_blocked === true
                  ? "text-destructive"
                  : card.is_blocked === false
                    ? "text-success"
                    : "text-muted-foreground"
              }
            />
            <DetailRow
              label="Temporarily blocked"
              value={
                card.is_temporary_blocked === true
                  ? "Yes"
                  : "No"
              }
              valueClassName={
                card.is_temporary_blocked === true
                  ? "text-destructive"
                  : "text-success"
              }
            />
          </dl>
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
