"use client"

import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  MessagePartPrimitive,
  AuiIf,
} from "@assistant-ui/react"
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk"
import { Sparkles, Send } from "lucide-react"
import { cn } from "@/lib/utils"

function MessageRenderer() {
  return (
    <MessagePrimitive.Root className="group/message">
      <MessagePrimitive.If user>
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
            <MessagePrimitive.Parts
              components={{
                Text: (props) => (
                  <MessagePartPrimitive.Text
                    {...props}
                    className="whitespace-pre-wrap break-words text-sm"
                  />
                ),
              }}
            />
          </div>
        </div>
      </MessagePrimitive.If>
      <MessagePrimitive.If assistant>
        <div className="flex justify-start">
          <div className="flex max-w-[85%] gap-2 rounded-2xl rounded-bl-md border border-border bg-muted/50 px-4 py-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <MessagePrimitive.Parts
              components={{
                Text: (props) => (
                  <MessagePartPrimitive.Text
                    {...props}
                    className="whitespace-pre-wrap break-words text-sm text-foreground"
                    component="div"
                  />
                ),
              }}
            />
          </div>
        </div>
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  )
}

function ThreadContent() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto p-4">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">AI Budget Assistant</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Ask about budgets, spending, or savings. I’ll help you stay on track.
            </p>
          </div>
        </AuiIf>
        <ThreadPrimitive.Messages
          components={{
            Message: MessageRenderer,
          }}
        />
      </ThreadPrimitive.Viewport>
      <div className="shrink-0 border-t border-border bg-background p-4">
        <ComposerPrimitive.Root className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
          <ComposerPrimitive.Input
            placeholder="Message AI Budget Assistant..."
            className="min-h-[44px] max-h-32 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          <ComposerPrimitive.Send
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            )}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  )
}

export function AIBudgetChat() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({ api: "/api/chat" }),
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-background">
        <ThreadContent />
      </div>
    </AssistantRuntimeProvider>
  )
}
