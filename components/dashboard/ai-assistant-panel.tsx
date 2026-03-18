"use client"

import { useState, useCallback, useEffect, useTransition, useRef } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Plus,
  X,
  Zap,
  Loader2,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import type { UIMessage } from "ai"
import type { AIUsage } from "@/app/actions/ai-usage"

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

// ---------------------------------------------------------------------------
// Thread selector dropdown (Supabase-style)
// ---------------------------------------------------------------------------
interface ThreadSelectorProps {
  threads: ChatThread[]
  activeThreadId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onRename: (id: string, title: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function ThreadSelector({
  threads,
  activeThreadId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
}: ThreadSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState("")
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
    }
  }, [renamingId])

  const activeThread = threads.find((t) => t.id === activeThreadId)
  const filtered = threads.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  const commitRename = async (id: string) => {
    const trimmed = draftTitle.trim()
    if (trimmed) await onRename(id, trimmed)
    setRenamingId(null)
    setDraftTitle("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex max-w-[200px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <span className="truncate">
            {activeThread?.title ?? "New chat"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        className="w-72 p-0 shadow-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Search */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 shrink-0 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Thread list */}
        <ScrollArea className="max-h-60">
          <div className="py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                {search ? "No matching chats" : "No conversations yet"}
              </p>
            )}
            {filtered.map((thread) => (
              <div
                key={thread.id}
                className="group relative flex items-center gap-2 px-3 py-2 hover:bg-accent"
              >
                {renamingId === thread.id ? (
                  <input
                    ref={renameInputRef}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onBlur={() => void commitRename(thread.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void commitRename(thread.id)
                      if (e.key === "Escape") {
                        setRenamingId(null)
                        setDraftTitle("")
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 rounded border border-border bg-background px-2 py-0.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <>
                    {/* Checkmark for active thread */}
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 text-primary",
                        thread.id === activeThreadId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <button
                      type="button"
                      className="flex-1 truncate text-left text-sm text-foreground"
                      onClick={() => {
                        onSelect(thread.id)
                        setOpen(false)
                        setSearch("")
                      }}
                    >
                      {thread.title}
                    </button>

                    {/* Hover actions */}
                    <div className="invisible flex shrink-0 items-center gap-0.5 group-hover:visible">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDraftTitle(thread.title)
                          setRenamingId(thread.id)
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Rename"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await onDelete(thread.id)
                          if (thread.id === activeThreadId) setOpen(false)
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* New chat */}
        <div className="border-t border-border p-1">
          <button
            type="button"
            onClick={() => {
              onNewChat()
              setOpen(false)
              setSearch("")
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          >
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
            Start a new chat
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
export function AiAssistantPanel() {
  const [open, setOpen] = useState(false)
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

  return (
    <>
      {/* Trigger button in top nav */}
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
          className="flex w-full flex-col p-0 sm:max-w-[560px] [&>button]:hidden"
        >
          {/* Required for screen reader accessibility */}
          <SheetTitle className="sr-only">AI Assistant</SheetTitle>

          {/* Header */}
          <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border px-3">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />

            {/* Thread selector dropdown */}
            {loaded ? (
              <ThreadSelector
                threads={threads}
                activeThreadId={activeThreadId}
                onSelect={handleSelectThread}
                onNewChat={handleNewChat}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ) : (
              <span className="px-2.5 py-1.5 text-sm font-medium text-foreground">
                New chat
              </span>
            )}

            <div className="flex-1" />

            {/* Usage badge for free users */}
            {usage && !usage.isPro && usage.chatLimit !== null && (
              <span
                className={cn(
                  "hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline-flex",
                  limitReached
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {usage.chatMessagesUsed}/{usage.chatLimit}
              </span>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat body */}
          <div className="flex min-h-0 flex-1 flex-col">
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
