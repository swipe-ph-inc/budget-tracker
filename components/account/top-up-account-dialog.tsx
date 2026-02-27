"use client"

import { useState } from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { SuccessMessage, ErrorMessage } from "@/components/ui/status-message"
import { createTopUp } from "@/app/actions/transaction"

/** Formats a numeric input string with locale thousands separators (e.g. 1234567.89 -> 1,234,567.89) */
function formatAmountInput(value: string): string {
  if (!value) return ""
  let cleaned = value.replace(/[^\d.]/g, "")
  const firstDotIndex = cleaned.indexOf(".")
  if (firstDotIndex !== -1) {
    cleaned =
      cleaned.slice(0, firstDotIndex + 1) +
      cleaned.slice(firstDotIndex + 1).replace(/\./g, "")
  }
  const hasDecimal = cleaned.includes(".")
  let [intPart = "", decPart = ""] = cleaned.split(".")
  if (intPart === "" && hasDecimal) {
    intPart = "0"
  }
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  if (hasDecimal && cleaned.endsWith(".")) {
    return `${formattedInt}.`
  }

  if (hasDecimal) {
    return `${formattedInt}.${decPart.slice(0, 2)}`
  }

  return formattedInt
}

interface TopUpAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  accountName: string
  currency: string
  onCompleted?: () => void
}

export function TopUpAccountDialog({
  open,
  onOpenChange,
  accountId,
  accountName,
  currency,
  onCompleted,
}: TopUpAccountDialogProps) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState<
    { type: "success" | "error"; message: string } | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStatus(null)
      setAmount("")
      setNote("")
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleaned = amount.replace(/,/g, "").trim()
    const parsed = parseFloat(cleaned)

    if (!cleaned || Number.isNaN(parsed) || parsed <= 0) {
      setStatus({
        type: "error",
        message: "Please enter a valid amount greater than zero.",
      })
      return
    }

    setIsSubmitting(true)
    const result = await createTopUp({
      accountId,
      amount: parsed,
      currency,
      note: note.trim() || undefined,
    })

    if (result.success) {
      setStatus({ type: "success", message: "Top-up recorded successfully." })
      onCompleted?.()
      setTimeout(() => {
        handleClose(false)
      }, 1200)
    } else {
      setStatus({ type: "error", message: result.error })
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Top Up Account</DialogTitle>
          <DialogDescription>
            Add funds to <span className="font-medium">{accountName}</span>.
          </DialogDescription>
        </DialogHeader>

        {status && (
          <div className="sm:col-span-2">
            {status.type === "success" ? (
              <SuccessMessage message={status.message} />
            ) : (
              <ErrorMessage message={status.message} />
            )}
          </div>
        )}

        <form
          className="grid grid-cols-1 gap-6 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2">
            <Label htmlFor="topup-amount">Amount</Label>
            <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Input
                id="topup-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                aria-describedby="topup-amount-hint"
                className="min-w-0 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex h-10 items-center px-3 text-xs font-medium text-muted-foreground">
                {currency}
              </div>
            </div>
            <p
              id="topup-amount-hint"
              className="text-xs text-muted-foreground"
            >
              The amount you want to add to this account.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="topup-note">Note (optional)</Label>
            <Textarea
              id="topup-note"
              placeholder="e.g. Transfer from payroll, cash deposit..."
              rows={3}
              maxLength={255}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Topping up..." : "Top Up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

