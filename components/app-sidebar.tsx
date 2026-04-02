"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  User,
  ArrowLeftRight,
  Receipt,
  FileText,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Mail,
  Gift,
  BarChart3,
  Store,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Lock,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AppLogo } from "@/components/app-logo"
import { useState } from "react"

/** Persisted key — shared with `DashboardShell` for main-content margin. */
export const SIDEBAR_COLLAPSED_STORAGE_KEY = "sidebar-collapsed"

type SidebarItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  children?: { label: string; href: string }[]
  badge?: boolean
  pro?: boolean
}

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Account", icon: User, href: "/dashboard/account" },
  { label: "Credit Cards", icon: CreditCard, href: "/dashboard/cards" },
  { label: "Merchants", icon: Store, href: "/dashboard/merchants" },
  {
    label: "Payments",
    icon: ArrowLeftRight,
    href: "/dashboard/payments",
    children: [
      { label: "Transfer", href: "/dashboard/payments/transfer" },
      { label: "Payment", href: "/dashboard/payments/payment" },
    ],
  },
  { label: "Transactions", icon: Receipt, href: "/dashboard/transactions" },
  { label: "Invoices", icon: FileText, href: "/dashboard/invoice" },
  { label: "Saving Plans", icon: PiggyBank, href: "/dashboard/saving-plans" },
  // { label: "Investments", icon: TrendingUp, href: "/dashboard/investment" },
  // { label: "Inbox", icon: Mail, href: "/dashboard/inbox", badge: true },
  // { label: "Promos", icon: Gift, href: "/dashboard/promos" },
  // { label: "Insights", icon: BarChart3, href: "/dashboard/insights" },
]

type AppSidebarProps = {
  /** When true, hides the “Get Pro” promo (user already has an active paid subscription). */
  hasActiveSubscription?: boolean
  /** Desktop rail width — controlled by `DashboardShell` so main margin stays in sync. */
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function AppSidebar({
  hasActiveSubscription = false,
  collapsed,
  onCollapsedChange,
}: AppSidebarProps) {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(
    pathname.startsWith("/dashboard/payments") ? "Payments" : null
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (opts?: { collapsed?: boolean; onToggleCollapsed?: () => void }) => {
    const isCollapsed = opts?.collapsed === true
    return (
    <>
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2 px-5 py-6",
          isCollapsed ? "justify-center px-0" : "justify-between"
        )}
      >
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          <Link href="/dashboard" className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-1")}>
            <AppLogo collapsed={isCollapsed} />
            {/*
              {!isCollapsed && (
                <span className="text-xl font-bold tracking-tight text-foreground">Budget Partner</span>
              )}
            */}

          </Link>
        </div>
        {!isCollapsed && (
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-2",
          isCollapsed ? "px-2" : "px-3"
        )}
      >
        <ul className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.children && pathname.startsWith(item.href))
            const hasChildren = !!item.children
            const isOpen = openSubmenu === item.label

            if (isCollapsed) {
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "relative flex items-center justify-center rounded-lg p-2.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.pro && (
                      <Crown className="absolute -right-0.5 -top-0.5 h-3 w-3 text-amber-500" />
                    )}
                  </Link>
                </li>
              )
            }

            return (
              <li key={item.label}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() =>
                        setOpenSubmenu(isOpen ? null : item.label)
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <ul className="ml-8 mt-1 flex flex-col gap-1">
                        {(item.children ?? []).map((child) => (
                          <li key={child.label}>
                            <Link
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                                pathname === child.href
                                  ? "font-medium text-primary"
                                  : "text-sidebar-foreground hover:text-primary"
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    <span className="flex-1">{item.label}</span>
                    {item.pro && (
                      <Crown className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isActive ? "text-primary-foreground/80" : "text-amber-500"
                      )} />
                    )}
                    {item.badge && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        3
                      </span>
                    )}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Get Pro CTA — only for users without an active subscription */}
      {!hasActiveSubscription && (
        <div className={cn("p-4", isCollapsed && "p-2")}>
          {isCollapsed ? (
            <Link
              href="/dashboard/subscription"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center rounded-lg bg-primary/10 p-2.5 text-primary transition-colors hover:bg-primary/20"
              title="Get Pro"
            >
              <Lock className="h-5 w-5" />
            </Link>
          ) : (
            <div className="rounded-xl bg-primary/10 p-4">
              <Lock className="mb-2 h-6 w-6 text-primary" />
              <p className="text-xs leading-relaxed text-foreground">
                Gain full access to your finances with detailed analytics and graphs
              </p>
              <Link
                href="/dashboard/subscription"
                onClick={() => setMobileOpen(false)}
                className="mt-3 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Pro
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Desktop collapse toggle */}
      {opts?.onToggleCollapsed && (
        <div className="border-t border-sidebar-border p-2">
          <button
            type="button"
            onClick={() => opts.onToggleCollapsed?.()}
            className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      )}
    </>
    )
  }

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border text-foreground lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent()}
      </aside>

      {/* Desktop sidebar — fixed on left, full height, only main content scrolls */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 z-30 h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
          collapsed ? "w-16" : "w-[220px]"
        )}
      >
        {sidebarContent({
          collapsed,
          onToggleCollapsed: () => onCollapsedChange(!collapsed),
        })}
      </aside>
    </>
  )
}
