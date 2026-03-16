"use server"

import { createClient } from "@/lib/supabase/server"

export type ChatThread = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

type Result = { success: true } | { success: false; error: string }

// ---------------------------------------------------------------------------
// List all threads for the current user, most-recent first
// ---------------------------------------------------------------------------
export async function listThreads(): Promise<ChatThread[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("chat_thread")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("[chat-threads] listThreads failed", error)
    return []
  }

  return (data ?? []) as ChatThread[]
}

// ---------------------------------------------------------------------------
// Create a new thread
// ---------------------------------------------------------------------------
export async function createThread(
  title: string
): Promise<{ success: true; thread: ChatThread } | { success: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const { data, error } = await supabase
    .from("chat_thread")
    .insert({ user_id: user.id, title: title.slice(0, 120) || "New conversation" })
    .select("id, title, created_at, updated_at")
    .single()

  if (error || !data) {
    console.error("[chat-threads] createThread failed", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }

  return { success: true, thread: data as ChatThread }
}

// ---------------------------------------------------------------------------
// Rename a thread
// ---------------------------------------------------------------------------
export async function renameThread(id: string, title: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const { error } = await supabase
    .from("chat_thread")
    .update({ title: title.trim().slice(0, 120) || "Untitled" })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[chat-threads] renameThread failed", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// Delete a thread (cascades messages)
// ---------------------------------------------------------------------------
export async function deleteThread(id: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const { error } = await supabase
    .from("chat_thread")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[chat-threads] deleteThread failed", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// Get all messages for a thread, oldest first
// ---------------------------------------------------------------------------
export async function getThreadMessages(threadId: string): Promise<ChatMessage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("chat_message")
    .select("id, role, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[chat-threads] getThreadMessages failed", error)
    return []
  }

  return (data ?? []) as ChatMessage[]
}

// ---------------------------------------------------------------------------
// Append new messages and bump thread updated_at
// Only plain text turns (role = user | assistant) should be passed.
// This is always INSERT — never upsert.
// ---------------------------------------------------------------------------
export async function appendMessages(
  threadId: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<void> {
  if (messages.length === 0) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Verify the thread belongs to this user before inserting
  const { data: thread } = await supabase
    .from("chat_thread")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!thread) return

  const rows = messages.map((m) => ({ thread_id: threadId, role: m.role, content: m.content }))

  const { error: insertError } = await supabase.from("chat_message").insert(rows)
  if (insertError) {
    console.error("[chat-threads] appendMessages insert failed", insertError)
    return
  }

  // moddatetime trigger fires only on direct UPDATE — must bump manually
  const { error: updateError } = await supabase
    .from("chat_thread")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId)
    .eq("user_id", user.id)

  if (updateError) {
    console.error("[chat-threads] appendMessages bump updated_at failed", updateError)
  }
}
