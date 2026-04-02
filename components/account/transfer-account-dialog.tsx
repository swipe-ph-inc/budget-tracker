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
import { createTransfer } from "@/app/actions/transaction"

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

export type TransferAccountOption = {
  id: string
  name: string
  balance: number
  currency: string
}

interface TransferAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: TransferAccountOption[]
  selectedAccountId?: string
  onCompleted?: () => void
}

export function TransferAccountDialog({
  open,
  onOpenChange,
  accounts,
  selectedAccountId,
  onCompleted,
}: TransferAccountDialogProps) {
  const [fromAccountId, setFromAccountId] = useState<string>("")
  const [toAccountId, setToAccountId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [feeAmount, setFeeAmount] = useState("")
  const [transferMethod, setTransferMethod] = useState<
    "instaPay" | "pesoNet" | "wire" | "cash"
  >("instaPay")
  const [transferType, setTransferType] = useState<"local" | "international">(
    "local",
  )
  const [status, setStatus] = useState<
    { type: "success" | "error"; message: string } | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const toAccount = accounts.find((a) => a.id === toAccountId)
  const currency = fromAccount?.currency ?? "PHP"
  const toOptions = accounts.filter((a) => a.id !== fromAccountId)
  const fromOptions = accounts.filter((a) => a.id !== toAccountId)

  useEffect(() => {
    if (open) {
      setStatus(null)
      setFromAccountId(selectedAccountId ?? "")
      setToAccountId("")
      setAmount("")
      setNote("")
      setFeeAmount("")
      setTransferMethod("instaPay")
      setTransferType("local")
    }
  }, [open, selectedAccountId])

  useEffect(() => {
    if (fromAccountId && toAccountId === fromAccountId) {
      setToAccountId("")
    }
  }, [fromAccountId, toAccountId])

  useEffect(() => {
    if (toAccountId && fromAccountId === toAccountId) {
      setFromAccountId("")
    }
  }, [toAccountId, fromAccountId])

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStatus(null)
      setFromAccountId("")
      setToAccountId("")
      setAmount("")
      setNote("")
      setFeeAmount("")
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fromAccountId || !toAccountId) {
      setStatus({
        type: "error",
        message: "Please select both source and destination accounts.",
      })
      return
    }

    if (fromAccountId === toAccountId) {
      setStatus({
        type: "error",
        message: "Source and destination accounts must be different.",
      })
      return
    }

    const cleaned = amount.replace(/,/g, "").trim()
    const parsed = parseFloat(cleaned)

    if (!cleaned || Number.isNaN(parsed) || parsed <= 0) {
      setStatus({
        type: "error",
        message: "Please enter a valid amount greater than zero.",
      })
      return
    }

    const cleanedFee = feeAmount.replace(/,/g, "").trim()
    const parsedFee = cleanedFee ? parseFloat(cleanedFee) : 0
    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setStatus({
        type: "error",
        message: "Fee amount must be zero or greater.",
      })
      return
    }

    if (fromAccount && (fromAccount.balance ?? 0) < parsed + parsedFee) {
      setStatus({
        type: "error",
        message: "Insufficient balance in the source account.",
      })
      return
    }

    if (fromAccount && toAccount && fromAccount.currency !== toAccount.currency) {
      setStatus({
        type: "error",
        message: "Source and destination accounts must use the same currency.",
      })
      return
    }

    setIsSubmitting(true)
    const result = await createTransfer({
      fromAccountId,
      toAccountId,
      amount: parsed,
      currency,
      note: note.trim() || undefined,
      transferMethod,
      transferType,
      feeAmount: parsedFee,
      feeCurrency: parsedFee > 0 ? currency : undefined,
    })

    if (result.success) {
      setStatus({ type: "success", message: "Transfer completed successfully." })
      onCompleted?.()
      setTimeout(() => {
        handleClose(false)
      }, 1200)
    } else {
      setStatus({ type: "error", message: result.error })
    }
    setIsSubmitting(false)
  }

  const canTransfer = accounts.length >= 2

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Transfer Between Accounts</DialogTitle>
          <DialogDescription>
            Move funds from one account to another. Both accounts must use the
            same currency.
          </DialogDescription>
        </DialogHeader>

        {!canTransfer && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Add at least 2 accounts to transfer between them.
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

        <form
          className="grid grid-cols-1 gap-6 py-4 sm:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="transfer-from">From Account</Label>
            <Select
              value={fromAccountId}
              onValueChange={setFromAccountId}
              disabled={!canTransfer}
            >
              <SelectTrigger id="transfer-from">
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {fromOptions.map((acc) => {
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

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="transfer-to">To Account</Label>
            <Select
              value={toAccountId}
              onValueChange={setToAccountId}
              disabled={!canTransfer || !fromAccountId}
            >
              <SelectTrigger id="transfer-to">
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {toOptions.map((acc) => {
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

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="transfer-amount">Amount</Label>
            <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Input
                id="transfer-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                disabled={!fromAccountId || !toAccountId}
                className="min-w-0 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex h-10 shrink-0 items-center px-3 text-xs font-medium text-muted-foreground">
                {currency}
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="transfer-fee">Fee Amount (optional)</Label>
            <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Input
                id="transfer-fee"
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

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="transfer-note">Note (optional)</Label>
            <Textarea
              id="transfer-note"
              placeholder="e.g. Monthly savings transfer"
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
                !canTransfer ||
                !fromAccountId ||
                !toAccountId ||
                !amount
              }
            >
              {isSubmitting ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
