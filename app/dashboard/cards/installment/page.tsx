 "use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { TopHeader } from "@/components/top-header"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, Percent, MoreHorizontal } from "lucide-react"
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
    type InstallmentPlanListItem,
} from "@/app/actions/credit-cards"

const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All plans" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
] as const

export default function CardInstallmentPage() {
    const [statusFilter, setStatusFilter] = useState<"all" | "ongoing" | "completed">("all")
    const [plans, setPlans] = useState<InstallmentPlanListItem[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const data = await getInstallmentPlans()
                setPlans(data)
            } finally {
                setLoading(false)
            }
        }
        void load()
    }, [])

    const filteredInstallments = useMemo(
        () =>
            plans.filter((plan) =>
                statusFilter === "all" ? true : plan.status === statusFilter,
            ),
        [plans, statusFilter],
    )
    return (
        <div className="min-h-screen bg-background">
            <TopHeader title="Card Installments" />
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
                                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                            >
                                <Percent className="h-3.5 w-3.5" aria-hidden />
                                Plan new installment
                            </button>
                        </header>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                            <p className="text-xs text-muted-foreground">
                                Filter your installment plans by status.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Status</span>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(v) =>
                                        setStatusFilter(v as "all" | "ongoing" | "completed")
                                    }
                                >
                                    <SelectTrigger className="h-8 w-[150px] text-xs">
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

                                            {/* Monthly amount */}
                                            <td className="px-3 py-3.5 text-sm font-semibold tabular-nums text-card-foreground lg:px-4">
                                                {new Intl.NumberFormat(undefined, {
                                                    style: "currency",
                                                    currency: plan.currency,
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }).format(plan.amountPerMonth)}
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
                                                            {`${plan.remainingMonths} ${
                                                                plan.remainingMonths === 1 ? "payment" : "payments"
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

                                            {/* Row actions – placeholder only for now */}
                                            <td className="px-3 py-3.5 text-right lg:px-4">
                                                <button
                                                    type="button"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    aria-label="More options"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

