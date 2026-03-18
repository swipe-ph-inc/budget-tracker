"use client"

import { useState, useCallback, useEffect, useTransition } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Sparkles, PanelLeft, Plus, X, Zap, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import type { UIMessage } from "ai"
import type { AIUsage } from "@/app/actions/ai-usage"

import { ThreadSidebar } from "@/components/dashboard/thread-sidebar"
import { AIBudgetChat } from "@/components/dashboard/ai-budget-chat"
import {
  createThread,
  renameThread,
  deleteThread,
  getThreadMessages,
  listThreads,
  type ChatThread,
  type ChatMessage,
} from "@/app/actions/chat-threads"
import { getAIUsage } from "@/app/actions/ai-usage"

function toUIMessages(rows: ChatMessage[]): UIMessage[] {
  return rows.map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: r.content }],
    metadata: {},
  }))
}

export function AiAssistantPanel() {
  const [open, setOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [usage, setUsage] = useState<AIUsage | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<UIMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [resolvedThreadId, setResolvedThreadId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Lazy-load threads + usage on first open
  useEffect(() => {
    if (!open || loaded) return
    Promise.all([listThreads().catch(() => []), getAIUsage()])
      .then(([t, u]) => {
        setThreads(t)
        setUsage(u)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [open, loaded])

  const limitReached =
    usage !== null &&
    !usage.isPro &&
    usage.chatLimit !== null &&
    usage.chatMessagesUsed >= usage.chatLimit

  // ------------------------------------------------------------------
  // Thread handlers
  // ------------------------------------------------------------------
  const handleSelectThread = useCallback(async (threadId: string) => {
    if (threadId === activeThreadId) return
    setMessagesLoading(true)
    try {
      const msgs = await getThreadMessages(threadId)
      setActiveMessages(toUIMessages(msgs))
      setActiveThreadId(threadId)
      setResolvedThreadId(threadId)
    } catch {
      toast({ title: "Failed to load conversation", variant: "destructive" })
    } finally {
      setMessagesLoading(false)
    }
  }, [activeThreadId])

  const handleNewChat = useCallback(() => {
    setActiveThreadId(null)
    setActiveMessages([])
    setResolvedThreadId(null)
  }, [])

  const handleRename = useCallback(async (id: string, title: string) => {
    const result = await renameThread(id, title)
    if (result.success) {
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)))
    } else {
      toast({ title: "Rename failed", description: result.error, variant: "destructive" })
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteThread(id)
    if (result.success) {
      startTransition(() => {
        setThreads((prev) => prev.filter((t) => t.id !== id))
        if (activeThreadId === id) {
          setActiveThreadId(null)
          setActiveMessages([])
          setResolvedThreadId(null)
        }
      })
    } else {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" })
    }
  }, [activeThreadId])

  const handleCreateThread = useCallback(async (firstMessage: string) => {
    const title = firstMessage.trim().slice(0, 60) || "New conversation"
    const result = await createThread(title)
    if (result.success) {
      const newThread = result.thread
      setThreads((prev) => [newThread, ...prev])
      setActiveThreadId(newThread.id)
      setResolvedThreadId(newThread.id)
      return newThread.id
    } else {
      toast({ title: "Could not start conversation", description: result.error, variant: "destructive" })
      return null
    }
  }, [])

  // Usage bar for free users
  const usageBar = usage && !usage.isPro && usage.chatLimit !== null ? (
    <div className="shrink-0 border-t border-border px-3 py-3">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
        <span>Free Plan</span>
        <span>{usage.chatMessagesUsed}/{usage.chatLimit} messages</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            limitReached ? "bg-destructive" : "bg-primary"
          )}
          style={{
            width: `${Math.min(100, Math.round((usage.chatMessagesUsed / usage.chatLimit) * 100))}%`,
          }}
        />
      </div>
      <Link
        href="/dashboard/subscription"
        className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
        onClick={() => setOpen(false)}
      >
        <Zap className="h-3 w-3" />
        Upgrade for unlimited
      </Link>
    </div>
  ) : null

  return (
    <>
      {/* Trigger button — rendered in the top header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:h-10 lg:w-10"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-4 w-4 lg:h-5 lg:w-5" />
      </button>

      {/* Floating panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col p-0 sm:max-w-[680px] [&>button]:hidden"
        >
          {/* Header */}
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Toggle thread history"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 text-sm font-semibold text-foreground">AI Assistant</span>

            <button
              type="button"
              onClick={handleNewChat}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="New chat"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Thread sidebar (collapsible) */}
            {sidebarOpen && (
              <div className="flex w-56 shrink-0 flex-col border-r border-border">
                <div className="min-h-0 flex-1">
                  <ThreadSidebar
                    threads={threads}
                    activeThreadId={activeThreadId}
                    onSelect={handleSelectThread}
                    onNewChat={handleNewChat}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                </div>
                {usageBar}
              </div>
            )}

            {/* Chat area */}
            <div className="flex min-w-0 flex-1 flex-col">
              {!loaded ? (
                <PanelLoadingSkeleton />
              ) : messagesLoading ? (
                <PanelLoadingSkeleton />
              ) : limitReached && resolvedThreadId === null ? (
                <LimitReachedBanner
                  used={usage!.chatMessagesUsed}
                  limit={usage!.chatLimit!}
                  onClose={() => setOpen(false)}
                />
              ) : creating ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting conversation…
                </div>
              ) : resolvedThreadId === null ? (
                <NewChatInterceptor
                  limitReached={limitReached}
                  onFirstMessage={async (msg) => {
                    setCreating(true)
                    const id = await handleCreateThread(msg)
                    setCreating(false)
                    return id
                  }}
                />
              ) : (
                <AIBudgetChat
                  key={resolvedThreadId}
                  threadId={resolvedThreadId}
                  initialMessages={activeMessages}
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ---------------------------------------------------------------------------
// Limit reached banner
// ---------------------------------------------------------------------------
function LimitReachedBanner({
  used,
  limit,
  onClose,
}: {
  used: number
  limit: number
  onClose: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-foreground">Monthly limit reached</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          You've used {used}/{limit} messages this month. Upgrade to Pro for unlimited AI conversations.
        </p>
      </div>
      <Link
        href="/dashboard/subscription"
        onClick={onClose}
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Zap className="h-4 w-4" />
        Upgrade to Pro
      </Link>
      <p className="text-xs text-muted-foreground">Limit resets on the 1st of each month</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New chat interceptor
// ---------------------------------------------------------------------------
interface NewChatInterceptorProps {
  onFirstMessage: (msg: string) => Promise<string | null>
  limitReached: boolean
}

function NewChatInterceptor({ onFirstMessage, limitReached }: NewChatInterceptorProps) {
  const [pending, setPending] = useState(false)
  const [input, setInput] = useState("")

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || pending || limitReached) return
    setPending(true)
    await onFirstMessage(trimmed)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Empty state */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">AI Budget Assistant</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Ask about budgets, spending, or savings. I'll help you stay on track.
          </p>
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border bg-background p-4">
        {limitReached ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <span>Monthly limit reached.</span>
            <Link href="/dashboard/subscription" className="font-medium text-primary hover:underline">
              Upgrade to Pro →
            </Link>
          </div>
        ) : (
          <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              placeholder="Message AI Assistant..."
              rows={1}
              disabled={pending}
              className="min-h-[44px] max-h-32 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || pending}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              )}
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path d="M22 2 11 13" />
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function PanelLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-64 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-20 w-56 rounded-2xl" />
      </div>
    </div>
  )
}
