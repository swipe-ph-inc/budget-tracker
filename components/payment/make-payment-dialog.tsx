"use client"

import Link from "next/link"
import { Copy, CreditCard, Wallet } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { createPayment } from "@/app/actions/transaction"
import type { MerchantCategoryOption, MerchantWithCategory } from "@/app/actions/merchants"
import type { Tables } from "@/lib/supabase/database.types"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type AccountRow = Tables<"account">
type CreditCardRow = Tables<"credit_card">
type RecurrenceFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly"

const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
]

function formatBalance(account: AccountRow): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: account.currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(account.balance)
}

function formatAvailableCredit(card: CreditCardRow): string {
  const available = (card.credit_limit ?? 0) - (card.balance_owed ?? 0)
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: card.currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(available)
}

function formatAmountInput(value: string): string {
  if (!value) return ""
  const cleaned = value.replace(/[^\d.]/g, "")
  const [intPart = "", decPart = ""] = cleaned.split(".")
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return decPart ? `${formattedInt}.${decPart.slice(0, 2)}` : formattedInt
}

export interface MakePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
  accounts: AccountRow[]
  creditCards: CreditCardRow[]
  categories: MerchantCategoryOption[]
  merchants: MerchantWithCategory[]
  accountsLoading: boolean
  creditCardsLoading: boolean
  merchantsLoading: boolean
}

