"use client"

import { useState, useCallback, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { PanelLeft, Sparkles, Zap } from "lucide-react"
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
  type ChatThread,
  type ChatMessage,
} from "@/app/actions/chat-threads"

// Convert DB rows → UIMessage[] for useChatRuntime
function toUIMessages(rows: ChatMessage[]): UIMessage[] {
  return rows.map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: r.content }],
    metadata: {},
  }))
}

interface AIBudgetAssistantClientProps {
  initialThreads: ChatThread[]
  initialUsage: AIUsage
}

export function AIBudgetAssistantClient({ initialThreads, initialUsage }: AIBudgetAssistantClientProps) {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<UIMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [, startTransition] = useTransition()

  const limitReached =
    !initialUsage.isPro &&
    initialUsage.chatLimit !== null &&
    initialUsage.chatMessagesUsed >= initialUsage.chatLimit

  // ------------------------------------------------------------------
  // Select an existing thread
  // ------------------------------------------------------------------
  const handleSelectThread = useCallback(async (threadId: string) => {
    if (threadId === activeThreadId) return
    setMessagesLoading(true)
    setMobileSheetOpen(false)

    try {
      const msgs = await getThreadMessages(threadId)
      setActiveMessages(toUIMessages(msgs))
      setActiveThreadId(threadId)
    } catch {
      toast({ title: "Failed to load conversation", variant: "destructive" })
    } finally {
      setMessagesLoading(false)
    }
  }, [activeThreadId])

  // ------------------------------------------------------------------
  // Start a new chat
  // ------------------------------------------------------------------
  const handleNewChat = useCallback(() => {
    setActiveThreadId(null)
    setActiveMessages([])
    setMobileSheetOpen(false)
  }, [])

  // ------------------------------------------------------------------
  // Rename
  // ------------------------------------------------------------------
  const handleRename = useCallback(async (id: string, title: string) => {
    const result = await renameThread(id, title)
    if (result.success) {
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title } : t))
      )
    } else {
      toast({ title: "Rename failed", description: result.error, variant: "destructive" })
    }
  }, [])

  // ------------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------------
  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteThread(id)
    if (result.success) {
      startTransition(() => {
        setThreads((prev) => prev.filter((t) => t.id !== id))
        if (activeThreadId === id) {
          setActiveThreadId(null)
          setActiveMessages([])
        }
      })
    } else {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" })
    }
  }, [activeThreadId])

  // ------------------------------------------------------------------
  // Create thread before first message is sent
  // ------------------------------------------------------------------
  const handleCreateThread = useCallback(async (firstMessage: string) => {
    const title = firstMessage.trim().slice(0, 60) || "New conversation"
    const result = await createThread(title)
    if (result.success) {
      const newThread = result.thread
      setThreads((prev) => [newThread, ...prev])
      setActiveThreadId(newThread.id)
      return newThread.id
    } else {
      toast({ title: "Could not start conversation", description: result.error, variant: "destructive" })
      return null
    }
  }, [])

  // ------------------------------------------------------------------
  // Usage counter shown in sidebar for free users
  // ------------------------------------------------------------------
  const usageBar = !initialUsage.isPro && initialUsage.chatLimit !== null ? (
    <div className="shrink-0 border-t border-border px-3 py-3">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
        <span>Free Plan</span>
        <span>{initialUsage.chatMessagesUsed}/{initialUsage.chatLimit} messages</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            limitReached ? "bg-destructive" : "bg-primary"
          )}
          style={{
            width: `${Math.min(100, Math.round((initialUsage.chatMessagesUsed / initialUsage.chatLimit) * 100))}%`,
          }}
        />
      </div>
      <Link
        href="/dashboard/subscription"
        className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
      >
        <Zap className="h-3 w-3" />
        Upgrade for unlimited
      </Link>
    </div>
  ) : null

  const threadSidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
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
  )

  return (
    <div className="flex h-full min-h-0">
      {/* ---- Desktop thread sidebar ---- */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
        {threadSidebarContent}
      </aside>

      {/* ---- Main area ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
          {/* Mobile threads toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setMobileSheetOpen(true)}
            aria-label="Open thread history"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <h1 className="flex-1 text-sm font-semibold text-foreground">AI Budget Assistant</h1>
        </div>

        {/* Chat area */}
        <div className="min-h-0 flex-1">
          {messagesLoading ? (
            <ThreadLoadingSkeleton />
          ) : limitReached && activeThreadId === null ? (
            <LimitReachedBanner used={initialUsage.chatMessagesUsed} limit={initialUsage.chatLimit!} />
          ) : (
            <AIBudgetAssistantChatWrapper
              key={activeThreadId ?? "new"}
              activeThreadId={activeThreadId}
              activeMessages={activeMessages}
              onCreateThread={handleCreateThread}
              limitReached={limitReached}
            />
          )}
        </div>
      </div>

      {/* ---- Mobile sheet ---- */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {threadSidebarContent}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Limit reached banner — shown when free user has exhausted monthly messages
// ---------------------------------------------------------------------------
function LimitReachedBanner({ used, limit }: { used: number; limit: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-foreground">Monthly limit reached</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          You've used {used}/{limit} messages this month. Upgrade to Pro for unlimited AI
          conversations and receipt scans.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/dashboard/subscription"
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Zap className="h-4 w-4" />
          Upgrade to Pro
        </Link>
        <p className="text-xs text-muted-foreground">
          Limit resets on the 1st of each month
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inner wrapper that handles the new-thread creation flow before first send.
// ---------------------------------------------------------------------------
interface ChatWrapperProps {
  activeThreadId: string | null
  activeMessages: UIMessage[]
  onCreateThread: (firstMessage: string) => Promise<string | null>
  limitReached: boolean
}

function AIBudgetAssistantChatWrapper({
  activeThreadId,
  activeMessages,
  onCreateThread,
  limitReached,
}: ChatWrapperProps) {
  const [resolvedThreadId, setResolvedThreadId] = useState<string | null>(activeThreadId)
  const [creating, setCreating] = useState(false)

  if (creating) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Starting conversation…
      </div>
    )
  }

  if (resolvedThreadId === null) {
    return (
      <NewChatInterceptor
        limitReached={limitReached}
        onFirstMessage={async (msg) => {
          setCreating(true)
          const id = await onCreateThread(msg)
          setCreating(false)
          if (id) setResolvedThreadId(id)
          return id
        }}
      />
    )
  }

  return (
    <AIBudgetChat
      threadId={resolvedThreadId}
      initialMessages={activeMessages}
    />
  )
}

// ---------------------------------------------------------------------------
// NewChatInterceptor: renders the chat UI but intercepts the first send
// to create a thread, then hands off to the real AIBudgetChat.
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
    // After this, the parent sets resolvedThreadId and remounts to AIBudgetChat
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
              placeholder="Message AI Budget Assistant..."
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

function ThreadLoadingSkeleton() {
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
        <Skeleton className="h-20 w-72 rounded-2xl" />
      </div>
    </div>
  )
}
