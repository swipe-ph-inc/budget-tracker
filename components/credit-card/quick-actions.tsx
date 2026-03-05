"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { DollarSign, CalendarRange, Calendar, ArrowRightLeft } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const ACTIONS = [
  {
    icon: DollarSign,
    label: "Payment",
    description: "Make a payment",
    href: "/dashboard/payments/payment",
  },
  {
    icon: CalendarRange,
    label: "Subscription",
    description: "Manage subscriptions",
    href: "/dashboard/cards/subscription",
  },
  {
    icon: Calendar,
    label: "Installment",
    description: "View installments",
    href: "/dashboard/cards/installment",
  },
  {
    icon: ArrowRightLeft,
    label: "Transfer",
    description: "Transfer balance",
    href: "/dashboard/payments/transfer",
  },
] as const

export function QuickActions() {
  const router = useRouter()

  return (
    <div className="space-y-3">
      {/* Breadcrumbs for card-related flows */}
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
            <BreadcrumbPage>Quick actions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => router.push(action.href)}
            className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm lg:p-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <action.icon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <span className="text-xs font-semibold text-card-foreground">
                {action.label}
              </span>
              <p className="mt-0.5 hidden text-[10px] text-muted-foreground lg:block">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
