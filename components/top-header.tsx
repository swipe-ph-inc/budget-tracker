"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Search, Bell, Settings, Sparkles, Sun, Moon, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/app/actions/auth"
import { getProfile } from "@/app/actions/profile"
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  type NotificationItem,
} from "@/app/actions/notification"

interface TopHeaderProps {
  title: string
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, { dateStyle: "short" })
}

export function TopHeader({ title }: TopHeaderProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string>("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState<string>("?")

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadUser = useCallback(async () => {
    const res = await getProfile()
    const profile = res.profile
    const first = profile?.first_name?.trim()
    const last = profile?.last_name?.trim()
    if (first || last) {
      setDisplayName([first, last].filter(Boolean).join(" "))
      setInitials(
        [first?.[0], last?.[0]].filter(Boolean).join("").toUpperCase().slice(0, 2) || "?"
      )
    } else if (res.email) {
      setDisplayName(res.email)
      const part = res.email.split("@")[0]
      setInitials(
        part.length >= 2
          ? part.slice(0, 2).toUpperCase()
          : part.slice(0, 1).toUpperCase()
      )
    } else {
      setDisplayName("Account")
      setInitials("?")
    }
    setAvatarUrl(profile?.avatar_url ?? null)
  }, [])

  useEffect(() => {
    if (mounted) {
      void loadUser()
    }
  }, [mounted, loadUser])

  const loadNotifications = useCallback(async () => {
    const [list, count] = await Promise.all([
      getNotifications(8),
      getUnreadNotificationCount(),
    ])
    setNotifications(list)
    setUnreadCount(count)
  }, [])

  useEffect(() => {
    if (mounted) {
      getUnreadNotificationCount().then(setUnreadCount)
    }
  }, [mounted])

  useEffect(() => {
    if (mounted && notifOpen) {
      void loadNotifications()
    }
  }, [mounted, notifOpen, loadNotifications])

  const handleNotificationClick = useCallback(async (n: NotificationItem) => {
    if (!n.read_at) {
      await markNotificationAsRead(n.id)
      setUnreadCount((c) => Math.max(0, c - 1))
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      )
    }
  }, [])

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6 lg:py-4">
      {/* Title - with left padding on mobile for hamburger */}
      <h1 className="pl-12 text-xl font-bold text-foreground lg:pl-0 lg:text-2xl">{title}</h1>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Search Bar - hidden on mobile, shown on md+ */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search placeholder"
            className="h-10 w-48 rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring lg:w-64"
          />
        </div>

        {mounted ? (
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:h-10 lg:w-10"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary lg:right-2 lg:top-2" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0" alignOffset={0}>
              <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {unreadCount} unread
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[280px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      asChild
                      className="cursor-pointer flex-col items-stretch gap-0.5 px-4 py-3 focus:bg-accent"
                    >
                      <Link
                        href="/dashboard/notification"
                        onClick={() => handleNotificationClick(n)}
                        className="block"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm ${n.read_at ? "font-normal text-muted-foreground" : "font-medium text-foreground"}`}
                          >
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatTimeAgo(n.created_at)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </p>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="justify-center">
                <Link href="/dashboard/notification" className="w-full text-center">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:h-10 lg:w-10"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary lg:right-2 lg:top-2" />
          </button>
        )}

        {/* User dropdown - render only after mount to avoid Radix hydration mismatch */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1 outline-none transition-colors hover:bg-muted focus:ring-2 focus:ring-ring lg:gap-3 lg:px-2 lg:py-1.5"
                aria-label="Open profile menu"
              >
                <span className="hidden text-sm font-medium text-foreground sm:block truncate max-w-[140px]">
                  {displayName || "Account"}
                </span>
                <Avatar className="h-8 w-8 shrink-0 lg:h-9 lg:w-9">
                  <AvatarImage
                    src={avatarUrl ?? undefined}
                    alt="Profile"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Profile settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/subscription" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Upgrade plan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center gap-2"
              >
                {isDark ? (
                  <>
                    <Sun className="h-4 w-4" />
                    Light mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  void signOut()
                }}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-1 outline-none transition-colors hover:bg-muted focus:ring-2 focus:ring-ring lg:gap-3 lg:px-2 lg:py-1.5"
            aria-label="Open profile menu"
          >
            <span className="hidden text-sm font-medium text-foreground sm:block truncate max-w-[140px]">
              {displayName || "Account"}
            </span>
            <Avatar className="h-8 w-8 shrink-0 lg:h-9 lg:w-9">
              <AvatarImage src={avatarUrl ?? undefined} alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </div>
    </header>
  )
}
