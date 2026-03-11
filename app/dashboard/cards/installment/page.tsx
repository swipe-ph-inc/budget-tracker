"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Percent, MoreHorizontal, Banknote, Trash } from "lucide-react"
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
    getInstallmentPlans,
    deleteInstallmentPlan,
    type InstallmentPlanListItem,
} from "@/app/actions/credit-cards"
import { AddInstallmentDialog } from "@/components/credit-card/installment/add-installment-dialog"
import { PayInstallmentDialog } from "@/components/credit-card/installment/pay-installment-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { toast } from "@/hooks/use-toast"

const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All plans" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
] as const

export default function CardInstallmentPage() {
    const [statusFilter, setStatusFilter] = useState<"all" | "ongoing" | "completed">("all")
    const [cardFilter, setCardFilter] = useState<string>("all")
    const [merchantFilter, setMerchantFilter] = useState<string>("all")
    const [currencyFilter, setCurrencyFilter] = useState<string>("all")
    const [plans, setPlans] = useState<InstallmentPlanListItem[]>([])
    const [loading, setLoading] = useState(false)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [payDialogPlan, setPayDialogPlan] = useState<InstallmentPlanListItem | null>(null)
    const [deleteDialogPlan, setDeleteDialogPlan] = useState<InstallmentPlanListItem | null>(null)
    const [deleteInProgress, setDeleteInProgress] = useState(false)

    const loadPlans = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getInstallmentPlans()
            setPlans(data)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadPlans()
    }, [loadPlans])

    const filterOptions = useMemo(() => {
        const cards = Array.from(
            new Map(
                plans
                    .filter((p) => p.cardId)
                    .map((p) => [p.cardId, { id: p.cardId, name: p.cardName }]),
            ).values(),
        ).sort((a, b) => a.name.localeCompare(b.name))
        const merchants = Array.from(
            new Set(plans.map((p) => p.merchantName).filter((n) => n && n !== "—")),
        ).sort()
        const currencies = Array.from(new Set(plans.map((p) => p.currency).filter(Boolean))).sort()
        return { cards, merchants, currencies }
    }, [plans])

    const filteredInstallments = useMemo(
        () =>
            plans.filter((plan) => {
                if (statusFilter !== "all" && plan.status !== statusFilter) return false
                if (cardFilter !== "all" && plan.cardId !== cardFilter) return false
                if (merchantFilter !== "all" && plan.merchantName !== merchantFilter) return false
                if (currencyFilter !== "all" && plan.currency !== currencyFilter) return false
                return true
            }),
        [plans, statusFilter, cardFilter, merchantFilter, currencyFilter],
    )

    const handleOpenPayDialog = (plan: InstallmentPlanListItem) => {
        if (plan.status === "completed") return
        setPayDialogPlan(plan)
    }

    const handleOpenDeleteDialog = (plan: InstallmentPlanListItem) => {
        if (plan.status === "completed") return
        setDeleteDialogPlan(plan)
    }

    const handleConfirmDelete = async () => {
        if (!deleteDialogPlan) return
        setDeleteInProgress(true)
        try {
            const result = await deleteInstallmentPlan(deleteDialogPlan.id)
            if (result.success) {
                toast({
                    title: "Installment plan deleted",
                    description: "The plan has been removed. Reserved credit is now available again.",
                })
                setDeleteDialogPlan(null)
                await loadPlans()
            } else {
                toast({
                    title: "Could not delete plan",
                    description: result.error,
                    variant: "destructive",
                })
            }
        } finally {
            setDeleteInProgress(false)
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
                                    <BreadcrumbPage>Installments</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <header className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-card-foreground">
                                    Installment plans on your cards
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    See remaining balances and upcoming due dates.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAddDialogOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                            >
                                <Percent className="h-3.5 w-3.5" aria-hidden />
                                Plan new installment
                            </button>
                        </header>

                        {/* Filters */}
                        <div className="flex flex-col gap-3 border-b border-border pb-3">
                            <p className="text-xs text-muted-foreground">
                                Filter your installment plans.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Status</span>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(v) =>
                                            setStatusFilter(v as "all" | "ongoing" | "completed")
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
                            <table className="w-full min-w-[760px] text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        <th className="px-3 py-2.5 lg:px-4">Installment</th>
                                        <th className="px-3 py-2.5 lg:px-4">Monthly</th>
                                        <th className="px-3 py-2.5 lg:px-4">Total / Term</th>
                                        <th className="px-3 py-2.5 lg:px-4">Next due</th>
                                        <th className="px-3 py-2.5 lg:px-4">Card</th>
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
                                                colSpan={7}
                                                className="px-3 py-8 text-center text-xs text-muted-foreground lg:px-4"
                                            >
                                                Loading installment plans...
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && filteredInstallments.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-3 py-8 text-center text-xs text-muted-foreground lg:px-4"
                                            >
                                                No installment plans found.
                                            </td>
                                        </tr>
                                    )}
                                    {!loading &&
                                        filteredInstallments.length > 0 &&
                                        filteredInstallments.map((plan) => (
                                            <tr
                                                key={plan.id}
                                                className="group border-b border-border last:border-b-0 hover:bg-muted/25"
                                            >
                                                {/* Installment + description */}
                                                <td className="px-3 py-3.5 lg:px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                            <CreditCard className="h-4 w-4" aria-hidden />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-card-foreground">
                                                                {plan.merchantName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {plan.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Monthly amount and remaining balance */}
                                                <td className="px-3 py-3.5 lg:px-4">
                                                    <p className="text-sm font-semibold tabular-nums text-card-foreground">
                                                        {new Intl.NumberFormat(undefined, {
                                                            style: "currency",
                                                            currency: plan.currency,
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }).format(plan.amountPerMonth)}
                                                    </p>
                                                    {plan.remainingMonths > 0 && (
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                            {new Intl.NumberFormat(undefined, {
                                                                style: "currency",
                                                                currency: plan.currency,
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }).format(plan.remainingBalance)}{" "}
                                                            left
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Total / term */}
                                                <td className="px-3 py-3.5 text-xs text-muted-foreground lg:px-4">
                                                    <p>
                                                        Total:{" "}
                                                        <span className="font-medium text-card-foreground">
                                                            {new Intl.NumberFormat(undefined, {
                                                                style: "currency",
                                                                currency: plan.currency,
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }).format(plan.totalAmount)}
                                                        </span>
                                                    </p>
                                                    <p className="mt-0.5 text-[11px]">
                                                        {plan.months}-month plan •{" "}
                                                        {plan.remainingMonths > 0
                                                            ? `${plan.remainingMonths} months left`
                                                            : "Paid off"}
                                                    </p>
                                                </td>

                                                {/* Next due date */}
                                                <td className="px-3 py-3.5 text-xs text-muted-foreground lg:px-4">
                                                    <p>{plan.nextDueDateLabel}</p>
                                                    {plan.remainingMonths > 0 && (
                                                        <p className="mt-0.5 text-[11px]">
                                                            Remaining:{" "}
                                                            <span className="font-medium text-card-foreground">
                                                                {`${plan.remainingMonths} ${plan.remainingMonths === 1 ? "payment" : "payments"
                                                                    }`}
                                                            </span>
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Card */}
                                                <td className="px-3 py-3.5 lg:px-4">
                                                    <p className="text-xs font-medium text-card-foreground">
                                                        {plan.cardName}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {plan.cardMaskedIdentifier}
                                                    </p>
                                                </td>

                                                {/* Status */}
                                                <td className="px-3 py-3.5 lg:px-4">
                                                    <Badge
                                                        className={
                                                            plan.status === "ongoing"
                                                                ? "rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary"
                                                                : "rounded-full border-success/30 bg-success/10 px-3 py-1 text-[11px] font-medium text-success"
                                                        }
                                                    >
                                                        {plan.status === "ongoing" ? "Ongoing" : "Completed"}
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
                                                                onClick={() => handleOpenPayDialog(plan)}
                                                                disabled={plan.status === "completed"}
                                                            >
                                                                <Banknote className="h-4 w-4" aria-hidden />
                                                                Pay for this month
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleOpenDeleteDialog(plan)}
                                                                disabled={plan.status === "completed"}
                                                                className="text-red-600 hover:bg-red-50 focus:bg-red-100 focus:text-red-800 dark:hover:bg-red-900/20 dark:focus:bg-red-900/30 flex items-center font-medium"
                                                            >
                                                                <Trash className="h-4 w-4" aria-hidden />
                                                                Delete This Installment
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
            <AddInstallmentDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onCompleted={loadPlans}
            />
            <PayInstallmentDialog
                open={!!payDialogPlan}
                onOpenChange={(open) => !open && setPayDialogPlan(null)}
                plan={payDialogPlan}
                onCompleted={loadPlans}
            />
            <AlertDialog open={!!deleteDialogPlan} onOpenChange={(open) => !open && setDeleteDialogPlan(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete installment plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the plan for {deleteDialogPlan?.merchantName} (
                            {deleteDialogPlan?.totalAmount.toLocaleString(undefined, {
                                style: "currency",
                                currency: deleteDialogPlan?.currency ?? "PHP",
                            })}{" "}
                            total). Any installments already posted to your card balance will be reversed. This cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteInProgress}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                void handleConfirmDelete()
                            }}
                            disabled={deleteInProgress}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteInProgress ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

