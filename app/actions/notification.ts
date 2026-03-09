"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

type NotificationRow = Database["public"]["Tables"]["notification"]["Row"]

export type NotificationItem = {
  id: string
  title: string
  body: string | null
  type: string
  created_at: string
  read_at: string | null
}

export async function getNotifications(limit = 10): Promise<NotificationItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return []

  const { data, error } = await supabase
    .from("notification")
    .select("id, title, body, type, created_at, read_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return []

  return (data ?? []).map((row: NotificationRow) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    created_at: row.created_at,
    read_at: row.read_at,
  }))
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return 0

  const { count, error } = await supabase
    .from("notification")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null)

  if (error) return 0
  return count ?? 0
}

export type MarkAsReadResult =
  | { success: true }
  | { success: false; error: string }

export async function markNotificationAsRead(id: string): Promise<MarkAsReadResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notification")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
