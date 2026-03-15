"use client"

import { TopHeader } from "@/components/top-header"
import {
  Plus,
  ArrowUpDown,
  Crown,
  DollarSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash,
  CircleCheck,
  CircleX,
  ShieldOff,
  Store,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCallback, useEffect, useRef, useState } from "react"
import { AddAccountDialog } from "@/components/account/add-account-dialog"
import {
  UpdateAccountDialog,
  type UpdateAccountInitialValues,
} from "@/components/account/update-account-dialog"
import { TopUpAccountDialog } from "@/components/account/top-up-account-dialog"
import { TransferAccountDialog } from "@/components/account/transfer-account-dialog"
import { PaymentAccountDialog } from "@/components/account/payment-account-dialog"
import { ManageMerchantDialog } from "@/components/account/manage-merchant-dialog"
import { getAccounts, deactivateAccount, deleteAccount } from "@/app/actions/accounts"
import { getAccountPageData, type AccountPageData } from "@/app/actions/account-page"
import { getActiveSubscription } from "@/app/actions/billing"
import { type AccountTransaction } from "@/app/actions/transaction"
import type { Database } from "@/lib/supabase/database.types"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
type AccountRow = Database["public"]["Tables"]["account"]["Row"]

type CardTypes = {
  id: string
  name: string
  type: string
  badge: string
  balance: string
  number: string
  maskedNumber: string
  exp: string
  cvv: string
  currency: string
  masked_identifier: string
  variant: "light" | "dark"
  displayName?: string[]
  bankName: string | null
  backgroundImg: string | Blob | null | undefined
  isActive: boolean
  isDeactivated: boolean | null
  cardType: string | null
}

/** Format a digit/asterisk string with a space every 4 characters (e.g. "12345678" → "1234 5678"). */
function formatMaskedNumber(value: string): string {
  const cleaned = value.replace(/\s/g, "").replace(/[^\d*]/g, "*")
  if (!cleaned) return "**** **** **** ****"
  return cleaned.replace(/(.{4})/g, "$1 ").trim()
}

/** Map account rows to the card shape used by the carousel. Uses dummy data for fields not in account. */
function transformAccountToCards(accounts: AccountRow[]): CardTypes[] {
  return accounts.map((acc, i) => {
    const balanceFormatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: acc.currency || "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(acc.balance)
    const cardType = (acc.card_type || "none").toLowerCase()
    const badge =
      cardType === "visa"
        ? "VISA"
        : cardType === "mastercard"
          ? "Mastercard"
          : cardType === "amex"
            ? "American Express"
            : ""
    return {
      id: acc.id,
      name: acc.name,
      bankName: acc.bank_name,
      type: acc.account_type.charAt(0).toUpperCase() + acc.account_type.slice(1).replace("_", " "),
      badge,
      balance: balanceFormatted,
      number: "**** **** **** ****",
      maskedNumber: formatMaskedNumber(acc.masked_identifier ?? ""),
      exp: "**/**",
      cvv: "***",
      currency: acc.currency || "PHP",
      masked_identifier: acc.masked_identifier,
      variant: i % 2 === 0 ? "light" : "dark",
      backgroundImg: acc.background_img_url,
      isActive: acc.is_active,
      isDeactivated: acc.is_deleted,
      cardType: acc.card_network_url
    }
  })
}

/** Map AccountTransaction to display row for the transactions table */
function mapTransactionToRow(tx: AccountTransaction) {
  const d = tx.date ? new Date(tx.date) : null
  const dateStr = d ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"
  const timeStr = d ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"
  const amountFormatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: tx.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tx.amount)
  const amountDisplay = tx.direction === "in" ? `+${amountFormatted}` : amountFormatted
  const name = tx.type === "payment"
    ? "Payment"
    : tx.direction === "in"
      ? "Transfer In"
      : "Transfer Out"
  const category = tx.type === "payment" ? "Payment" : "Transfer"
  const statusDisplay =
    tx.status.charAt(0).toUpperCase() + tx.status.slice(1).toLowerCase()

  return {
    id: tx.id,
    name,
    category,
    icon: tx.type === "payment" ? DollarSign : ArrowUpDown,
    txId: tx.id.slice(0, 8),
    date: dateStr,
    time: timeStr,
    amount: amountDisplay,
    isIncome: tx.direction === "in",
    note: tx.note ?? "",
    status: statusDisplay,
  }
}

