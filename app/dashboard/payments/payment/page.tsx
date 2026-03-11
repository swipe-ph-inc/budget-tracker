"use client"

import Link from "next/link"
import { Search, SlidersHorizontal, CreditCard, Plus, ChevronDown, MoreHorizontal, Copy, Globe, Tv, HeartPulse, ShoppingCart, Shield, FolderPlus, Store, FileDown, FileUp, CalendarRange, Calendar, WalletCards, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useCallback, useEffect } from "react"
import { getAccounts } from "@/app/actions/accounts"
import { getCreditCards } from "@/app/actions/credit-cards"
import {
  getMerchantCategories,
  getMerchantsWithCategories,
  type MerchantCategoryOption,
  type MerchantWithCategory,
} from "@/app/actions/merchants"
import { getSubscriptionSchedules, getInstallmentPlans } from "@/app/actions/credit-cards"
import { createPayment, getPayments } from "@/app/actions/transaction"
import type { Tables } from "@/lib/supabase/database.types"
import { toast } from "@/hooks/use-toast"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ManageMerchantDialog } from "@/components/account/manage-merchant-dialog"
import { ManageMerchantCategoryDialog } from "@/components/payment/payment/manage-merchant-category-dialog"
import { AddSubscriptionDialog } from "@/components/credit-card/subscription/add-subscription-dialog"
import { AddInstallmentDialog } from "@/components/credit-card/installment/add-installment-dialog"
import { PayCreditCardDialog } from "@/components/credit-card/pay-credit-card-dialog"

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

const paymentTabs: {
  label: string
  icon: typeof WalletCards
  href?: string
  active: boolean
  dialog?: "subscription" | "installment" | "credit_card_payment"
}[] = [
    { label: "Payment", icon: WalletCards, href: "/dashboard/payments/payment", active: true },
    { label: "Subscription Payment", icon: CalendarRange, active: false, dialog: "subscription" },
    { label: "Installment Payment", icon: Calendar, active: false, dialog: "installment" },
    { label: "Credit Card Payment", icon: CreditCard, active: false, dialog: "credit_card_payment" },
  ]

const RECENT_PAYMENTS_LIMIT = 10

type RecentActivityItem = {
  id: string
  type: "payment" | "subscription" | "installment"
  merchantName: string
  amount: number
  currency: string
  status: string
  accountDisplay: string
  sortDate: string
}

function formatPaymentAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function initials(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const CATEGORY_ICONS: Record<string, typeof HeartPulse> = {
  Healthcare: HeartPulse,
  "E-commerce": ShoppingCart,
  "Internet & Cable TV": Tv,
  Insurance: Shield,
  Utilities: Globe,
}
const DEFAULT_CATEGORY_ICON = Shield

function getCategoryIcon(name: string) {
  return CATEGORY_ICONS[name] ?? DEFAULT_CATEGORY_ICON
}

export default function PaymentPage() {
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [creditCards, setCreditCards] = useState<CreditCardRow[]>([])
  const [categories, setCategories] = useState<MerchantCategoryOption[]>([])
  const [merchants, setMerchants] = useState<MerchantWithCategory[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [creditCardsLoading, setCreditCardsLoading] = useState(true)
  const [merchantsLoading, setMerchantsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [recentPaymentsLoading, setRecentPaymentsLoading] = useState(true)

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
  const [manageMerchantOpen, setManageMerchantOpen] = useState(false)
  const [manageCategoryOpen, setManageCategoryOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [addSubscriptionOpen, setAddSubscriptionOpen] = useState(false)
  const [addInstallmentOpen, setAddInstallmentOpen] = useState(false)
  const [payCreditCardOpen, setPayCreditCardOpen] = useState(false)

  const selectedAccount = accounts.find((a) => a.id === fromAccountId)
  const selectedCard = creditCards.find((c) => c.id === fromCreditCardId)
  const currency = (fundingSource === "account" ? selectedAccount?.currency : selectedCard?.currency) ?? "PHP"

  const searchLower = searchQuery.trim().toLowerCase()
  const categoriesWithMerchants = categories.map((cat) => ({
    ...cat,
    merchants: merchants.filter((m) => m.category_id === cat.id),
  }))
  const filteredCategoriesWithMerchants = searchLower
    ? categoriesWithMerchants
      .map((cat) => ({
        ...cat,
        merchants: cat.merchants.filter((m) =>
          m.name.toLowerCase().includes(searchLower)
        ),
      }))
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchLower) || cat.merchants.length > 0
      )
    : categoriesWithMerchants
  const filteredMerchants = selectedCategoryId
    ? merchants.filter((m) => m.category_id === selectedCategoryId)
    : merchants

  const fetchData = useCallback(async () => {
    setAccountsLoading(true)
    setCreditCardsLoading(true)
    setMerchantsLoading(true)
    setRecentPaymentsLoading(true)
    try {
      const [
        accountsData,
        creditCardsData,
        categoriesData,
        merchantsData,
        paymentsData,
        schedulesData,
        plansData,
      ] = await Promise.all([
        getAccounts(),
        getCreditCards(),
        getMerchantCategories(),
        getMerchantsWithCategories(),
        getPayments(),
        getSubscriptionSchedules(),
        getInstallmentPlans(),
      ])
      setAccounts(accountsData ?? [])
      setCreditCards(creditCardsData ?? [])
      setCategories(categoriesData ?? [])
      setMerchants(merchantsData ?? [])
      const payments: RecentActivityItem[] = (paymentsData ?? []).map((p) => ({
        id: `payment-${p.id}`,
        type: "payment",
        merchantName: p.merchantName,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        accountDisplay: p.virtualAccount ?? p.fromAccountMasked ?? "—",
        sortDate: p.createdAt,
      }))
      const subscriptions: RecentActivityItem[] = (schedulesData ?? []).map((s) => ({
        id: `subscription-${s.id}`,
        type: "subscription",
        merchantName: s.merchantName,
        amount: s.amount,
        currency: s.currency,
        status: "Subscription",
        accountDisplay: s.cardMaskedIdentifier,
        sortDate: s.nextDueDate,
      }))
      const installments: RecentActivityItem[] = (plansData ?? [])
        .filter((plan) => plan.status === "ongoing" && plan.nextDueDate)
        .map((plan) => ({
          id: `installment-${plan.id}`,
          type: "installment",
          merchantName: plan.merchantName,
          amount: plan.amountPerMonth,
          currency: plan.currency,
          status: "Installment",
          accountDisplay: plan.cardMaskedIdentifier,
          sortDate: plan.nextDueDate,
        }))
      const combined = [...payments, ...subscriptions, ...installments].sort(
        (a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
      )
      setRecentActivity(combined.slice(0, RECENT_PAYMENTS_LIMIT))
      setFromAccountId((prev) => {
        const list = accountsData ?? []
        if (list.length === 0) return ""
        const hasPrev = prev && list.some((a) => a.id === prev)
        return hasPrev ? prev : list[0]!.id
      })
    } catch {
      toast({
        title: "Failed to load data",
        description: "Could not load accounts or merchants. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAccountsLoading(false)
      setCreditCardsLoading(false)
      setMerchantsLoading(false)
      setRecentPaymentsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      toast({ title: "Payment completed", description: "Your payment has been processed successfully." })
      setAmount("")
      setVirtualAccount("")
      setNote("")
      setDueDate("")
      setFeeAmount("")
      setIsRecurring(false)
      setRecurrenceFrequency("")
      setMerchantId("")
      fetchData()
    } else {
      setFormError(result.error)
    }
    setIsSubmitting(false)
  }

  const handleCancel = () => {
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
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/payments/payment">Payments</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Payment</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {/* Left Column - Tabs + Providers */}
          <div className="min-w-0 w-full shrink-0 flex flex-col gap-4 lg:w-[320px] lg:gap-5">
            {/* Payment Type Tabs */}
            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {paymentTabs.map((tab) =>
                  tab.dialog ? (
                    <button
                      key={tab.label}
                      type="button"
                      onClick={() =>
                        tab.dialog === "subscription"
                          ? setAddSubscriptionOpen(true)
                          : tab.dialog === "installment"
                            ? setAddInstallmentOpen(true)
                            : setPayCreditCardOpen(true)
                      }
                      className={`flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors ${tab.active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <tab.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium">{tab.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={tab.label}
                      href={tab.href ?? "#"}
                      className={`flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors ${tab.active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <tab.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium">{tab.label}</span>
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search providers"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Provider Categories */}
            <div className="flex flex-col gap-2">
              {merchantsLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading merchants...</p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No categories yet. Add merchants from the Account page.</p>
              ) : filteredCategoriesWithMerchants.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No providers match &quot;{searchQuery}&quot;
                </p>
              ) : (
                filteredCategoriesWithMerchants.map((cat) => {
                  const isOpen = openCategoryId === cat.id
                  const Icon = getCategoryIcon(cat.name)
                  return (
                    <div key={cat.id}>
                      <button
                        type="button"
                        onClick={() => setOpenCategoryId(isOpen ? null : cat.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium text-card-foreground">{cat.name}</span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-border pl-4">
                          {cat.merchants.length === 0 ? (
                            <p className="py-2 text-xs text-muted-foreground">No merchants in this category</p>
                          ) : (
                            cat.merchants.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setMerchantId(m.id)}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-foreground ${merchantId === m.id ? "bg-accent text-foreground font-medium" : "text-muted-foreground"
                                  }`}
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-secondary">
                                  <Icon className="h-3 w-3 text-primary" />
                                </div>
                                {m.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column - Recent Payments + Payment Form */}
          <div className="min-w-0 flex-1 flex flex-col gap-4 lg:gap-5">
            {/* Recent Payments */}
            <div className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Recent Payments</h3>
                <Link
                  href="/dashboard/payments/payment/payments"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                  target="_blank"
                >
                  Show More
                </Link>
              </div>
              <div className="mt-3 sm:mt-4 flex min-w-0 gap-3 overflow-x-auto overscroll-x-contain pb-2 sm:gap-4" style={{ scrollbarWidth: "thin" }}>
                {recentPaymentsLoading ? (
                  <div className="flex min-w-[200px] items-center justify-center rounded-xl border border-border p-6 text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="flex min-w-[200px] items-center justify-center rounded-xl border border-border p-6 text-sm text-muted-foreground">
                    No payments or upcoming items yet
                  </div>
                ) : (
                  recentActivity.map((item) => {
                    const isPayment = item.type === "payment"
                    const isCompleted = isPayment && item.status.toLowerCase() === "completed"
                    const isUpcoming = item.type === "subscription" || item.type === "installment"
                    const badgeClass = isCompleted
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : isUpcoming
                        ? "border-muted-foreground/30 bg-muted/50 text-muted-foreground"
                        : "border-warning/30 bg-warning/10 text-warning"
                    return (
                      <div key={item.id} className="flex min-w-[180px] shrink-0 items-center gap-3 rounded-xl border border-border p-3 sm:min-w-[200px]">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
                            {initials(item.merchantName) || "—"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">{item.merchantName}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.accountDisplay}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-card-foreground">
                            {formatPaymentAmount(item.amount, item.currency)}
                          </p>
                          <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Make a Payment Form - compact layout */}
            <form id="payment-form" onSubmit={handleSubmit} className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <h3 className="text-sm font-semibold text-card-foreground sm:text-base">Make a Payment</h3>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (fundingSource === "account" ? accountsLoading : creditCardsLoading) ||
                      (fundingSource === "account" ? !fromAccountId : !fromCreditCardId) ||
                      !merchantId ||
                      !amount ||
                      (isRecurring && !recurrenceFrequency)
                    }
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing..." : "Proceed to Payment"}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setManageCategoryOpen(true)}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Manage Merchant Categories
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setManageMerchantOpen(true)}>
                        <Store className="mr-2 h-4 w-4" />
                        Add Service Provider
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <FileDown className="mr-2 h-4 w-4" />
                        Import
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <FileUp className="mr-2 h-4 w-4" />
                        Export
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {formError && (
                <div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              )}

              {/* Payment source: Account or Credit Card */}
              <div className="mt-4">
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
                {/* Segmented control */}
                <div className="mt-1.5 flex rounded-lg border border-border p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFundingSource("account")
                      setFromCreditCardId("")
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${fundingSource === "account"
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
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${fundingSource === "credit_card"
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
                              className={`flex min-w-[150px] max-w-[200px] shrink-0 cursor-pointer flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-colors sm:min-w-[180px] sm:p-3 ${isSelected
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
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(145,50%,25%)] to-[hsl(145,60%,18%)]">
                                    <CreditCard className="h-4 w-4 text-[hsl(0,0%,100%)]" />
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
                            className={`flex min-w-[150px] max-w-[200px] shrink-0 cursor-pointer flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-colors sm:min-w-[180px] sm:p-3 ${isSelected
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
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(145,50%,25%)] to-[hsl(145,60%,18%)]">
                                  <CreditCard className="h-4 w-4 text-[hsl(0,0%,100%)]" />
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

              {/* Merchant Category + Merchant - 2 col */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              {/* Amount + Fee - 2 col */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-card-foreground">Amount</h4>
                  <div className="mt-1 flex overflow-hidden rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring">
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
              </div>

              {/* Reference + Due Date + Recurring - compact row */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                <div>
                  <h4 className="text-sm font-medium text-card-foreground">Due Date (optional)</h4>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-card-foreground">Recurring</h4>
                  <div className="mt-1 flex min-h-[38px] items-center gap-2">
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
                        onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency | "")}
                        className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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

              {/* Note - full width, compact */}
              <div className="mt-4">
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
            </form>
          </div>
        </div>
      </div>

      <ManageMerchantCategoryDialog
        open={manageCategoryOpen}
        onOpenChange={setManageCategoryOpen}
        onCompleted={fetchData}
      />
      <ManageMerchantDialog
        open={manageMerchantOpen}
        onOpenChange={setManageMerchantOpen}
        onCompleted={fetchData}
      />
      <AddSubscriptionDialog
        open={addSubscriptionOpen}
        onOpenChange={setAddSubscriptionOpen}
        onCompleted={fetchData}
      />
      <AddInstallmentDialog
        open={addInstallmentOpen}
        onOpenChange={setAddInstallmentOpen}
        onCompleted={fetchData}
      />
      <PayCreditCardDialog
        open={payCreditCardOpen}
        onOpenChange={setPayCreditCardOpen}
        onCompleted={fetchData}
      />
    </>
  )
}
