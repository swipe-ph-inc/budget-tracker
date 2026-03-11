"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { CreditCard, RefreshCw, MoreHorizontal } from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    getSubscriptionSchedules,
    toggleSubscriptionAutoPay,
    type SubscriptionScheduleListItem,
} from "@/app/actions/credit-cards"
import { AddSubscriptionDialog } from "@/components/credit-card/subscription/add-subscription-dialog"
import { EditSubscriptionDialog } from "@/components/credit-card/subscription/edit-subscription-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { Zap } from "lucide-react"

const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "cancelled", label: "Cancelled" },
] as const

const FREQ_LABELS: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Biweekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
}

export default function CardSubscriptionPage() {
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "cancelled">("all")
    const [cardFilter, setCardFilter] = useState<string>("all")
    const [merchantFilter, setMerchantFilter] = useState<string>("all")
    const [currencyFilter, setCurrencyFilter] = useState<string>("all")
    const [schedules, setSchedules] = useState<SubscriptionScheduleListItem[]>([])
    const [loading, setLoading] = useState(false)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [editSubscription, setEditSubscription] = useState<SubscriptionScheduleListItem | null>(null)
    const [autoPayConfirm, setAutoPayConfirm] = useState<{
        sub: SubscriptionScheduleListItem
        enable: boolean
    } | null>(null)

    const loadSchedules = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getSubscriptionSchedules()
            setSchedules(data)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadSchedules()
    }, [loadSchedules])

    const filterOptions = useMemo(() => {
        const cards = Array.from(
            new Map(
                schedules
                    .filter((s) => s.cardId)
                    .map((s) => [s.cardId, { id: s.cardId, name: s.cardName }]),
            ).values(),
        ).sort((a, b) => a.name.localeCompare(b.name))
        const merchants = Array.from(
            new Set(schedules.map((s) => s.merchantName).filter((n) => n && n !== "—")),
        ).sort()
        const currencies = Array.from(new Set(schedules.map((s) => s.currency).filter(Boolean))).sort()
        return { cards, merchants, currencies }
    }, [schedules])

    const filteredSchedules = useMemo(
        () =>
            schedules.filter((s) => {
                if (statusFilter !== "all") {
                    const sStatus = s.status?.toLowerCase() ?? "active"
                    if (sStatus !== statusFilter) return false
                }
                if (cardFilter !== "all" && s.cardId !== cardFilter) return false
                if (merchantFilter !== "all" && s.merchantName !== merchantFilter) return false
                if (currencyFilter !== "all" && s.currency !== currencyFilter) return false
                return true
            }),
        [schedules, statusFilter, cardFilter, merchantFilter, currencyFilter],
    )

    const handleConfirmAutoPay = async () => {
        if (!autoPayConfirm) return
        const result = await toggleSubscriptionAutoPay(autoPayConfirm.sub.id, autoPayConfirm.enable)
        setAutoPayConfirm(null)
        if (result.success) {
            toast({
                title: autoPayConfirm.enable ? "Auto pay enabled" : "Auto pay disabled",
                description: autoPayConfirm.enable
                    ? `${autoPayConfirm.sub.merchantName} will be charged automatically on the billing day.`
                    : `${autoPayConfirm.sub.merchantName} will no longer be charged automatically.`,
            })
            void loadSchedules()
        } else {
            toast({ title: "Failed", description: result.error, variant: "destructive" })
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="w-full px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
                <div className="w-full flex justify-center">
                    <section className="w-full max-w-screen-2xl flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 lg:p-5 mx-auto">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/dashboard">Dashboard</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/dashboard/cards">Credit Cards</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Subscriptions</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <header className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-card-foreground">
                                    Subscriptions on your cards
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Track recurring payments linked to your credit cards.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAddDialogOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                            >
                                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                                Add subscription
                            </button>
                        </header>

                        {/* Filters */}
                        <div className="flex flex-col gap-3 border-b border-border pb-3">
                            <p className="text-xs text-muted-foreground">
                                Filter your subscriptions.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Status</span>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(v) =>
                                            setStatusFilter(v as "all" | "active" | "paused" | "cancelled")
                                        }
                                    >
                                        <SelectTrigger className="h-8 w-[140px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_FILTER_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Card</span>
                                    <Select
                                        value={cardFilter}
                                        onValueChange={setCardFilter}
                                        disabled={filterOptions.cards.length === 0}
                                    >
                                        <SelectTrigger className="h-8 w-[160px] text-xs">
                                            <SelectValue
                                                placeholder={
                                                    filterOptions.cards.length === 0
                                                        ? "No cards"
                                                        : "All cards"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All cards</SelectItem>
                                            {filterOptions.cards.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Merchant</span>
                                    <Select
                                        value={merchantFilter}
                                        onValueChange={setMerchantFilter}
                                        disabled={filterOptions.merchants.length === 0}
                                    >
                                        <SelectTrigger className="h-8 w-[160px] text-xs">
                                            <SelectValue
                                                placeholder={
                                                    filterOptions.merchants.length === 0
                                                        ? "No merchants"
                                                        : "All merchants"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All merchants</SelectItem>
                                            {filterOptions.merchants.map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Currency</span>
                                    <Select
                                        value={currencyFilter}
                                        onValueChange={setCurrencyFilter}
                                        disabled={filterOptions.currencies.length === 0}
                                    >
                                        <SelectTrigger className="h-8 w-[100px] text-xs">
                                            <SelectValue
                                                placeholder={
                                                    filterOptions.currencies.length === 0
                                                        ? "—"
                                                        : "All"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            {filterOptions.currencies.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        <th className="px-3 py-2.5 lg:px-4">Subscription</th>
                                        <th className="px-3 py-2.5 lg:px-4">Amount</th>
                                        <th className="px-3 py-2.5 lg:px-4">Billing</th>
                                        <th className="px-3 py-2.5 lg:px-4">Next charge</th>
                                        <th className="px-3 py-2.5 lg:px-4">Card</th>
                                        <th className="px-3 py-2.5 lg:px-4">Auto pay</th>
                                        <th className="px-3 py-2.5 lg:px-4">Status</th>
                                        <th className="px-3 py-2.5 lg:px-4 text-right">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-3 py-8 text-center text-xs text-muted-foreground lg:px-4"
                                            >
                                                Loading subscriptions...
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && filteredSchedules.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-3 py-8 text-center text-xs text-muted-foreground lg:px-4"
                                            >
                                                No subscriptions found.
                                            </td>
                                        </tr>
                                    )}
                                    {!loading &&
                                        filteredSchedules.length > 0 &&
                                        filteredSchedules.map((sub) => (
                                            <tr
                                                key={sub.id}
                                                className="group border-b border-border last:border-b-0 hover:bg-muted/25"
                                            >
                                                {/* Subscription */}
                                                <td className="px-3 py-3.5 lg:px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                            <CreditCard className="h-4 w-4" aria-hidden />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-card-foreground">
                                                                {sub.merchantName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {FREQ_LABELS[sub.recurrenceFrequency] ?? sub.recurrenceFrequency}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="px-3 py-3.5 lg:px-4">
                                                    <p className="text-sm font-semibold tabular-nums text-card-foreground">
                                                        {new Intl.NumberFormat(undefined, {
                                                            style: "currency",
                                                            currency: sub.currency,
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }).format(sub.amount)}
                                                    </p>
                                                </td>

                                                {/* Billing */}
                                                <td className="px-3 py-3.5 text-xs text-muted-foreground lg:px-4">
                                                    <p>{sub.billingDayLabel}</p>
                                                </td>

                                                {/* Next charge */}
                                                <td className="px-3 py-3.5 text-xs text-muted-foreground lg:px-4">
                                                    <p className="font-medium text-card-foreground">
                                                        {sub.nextDueDateLabel}
                                                    </p>
                                                </td>

                                                {/* Card */}
                                                <td className="px-3 py-3.5 lg:px-4">
                                                    <p className="text-xs font-medium text-card-foreground">
                                                        {sub.cardName}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {sub.cardMaskedIdentifier}
                                                    </p>
                                                </td>

                                                {/* Auto pay */}
                                                <td className="px-3 py-3.5 lg:px-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            sub.autoPayEnabled
                                                                ? "rounded-full border-success/30 bg-success/10 px-2.5 py-0.5 text-[10px] font-medium text-success"
                                                                : "rounded-full border-muted bg-muted/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                                                        }
                                                    >
                                                        {sub.autoPayEnabled ? "On" : "Off"}
                                                    </Badge>
                                                </td>

                                                {/* Status */}
                                                <td className="px-3 py-3.5 lg:px-4">
                                                    <Badge
                                                        className={
                                                            (sub.status?.toLowerCase() ?? "active") === "active"
                                                                ? "rounded-full border-success/30 bg-success/10 px-3 py-1 text-[11px] font-medium text-success"
                                                                : (sub.status?.toLowerCase() ?? "") === "cancelled"
                                                                  ? "rounded-full border-destructive/30 bg-destructive/10 px-3 py-1 text-[11px] font-medium text-destructive"
                                                                  : "rounded-full border-warning/30 bg-warning/10 px-3 py-1 text-[11px] font-medium text-warning"
                                                        }
                                                    >
                                                        {(sub.status?.toLowerCase() ?? "active") === "active"
                                                            ? "Active"
                                                            : (sub.status?.toLowerCase() ?? "") === "cancelled"
                                                              ? "Cancelled"
                                                              : "Paused"}
                                                    </Badge>
                                                </td>

                                                {/* Row actions */}
                                                <td className="px-3 py-3.5 text-right lg:px-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                                                                aria-label="More options"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" aria-hidden />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setAutoPayConfirm({
                                                                        sub,
                                                                        enable: !sub.autoPayEnabled,
                                                                    })
                                                                }
                                                            >
                                                                <Zap className="h-4 w-4" aria-hidden />
                                                                {sub.autoPayEnabled
                                                                    ? "Disable auto pay"
                                                                    : "Enable auto pay"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setEditSubscription(sub)
                                                                }
                                                            >
                                                                Edit subscription
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                {(sub.status?.toLowerCase() ?? "active") === "active"
                                                                    ? "Pause"
                                                                    : "Resume"}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
            <AddSubscriptionDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onCompleted={loadSchedules}
            />
            <EditSubscriptionDialog
                open={!!editSubscription}
                onOpenChange={(open) => !open && setEditSubscription(null)}
                subscription={editSubscription}
                onCompleted={loadSchedules}
            />
            <AlertDialog
                open={!!autoPayConfirm}
                onOpenChange={(open) => !open && setAutoPayConfirm(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {autoPayConfirm?.enable ? "Enable auto pay?" : "Disable auto pay?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {autoPayConfirm?.enable
                                ? `When enabled, ${autoPayConfirm.sub.merchantName} will be charged automatically on the billing day (${autoPayConfirm.sub.billingDayLabel}) using your linked credit card.`
                                : `When disabled, you will need to manually pay ${autoPayConfirm?.sub.merchantName} each billing cycle.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmAutoPay}>
                            {autoPayConfirm?.enable ? "Enable" : "Disable"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