const CARD_WIDTH_PX = 280
const CARD_HEIGHT_PX = 176
const CARD_GAP_PX = 20

export default function AccountPage() {
  const [pageData, setPageData] = useState<AccountPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [subscription, setSubscription] = useState<Awaited<ReturnType<typeof getActiveSubscription>> | undefined>(undefined)
  const [transactionsByAccountId, setTransactionsByAccountId] = useState<Record<string, AccountTransaction[]>>({})
  const [cards, setCards] = useState<CardTypes[] | undefined>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [updateAccountOpen, setUpdateAccountOpen] = useState(false)
  const [updateAccountId, setUpdateAccountId] = useState<string | null>(null)
  const [updateInitialValues, setUpdateInitialValues] =
    useState<UpdateAccountInitialValues | null>(null)
  const [manageMerchantOpen, setManageMerchantOpen] = useState(false)
  const [transactions, setTransactions] = useState<AccountTransaction[]>([])
  const trackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadPageData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAccountPageData()
      setPageData(data)
      setAccounts(data.accounts)
      setSubscription(data.subscription)
      setTransactionsByAccountId(data.transactionsByAccountId)
    } catch {
      toast({
        title: "Failed to load accounts",
        description: "There was a problem fetching your accounts. Please try again.",
        variant: "destructive",
      })
      setPageData(null)
      setAccounts([])
      setSubscription(null)
      setTransactionsByAccountId({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPageData()
  }, [loadPageData])

  useEffect(() => {
    if (accounts.length === 0) {
      setCards([])
      setSelectedIndex(0)
      setTransactions([])
      return
    }
    const nextCards = transformAccountToCards(accounts)
    setCards(nextCards)
    setSelectedIndex((i) => (nextCards.length ? Math.min(i, nextCards.length - 1) : 0))
  }, [accounts])

  useEffect(() => {
    if (accounts.length === 0 || !transactionsByAccountId) {
      setTransactions([])
      return
    }
    const selectedAccount = accounts[selectedIndex]
    if (!selectedAccount) {
      setTransactions([])
      return
    }
    setTransactions(transactionsByAccountId[selectedAccount.id] ?? [])
  }, [accounts, selectedIndex, transactionsByAccountId])

  const cardsList = cards ?? []
  const selectedCard = cardsList[selectedIndex]
  const totalCards = cardsList.length
  const accountCount = accounts.length
  const isPro = subscription !== null
  const canAddAccount = isPro || accountCount < 3

  const refreshAfterMutation = useCallback(() => {
    void loadPageData()
  }, [loadPageData])

  const updateTrackTransform = useCallback(() => {
    if (!containerRef.current || !trackRef.current) return
    const containerWidth = containerRef.current.offsetWidth
    const cardCenterOffset = selectedIndex * (CARD_WIDTH_PX + CARD_GAP_PX) + CARD_WIDTH_PX / 2
    const transformX = containerWidth / 2 - cardCenterOffset
    trackRef.current.style.transform = `translate3d(${transformX}px, 0, 0)`
  }, [selectedIndex])

  useEffect(() => {
    updateTrackTransform()
    const ro = new ResizeObserver(updateTrackTransform)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [updateTrackTransform])

  const goPrev = () => {
    setSelectedIndex((i) => (i <= 0 ? totalCards - 1 : i - 1))
  }
  const goNext = () => {
    setSelectedIndex((i) => (i >= totalCards - 1 ? 0 : i + 1))
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault()
        goPrev()
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [totalCards])

  return (
    <>
      <main className="w-full px-4 pt-4 text-left lg:px-6 lg:pt-6">
        <Breadcrumb>
          <BreadcrumbList className="justify-start">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Accounts</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </main>
      <AddAccountDialog
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
        onCompleted={loadPageData}
      />
      {selectedCard && (
        <TopUpAccountDialog
          open={topUpOpen}
          onOpenChange={setTopUpOpen}
          accountId={selectedCard.id}
          accountName={
            selectedCard.displayName
              ? selectedCard.displayName.join(" ")
              : selectedCard.name
          }
          currency={selectedCard.currency}
          onCompleted={refreshAfterMutation}
        />
      )}
      <TransferAccountDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        accounts={(accounts ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          balance: a.balance ?? 0,
          currency: a.currency ?? "PHP",
        }))}
        selectedAccountId={selectedCard?.id}
        onCompleted={refreshAfterMutation}
      />
      <PaymentAccountDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        accounts={(accounts ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          balance: a.balance ?? 0,
          currency: a.currency ?? "PHP",
        }))}
        selectedAccountId={selectedCard?.id}
        onCompleted={refreshAfterMutation}
      />
      {updateAccountId && updateInitialValues && (
        <UpdateAccountDialog
          open={updateAccountOpen}
          onOpenChange={setUpdateAccountOpen}
          accountId={updateAccountId}
          initialValues={updateInitialValues}
          onUpdated={refreshAfterMutation}
        />
      )}
      <ManageMerchantDialog
        open={manageMerchantOpen}
        onOpenChange={setManageMerchantOpen}
      />
      {loading ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-screen-2xl space-y-6">
            <div className="h-[232px] animate-pulse rounded-xl bg-muted" />
            <div className="h-[320px] animate-pulse rounded-xl bg-muted" />
            <div className="h-[490px] animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
        {/* ========== CAROUSEL AT TOP ========== */}
        <div className="rounded-xl border border-border bg-card p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-card-foreground">My Cards</h2>
            <div className="flex items-center gap-2">
              {!canAddAccount && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  Free plan: 3 accounts max.
                </span>
              )}
              {canAddAccount ? (
                <button
                  type="button"
                  onClick={() => setAddAccountOpen(true)}
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              ) : (
                <Link
                  href="/dashboard/subscription"
                  className="flex items-center gap-1 text-sm font-medium text-amber-500 hover:text-amber-600"
                >
                  <Crown className="h-4 w-4" /> Upgrade to Pro
                </Link>
              )}
            </div>
          </div>

          {/* Carousel: same behavior as carousel-sample (CSS + JS) */}
          <div
            ref={containerRef}
            className="account-carousel relative w-full overflow-hidden"
            style={{ height: CARD_HEIGHT_PX + 56 }}
            aria-label="Card carousel"
          >
            <div
              ref={trackRef}
              className="account-carousel-track flex items-center justify-center gap-5"
              style={{
                width: totalCards * CARD_WIDTH_PX + (totalCards - 1) * CARD_GAP_PX,
                transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            >
              {cardsList.map((card, i) => {
                const isCenter = i === selectedIndex
                const isDark = card.variant === "dark"
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    className="account-carousel-card shrink-0 rounded-2xl border-2 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    style={{
                      width: CARD_WIDTH_PX,
                      height: CARD_HEIGHT_PX,
                      transform: isCenter ? "scale(1)" : "scale(0.88)",
                      opacity: isCenter ? 1 : 0.92,
                      zIndex: isCenter ? 10 : 1,
                      boxShadow: isCenter
                        ? "0 10px 40px -10px rgba(0,0,0,0.25), 0 4px 15px -4px rgba(0,0,0,0.15)"
                        : "0 4px 12px -4px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div
                      className={`relative h-full w-full overflow-hidden rounded-2xl text-white shadow-2xl transition-transform ${isDark ? "bg-emerald-900" : "bg-red-100"
                        }`}
                    >
                      <img
                        className="absolute inset-0 h-full w-full object-cover"
                        src={card.backgroundImg ?? "https://i.imgur.com/kGkSg1v.png"}
                        alt=""
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black/40 via-black/10 to-black/60" />

                      <div className="relative flex h-full flex-col justify-between px-6 pt-4 pb-5">
                        <div className="flex min-w-0 justify-between gap-3">
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="text-[11px] font-light tracking-wide text-white/80">
                              Name
                            </p>
                            <p
                              className="mt-1 truncate text-sm font-medium tracking-[0.15em]"
                              title={card.displayName ? card.displayName.join(" ") : card.name}
                            >
                              {card.displayName
                                ? card.displayName.join(" ")
                                : card.name}
                            </p>
                          </div>
                          <img
                            className="h-12 w-12 shrink-0"
                            src={card.cardType ?? "https://i.imgur.com/bbPHJVe.png"}
                            alt=""
                          />
                        </div>

                        <div className="pt-2">
                          <p className="text-[11px] font-light tracking-wide text-white/80">
                            Card Number
                          </p>
                          <p className="mt-1 text-sm font-medium tracking-[0.2em]">
                            {card.maskedNumber || card.number}
                          </p>
                        </div>

                        <div className="pt-4 pr-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="text-[10px] font-light text-white/80">
                                Valid
                              </p>
                              <p className="mt-1 text-xs font-medium tracking-[0.2em]">
                                {card.exp}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-light text-white/80">
                                Expiry
                              </p>
                              <p className="mt-1 text-xs font-medium tracking-[0.2em]">
                                {card.exp}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-light text-white/80">
                                CVV
                              </p>
                              <p className="mt-1 text-xs font-bold tracking-[0.3em]">
                                {card.cvv || "···"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Prev / Next — same as carousel-sample */}
            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
                aria-label="Previous card"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
                aria-label="Next card"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Use arrow keys or Page Up/Down · Click a card to select
          </p>

          {/* Card details + quick actions — same background as carousel above */}
          <div className="mt-6 border-t border-border pt-6">
            {selectedCard ? (
              <div className="flex flex-col gap-6">
                {/* Balance + Quick actions (money flow) */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Balance</p>
                    <p className="mt-1 text-xl font-bold text-card-foreground lg:text-2xl">
                      {selectedCard.balance}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    {[
                      { icon: Plus, label: "Top Up" },
                      { icon: ArrowUpDown, label: "Transfer" },
                      { icon: DollarSign, label: "Payment" },
                    ].map((action) => {
                      const isTopUp = action.label === "Top Up"
                      const isTransfer = action.label === "Transfer"
                      const isPayment = action.label === "Payment"
                      const handleClick = () => {
                        if (!selectedCard) return
                        if (isTopUp) setTopUpOpen(true)
                        if (isTransfer) setTransferOpen(true)
                        if (isPayment) setPaymentOpen(true)
                      }
                      const colorClasses =
                        isTopUp
                          ? "border-success/40 text-success hover:bg-success/10"
                          : isTransfer
                            ? "border-primary/40 text-primary hover:bg-primary/10"
                            : "border-primary/40 text-primary hover:bg-primary/10"
                      return (
                        <button
                          key={action.label}
                          type="button"
                          title={action.label}
                          onClick={handleClick}
                          className={`flex h-9 min-w-[88px] items-center justify-center gap-1.5 rounded-lg border bg-muted/50 px-4 text-xs font-medium transition-colors ${colorClasses}`}
                        >
                          <action.icon className="h-3.5 w-3.5" aria-hidden />
                          <span>{action.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Account details grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Name</p>
                    <p className="mt-1 text-sm font-bold text-card-foreground">
                      {selectedCard.displayName ? selectedCard.displayName.join(" ") : selectedCard.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Type</p>
                    <p className="mt-1 text-sm font-bold text-card-foreground">
                      {selectedCard.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="mt-1 text-sm font-bold text-card-foreground font-mono">
                      {selectedCard.maskedNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="mt-1 text-sm font-bold text-card-foreground">
                      {selectedCard.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="mt-1 text-sm font-bold text-card-foreground">
                      {selectedCard.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-card-foreground">
                      {selectedCard.isActive ? (
                        <>
                          <CircleCheck className="h-4 w-4 text-green-500" aria-label="Active" />
                          <span className="text-green-500">Active</span>
                        </>
                      ) : (
                        <>
                          <CircleX className="h-4 w-4 text-red-500" aria-label="Inactive" />
                          <span className="text-red-500">Inactive</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Manage account + Manage Merchant (side by side) */}
                <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Manage account</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: Pencil, label: "Update" },
                        { icon: ShieldOff, label: "Deactivate" },
                        { icon: Trash, label: "Delete" },
                      ].map((action) => {
                        const isDelete = action.label === "Delete"
                        const isUpdate = action.label === "Update"
                        const isDeactivate = action.label === "Deactivate"
                        const handleClick = async () => {
                          if (!selectedCard || !accounts) return

                          if (isUpdate) {
                            const selectedAccount = accounts.find(
                              (acc) => acc.id === selectedCard.id
                            )
                            if (!selectedAccount) return

                            const formattedBalance = new Intl.NumberFormat(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ).format(selectedAccount.balance ?? 0)

                            setUpdateAccountId(selectedAccount.id)
                            setUpdateInitialValues({
                              accountName: selectedAccount.name ?? "",
                              bankName: selectedAccount.bank_name,
                              maskedIdentifier:
                                selectedAccount.masked_identifier ?? "",
                              totalBalance: formattedBalance,
                              currency: selectedAccount.currency || "PHP",
                              accountType:
                                selectedAccount.account_type as UpdateAccountInitialValues["accountType"]
                            })
                            setUpdateAccountOpen(true)
                            return
                          }

                          if (isDeactivate) {
                            const result = await deactivateAccount(selectedCard.id)
                            if (result.success) {
                              toast({
                                title: "Account deactivated",
                                description: result.message,
                              })
                              void loadPageData()
                            } else {
                              toast({
                                title: "Failed to deactivate account",
                                description: result.error,
                                variant: "destructive",
                              })
                            }
                            return
                          }

                          if (isDelete) {
                            const result = await deleteAccount(selectedCard.id)
                            if (result.success) {
                              toast({
                                title: "Account deleted",
                                description: result.message,
                              })
                              void loadPageData()
                            } else {
                              toast({
                                title: "Failed to delete account",
                                description: result.error,
                                variant: "destructive",
                              })
                            }
                          }
                        }
                        const colorClasses = isDelete
                          ? "border-destructive/60 text-destructive hover:bg-destructive/10"
                          : isDeactivate
                            ? "border-warning/50 text-warning hover:bg-warning/10"
                            : "border-primary/40 text-primary hover:bg-primary/10"
                        return (
                          <button
                            key={action.label}
                            type="button"
                            title={action.label}
                            onClick={handleClick}
                            className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border bg-muted/50 px-4 text-xs font-medium transition-colors ${colorClasses}`}
                          >
                            <action.icon className="h-3.5 w-3.5" aria-hidden />
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-center text-right">
                    <p className="text-xs font-medium text-muted-foreground">Manage Merchant</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        title="Show merchants"
                        onClick={() => setManageMerchantOpen(true)}
                        className="flex h-9 min-w-[88px] items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/50 px-4 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        <Store className="h-3.5 w-3.5" aria-hidden />
                        <span>Show merchants</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No account selected. Add an account to get started.</p>
            )}
          </div>
        </div>

        {/* ========== TRANSACTIONS BELOW ========== */}
        <div className="mt-6 flex flex-col gap-4 lg:gap-5">
          {/* Transactions table */}
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 lg:px-6">
              <h3 className="text-base font-semibold text-card-foreground">
                Transactions
              </h3>
              <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
                <option>This Month</option>
                <option>Last Month</option>
              </select>
            </div>
            <div className="h-[490px] min-h-0 overflow-auto overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="sticky top-0 z-10 bg-card shadow-sm">
                  <tr className="border-b border-border">
                    <th className="w-10 bg-card px-4 py-3 lg:px-5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                    </th>
                    {[
                      "Transaction Name",
                      "Transaction ID",
                      "Date & Time",
                      "Amount",
                      "Note",
                      "Status",
                    ].map((col) => (
                      <th
                        key={col}
                        className="bg-card px-4 py-3 text-left lg:px-5"
                      >
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          {col} <ChevronDown className="h-3 w-3" />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!selectedCard ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-muted-foreground lg:px-5"
                      >
                        Select an account to view transactions.
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-muted-foreground lg:px-5"
                      >
                        No transactions yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const row = mapTransactionToRow(tx)
                      const Icon = row.icon
                      return (
                        <tr
                          key={tx.id}
                          className="border-b border-border last:border-0 transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-3.5 lg:px-5">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-input accent-primary"
                            />
                          </td>
                          <td className="px-4 py-3.5 lg:px-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                                <Icon className="h-4 w-4 text-accent-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-card-foreground">
                                  {row.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {row.category}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground lg:px-5">
                            {row.txId}
                          </td>
                          <td className="px-4 py-3.5 lg:px-5">
                            <p className="text-card-foreground">{row.date}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.time}
                            </p>
                          </td>
                          <td
                            className={`px-4 py-3.5 font-medium lg:px-5 ${row.isIncome ? "text-primary" : "text-destructive"}`}
                          >
                            {row.amount}
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3.5 text-muted-foreground lg:px-5">
                            {row.note}
                          </td>
                          <td className="px-4 py-3.5 lg:px-5">
                            <Badge
                              className={`rounded-full px-3 py-1 text-xs font-medium ${row.status.toLowerCase() === "completed"
                                ? "bg-primary/10 text-primary hover:bg-primary/10"
                                : "bg-warning/10 text-warning hover:bg-warning/10"}`}
                            >
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  )
}
