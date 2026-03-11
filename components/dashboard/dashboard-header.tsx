"use client"

import { usePathname } from "next/navigation"
import { TopHeader } from "@/components/top-header"

const PATH_TO_TITLE: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/account": "Account",
  "/dashboard/cards": "Credit Cards",
  "/dashboard/cards/subscription": "Card Subscriptions",
  "/dashboard/cards/installment": "Card Installments",
  "/dashboard/cards/history": "Card History",
  "/dashboard/payments": "Payments",
  "/dashboard/payments/transfer": "Transfer",
  "/dashboard/payments/transfer/transfers": "Transfers",
  "/dashboard/payments/payment": "Payment",
  "/dashboard/payments/payment/payments": "Payments",
  "/dashboard/transactions": "Transactions",
  "/dashboard/invoice": "Invoices",
  "/dashboard/saving-plans": "Saving Plans",
  "/dashboard/profile": "Profile",
  "/dashboard/subscription": "Subscription",
  "/dashboard/notification": "Notifications",
  "/dashboard/inbox": "Inbox",
  "/dashboard/promos": "Promos",
  "/dashboard/insights": "Insights",
  "/dashboard/investment": "Investment",
}

function getTitleForPath(pathname: string): string {
  if (pathname in PATH_TO_TITLE) return PATH_TO_TITLE[pathname]
  const segment = pathname.split("/").filter(Boolean).pop() ?? "Dashboard"
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
}

/**
 * Renders the dashboard top header with title derived from the current pathname.
 * Used once in the dashboard layout so the header (and profile) persist across navigations.
 */
export function DashboardHeader() {
  const pathname = usePathname()
  const title = getTitleForPath(pathname ?? "/dashboard")
  return <TopHeader title={title} />
}
