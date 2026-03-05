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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateCreditCard } from "@/app/actions/credit-cards"
import type { CreditCardData } from "@/components/credit-card/credit-card-visual"
import { toast } from "@/hooks/use-toast"

const CURRENCIES = [
  { value: "PHP", label: "PHP" },
  { value: "USD", label: "USD" },
] as const

function formatCreditLimitInput(value: string): string {
  if (!value) return ""
  const cleaned = value.replace(/[^\d.]/g, "")
  const parts = cleaned.split(".")
  const intPart = parts[0] ?? ""
  const decPart = parts.slice(1).join("").slice(0, 2)
  const hasDecimal = parts.length > 1
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return hasDecimal ? `${formattedInt}.${decPart}` : formattedInt
}

interface EditCreditCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: CreditCardData | null
  onCompleted?: () => void
}

export function EditCreditCardDialog({
  open,
  onOpenChange,
  card,
  onCompleted,
}: EditCreditCardDialogProps) {
  const [name, setName] = useState("")
  const [lastFour, setLastFour] = useState("")
  const [creditLimit, setCreditLimit] = useState("")
  const [balanceOwed, setBalanceOwed] = useState("")
  const [currency, setCurrency] = useState("PHP")
  const [statementDay, setStatementDay] = useState("")
  const [paymentDueDay, setPaymentDueDay] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && card) {
      setName(card.name)
      const digits = (card.masked_identifier ?? "").replace(/\D/g, "").slice(-4)
      setLastFour(digits)
      setCreditLimit(String(card.credit_limit))
      setBalanceOwed(String(card.balance_owed))
      setCurrency(card.currency ?? "PHP")
      setStatementDay(card.statement_day != null ? String(card.statement_day) : "")
      setPaymentDueDay(card.payment_due_day != null ? String(card.payment_due_day) : "")
    }
  }, [open, card])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!card) return

    const digits = lastFour.replace(/\D/g, "")
    if (digits.length !== 4) {
      toast({
        title: "Invalid input",
        description: "Enter the last 4 digits of your card.",
        variant: "destructive",
      })
      return
    }

    const parsedLimit = parseFloat(creditLimit.replace(/,/g, ""))
    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
      toast({
        title: "Invalid input",
        description: "Credit limit must be zero or greater.",
        variant: "destructive",
      })
      return
    }

    const parsedBalance = parseFloat(balanceOwed.replace(/,/g, ""))
    if (!Number.isFinite(parsedBalance) || parsedBalance < 0 || parsedBalance > parsedLimit) {
      toast({
        title: "Invalid input",
        description: "Balance owed must be zero or greater and not exceed credit limit.",
        variant: "destructive",
      })
      return
    }

    const masked = `•••• •••• •••• ${digits}`
    setIsSubmitting(true)
    const result = await updateCreditCard(card.id, {
      name: name.trim(),
      maskedIdentifier: masked,
      creditLimit: parsedLimit,
      balanceOwed: parsedBalance,
      currency,
      statementDay: statementDay ? parseInt(statementDay, 10) : null,
      paymentDueDay: paymentDueDay ? parseInt(paymentDueDay, 10) : null,
    })

    if (result.success) {
      toast({ title: "Card updated", description: "Your credit card has been updated." })
      onCompleted?.()
      onOpenChange(false)
    } else {
      toast({ title: "Update failed", description: result.error, variant: "destructive" })
    }
    setIsSubmitting(false)
  }

  if (!card) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update credit card</DialogTitle>
          <DialogDescription>
            Edit the details for {card.masked_identifier}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Card name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BPI Platinum Visa"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-last-four">Last 4 digits</Label>
              <Input
                id="edit-last-four"
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="5487"
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="edit-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-limit">Credit limit</Label>
              <Input
                id="edit-limit"
                value={creditLimit}
                onChange={(e) => setCreditLimit(formatCreditLimitInput(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-balance">Balance owed</Label>
              <Input
                id="edit-balance"
                value={balanceOwed}
                onChange={(e) => setBalanceOwed(formatCreditLimitInput(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-statement">Statement day (1–28)</Label>
              <Input
                id="edit-statement"
                type="number"
                min={1}
                max={28}
                value={statementDay}
                onChange={(e) => setStatementDay(e.target.value)}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-due">Payment due day (1–31)</Label>
              <Input
                id="edit-due"
                type="number"
                min={1}
                max={31}
                value={paymentDueDay}
                onChange={(e) => setPaymentDueDay(e.target.value)}
                placeholder="22"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
