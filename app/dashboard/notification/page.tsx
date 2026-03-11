"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getNotifications, markNotificationAsRead, type NotificationItem } from "@/app/actions/notification"

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function typeLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getNotifications(50)
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleMarkRead = useCallback(async (n: NotificationItem) => {
    if (n.read_at) return
    await markNotificationAsRead(n.id)
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    )
  }, [])

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-screen-2xl">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Notifications</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-card-foreground">All notifications</h2>
            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`py-4 first:pt-0 last:pb-0 ${!n.read_at ? "bg-accent/20 -mx-5 px-5" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm ${n.read_at ? "font-normal text-muted-foreground" : "font-medium text-foreground"}`}
                          >
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {typeLabel(n.type)} · {formatDateTime(n.created_at)}
                          </p>
                        </div>
                        {!n.read_at && (
                          <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Unread
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
