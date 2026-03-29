"use client"

import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SuccessMessage, ErrorMessage } from "@/components/ui/status-message"
import { createPayment } from "@/app/actions/transaction"
import { getMerchantsWithCategories, type MerchantWithCategory } from "@/app/actions/merchants"
import { Loader2 } from "lucide-react"

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
  if (intPart === "" && hasDecimal) intPart = "0"
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  if (hasDecimal && cleaned.endsWith(".")) return `${formattedInt}.`
  if (hasDecimal) return `${formattedInt}.${decPart.slice(0, 2)}`
  return formattedInt
}

export type PaymentAccountOption = {
  id: string
  name: string
  balance: number
  currency: string
}

interface PaymentAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: PaymentAccountOption[]
  selectedAccountId?: string
  onCompleted?: () => void
}

export function PaymentAccountDialog({
  open,
  onOpenChange,
  accounts,
  selectedAccountId,
  onCompleted,
}: PaymentAccountDialogProps) {
  // Form state
  const [fromAccountId, setFromAccountId] = useState<string>("")
  const [merchantId, setMerchantId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [feeAmount, setFeeAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [merchants, setMerchants] = useState<MerchantWithCategory[]>([])
  const [merchantsLoading, setMerchantsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const currency = fromAccount?.currency ?? "PHP"

  // Reset form on open
  useEffect(() => {
    if (open) {
      setStatus(null)
      setFromAccountId(selectedAccountId ?? "")
      setMerchantId("")
      setAmount("")
      setNote("")
      setFeeAmount("")
      setDueDate("")
    }
  }, [open, selectedAccountId])

  useEffect(() => {
    if (!open) return
    setMerchantsLoading(true)
    getMerchantsWithCategories()
      .then(setMerchants)
      .catch(() => setMerchants([]))
      .finally(() => setMerchantsLoading(false))
  }, [open])

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStatus(null)
      setFromAccountId("")
      setMerchantId("")
      setAmount("")
      setNote("")
      setFeeAmount("")
      setDueDate("")
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fromAccountId) {
      setStatus({ type: "error", message: "Please select an account to pay from." })
      return
    }
    if (!merchantId) {
      setStatus({ type: "error", message: "Please select a merchant." })
      return
    }

    const cleaned = amount.replace(/,/g, "").trim()
    const parsed = parseFloat(cleaned)
    if (!cleaned || Number.isNaN(parsed) || parsed <= 0) {
      setStatus({ type: "error", message: "Please enter a valid amount greater than zero." })
      return
    }

    const cleanedFee = feeAmount.replace(/,/g, "").trim()
    const parsedFee = cleanedFee ? parseFloat(cleanedFee) : 0
    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setStatus({ type: "error", message: "Fee amount must be zero or greater." })
      return
    }

    if (fromAccount && (fromAccount.balance ?? 0) < parsed + parsedFee) {
      setStatus({ type: "error", message: "Insufficient balance in the account." })
      return
    }

    setIsSubmitting(true)
    const result = await createPayment({
      fromAccountId,
      merchantId,
      amount: parsed,
      currency,
      note: note.trim() || undefined,
      feeAmount: parsedFee,
      feeCurrency: parsedFee > 0 ? currency : undefined,
      dueDate: dueDate.trim() || undefined,
    })
    setIsSubmitting(false)

    if (result.success) {
      setStatus({ type: "success", message: "Payment completed successfully." })
      onCompleted?.()
      setTimeout(() => handleClose(false), 1200)
    } else {
      setStatus({ type: "error", message: result.error })
    }
  }

  const hasAccounts = accounts.length >= 1
  const hasMerchants = merchants.length >= 1

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Make a Payment</DialogTitle>
          <DialogDescription>
            Pay a merchant from your account. The amount will be deducted immediately.
          </DialogDescription>
        </DialogHeader>

        {!hasAccounts && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Add an account to make payments.
          </p>
        )}

        {hasAccounts && !hasMerchants && !merchantsLoading && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            No merchants found. Add merchants to make payments.
          </p>
        )}

        {status && (
          <div className="sm:col-span-2">
            {status.type === "success" ? (
              <SuccessMessage message={status.message} />
            ) : (
              <ErrorMessage message={status.message} />
            )}
          </div>
        )}

        <form className="grid grid-cols-1 gap-5 py-2 sm:grid-cols-2" onSubmit={handleSubmit}>

          {/* From Account */}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="payment-from">From Account</Label>
            <Select
              value={fromAccountId}
              onValueChange={setFromAccountId}
              disabled={!hasAccounts}
            >
              <SelectTrigger id="payment-from">
                <SelectValue placeholder="Select account to pay from" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => {
                  const balanceStr = new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: acc.currency,
                    minimumFractionDigits: 2,
                  }).format(acc.balance)
                  return (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} — {balanceStr}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Merchant */}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="payment-merchant">Pay To (Merchant)</Label>
            <Select
              value={merchantId}
              onValueChange={setMerchantId}
              disabled={!hasMerchants || merchantsLoading}
            >
              <SelectTrigger id="payment-merchant">
                <SelectValue
                  placeholder={merchantsLoading ? "Loading merchants..." : "Select merchant"}
                />
              </SelectTrigger>
              <SelectContent>
                {merchants.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="payment-amount">Amount</Label>
            <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Input
                id="payment-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                disabled={!fromAccountId || !merchantId}
                className="min-w-0 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex h-10 shrink-0 items-center px-3 text-xs font-medium text-muted-foreground">
                {currency}
              </div>
            </div>
          </div>

          {/* Fee */}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="payment-fee">Fee Amount (optional)</Label>
            <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Input
                id="payment-fee"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={feeAmount}
                onChange={(e) => setFeeAmount(formatAmountInput(e.target.value))}
                className="min-w-0 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex h-10 shrink-0 items-center px-3 text-xs font-medium text-muted-foreground">
                {currency}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="payment-due">Due Date (optional)</Label>
            <Input
              id="payment-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Note */}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="payment-note">Note (optional)</Label>
            <Textarea
              id="payment-note"
              placeholder="e.g. Monthly subscription, invoice #123"
              rows={3}
              maxLength={255}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-2 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !hasAccounts ||
                !hasMerchants ||
                !fromAccountId ||
                !merchantId ||
                !amount
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                "Submit Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