export function MakePaymentDialog({
  open,
  onOpenChange,
  onCompleted,
  accounts,
  creditCards,
  categories,
  merchants,
  accountsLoading,
  creditCardsLoading,
  merchantsLoading,
}: MakePaymentDialogProps) {
  const [fundingSource, setFundingSource] = useState<"account" | "credit_card">("account")
  const [fromAccountId, setFromAccountId] = useState<string>("")
  const [fromCreditCardId, setFromCreditCardId] = useState<string>("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [merchantId, setMerchantId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [virtualAccount, setVirtualAccount] = useState("")
  const [note, setNote] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [feeAmount, setFeeAmount] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedAccount = accounts.find((a) => a.id === fromAccountId)
  const selectedCard = creditCards.find((c) => c.id === fromCreditCardId)
  const currency =
    (fundingSource === "account" ? selectedAccount?.currency : selectedCard?.currency) ?? "PHP"

  const filteredMerchants = selectedCategoryId
    ? merchants.filter((m) => m.category_id === selectedCategoryId)
    : merchants

  const resetForm = useCallback(() => {
    setFormError(null)
    setAmount("")
    setVirtualAccount("")
    setNote("")
    setDueDate("")
    setFeeAmount("")
    setIsRecurring(false)
    setRecurrenceFrequency("")
    setSelectedCategoryId("")
    setMerchantId("")
    setFromCreditCardId("")
    setFundingSource("account")
  }, [])

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

  useEffect(() => {
    if (merchantId) {
      const m = merchants.find((x) => x.id === merchantId)
      if (m) setSelectedCategoryId(m.category_id)
    }
  }, [merchantId, merchants])

  useEffect(() => {
    if (fundingSource === "account" && !fromAccountId && accounts.length > 0) {
      setFromAccountId(accounts[0]!.id)
    }
    if (fundingSource === "credit_card" && !fromCreditCardId && creditCards.length > 0) {
      setFromCreditCardId(creditCards[0]!.id)
    }
  }, [fundingSource, fromAccountId, fromCreditCardId, accounts, creditCards])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied", description: "Copied to clipboard" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (fundingSource === "account") {
      if (!fromAccountId) {
        setFormError("Please select a payment account.")
        return
      }
    } else {
      if (!fromCreditCardId) {
        setFormError("Please select a credit card.")
        return
      }
    }

    if (!merchantId) {
      setFormError("Please select a merchant.")
      return
    }

    const parsedAmount = parseFloat(amount.replace(/,/g, ""))
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid amount greater than zero.")
      return
    }

    const parsedFee = feeAmount ? parseFloat(feeAmount.replace(/,/g, "")) : 0
    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setFormError("Fee amount must be zero or greater.")
      return
    }

    const totalCharge = parsedAmount + parsedFee
    if (fundingSource === "account") {
      if (selectedAccount && (selectedAccount.balance ?? 0) < totalCharge) {
        setFormError("Insufficient balance in the selected account.")
        return
      }
    } else {
      if (selectedCard) {
        const availableCredit = (selectedCard.credit_limit ?? 0) - (selectedCard.balance_owed ?? 0)
        if (availableCredit < totalCharge) {
          setFormError("Insufficient available credit on the selected card.")
          return
        }
      }
    }

    if (isRecurring && !recurrenceFrequency) {
      setFormError("Please select a recurrence frequency for recurring payments.")
      return
    }

    setIsSubmitting(true)
    const result = await createPayment({
      fromAccountId: fundingSource === "account" ? fromAccountId : null,
      fromCreditCardId: fundingSource === "credit_card" ? fromCreditCardId : null,
      merchantId,
      amount: parsedAmount,
      currency,
      note: note.trim() || undefined,
      feeAmount: parsedFee,
      feeCurrency: parsedFee > 0 ? currency : undefined,
      dueDate: dueDate || undefined,
      virtualAccount: virtualAccount.trim() || undefined,
      isRecurring,
      recurrenceFrequency: isRecurring ? (recurrenceFrequency as RecurrenceFrequency) : undefined,
    })

    if (result.success) {
      toast({
        title: "Payment completed",
        description: "Your payment has been processed successfully.",
      })
      resetForm()
      onOpenChange(false)
      onCompleted?.()
    } else {
      setFormError(result.error)
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] w-[calc(100vw-1.5rem)] overflow-y-auto sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Make a payment</DialogTitle>
        </DialogHeader>
        <form id="make-payment-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-card-foreground">
              Pay from
              <Link
                href="/dashboard/account"
                className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                title="View accounts & cards"
              >
                <svg
                  width={16}
                  height={16}
                  stroke="currentColor"
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  className="text-primary"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Link>
            </h4>
            <div className="mt-1.5 flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => {
                  setFundingSource("account")
                  setFromCreditCardId("")
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  fundingSource === "account"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Wallet className="h-4 w-4" />
                Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setFundingSource("credit_card")
                  setFromAccountId("")
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  fundingSource === "credit_card"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Credit Card
              </button>
            </div>
            <div className="mt-1.5 min-w-0 overflow-hidden rounded-lg border border-border">
              {fundingSource === "account" ? (
                accountsLoading ? (
                  <div className="flex h-20 items-center justify-center py-4 text-center text-sm text-muted-foreground">
                    Loading accounts...
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="flex h-20 items-center justify-center py-4 text-center text-sm text-muted-foreground">
                    Add an account to make payments.
                  </div>
                ) : (
                  <div
                    className="flex min-w-0 w-full gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain p-2 pb-1 scroll-smooth"
                    style={{ scrollbarWidth: "thin" }}
                  >
                    {accounts.map((acc) => {
                      const isSelected = fromAccountId === acc.id
                      return (
                        <div
                          key={acc.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setFromAccountId(acc.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              setFromAccountId(acc.id)
                            }
                          }}
                          className={`flex min-w-[150px] max-w-[200px] shrink-0 cursor-pointer flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-colors sm:min-w-[180px] sm:p-3 ${
                            isSelected
                              ? "border-2 border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-card hover:bg-accent/50 hover:border-accent-foreground/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {acc.card_network_url ? (
                              <img
                                src={acc.card_network_url}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-lg object-contain"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[hsl(var(--primary-dark))]">
                                <CreditCard className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="truncate text-xs font-medium text-card-foreground">{acc.name}</p>
                            <p className="text-sm font-bold text-card-foreground">{formatBalance(acc)}</p>
                            <div className="flex items-center gap-1">
                              <p className="truncate text-xs text-muted-foreground">{acc.masked_identifier}</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopy(acc.masked_identifier)
                                }}
                                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                aria-label="Copy account number"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : creditCardsLoading ? (
                <div className="flex h-20 items-center justify-center py-4 text-center text-sm text-muted-foreground">
                  Loading credit cards...
                </div>
              ) : creditCards.length === 0 ? (
                <div className="flex h-20 items-center justify-center py-4 text-center text-sm text-muted-foreground">
                  Add a credit card to make payments.
                </div>
              ) : (
                <div
                  className="flex min-w-0 w-full gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain p-2 pb-1 scroll-smooth"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {creditCards.map((card) => {
                    const isSelected = fromCreditCardId === card.id
                    return (
                      <div
                        key={card.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setFromCreditCardId(card.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setFromCreditCardId(card.id)
                          }
                        }}
                        className={`flex min-w-[150px] max-w-[200px] shrink-0 cursor-pointer flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-colors sm:min-w-[180px] sm:p-3 ${
                          isSelected
                            ? "border-2 border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:bg-accent/50 hover:border-accent-foreground/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {card.card_network_url ? (
                            <img
                              src={card.card_network_url}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-lg object-contain"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[hsl(var(--primary-dark))]">
                              <CreditCard className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="truncate text-xs font-medium text-card-foreground">{card.name}</p>
                          <p className="text-sm font-bold text-card-foreground">
                            {formatAvailableCredit(card)} avail.
                          </p>
                          <div className="flex items-center gap-1">
                            <p className="truncate text-xs text-muted-foreground">{card.masked_identifier}</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopy(card.masked_identifier)
                              }}
                              className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                              aria-label="Copy card number"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {(fundingSource === "account" ? accounts.length : creditCards.length) > 1 && (
              <p className="mt-1 text-xs text-muted-foreground">Scroll to see all</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-card-foreground">Merchant Category</h4>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value)
                  setMerchantId("")
                }}
                disabled={merchantsLoading || categories.length === 0}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">
                  {merchantsLoading ? "Loading..." : categories.length === 0 ? "No categories" : "Select category"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && !merchantsLoading && (
                <p className="mt-1 text-xs text-muted-foreground">
                  No categories yet. Add categories in{" "}
                  <Link className="text-primary hover:text-primary/80" href="/dashboard/merchants">
                    Merchants
                  </Link>
                  .
                </p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-card-foreground">Merchant</h4>
              <select
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                disabled={merchantsLoading || filteredMerchants.length === 0}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">
                  {merchantsLoading
                    ? "Loading..."
                    : filteredMerchants.length === 0
                      ? selectedCategoryId
                        ? "No merchants"
                        : "Select category first"
                      : "Select merchant"}
                </option>
                {filteredMerchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-card-foreground">Amount</h4>
            <div className="mt-1 flex max-w-md overflow-hidden rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                placeholder="0.00"
                className="flex-1 rounded-none border-0 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
              <span className="flex items-center px-3 py-2 text-xs font-medium text-muted-foreground">
                {currency}
              </span>
            </div>
          </div>

          <Accordion type="single" collapsible className="rounded-lg border border-border">
            <AccordionItem value="advanced" className="border-0">
              <AccordionTrigger type="button" className="px-4 py-3 text-sm hover:no-underline">
                Advanced options
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-4 pb-4 pt-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-card-foreground">Fee (optional)</h4>
                    <div className="mt-1 flex overflow-hidden rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(formatAmountInput(e.target.value))}
                        placeholder="0.00"
                        className="flex-1 rounded-none border-0 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                      />
                      <span className="flex items-center px-3 py-2 text-xs font-medium text-muted-foreground">
                        {currency}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-card-foreground">Ref # (optional)</h4>
                    <input
                      type="text"
                      value={virtualAccount}
                      onChange={(e) => setVirtualAccount(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-card-foreground">Due date (optional)</h4>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-card-foreground">Recurring</h4>
                    <div className="mt-1 flex min-h-[38px] flex-wrap items-center gap-2">
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isRecurring}
                          onChange={(e) => setIsRecurring(e.target.checked)}
                          className="h-3.5 w-3.5 shrink-0 rounded border-input accent-primary"
                        />
                        <span className="text-sm text-card-foreground">Yes</span>
                      </label>
                      {isRecurring && (
                        <select
                          value={recurrenceFrequency}
                          onChange={(e) =>
                            setRecurrenceFrequency(e.target.value as RecurrenceFrequency | "")
                          }
                          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:min-w-[140px]"
                        >
                          <option value="">Frequency</option>
                          {RECURRENCE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-card-foreground">Note (optional)</h4>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Invoice #123"
                    maxLength={255}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (fundingSource === "account" ? accountsLoading : creditCardsLoading) ||
                (fundingSource === "account" ? !fromAccountId : !fromCreditCardId) ||
                !merchantId ||
                !amount ||
                (isRecurring && !recurrenceFrequency)
              }
            >
              {isSubmitting ? "Processing..." : "Proceed to payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
