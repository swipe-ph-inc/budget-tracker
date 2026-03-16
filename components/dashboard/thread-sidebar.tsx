"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, Check, X, MessageSquare } from "lucide-react"
import type { ChatThread } from "@/app/actions/chat-threads"

interface ThreadSidebarProps {
  threads: ChatThread[]
  activeThreadId: string | null
  onSelect: (threadId: string) => void
  onNewChat: () => void
  onRename: (id: string, title: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function getDateGroup(dateStr: string): "Today" | "Yesterday" | "Older" {
  const date = new Date(dateStr)
  const now = new Date()
  const todayStr = now.toLocaleDateString()
  const dateLocalStr = date.toLocaleDateString()

  if (dateLocalStr === todayStr) return "Today"

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateLocalStr === yesterday.toLocaleDateString()) return "Yesterday"

  return "Older"
}

function groupThreads(threads: ChatThread[]): { label: string; threads: ChatThread[] }[] {
  const groups: Record<string, ChatThread[]> = { Today: [], Yesterday: [], Older: [] }
  for (const t of threads) {
    groups[getDateGroup(t.updated_at)].push(t)
  }
  return (["Today", "Yesterday", "Older"] as const)
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, threads: groups[label] }))
}

interface ThreadItemProps {
  thread: ChatThread
  isActive: boolean
  onSelect: () => void
  onRename: (title: string) => Promise<void>
  onDelete: () => Promise<void>
}

function ThreadItem({ thread, isActive, onSelect, onRename, onDelete }: ThreadItemProps) {
  const [renaming, setRenaming] = useState(false)
  const [draftTitle, setDraftTitle] = useState(thread.title)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) inputRef.current?.focus()
  }, [renaming])

  const commitRename = async () => {
    const trimmed = draftTitle.trim()
    if (trimmed && trimmed !== thread.title) {
      await onRename(trimmed)
    } else {
      setDraftTitle(thread.title)
    }
    setRenaming(false)
  }

  const cancelRename = () => {
    setDraftTitle(thread.title)
    setRenaming(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  return (
    <li
      className={cn(
        "group relative flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors cursor-pointer",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      onClick={() => !renaming && onSelect()}
    >
      {renaming ? (
        <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); void commitRename() }
              if (e.key === "Escape") cancelRename()
            }}
            className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-0.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => void commitRename()}
            className="shrink-0 text-primary hover:text-primary/80"
            aria-label="Confirm rename"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={cancelRename}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Cancel rename"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <span className="flex-1 truncate">{thread.title}</span>
          <div
            className="invisible flex shrink-0 items-center gap-1 group-hover:visible"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => { setDraftTitle(thread.title); setRenaming(true) }}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Rename thread"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded p-0.5 text-muted-foreground hover:text-destructive disabled:opacity-50"
              aria-label="Delete thread"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </li>
  )
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
}: ThreadSidebarProps) {
  const groups = groupThreads(threads)

  return (
    <div className="flex h-full flex-col gap-2 py-3">
      {/* New chat button */}
      <div className="px-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Thread list */}
      <ScrollArea className="flex-1 px-2">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map(({ label, threads: groupThreads }) => (
              <div key={label}>
                <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {groupThreads.map((thread) => (
                    <ThreadItem
                      key={thread.id}
                      thread={thread}
                      isActive={thread.id === activeThreadId}
                      onSelect={() => onSelect(thread.id)}
                      onRename={(title) => onRename(thread.id, title)}
                      onDelete={() => onDelete(thread.id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
