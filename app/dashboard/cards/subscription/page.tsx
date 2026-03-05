"use client"

import Link from "next/link"
import { TopHeader } from "@/components/top-header"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CalendarRange, Calendar, RefreshCw, MoreHorizontal } from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const MOCK_SUBSCRIPTIONS = [
    {
        id: "1",
        merchant: "Netflix",
        category: "Entertainment",
        amount: "₱499.00",
        billingDay: "Every 12th",
        nextCharge: "Mar 12",
        cardName: "BPI Platinum Visa",
        cardMasked: "•••• 1234",
        status: "active" as const,
        tag: "Streaming",
    },
    {
        id: "2",
        merchant: "Spotify",
        category: "Music",
        amount: "₱149.00",
        billingDay: "Every 3rd",
        nextCharge: "Mar 03",
        cardName: "UnionBank Gold",
        cardMasked: "•••• 5678",
        status: "active" as const,
        tag: "Audio",
    },
    {
        id: "3",
        merchant: "Adobe Creative Cloud",
        category: "Productivity",
        amount: "₱2,499.00",
        billingDay: "Every 25th",
        nextCharge: "Mar 25",
        cardName: "BPI Platinum Visa",
        cardMasked: "•••• 1234",
        status: "paused" as const,
        tag: "Design",
    },
] as const

const SUMMARY_CARDS = [
    {
        label: "Monthly spend on subscriptions",
        value: "₱3,147.00",
        icon: RefreshCw,
        tone: "primary" as const,
    },
    {
        label: "Active subscriptions",
        value: "3",
        icon: CalendarRange,
        tone: "success" as const,
    },
    {
        label: "Next upcoming charge",
        value: "Mar 03 • Spotify",
        icon: Calendar,
        tone: "default" as const,
    },
]

export default function CardSubscriptionPage() {
    return (
        <div className="min-h-screen bg-background">
            <TopHeader title="Card Subscriptions" />
            <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8 lg:py-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
                    {/* Left column – overview & filters */}
                    <aside className="flex flex-col gap-4">
                        {/* Overview */}
                        <section className="space-y-3 rounded-2xl border border-border bg-card p-4 lg:p-5">
                            <h2 className="text-sm font-semibold text-card-foreground">
                                Overview this month
                            </h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {SUMMARY_CARDS.map((card) => {
                                    const Icon = card.icon
                                    const toneClass =
                                        card.tone === "primary"
                                            ? "bg-primary/10 text-primary"
                                            : card.tone === "success"
                                                ? "bg-success/10 text-success"
                                                : "bg-muted text-muted-foreground"
                                    return (
                                        <div
                                            key={card.label}
                                            className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
                                        >
                                            <div
                                                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${toneClass}`}
                                            >
                                                <Icon className="h-4 w-4" aria-hidden />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[11px] font-medium text-muted-foreground">
                                                    {card.label}
                                                </p>
                                                <p className="mt-0.5 text-sm font-semibold tabular-nums text-card-foreground">
                                                    {card.value}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

                        {/* Filters (static for now) */}
                        <section className="rounded-2xl border border-border bg-card p-4 lg:p-5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Filters
                            </h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                    Paused
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                    This month
                                </button>
                            </div>
                        </section>
                    </aside>

                    {/* Right column – subscription list */}
                    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 lg:p-5">
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
                                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                            >
                                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                                Manage in Payment Schedules
                            </button>
                        </header>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        <th className="px-3 py-2.5 lg:px-4">Subscription</th>
                                        <th className="px-3 py-2.5 lg:px-4">Amount</th>
                                        <th className="px-3 py-2.5 lg:px-4">Billing</th>
                                        <th className="px-3 py-2.5 lg:px-4">Card</th>
                                        <th className="px-3 py-2.5 lg:px-4">Status</th>
                                        <th className="px-3 py-2.5 lg:px-4 text-right">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_SUBSCRIPTIONS.map((sub) => (
                                        <tr
                                            key={sub.id}
                                            className="group border-b border-border last:border-b-0 hover:bg-muted/25"
                                        >
                                            {/* Subscription + category */}
                                            <td className="px-3 py-3.5 lg:px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <CreditCard className="h-4 w-4" aria-hidden />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-card-foreground">
                                                            {sub.merchant}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {sub.category} • {sub.tag}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-3 py-3.5 text-sm font-semibold tabular-nums text-card-foreground lg:px-4">
                                                {sub.amount}
                                            </td>

                                            {/* Billing pattern */}
                                            <td className="px-3 py-3.5 text-xs text-muted-foreground lg:px-4">
                                                <p>{sub.billingDay}</p>
                                                <p className="mt-0.5 text-[11px]">
                                                    Next charge: <span className="font-medium text-card-foreground">{sub.nextCharge}</span>
                                                </p>
                                            </td>

                                            {/* Card */}
                                            <td className="px-3 py-3.5 lg:px-4">
                                                <p className="text-xs font-medium text-card-foreground">
                                                    {sub.cardName}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {sub.cardMasked}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="px-3 py-3.5 lg:px-4">
                                                <Badge
                                                    className={
                                                        sub.status === "active"
                                                            ? "rounded-full border-success/30 bg-success/10 px-3 py-1 text-[11px] font-medium text-success"
                                                            : "rounded-full border-warning/30 bg-warning/10 px-3 py-1 text-[11px] font-medium text-warning"
                                                    }
                                                >
                                                    {sub.status === "active" ? "Active" : "Paused"}
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

