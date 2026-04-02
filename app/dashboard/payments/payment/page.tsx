"use client"

import Link from "next/link"
import {
  Calendar,
  CalendarRange,
  ChevronDown,
  CreditCard,
  FileDown,
  FileUp,
  FolderPlus,
  MoreHorizontal,
  Store,
  WalletCards,
} from "lucide-react"
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
import { useState, useCallback, useEffect, useMemo } from "react"
import { getAccounts } from "@/app/actions/accounts"
import { getCreditCards } from "@/app/actions/credit-cards"
import {
  getMerchantCategories,
  getMerchantsWithCategories,
  type MerchantCategoryOption,
  type MerchantWithCategory,
} from "@/app/actions/merchants"
import {
  getPayments,
  getCardPayments,
  type PaymentListItem,
  type GetPaymentsFilters,
} from "@/app/actions/transaction"
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
import { AddSubscriptionDialog } from "@/components/credit-card/subscription/add-subscription-dialog"
import { AddInstallmentDialog } from "@/components/credit-card/installment/add-installment-dialog"
import { PayCreditCardDialog } from "@/components/credit-card/pay-credit-card-dialog"
import { MakePaymentDialog } from "@/components/payment/make-payment-dialog"
import { PaymentHistoryTable } from "@/components/payment/payment-history-table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

type AccountRow = Tables<"account">
type CreditCardRow = Tables<"credit_card">

const paymentTabs: {
  label: string
  icon: typeof WalletCards
  action: "make_payment" | "subscription" | "installment" | "credit_card_payment"
}[] = [
  { label: "Payment", icon: WalletCards, action: "make_payment" },
  { label: "Subscription Payment", icon: CalendarRange, action: "subscription" },
  { label: "Installment Payment", icon: Calendar, action: "installment" },
  { label: "Credit Card Payment", icon: CreditCard, action: "credit_card_payment" },
]

const MERGED_FETCH_LIMIT = 500

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
]

const DEFAULT_FILTERS: GetPaymentsFilters = {
  status: "all",
  merchantId: "all",
  dateFrom: "",
  dateTo: "",
}

