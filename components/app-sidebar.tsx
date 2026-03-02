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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed"

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Account", icon: User, href: "/dashboard/account" },
  { label: "Credit Cards", icon: CreditCard, href: "/dashboard/cards" },
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
  { label: "Investments", icon: TrendingUp, href: "/dashboard/investment" },
  { label: "Inbox", icon: Mail, href: "/dashboard/inbox", badge: true },
  { label: "Promos", icon: Gift, href: "/dashboard/promos" },
  { label: "Insights", icon: BarChart3, href: "/dashboard/insights" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(
    pathname.startsWith("/dashboard/payments") ? "Payments" : null
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored !== null) setCollapsed(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [])

  const setCollapsedPersisted = (value: boolean) => {
    setCollapsed(value)
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(value))
    } catch {
      // ignore
    }
  }

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
        <div className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <svg viewBox="0 0 32 32" className="h-7 w-7 text-primary" fill="currentColor" aria-hidden>
              <circle cx="10" cy="10" r="4" />
              <circle cx="22" cy="10" r="4" />
              <circle cx="10" cy="22" r="4" />
              <circle cx="22" cy="22" r="4" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground">COINEST</span>
          )}
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
                      "flex items-center justify-center rounded-lg p-2.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
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
                        {item.children.map((child) => (
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
                    <span>{item.label}</span>
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

      {/* Get Pro CTA */}
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

      {/* Desktop collapse toggle */}
      {opts?.onToggleCollapsed && (
        <div className="border-t border-sidebar-border p-2">
          <button
            type="button"
            onClick={opts.onToggleCollapsed}
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

      {/* Desktop sidebar — collapsible to icon-only strip */}
      <aside
        className={cn(
          "hidden lg:flex h-screen flex-col border-r border-sidebar-border bg-sidebar shrink-0 transition-[width] duration-200",
          collapsed ? "w-16" : "w-[220px]"
        )}
      >
        {sidebarContent({
          collapsed,
          onToggleCollapsed: () => setCollapsedPersisted(!collapsed),
        })}
      </aside>
    </>
  )
}
