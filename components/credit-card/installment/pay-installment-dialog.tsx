"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { payNextInstallment } from "@/app/actions/credit-cards"
import { getAccounts } from "@/app/actions/accounts"
import type { InstallmentPlanListItem } from "@/app/actions/credit-cards"
import { ErrorMessage } from "@/components/ui/status-message"
import { toast } from "@/hooks/use-toast"
import type { Tables } from "@/lib/supabase/database.types"

type AccountRow = Tables<"account">

function formatAmountInput(value: string): string {
  if (!value) return ""
  const cleaned = value.replace(/[^\d.]/g, "")
  const parts = cleaned.split(".")
  const intPart = parts[0] ?? ""
  const decPart = parts.slice(1).join("").slice(0, 2)
  const hasDecimal = parts.length > 1
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return hasDecimal ? `${formattedInt}.${decPart}` : formattedInt
}

interface PayInstallmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: InstallmentPlanListItem | null
  onCompleted?: () => void
}

export function PayInstallmentDialog({
  open,
  onOpenChange,
  plan,
  onCompleted,
}: PayInstallmentDialogProps) {
  const [fromAccountId, setFromAccountId] = useState("")
  const [feeAmount, setFeeAmount] = useState("")
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true)
    try {
      const data = await getAccounts()
      const active = (data ?? []).filter((a) => a.is_active && !a.is_deleted)
      setAccounts(active)
    } catch {
      toast({
        title: "Failed to load accounts",
        description: "Could not load accounts. Please try again.",
        variant: "destructive",
      })
      setAccounts([])
    } finally {
      setAccountsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setStatus(null)
      setFeeAmount("")
      setFromAccountId("")
      fetchAccounts()
    }
  }, [open, fetchAccounts])

  useEffect(() => {
    if (open && accounts.length && !fromAccountId) {
      setFromAccountId(accounts[0]!.id)
    }
  }, [open, accounts, fromAccountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan) return

    setStatus(null)
    if (!fromAccountId) {
      setStatus({ type: "error", message: "Please select an account to pay from." })
      return
    }

    const fee = feeAmount ? parseFloat(feeAmount.replace(/,/g, "")) : 0
    if (feeAmount && (Number.isNaN(fee) || fee < 0)) {
      setStatus({ type: "error", message: "Please enter a valid fee amount." })
      return
    }

    const selectedAccount = accounts.find((a) => a.id === fromAccountId)
    const totalCharge = plan.amountPerMonth + fee
    if (selectedAccount && (selectedAccount.balance ?? 0) < totalCharge) {
      setStatus({ type: "error", message: "Insufficient balance in the selected account." })
      return
    }

    setIsSubmitting(true)
    const result = await payNextInstallment({
      paymentId: plan.id,
      fromAccountId,
      feeAmount: fee,
    })

    if (result.success) {
      toast({
        title: "Payment recorded",
        description: `Installment payment for ${plan.merchantName} has been recorded.`,
      })
      onCompleted?.()
      onOpenChange(false)
    } else {
      setStatus({ type: "error", message: result.error })
    }
    setIsSubmitting(false)
  }

  if (!plan) return null

  const totalCharge = plan.amountPerMonth + (feeAmount ? parseFloat(feeAmount.replace(/,/g, "")) || 0 : 0)
  const selectedAccount = accounts.find((a) => a.id === fromAccountId)
  const hasInsufficientBalance =
    selectedAccount && (selectedAccount.balance ?? 0) < totalCharge

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay installment</DialogTitle>
          <DialogDescription>
            Pay this month&apos;s installment for {plan.merchantName} from your account.
          </DialogDescription>
        </DialogHeader>

        {status && <ErrorMessage message={status.message} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">Amount due this month</p>
            <p className="mt-1 font-semibold tabular-nums text-card-foreground">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: plan.currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(plan.amountPerMonth)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-from-account">Pay from account</Label>
            <Select
              value={fromAccountId}
              onValueChange={setFromAccountId}
              disabled={accountsLoading || accounts.length === 0}
            >
              <SelectTrigger id="pay-from-account">
                <SelectValue
                  placeholder={
                    accountsLoading
                      ? "Loading..."
                      : accounts.length === 0
                        ? "No accounts"
                        : "Select account"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.masked_identifier}) ·{" "}
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: a.currency ?? "PHP",
                      minimumFractionDigits: 2,
                    }).format(a.balance ?? 0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-fee">Transaction fee (optional)</Label>
            <Input
              id="pay-fee"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={feeAmount}
              onChange={(e) => setFeeAmount(formatAmountInput(e.target.value))}
            />
          </div>

          {hasInsufficientBalance && (
            <p className="text-sm text-destructive">
              Insufficient balance. Total charge:{" "}
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: plan.currency,
                minimumFractionDigits: 2,
              }).format(totalCharge)}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !fromAccountId ||
                hasInsufficientBalance ||
                accounts.length === 0
              }
            >
              {isSubmitting ? "Processing..." : "Pay installment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
