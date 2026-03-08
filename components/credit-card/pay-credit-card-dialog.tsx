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
import { payCreditCard, getCreditCards } from "@/app/actions/credit-cards"
import { getAccounts } from "@/app/actions/accounts"
import { ErrorMessage } from "@/components/ui/status-message"
import { toast } from "@/hooks/use-toast"
import type { Tables } from "@/lib/supabase/database.types"

type CreditCardRow = Tables<"credit_card">
type AccountRow = Tables<"account">

function formatBalance(account: AccountRow): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: account.currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(account.balance ?? 0)
}

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

interface PayCreditCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

export function PayCreditCardDialog({
  open,
  onOpenChange,
  onCompleted,
}: PayCreditCardDialogProps) {
  const [creditCardId, setCreditCardId] = useState("")
  const [fromAccountId, setFromAccountId] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [creditCards, setCreditCards] = useState<CreditCardRow[]>([])
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCreditCards = useCallback(async () => {
    setCardsLoading(true)
    try {
      const data = await getCreditCards()
      setCreditCards(data ?? [])
      if (data?.length && !creditCardId) {
        const withBalance = data.filter((c) => (c.balance_owed ?? 0) > 0)
        setCreditCardId((prev) => prev || withBalance[0]?.id || data[0]?.id || "")
      }
    } catch {
      toast({
        title: "Failed to load credit cards",
        description: "Could not load credit cards. Please try again.",
        variant: "destructive",
      })
      setCreditCards([])
    } finally {
      setCardsLoading(false)
    }
  }, [creditCardId])

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true)
    try {
      const data = await getAccounts()
      setAccounts(data ?? [])
      if (data?.length && !fromAccountId) {
        setFromAccountId((prev) => prev || data[0]?.id || "")
      }
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
  }, [fromAccountId])

  useEffect(() => {
    if (open) {
      setStatus(null)
      setAmount("")
      setNote("")
      setCreditCardId("")
      setFromAccountId("")
      fetchCreditCards()
      fetchAccounts()
    }
  }, [open, fetchCreditCards, fetchAccounts])

  const selectedCard = creditCards.find((c) => c.id === creditCardId)
  const selectedAccount = accounts.find((a) => a.id === fromAccountId)
  const balanceOwed = selectedCard?.balance_owed ?? 0
  const accountBalance = selectedAccount?.balance ?? 0
  const currency = selectedCard?.currency ?? selectedAccount?.currency ?? "PHP"

  const setPayFullBalance = () => {
    if (balanceOwed > 0) {
      setAmount(
        balanceOwed.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)

    if (!creditCardId) {
      setStatus({ type: "error", message: "Please select a credit card." })
      return
    }
    if (!fromAccountId) {
      setStatus({ type: "error", message: "Please select an account to pay from." })
      return
    }
    const parsedAmount = parseFloat(amount.replace(/,/g, ""))
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setStatus({ type: "error", message: "Please enter a valid amount." })
      return
    }
    if (balanceOwed <= 0) {
      setStatus({ type: "error", message: "This card has no balance to pay." })
      return
    }
    if (parsedAmount > accountBalance) {
      setStatus({ type: "error", message: "Amount exceeds account balance." })
      return
    }

    setIsSubmitting(true)
    const result = await payCreditCard({
      creditCardId,
      fromAccountId,
      amount: parsedAmount,
      note: note.trim() || null,
    })

    if (result.success) {
      toast({
        title: "Payment sent",
        description: "Your credit card payment has been recorded.",
      })
      onCompleted?.()
      onOpenChange(false)
    } else {
      setStatus({ type: "error", message: result.error })
    }
    setIsSubmitting(false)
  }

  const handleCancel = () => {
    setStatus(null)
    onOpenChange(false)
  }

  const cardsWithBalance = creditCards.filter((c) => (c.balance_owed ?? 0) > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay credit card</DialogTitle>
          <DialogDescription>
            Pay off your credit card balance from a linked account. The amount will be deducted from
            the account and applied to the card balance.
          </DialogDescription>
        </DialogHeader>

        {status && <ErrorMessage message={status.message} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-card">Credit card</Label>
            <Select
              value={creditCardId}
              onValueChange={(id) => {
                setCreditCardId(id)
                const card = creditCards.find((c) => c.id === id)
                if (card && (card.balance_owed ?? 0) > 0) setAmount("")
              }}
              disabled={cardsLoading || creditCards.length === 0}
            >
              <SelectTrigger id="pay-card">
                <SelectValue
                  placeholder={
                    cardsLoading
                      ? "Loading..."
                      : creditCards.length === 0
                        ? "No credit cards"
                        : "Select card"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {creditCards.map((c) => {
                  const owed = c.balance_owed ?? 0
                  return (
                    <SelectItem key={c.id} value={c.id} disabled={owed <= 0}>
                      {c.name} ({c.masked_identifier}) ·{" "}
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: c.currency ?? "PHP",
                        minimumFractionDigits: 2,
                      }).format(owed)}{" "}
                      owed
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedCard && balanceOwed > 0 && (
              <p className="text-xs text-muted-foreground">
                Balance owed:{" "}
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency,
                  minimumFractionDigits: 2,
                }).format(balanceOwed)}
              </p>
            )}
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
                    {a.name} ({a.masked_identifier}) · {formatBalance(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="pay-amount">Amount</Label>
              {balanceOwed > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-primary"
                  onClick={setPayFullBalance}
                >
                  Pay full balance
                </Button>
              )}
            </div>
            <Input
              id="pay-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
            />
            {selectedAccount && (
              <p className="text-xs text-muted-foreground">
                Available:{" "}
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: selectedAccount.currency ?? "PHP",
                  minimumFractionDigits: 2,
                }).format(accountBalance)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-note">Note (optional)</Label>
            <Input
              id="pay-note"
              type="text"
              placeholder="e.g. Monthly payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={255}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !creditCardId ||
                !fromAccountId ||
                !amount ||
                parseFloat(amount.replace(/,/g, "")) <= 0 ||
                balanceOwed <= 0 ||
                cardsWithBalance.length === 0
              }
            >
              {isSubmitting ? "Paying..." : "Pay"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
