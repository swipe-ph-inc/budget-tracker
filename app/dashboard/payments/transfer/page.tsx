"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { TopHeader } from "@/components/top-header"
import { Search, SlidersHorizontal, ArrowLeftRight, CreditCard, Plus, MoreHorizontal, Copy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddRecipientDialog } from "@/components/payment/transfer/add-recipient-dialog"
import { getRecipients, type Recipient } from "@/app/actions/recipient"
import { getAccounts } from "@/app/actions/accounts"
import { createTransfer, createTransferToRecipient, getRecentTransfers, type RecentTransferItem } from "@/app/actions/transaction"
import type { Database } from "@/lib/supabase/database.types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { ErrorMessage } from "@/components/ui/status-message"

type AccountRow = Database["public"]["Tables"]["account"]["Row"]
type TransferMethod = Database["public"]["Enums"]["transfer_method_enum"]

function parseAmount(value: string): number {
  const cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "")
  const parsed = parseFloat(cleaned)
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
}

const paymentTabs = [
  { label: "Transfer", icon: ArrowLeftRight, href: "/dashboard/payments/transfer", active: true },
  { label: "Payment", icon: CreditCard, href: "/dashboard/payments/payment", active: false },
]

function initials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatBalance(account: AccountRow): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: account.currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(account.balance)
}

type TransferMode = "recipient" | "toAccount"

