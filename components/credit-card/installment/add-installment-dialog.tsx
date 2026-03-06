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
import { createInstallmentPlan, getCreditCards } from "@/app/actions/credit-cards"
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

const INSTALLMENT_MONTHS = [3, 6, 12, 24] as const

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

interface AddInstallmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, this card is used and the card selector is hidden. */
  creditCardId?: string
  onCompleted?: () => void
}

export function AddInstallmentDialog({
  open,
  onOpenChange,
  creditCardId: initialCreditCardId,
  onCompleted,
}: AddInstallmentDialogProps) {
  const [merchantId, setMerchantId] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [numMonths, setNumMonths] = useState<number>(12)
  const [firstDueDate, setFirstDueDate] = useState("")
  const [currency, setCurrency] = useState("PHP")
  const [creditCardId, setCreditCardId] = useState(initialCreditCardId ?? "")
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
      if (data?.length && !initialCreditCardId) {
        setCreditCardId((prev) => prev || data[0].id)
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
  }, [initialCreditCardId])

  useEffect(() => {
    if (open) {
      setStatus(null)
      setMerchantId("")
      setTotalAmount("")
      setNumMonths(12)
      setFirstDueDate("")
      setCurrency("PHP")
      setCreditCardId(initialCreditCardId ?? "")
      fetchMerchants()
      if (!initialCreditCardId) {
        fetchCreditCards()
      }
    }
  }, [open, initialCreditCardId, fetchMerchants, fetchCreditCards])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)

    const cardId = initialCreditCardId ?? creditCardId
    if (!cardId) {
      setStatus({ type: "error", message: "Please select a credit card." })
      return
    }
    if (!merchantId) {
      setStatus({ type: "error", message: "Please select a merchant." })
      return
    }
    const amount = parseFloat(totalAmount.replace(/,/g, ""))
    if (!totalAmount || Number.isNaN(amount) || amount <= 0) {
      setStatus({ type: "error", message: "Please enter a valid total amount." })
      return
    }
    if (!firstDueDate) {
      setStatus({ type: "error", message: "Please select the first payment due date." })
      return
    }

    setIsSubmitting(true)
    const result = await createInstallmentPlan({
      creditCardId: cardId,
      merchantId,
      totalAmount: amount,
      numMonths,
      firstDueDate,
      currency,
    })

    if (result.success) {
      toast({
        title: "Installment plan added",
        description: "Your installment plan has been created successfully.",
      })
      onCompleted?.()
      onOpenChange(false)
    } else {
      setStatus({ type: "error", message: result.error })
    }
    setIsSubmitting(false)
  }

  const handleCancel = () => {
    setMerchantId("")
    setTotalAmount("")
    setNumMonths(12)
    setFirstDueDate("")
    setStatus(null)
    onOpenChange(false)
  }

  const showCardSelector = !initialCreditCardId
  const effectiveCardId = initialCreditCardId ?? creditCardId

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add installment plan</DialogTitle>
            <DialogDescription>
              Create a new installment plan on your credit card. Enter the merchant, total amount,
              and payment schedule.
            </DialogDescription>
          </DialogHeader>

          {status && <ErrorMessage message={status.message} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            {showCardSelector && (
              <div className="space-y-2">
                <Label htmlFor="installment-card">Credit card</Label>
                <Select
                  value={effectiveCardId}
                  onValueChange={setCreditCardId}
                  disabled={cardsLoading || creditCards.length === 0}
                >
                  <SelectTrigger id="installment-card">
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
                        {c.name} ·{" "}
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
            )}

            <div className="space-y-2">
              <Label htmlFor="installment-merchant">Merchant</Label>
              <div className="flex gap-2">
                <Select
                  value={merchantId}
                  onValueChange={setMerchantId}
                  disabled={merchantsLoading}
                >
                  <SelectTrigger id="installment-merchant" className="min-w-0 flex-1">
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
                <Label htmlFor="installment-amount">Total amount</Label>
                <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                  <Input
                    id="installment-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(formatAmountInput(e.target.value))}
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
                <Label htmlFor="installment-months">Term (months)</Label>
                <Select
                  value={String(numMonths)}
                  onValueChange={(v) => setNumMonths(parseInt(v, 10))}
                >
                  <SelectTrigger id="installment-months">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLMENT_MONTHS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} months
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installment-first-due">First payment due date</Label>
              <Input
                id="installment-first-due"
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                title="Date when your first installment payment is due"
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
                  !effectiveCardId ||
                  !merchantId ||
                  !totalAmount ||
                  !firstDueDate ||
                  parseFloat(totalAmount.replace(/,/g, "")) <= 0
                }
              >
                {isSubmitting ? "Adding..." : "Add installment plan"}
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