export default function PaymentPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [creditCards, setCreditCards] = useState<CreditCardRow[]>([])
  const [categories, setCategories] = useState<MerchantCategoryOption[]>([])
  const [merchants, setMerchants] = useState<MerchantWithCategory[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [creditCardsLoading, setCreditCardsLoading] = useState(true)
  const [merchantsLoading, setMerchantsLoading] = useState(true)

  const [historyFilters, setHistoryFilters] = useState<GetPaymentsFilters>(DEFAULT_FILTERS)
  const [mergedHistory, setMergedHistory] = useState<PaymentListItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [makePaymentOpen, setMakePaymentOpen] = useState(false)
  const [addSubscriptionOpen, setAddSubscriptionOpen] = useState(false)
  const [addInstallmentOpen, setAddInstallmentOpen] = useState(false)
  const [payCreditCardOpen, setPayCreditCardOpen] = useState(false)

  const loadAccountsAndMerchants = useCallback(async () => {
    setAccountsLoading(true)
    setCreditCardsLoading(true)
    setMerchantsLoading(true)
    try {
      const [accountsData, creditCardsData, categoriesData, merchantsData] = await Promise.all([
        getAccounts(),
        getCreditCards(),
        getMerchantCategories(),
        getMerchantsWithCategories(),
      ])
      setAccounts(accountsData ?? [])
      setCreditCards(creditCardsData ?? [])
      setCategories(categoriesData ?? [])
      setMerchants(merchantsData ?? [])
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
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const [paymentsData, cardPaymentsData] = await Promise.all([
        getPayments({
          ...historyFilters,
          limit: MERGED_FETCH_LIMIT,
        }),
        getCardPayments({
          status: historyFilters.status,
          fromAccountId: historyFilters.fromAccountId,
          dateFrom: historyFilters.dateFrom,
          dateTo: historyFilters.dateTo,
          limit: MERGED_FETCH_LIMIT,
        }),
      ])
      const combined: PaymentListItem[] = [
        ...(paymentsData ?? []),
        ...(cardPaymentsData ?? []),
      ].sort((a, b) => {
        const dateA = new Date(a.paidAt ?? a.createdAt).getTime()
        const dateB = new Date(b.paidAt ?? b.createdAt).getTime()
        return dateB - dateA
      })
      setMergedHistory(combined)
    } catch {
      toast({
        title: "Failed to load payments",
        description: "Could not load payment history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setHistoryLoading(false)
    }
  }, [historyFilters])

  useEffect(() => {
    void loadAccountsAndMerchants()
  }, [loadAccountsAndMerchants])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    setPage(1)
  }, [historyFilters])

  const totalPages = Math.max(1, Math.ceil(mergedHistory.length / pageSize))

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return mergedHistory.slice(start, start + pageSize)
  }, [mergedHistory, page, pageSize])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const handleFilterChange = <K extends keyof GetPaymentsFilters>(key: K, value: GetPaymentsFilters[K]) => {
    setHistoryFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setHistoryFilters(DEFAULT_FILTERS)
  }

  const refreshAll = useCallback(async () => {
    await loadAccountsAndMerchants()
    await fetchHistory()
  }, [loadAccountsAndMerchants, fetchHistory])

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4 lg:p-6">
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
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:gap-6">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {paymentTabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    if (tab.action === "make_payment") setMakePaymentOpen(true)
                    else if (tab.action === "subscription") setAddSubscriptionOpen(true)
                    else if (tab.action === "installment") setAddInstallmentOpen(true)
                    else setPayCreditCardOpen(true)
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors ${
                    tab.action === "make_payment"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <tab.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-border bg-card">
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
                <h2 className="text-base font-semibold text-card-foreground">Payment history</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/merchants">
                          <FolderPlus className="mr-2 h-4 w-4" />
                          Manage Merchant Categories
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/merchants">
                          <Store className="mr-2 h-4 w-4" />
                          Add Service Provider
                        </Link>
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
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      aria-expanded={filtersOpen}
                    >
                      Filters
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          filtersOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <CollapsibleContent className="border-b border-border">
                <div className="p-3 sm:p-4">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Filter by status, merchant, and date. Up to {MERGED_FETCH_LIMIT} rows per source are loaded.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
                <div className="space-y-2">
                  <Label htmlFor="pay-status" className="text-xs">
                    Status
                  </Label>
                  <Select
                    value={historyFilters.status ?? "all"}
                    onValueChange={(v) => handleFilterChange("status", v)}
                  >
                    <SelectTrigger id="pay-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-merchant" className="text-xs">
                    Merchant
                  </Label>
                  <Select
                    value={historyFilters.merchantId ?? "all"}
                    onValueChange={(v) => handleFilterChange("merchantId", v)}
                  >
                    <SelectTrigger id="pay-merchant" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All merchants</SelectItem>
                      {merchants.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-from" className="text-xs">
                    From date
                  </Label>
                  <Input
                    id="pay-from"
                    type="date"
                    value={historyFilters.dateFrom ?? ""}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value || undefined)
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-to" className="text-xs">
                    To date
                  </Label>
                  <Input
                    id="pay-to"
                    type="date"
                    value={historyFilters.dateTo ?? ""}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value || undefined)
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <PaymentHistoryTable
              wrapInCard={false}
              payments={paginatedRows}
              loading={historyLoading}
              pagination={{
                page,
                totalPages,
                totalItems: mergedHistory.length,
                pageSize,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
              emptyContent={
                <>
                  <p>No payments match your filters.</p>
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => setMakePaymentOpen(true)}
                  >
                    Make a payment
                  </button>
                  <span className="text-muted-foreground"> or </span>
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={clearFilters}
                  >
                    clear filters
                  </button>
                  <span className="text-muted-foreground">.</span>
                </>
              }
            />
          </div>
        </div>
      </div>

      <MakePaymentDialog
        open={makePaymentOpen}
        onOpenChange={setMakePaymentOpen}
        onCompleted={refreshAll}
        accounts={accounts}
        creditCards={creditCards}
        categories={categories}
        merchants={merchants}
        accountsLoading={accountsLoading}
        creditCardsLoading={creditCardsLoading}
        merchantsLoading={merchantsLoading}
      />
      <AddSubscriptionDialog
        open={addSubscriptionOpen}
        onOpenChange={setAddSubscriptionOpen}
        onCompleted={refreshAll}
      />
      <AddInstallmentDialog
        open={addInstallmentOpen}
        onOpenChange={setAddInstallmentOpen}
        onCompleted={refreshAll}
      />
      <PayCreditCardDialog
        open={payCreditCardOpen}
        onOpenChange={setPayCreditCardOpen}
        onCompleted={refreshAll}
      />
    </>
  )
}
