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
import { Checkbox } from "@/components/ui/checkbox"
import {
  getCreditCards,
  updateSubscriptionSchedule,
  type SubscriptionScheduleListItem,
} from "@/app/actions/credit-cards"
import { getMerchantsWithCategories, type MerchantWithCategory } from "@/app/actions/merchants"
import { AddMerchantDialog } from "@/components/merchant/add-merchant-dialog"
import { ErrorMessage } from "@/components/ui/status-message"
import { toast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import type { Tables } from "@/lib/supabase/database.types"

const CURRENCIES = [
  { value: "PHP", label: "PHP" },
  { value: "USD", label: "USD" },
] as const

const FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const

const BILLING_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function formatAvailableCredit(limit: number, owed: number, currency: string): string {
  const available = Math.max(0, (limit ?? 0) - (owed ?? 0))
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(available)
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

type CreditCardRow = Tables<"credit_card">

interface EditSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: SubscriptionScheduleListItem | null
  onCompleted?: () => void
}

export function EditSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onCompleted,
}: EditSubscriptionDialogProps) {
  const [merchantId, setMerchantId] = useState("")
  const [amount, setAmount] = useState("")
  const [frequency, setFrequency] = useState<"monthly" | "quarterly" | "yearly">("monthly")
  const [billingDay, setBillingDay] = useState(1)
  const [currency, setCurrency] = useState("PHP")
  const [creditCardId, setCreditCardId] = useState("")
  const [autoPayEnabled, setAutoPayEnabled] = useState(true)
  const [merchants, setMerchants] = useState<MerchantWithCategory[]>([])
  const [creditCards, setCreditCards] = useState<CreditCardRow[]>([])
  const [merchantsLoading, setMerchantsLoading] = useState(false)
  const [cardsLoading, setCardsLoading] = useState(false)
  const [addMerchantOpen, setAddMerchantOpen] = useState(false)
  const [status, setStatus] = useState<{ type: "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchMerchants = useCallback(async () => {
    setMerchantsLoading(true)
    try {
      const data = await getMerchantsWithCategories()
      setMerchants(data ?? [])
    } catch {
      toast({
        title: "Failed to load merchants",
        description: "Could not load merchants. Please try again.",
        variant: "destructive",
      })
      setMerchants([])
    } finally {
      setMerchantsLoading(false)
    }
  }, [])

  const fetchCreditCards = useCallback(async () => {
    setCardsLoading(true)
    try {
      const data = await getCreditCards()
      setCreditCards(data ?? [])
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
  }, [])

  useEffect(() => {
    if (open && subscription) {
      setStatus(null)
      setMerchantId(subscription.merchantId)
      setAmount(
        subscription.amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      )
      setFrequency(
        (subscription.recurrenceFrequency as "monthly" | "quarterly" | "yearly") || "monthly"
      )
      setBillingDay(new Date(subscription.nextDueDate).getDate() || 1)
      setCurrency(subscription.currency || "PHP")
      setCreditCardId(subscription.cardId)
      setAutoPayEnabled(subscription.autoPayEnabled)
      fetchMerchants()
      fetchCreditCards()
    }
  }, [open, subscription, fetchMerchants, fetchCreditCards])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscription) return
    setStatus(null)

    if (!creditCardId) {
      setStatus({ type: "error", message: "Please select a credit card." })
      return
    }
    if (!merchantId) {
      setStatus({ type: "error", message: "Please select a merchant." })
      return
    }
    const parsedAmount = parseFloat(amount.replace(/,/g, ""))
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setStatus({ type: "error", message: "Please enter a valid amount." })
      return
    }
    if (billingDay < 1 || billingDay > 31) {
      setStatus({ type: "error", message: "Billing day must be between 1 and 31." })
      return
    }

    setIsSubmitting(true)
    const result = await updateSubscriptionSchedule(subscription.id, {
      creditCardId,
      merchantId,
      amount: parsedAmount,
      frequency,
      billingDay,
      currency,
      autoPayEnabled,
    })

    if (result.success) {
      toast({
        title: "Subscription updated",
        description: "Your subscription has been updated successfully.",
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

  if (!subscription) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit subscription</DialogTitle>
            <DialogDescription>
              Update the recurring subscription for {subscription.merchantName}.
            </DialogDescription>
          </DialogHeader>

          {status && <ErrorMessage message={status.message} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subscription-card">Credit card</Label>
              <Select
                value={creditCardId}
                onValueChange={setCreditCardId}
                disabled={cardsLoading || creditCards.length === 0}
              >
                <SelectTrigger id="edit-subscription-card">
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
                  {creditCards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.masked_identifier}) ·{" "}
                      <span className="tabular-nums text-muted-foreground">
                        {formatAvailableCredit(
                          c.credit_limit ?? 0,
                          c.balance_owed ?? 0,
                          c.currency ?? "PHP"
                        )}{" "}
                        available
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subscription-merchant">Merchant</Label>
              <div className="flex gap-2">
                <Select
                  value={merchantId}
                  onValueChange={setMerchantId}
                  disabled={merchantsLoading}
                >
                  <SelectTrigger id="edit-subscription-merchant" className="min-w-0 flex-1">
                    <SelectValue
                      placeholder={
                        merchantsLoading ? "Loading..." : "Select merchant"
                      }
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setAddMerchantOpen(true)}
                  title="Add merchant"
                  aria-label="Add merchant"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subscription-amount">Amount</Label>
                <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                  <Input
                    id="edit-subscription-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                    className="min-w-0 flex-1 border-0 focus-visible:ring-0"
                  />
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-10 w-auto min-w-[72px] shrink-0 rounded-none border-0 border-l bg-transparent">
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
              <div className="space-y-2">
                <Label htmlFor="edit-subscription-frequency">Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as "monthly" | "quarterly" | "yearly")}
                >
                  <SelectTrigger id="edit-subscription-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subscription-billing-day">Billing day (1–31)</Label>
              <Select
                value={String(billingDay)}
                onValueChange={(v) => setBillingDay(parseInt(v, 10))}
              >
                <SelectTrigger id="edit-subscription-billing-day">
                  <SelectValue placeholder="Day of month" />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_DAYS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {[11, 12, 13].includes(d)
                        ? `${d}th`
                        : d % 10 === 1
                          ? `${d}st`
                          : d % 10 === 2
                            ? `${d}nd`
                            : d % 10 === 3
                              ? `${d}rd`
                              : `${d}th`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Day of the month when the subscription is charged (e.g. 12 = every 12th).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-subscription-auto-pay"
                checked={autoPayEnabled}
                onCheckedChange={(checked) => setAutoPayEnabled(checked === true)}
              />
              <Label
                htmlFor="edit-subscription-auto-pay"
                className="text-sm font-normal cursor-pointer"
              >
                Enable auto pay (charge automatically on billing day)
              </Label>
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
                  !merchantId ||
                  !amount ||
                  parseFloat(amount.replace(/,/g, "")) <= 0
                }
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddMerchantDialog
        open={addMerchantOpen}
        onOpenChange={setAddMerchantOpen}
        onAdded={(newMerchantId) => {
          fetchMerchants().then(() => setMerchantId(newMerchantId))
        }}
      />
    </>
  )
}
