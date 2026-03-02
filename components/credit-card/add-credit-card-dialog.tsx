"use client"

import { useEffect, useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar, RefreshCw } from "lucide-react"
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
import {
  createCreditCard,
  createInstallmentPlan,
  createSubscriptionSchedule,
} from "@/app/actions/credit-cards"
import { getAccounts } from "@/app/actions/accounts"
import { getMerchantsWithCategories } from "@/app/actions/merchants"
import type { Tables } from "@/lib/supabase/database.types"
import type { MerchantWithCategory } from "@/app/actions/merchants"
import { AddMerchantDialog } from "@/components/merchant/add-merchant-dialog"
import { SuccessMessage, ErrorMessage } from "@/components/ui/status-message"
import { toast } from "@/hooks/use-toast"

type AccountRow = Tables<"account">

const CURRENCIES = [
  { value: "PHP", label: "PHP" },
  { value: "USD", label: "USD" },
] as const

const CARD_TYPES = [
  { value: "visa", label: "Visa", url: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/Visa_Inc.-Logo.wine.svg" },
  { value: "mastercard", label: "Mastercard", url: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/ma_symbol.svg" },
  { value: "jcb", label: "JCB (Japan Credit Bureau)", url: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/jcb_logo_color.svg" },
  { value: "amex", label: "American Express", url: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/Amex_logo_color.svg" },
  { value: "none", label: "None", url: "" },
] as const

const BACKGROUND = [
  { value: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", label: "Black" },
  { value: "https://plus.unsplash.com/premium_photo-1755192700987-cae26287e93c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", label: "Titanium" },
  { value: "https://images.unsplash.com/photo-1664044020180-b75bfddf9776?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", label: "Diamond" },
  { value: "https://images.unsplash.com/photo-1714548870002-d25e8329039c?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", label: "Platinum" },
  { value: "https://images.unsplash.com/photo-1513346940221-6f673d962e97?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", label: "Gold" },
  { value: "https://images.unsplash.com/photo-1635151227785-429f420c6b9d?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", label: "Silver" },
  { value: "https://i.imgur.com/kGkSg1v.png", label: "Blue" },
  { value: "https://i.imgur.com/Zi6v09P.png", label: "Orange" },
] as const

const INSTALLMENT_MONTHS = [3, 6, 12, 24] as const
const BILLING_DAYS = Array.from({ length: 31 }, (_, i) => i + 1) as number[]
const RECURRENCE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
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

function formatMaskedIdentifier(value: string): string {
  const digits = value.replace(/\D/g, "").slice(-4)
  if (digits.length === 0) return ""
  if (digits.length < 4) return digits
  return `•••• •••• ••••${digits}`
}

function formatCurrency(amount: number, curr: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: curr || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

type InstallmentItem = {
  id: string
  merchantId: string
  merchantName: string
  totalAmount: number
  numMonths: number
  firstDueDate: string
}

type SubscriptionItem = {
  id: string
  merchantId: string
  merchantName: string
  amount: number
  frequency: string
  billingDay: number
}

interface AddCreditCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

const STEPS = [
  { id: 1, label: "Card details" },
  { id: 2, label: "Installments & subscriptions" },
  { id: 3, label: "Preview" },
]

export function AddCreditCardDialog({
  open,
  onOpenChange,
  onCompleted,
}: AddCreditCardDialogProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [lastFour, setLastFour] = useState("")
  const [creditLimit, setCreditLimit] = useState("")
  const [balanceOwed, setBalanceOwed] = useState("")
  const [currency, setCurrency] = useState("PHP")
  const [statementDay, setStatementDay] = useState("")
  const [paymentDueDay, setPaymentDueDay] = useState("")
  const [cardType, setCardType] = useState("none")
  const [background, setBackground] = useState("")
  const [defaultAccountId, setDefaultAccountId] = useState<string>("")
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [merchants, setMerchants] = useState<MerchantWithCategory[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [merchantsLoading, setMerchantsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [installments, setInstallments] = useState<InstallmentItem[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [addInstallmentMerchantId, setAddInstallmentMerchantId] = useState("")
  const [addInstallmentAmount, setAddInstallmentAmount] = useState("")
  const [addInstallmentMonths, setAddInstallmentMonths] = useState(12)
  const [addInstallmentFirstDue, setAddInstallmentFirstDue] = useState("")
  const [addSubMerchantId, setAddSubMerchantId] = useState("")
  const [addSubAmount, setAddSubAmount] = useState("")
  const [addSubFrequency, setAddSubFrequency] = useState("monthly")
  const [addSubBillingDay, setAddSubBillingDay] = useState(1)
  const [addMerchantOpen, setAddMerchantOpen] = useState(false)
  const [addMerchantTarget, setAddMerchantTarget] = useState<"installment" | "subscription" | null>(null)

  const fetchData = useCallback(async () => {
    setAccountsLoading(true)
    setMerchantsLoading(true)
    try {
      const [accountsData, merchantsData] = await Promise.all([
        getAccounts(),
        getMerchantsWithCategories(),
      ])
      setAccounts(accountsData ?? [])
      setMerchants(merchantsData ?? [])
    } catch {
      toast({
        title: "Failed to load data",
        description: "Could not load accounts or merchants.",
        variant: "destructive",
      })
      setAccounts([])
      setMerchants([])
    } finally {
      setAccountsLoading(false)
      setMerchantsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setStatus(null)
      setStep(1)
      setDefaultAccountId("")
      setInstallments([])
      setSubscriptions([])
      setAddInstallmentMerchantId("")
      setAddInstallmentAmount("")
      setAddInstallmentFirstDue("")
      setAddSubMerchantId("")
      setAddSubAmount("")
      fetchData()
    }
  }, [open, fetchData])

  const handleCancel = () => {
    setName("")
    setLastFour("")
    setCreditLimit("")
    setBalanceOwed("")
    setStatementDay("")
    setPaymentDueDay("")
    setCardType("none")
    setBackground("")
    setDefaultAccountId("")
    setInstallments([])
    setSubscriptions([])
    setStatus(null)
    setStep(1)
    onOpenChange(false)
  }

  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      setStatus({ type: "error", message: "Card name is required." })
      return false
    }
    const digits = lastFour.replace(/\D/g, "")
    if (digits.length !== 4) {
      setStatus({ type: "error", message: "Enter the last 4 digits of your card." })
      return false
    }
    const parsedLimit = parseFloat(creditLimit.replace(/,/g, ""))
    if (!creditLimit || Number.isNaN(parsedLimit) || parsedLimit < 0) {
      setStatus({ type: "error", message: "Please enter a valid credit limit." })
      return false
    }
    const parsedBalance = balanceOwed ? parseFloat(balanceOwed.replace(/,/g, "")) : 0
    if (Number.isNaN(parsedBalance) || parsedBalance < 0 || parsedBalance > parsedLimit) {
      setStatus({ type: "error", message: "Balance owed must be zero or greater and not exceed credit limit." })
      return false
    }
    return true
  }

  const handleNext = () => {
    setStatus(null)
    if (step === 1) {
      if (!validateStep1()) return
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setStatus(null)
    setStep((s) => Math.max(1, s - 1))
  }

  const handleAddInstallment = () => {
    if (!addInstallmentMerchantId || !addInstallmentAmount || !addInstallmentFirstDue) return
    const amount = parseFloat(addInstallmentAmount.replace(/,/g, ""))
    if (Number.isNaN(amount) || amount <= 0) return
    const m = merchants.find((x) => x.id === addInstallmentMerchantId)
    setInstallments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        merchantId: addInstallmentMerchantId,
        merchantName: m?.name ?? "—",
        totalAmount: amount,
        numMonths: addInstallmentMonths,
        firstDueDate: addInstallmentFirstDue,
      },
    ])
    setAddInstallmentMerchantId("")
    setAddInstallmentAmount("")
    setAddInstallmentFirstDue("")
  }

  const handleRemoveInstallment = (id: string) => {
    setInstallments((prev) => prev.filter((i) => i.id !== id))
  }

  const handleAddSubscription = () => {
    if (!addSubMerchantId || !addSubAmount) return
    const amount = parseFloat(addSubAmount.replace(/,/g, ""))
    if (Number.isNaN(amount) || amount <= 0) return
    const m = merchants.find((x) => x.id === addSubMerchantId)
    setSubscriptions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        merchantId: addSubMerchantId,
        merchantName: m?.name ?? "—",
        amount,
        frequency: addSubFrequency,
        billingDay: addSubBillingDay,
      },
    ])
    setAddSubMerchantId("")
    setAddSubAmount("")
  }

  const handleRemoveSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    if (step !== 3) return

    if (!validateStep1()) return

    const masked = formatMaskedIdentifier(lastFour)
    const parsedLimit = parseFloat(creditLimit.replace(/,/g, ""))
    const parsedBalance = balanceOwed ? parseFloat(balanceOwed.replace(/,/g, "")) : 0
    const stmtDay = statementDay ? parseInt(statementDay, 10) : null
    const dueDay = paymentDueDay ? parseInt(paymentDueDay, 10) : null

    if (stmtDay != null && (stmtDay < 1 || stmtDay > 28)) {
      setStatus({ type: "error", message: "Statement day must be between 1 and 28." })
      return
    }
    if (dueDay != null && (dueDay < 1 || dueDay > 31)) {
      setStatus({ type: "error", message: "Payment due day must be between 1 and 31." })
      return
    }

    setIsSubmitting(true)
    const result = await createCreditCard({
      name: name.trim(),
      maskedIdentifier: masked,
      creditLimit: parsedLimit,
      currency,
      balanceOwed: parsedBalance,
      statementDay: stmtDay,
      paymentDueDay: dueDay,
      cardType: cardType === "none" ? null : cardType,
      backgroundImgUrl: background || null,
      defaultPaymentAccountId: defaultAccountId || null,
    })

    if (!result.success) {
      setStatus({ type: "error", message: result.error })
      setIsSubmitting(false)
      return
    }

    const creditCardId = result.data!.id
    const errors: string[] = []

    for (const i of installments) {
      const r = await createInstallmentPlan({
        creditCardId,
        merchantId: i.merchantId,
        totalAmount: i.totalAmount,
        numMonths: i.numMonths,
        firstDueDate: i.firstDueDate,
        currency,
      })
      if (!r.success) errors.push(`Installment ${i.merchantName}: ${r.error}`)
    }

    for (const s of subscriptions) {
      const freq = s.frequency as "monthly" | "quarterly" | "yearly"
      const r = await createSubscriptionSchedule({
        creditCardId,
        merchantId: s.merchantId,
        amount: s.amount,
        frequency: freq,
        billingDay: s.billingDay,
        currency,
      })
      if (!r.success) errors.push(`Subscription ${s.merchantName}: ${r.error}`)
    }

    if (errors.length > 0) {
      toast({
        title: "Credit card added",
        description: `Card saved. Some items could not be saved: ${errors.slice(0, 2).join("; ")}${errors.length > 2 ? "..." : ""}`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Credit card added",
        description:
          installments.length + subscriptions.length > 0
            ? "Your credit card and payment plans have been saved."
            : "Your credit card has been added successfully.",
      })
    }
    onCompleted?.()
    handleCancel()
    setIsSubmitting(false)
  }

  const cardTypeInfo = CARD_TYPES.find((t) => t.value === cardType)
  const hasBg = Boolean(background)

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[680px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Credit Card</DialogTitle>
          <DialogDescription>
            Add a credit card in 3 steps: details, existing installments (optional), and preview.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 py-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors
                  ${step >= s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {s.id}
              </div>
              <span className={`text-sm font-medium ${step >= s.id ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {status && (
          <div>
            {status.type === "success" ? (
              <SuccessMessage message={status.message} />
            ) : (
              <ErrorMessage message={status.message} />
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && step !== 3) {
              e.preventDefault()
            }
          }}
          className="space-y-4 py-2"
        >
          {/* Step 1: Card details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card-name">Card Name</Label>
                <Input
                  id="card-name"
                  placeholder="e.g. BPI Platinum Visa, Freedom Unlimited"
                  maxLength={255}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="last-four">Last 4 Digits</Label>
                  <Input
                    id="last-four"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 5487"
                    maxLength={4}
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit-limit">Credit Limit</Label>
                  <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                    <Input
                      id="credit-limit"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(formatCreditLimitInput(e.target.value))}
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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="balance-owed">Current Balance Owed (optional)</Label>
                  <Input
                    id="balance-owed"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={balanceOwed}
                    onChange={(e) => setBalanceOwed(formatCreditLimitInput(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-type">Card Type</Label>
                  <Select value={cardType} onValueChange={setCardType}>
                    <SelectTrigger id="card-type">
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background">Background</Label>
                  <Select value={background || "__none__"} onValueChange={(v) => setBackground(v === "__none__" ? "" : v)}>
                    <SelectTrigger id="background">
                      <SelectValue placeholder="Select background" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {BACKGROUND.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="statement-day">Statement Day (optional)</Label>
                  <Input
                    id="statement-day"
                    type="number"
                    min={1}
                    max={28}
                    placeholder="e.g. 15"
                    value={statementDay}
                    onChange={(e) => setStatementDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-due-day">Payment Due Day (optional)</Label>
                  <Input
                    id="payment-due-day"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="e.g. 22"
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-account">Default Payment Account (optional)</Label>
                <Select
                  value={defaultAccountId || "__none__"}
                  onValueChange={(v) => setDefaultAccountId(v === "__none__" ? "" : v)}
                  disabled={accountsLoading || accounts.length === 0}
                >
                  <SelectTrigger id="default-account">
                    <SelectValue placeholder={accountsLoading ? "Loading..." : accounts.length === 0 ? "No accounts" : "Select account"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.masked_identifier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Installments & subscriptions */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Add existing installments or subscriptions on this card. You can skip this step if you have none.
              </p>

              {/* Add installment */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Installment plan
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInstallment}
                    disabled={!addInstallmentMerchantId || !addInstallmentAmount || !addInstallmentFirstDue}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs">Merchant</Label>
                    <div className="flex min-w-0 gap-2">
                      <Select value={addInstallmentMerchantId} onValueChange={setAddInstallmentMerchantId} disabled={merchantsLoading}>
                        <SelectTrigger className="min-w-0 flex-1">
                          <SelectValue placeholder="Select merchant" />
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
                        onClick={() => {
                          setAddMerchantTarget("installment")
                          setAddMerchantOpen(true)
                        }}
                        title="Add merchant"
                        aria-label="Add merchant"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="installment-amount" className="text-xs">Total amount</Label>
                    <Input
                      id="installment-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={addInstallmentAmount}
                      onChange={(e) => setAddInstallmentAmount(formatCreditLimitInput(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Months</Label>
                    <Select value={String(addInstallmentMonths)} onValueChange={(v) => setAddInstallmentMonths(parseInt(v, 10))}>
                      <SelectTrigger>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="first-due-date" className="text-xs">First payment due date</Label>
                    <Input
                      id="first-due-date"
                      type="date"
                      title="Date when your first installment payment is due"
                      value={addInstallmentFirstDue}
                      onChange={(e) => setAddInstallmentFirstDue(e.target.value)}
                    />
                  </div>
                </div>
                {installments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {installments.map((i) => (
                      <li key={i.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                        <span>
                          {i.merchantName} — {formatCurrency(i.totalAmount, currency)} / {i.numMonths}mo (from {i.firstDueDate})
                        </span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveInstallment(i.id)} aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add subscription */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Subscription
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSubscription}
                    disabled={!addSubMerchantId || !addSubAmount}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs">Merchant</Label>
                    <div className="flex min-w-0 gap-2">
                      <Select value={addSubMerchantId} onValueChange={setAddSubMerchantId} disabled={merchantsLoading}>
                        <SelectTrigger className="min-w-0 flex-1">
                          <SelectValue placeholder="Select merchant" />
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
                        onClick={() => {
                          setAddMerchantTarget("subscription")
                          setAddMerchantOpen(true)
                        }}
                        title="Add merchant"
                        aria-label="Add merchant"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sub-amount" className="text-xs">Amount</Label>
                    <Input
                      id="sub-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={addSubAmount}
                      onChange={(e) => setAddSubAmount(formatCreditLimitInput(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Frequency</Label>
                    <Select value={addSubFrequency} onValueChange={setAddSubFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="billing-day" className="text-xs">Billing day (1–31)</Label>
                    <Select
                      value={String(addSubBillingDay)}
                      onValueChange={(v) => setAddSubBillingDay(parseInt(v, 10))}
                    >
                      <SelectTrigger id="billing-day" title="Day of month when the subscription is charged (e.g. 5 = every 5th)">
                        <SelectValue placeholder="Day of month" />
                      </SelectTrigger>
                      <SelectContent>
                        {BILLING_DAYS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {[11, 12, 13].includes(d) ? `${d}th` : d % 10 === 1 ? `${d}st` : d % 10 === 2 ? `${d}nd` : d % 10 === 3 ? `${d}rd` : `${d}th`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {subscriptions.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {subscriptions.map((s) => (
                      <li key={s.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                        <span>
                          {s.merchantName} — {formatCurrency(s.amount, currency)} / {s.frequency}
                          {s.billingDay != null && ` on the ${s.billingDay}${[11, 12, 13].includes(s.billingDay) ? "th" : s.billingDay % 10 === 1 ? "st" : s.billingDay % 10 === 2 ? "nd" : s.billingDay % 10 === 3 ? "rd" : "th"}`}
                        </span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveSubscription(s.id)} aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-6">
              <div
                className={`relative w-full max-w-[360px] overflow-hidden rounded-2xl p-6 min-h-[200px] flex flex-col justify-between ${
                  hasBg ? "" : "border border-border bg-gradient-to-br from-[hsl(220,70%,35%)] to-[hsl(220,70%,22%)]"
                }`}
                style={hasBg ? { backgroundImage: `url(${background})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                <div className="flex items-start justify-between text-white">
                  <p className="text-xs text-white/80">
                    {name || "Card Name"}
                  </p>
                  <div className="flex items-center gap-1">
                    {cardTypeInfo?.url ? (
                      <img src={cardTypeInfo.url} alt="" className="h-7 w-10 object-contain" />
                    ) : (
                      <div className="flex">
                        <span className="h-6 w-6 rounded-full bg-white/50" />
                        <span className="-ml-3 h-6 w-6 rounded-full bg-white/30" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 text-white">
                  <p className="text-2xl font-bold">
                    {formatCurrency(parseFloat(creditLimit.replace(/,/g, "")) || 0, currency)}
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    Credit limit
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                  <div>
                    <p>Card Number</p>
                    <p className="mt-0.5 font-medium text-white">
                      {formatMaskedIdentifier(lastFour) || "•••• XXXX"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full text-center text-sm text-muted-foreground">
                {installments.length + subscriptions.length > 0 && (
                  <p>
                    {installments.length} installment plan(s), {subscriptions.length} subscription(s) will be saved with your card.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-between">
            <div className="flex gap-2 order-2 sm:order-1">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex gap-2 order-1 sm:order-2">
              {step < 3 ? (
                <>
                  {step === 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        setStep(3)
                      }}
                    >
                      Skip
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNext()
                    }}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Credit Card"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AddMerchantDialog
      open={addMerchantOpen}
      onOpenChange={setAddMerchantOpen}
      onAdded={(merchantId) => {
        const target = addMerchantTarget
        setAddMerchantTarget(null)
        fetchData().then(() => {
          if (target === "installment") setAddInstallmentMerchantId(merchantId)
          else if (target === "subscription") setAddSubMerchantId(merchantId)
        })
      }}
    />
  </>
  )
}