export default function TransferPage() {
  const [transferMode, setTransferMode] = useState<TransferMode>("recipient")
  const [transferType, setTransferType] = useState<"local" | "international">("local")
  const [addRecipientOpen, setAddRecipientOpen] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(true)
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("")
  const [selectedToAccountId, setSelectedToAccountId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [feeAmount, setFeeAmount] = useState("")
  const [note, setNote] = useState("")
  const [reference, setReference] = useState("")
  const [transferMethod, setTransferMethod] = useState<TransferMethod>("instaPay")
  const [transferError, setTransferError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recentTransfers, setRecentTransfers] = useState<RecentTransferItem[]>([])
  const [recentTransfersLoading, setRecentTransfersLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true)
    try {
      const data = await getAccounts()
      const list = data ?? []
      setAccounts(list)
      setSelectedAccountId((prev) => {
        if (list.length === 0) return null
        const hasPrev = prev && list.some((a) => a.id === prev)
        return hasPrev ? prev : list[0]!.id
      })
    } catch {
      setAccounts([])
      setSelectedAccountId(null)
    } finally {
      setAccountsLoading(false)
    }
  }, [])

  const fetchRecipients = useCallback(async () => {
    setRecipientsLoading(true)
    const result = await getRecipients()
    if (result.success) {
      const list = result.data
      setRecipients(list)
      setSelectedRecipientId((prev) => {
        if (list.length === 0) return ""
        const hasPrev = prev && list.some((r) => r.id === prev)
        return hasPrev ? prev : list[0]!.id
      })
    } else {
      setRecipients([])
      setSelectedRecipientId("")
    }
    setRecipientsLoading(false)
  }, [])

  useEffect(() => {
    fetchRecipients()
  }, [fetchRecipients])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const fetchRecentTransfers = useCallback(async () => {
    setRecentTransfersLoading(true)
    const data = await getRecentTransfers(10)
    setRecentTransfers(data)
    setRecentTransfersLoading(false)
  }, [])

  useEffect(() => {
    fetchRecentTransfers()
  }, [fetchRecentTransfers])

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
  const currency = selectedAccount?.currency ?? "PHP"
  const toAccountOptions = accounts.filter((a) => a.id !== selectedAccountId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTransferError(null)

    if (!selectedAccountId) {
      setTransferError("Please select a payment account.")
      return
    }
    if (transferMode === "recipient" && !selectedRecipientId) {
      setTransferError("Please select a recipient.")
      return
    }
    if (transferMode === "toAccount" && !selectedToAccountId) {
      setTransferError("Please select a destination account.")
      return
    }
    const amountNum = parseAmount(amount)
    if (amountNum <= 0) {
      setTransferError("Amount must be greater than zero.")
      return
    }
    const feeNum = parseAmount(feeAmount)

    setIsSubmitting(true)

    let result: { success: boolean; error?: string }
    if (transferMode === "recipient") {
      result = await createTransferToRecipient({
        fromAccountId: selectedAccountId,
        toRecipientId: selectedRecipientId,
        amount: amountNum,
        currency,
        note: note.trim() || undefined,
        reference: reference.trim() || undefined,
        transferMethod,
        transferType,
        feeAmount: feeNum,
        feeCurrency: feeNum > 0 ? currency : null,
      })
    } else {
      result = await createTransfer({
        fromAccountId: selectedAccountId,
        toAccountId: selectedToAccountId,
        amount: amountNum,
        currency,
        note: note.trim() || undefined,
        transferMethod,
        transferType: "local",
        feeAmount: feeNum,
        feeCurrency: feeNum > 0 ? currency : null,
      })
    }

    if (result.success) {
      toast({ title: "Transfer successful", description: "Your transfer has been completed." })
      setAmount("")
      setFeeAmount("")
      setNote("")
      setReference("")
      setSelectedToAccountId("")
      fetchAccounts()
      fetchRecentTransfers()
    } else {
      setTransferError(result.error ?? "Something went wrong.")
    }
    setIsSubmitting(false)
  }

  const handleCancel = () => {
    setAmount("")
    setFeeAmount("")
    setNote("")
    setReference("")
    setTransferError(null)
  }

  return (
    <>
      <TopHeader title="Transfer" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Tabs + Recipients */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-5">
            {/* Payment Type Tabs */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-4 gap-3">
                {paymentTabs.map((tab) => (
                  <a
                    key={tab.label}
                    href={tab.href}
                    className={`flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors ${tab.active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <tab.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{tab.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search account"
                  className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Recipients List */}
            <div className="flex flex-col gap-2">
              {recipientsLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading recipients...</div>
              ) : recipients.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No recipients yet. Add one below.</div>
              ) : (
                recipients.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${r.display_name}&backgroundColor=e8f5e9`} alt={r.display_name} />
                      <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">{initials(r.display_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{r.display_name}</p>
                      <p className="text-xs text-muted-foreground">{r.account_number}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Add New Recipient */}
            <button
              type="button"
              onClick={() => setAddRecipientOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add New Recipient
            </button>

            <AddRecipientDialog
              open={addRecipientOpen}
              onOpenChange={setAddRecipientOpen}
              onCompleted={fetchRecipients}
            />
          </div>

          {/* Right Column - Recent Transfers + Transfer Form */}
          <div className="min-w-0 flex-1 flex flex-col gap-5">
            {/* Recent Transfers */}
            <div className="min-w-0 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Recent Transfer
                  <Link
                    href="/dashboard/payments/transfer/transfers"
                    className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                    title="View all transfers"
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
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </Link>
                </h3>
                <button
                  type="button"
                  onClick={fetchRecentTransfers}
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Refresh
                </button>
              </div>
              <div className="mt-4 min-w-0 overflow-hidden">
                <div className="flex min-w-0 w-full gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: "thin" }}>
                  {recentTransfersLoading ? (
                    <div className="flex min-w-[200px] items-center justify-center rounded-xl border border-border p-6 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : recentTransfers.length === 0 ? (
                    <div className="flex min-w-[200px] items-center justify-center rounded-xl border border-border p-6 text-sm text-muted-foreground">
                      No transfers yet
                    </div>
                  ) : (
                    recentTransfers.map((t) => {
                      const amountFormatted = new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: t.currency || "PHP",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(t.amount)
                      const isSuccessful = t.status.toLowerCase() === "completed"
                      return (
                        <div key={t.id} className="flex min-w-[300px] items-center gap-3 rounded-xl border border-border p-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${t.name}&backgroundColor=e8f5e9`} alt={t.name} />
                            <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">{initials(t.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">{t.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{t.account}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-card-foreground">{amountFormatted}</p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${isSuccessful ? "border-primary/30 bg-primary/10 text-primary" : "border-warning/30 bg-warning/10 text-warning"
                                }`}
                            >
                              {t.status}
                            </Badge>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Transfer Form */}
            <div className="min-w-0 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Transfer Form</h3>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Recipient / To Account Toggle */}
              <div className="mt-4 flex rounded-xl bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTransferMode("recipient")
                    setSelectedToAccountId("")
                  }}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${transferMode === "recipient"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Recipient
                </button>
                <button
                  type="button"
                  onClick={() => setTransferMode("toAccount")}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${transferMode === "toAccount"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  To Account
                </button>
              </div>

              {/* Payment Account */}
              <div className="mt-5">
                <h4 className="text-sm font-medium text-card-foreground">Payment Account</h4>
                <div className="mt-3 min-w-0 overflow-hidden rounded-lg border border-border">
                  {accountsLoading ? (
                    <div className="flex h-28 items-center justify-center py-8 text-center text-sm text-muted-foreground">
                      Loading accounts...
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="flex h-28 items-center justify-center py-8 text-center text-sm text-muted-foreground">
                      No accounts yet. Add an account from the Account page.
                    </div>
                  ) : (
                    <div
                      className="flex min-w-0 w-full gap-3 overflow-x-auto overflow-y-hidden p-3 pb-2 scroll-smooth"
                      style={{ scrollbarWidth: "thin" }}
                    >
                      {accounts.map((acc) => {
                        const isSelected = acc.id === selectedAccountId
                        return (
                          <div
                            key={acc.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedAccountId(acc.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                setSelectedAccountId(acc.id)
                              }
                            }}
                            className={`flex min-w-[200px] max-w-[220px] shrink-0 cursor-pointer flex-col gap-2 rounded-xl border p-4 text-left transition-colors ${isSelected
                              ? "border-2 border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-card hover:bg-accent/50 hover:border-accent-foreground/20"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {acc.card_network_url ? (
                                <img
                                  src={acc.card_network_url}
                                  alt=""
                                  className="h-10 w-10 shrink-0 rounded-lg object-contain"
                                />
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(145,50%,25%)] to-[hsl(145,60%,18%)]">
                                  <CreditCard className="h-5 w-5 text-[hsl(0,0%,100%)]" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="truncate text-sm font-medium text-card-foreground">{acc.name}</p>
                              <p className="text-base font-bold text-card-foreground">{formatBalance(acc)}</p>
                              <div className="flex items-center gap-1">
                                <p className="truncate text-xs text-muted-foreground">{acc.masked_identifier}</p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void navigator.clipboard.writeText(acc.masked_identifier)
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
                  )}
                </div>
                {accounts.length > 1 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Scroll horizontally to see all accounts</p>
                )}
              </div>

              {/* Select Recipient (when Recipient mode) */}
              {transferMode === "recipient" && (
                <div className="mt-5">
                  <h4 className="text-sm font-medium text-card-foreground">Select Recipient</h4>
                  <div className="mt-2">
                    <Select
                      value={selectedRecipientId}
                      onValueChange={setSelectedRecipientId}
                      disabled={recipientsLoading || recipients.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            recipientsLoading ? "Loading..." : recipients.length === 0 ? "No recipients yet" : "Select recipient"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.display_name} — {r.account_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Select Destination Account (when To Account mode) */}
              {transferMode === "toAccount" && (
                <div className="mt-5">
                  <h4 className="text-sm font-medium text-card-foreground">Destination Account</h4>
                  <div className="mt-2">
                    <Select
                      value={selectedToAccountId}
                      onValueChange={setSelectedToAccountId}
                      disabled={accountsLoading || toAccountOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            accountsLoading
                              ? "Loading..."
                              : toAccountOptions.length === 0
                                ? "No other accounts"
                                : "Select account"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {toAccountOptions.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} — {formatBalance(acc)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                {/* Amount + Transfer Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Amount <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-method">Transfer Method</Label>
                    <Select
                      value={transferMethod}
                      onValueChange={(v) => setTransferMethod(v as TransferMethod)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="transfer-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instaPay">InstaPay</SelectItem>
                        <SelectItem value="pesoNet">PesoNet</SelectItem>
                        <SelectItem value="wire">Wire</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fee + Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fee">Fee (optional)</Label>
                    <Input
                      id="fee"
                      type="text"
                      placeholder="0.00"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">Transfer fee if any</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference (optional)</Label>
                    <Input
                      id="reference"
                      type="text"
                      placeholder="e.g. Invoice #123"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input
                    id="note"
                    type="text"
                    placeholder="Payment for shared vacation expenses"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {transferError && (
                  <ErrorMessage message={transferError} />
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="rounded-lg border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Send Money"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
