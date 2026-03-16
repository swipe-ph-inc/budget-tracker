# Design: AI Budget Assistant Thread History

**Date:** 2026-03-17
**Status:** Approved

---

## Summary

Separate the Profile settings page from AI Budget Assistant settings, and add persistent, thread-based conversation history to the AI Budget Assistant. Users can create multiple conversations, switch between them, and rename threads. The assistant page gains a left-panel thread list (ChatGPT-style), an active chat area, and a settings drawer.

---

## 1. Database Migration

Single migration file: `supabase/migrations/20260317000000_create_chat_threads.sql`

### `chat_thread`

| column | type | constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE, NOT NULL |
| `title` | `text` | NOT NULL |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, auto-updated via trigger (see below) |

### `chat_message`

| column | type | constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `thread_id` | `uuid` | FK → `chat_thread(id)` ON DELETE CASCADE, NOT NULL |
| `role` | `text` | NOT NULL, CHECK IN ('user', 'assistant') |
| `content` | `text` | NOT NULL |
| `created_at` | `timestamptz` | default `now()` |

**Note:** Only plain-text turns (`user` and `assistant`) are persisted. Tool-call and tool-result steps (which have no user-visible text content) are excluded at save time. This is consistent with the `role` CHECK constraint and `content NOT NULL`.

### `updated_at` trigger

A `moddatetime()` trigger is created on `chat_thread` so `updated_at` is bumped automatically on every `UPDATE`, including renames and message saves:

```sql
CREATE EXTENSION IF NOT EXISTS moddatetime;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON chat_thread
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

### RLS Policies

- `chat_thread`: `SELECT / INSERT / UPDATE / DELETE` where `auth.uid() = user_id`
- `chat_message`: all ops via `EXISTS (SELECT 1 FROM chat_thread WHERE id = thread_id AND user_id = auth.uid())`

---

## 2. Server Actions (`app/actions/chat-threads.ts`)

All functions are `"use server"` and require an authenticated user. Return `{ success: false, error: 'Something went wrong. Please try again.' }` on DB errors (consistent with other action files).

```ts
export type ChatThread = { id: string; title: string; created_at: string; updated_at: string }
export type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; created_at: string }
```

| function | signature | description |
|---|---|---|
| `listThreads` | `() → ChatThread[]` | All threads for current user, ordered `updated_at DESC`. Returns `[]` on error. |
| `createThread` | `(title: string) → { success: true; thread: ChatThread } \| { success: false; error: string }` | Insert and return new thread |
| `renameThread` | `(id: string, title: string) → Result` | Update title. Trigger auto-bumps `updated_at`. |
| `deleteThread` | `(id: string) → Result` | Delete thread (cascades messages) |
| `getThreadMessages` | `(threadId: string) → ChatMessage[]` | All messages, ordered `created_at ASC`. Returns `[]` on error. |
| `appendMessages` | `(threadId: string, messages: { role: 'user' \| 'assistant'; content: string }[]) → void` | Inserts only the new messages from the latest exchange. Caller must filter to text-only turns before calling. Does not upsert — always inserts. After inserting, must explicitly run `UPDATE chat_thread SET updated_at = now() WHERE id = threadId` — the `moddatetime` trigger only fires on direct `UPDATE` to `chat_thread`; inserting into `chat_message` does NOT fire it. |

---

## 3. API Route Changes (`app/api/chat/route.ts`)

### Thread creation responsibility: client-side (not API route)

**The API route does NOT create threads.** Thread creation happens client-side before the request is sent (see Section 5). The route always receives a `threadId` in the request body.

- Request body gains **required** `threadId: string`
- `onFinish` callback: extracts text-only messages (filter `message.parts` for `type === 'text'`, join text parts into a single string), then calls `appendMessages(threadId, textMessages)`.
- The API route does not modify response headers beyond what `toUIMessageStreamResponse()` sets.
- All other logic (auth, Pro gate, provider resolution, MCP tools) is unchanged.

```ts
// in onFinish({ messages }) — pseudocode
const textMessages = messages
  .filter(m => m.role === 'user' || m.role === 'assistant')
  .map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.parts
      .filter((p): p is TextUIPart => p.type === 'text')
      .map(p => p.text)
      .join(''),
  }))
  .filter(m => m.content.length > 0) // skip empty / tool-only turns
await appendMessages(threadId, textMessages)
```

---

## 4. Profile Page (`app/dashboard/profile/page.tsx`)

- Remove the entire "AI Budget Assistant" section: all AI settings state variables (`aiLoading`, `aiSaving`, `aiProvider`, `openaiApiKey`, `anthropicApiKey`, `geminiApiKey`, `aiSystemPrompt`, `showKeys`), `loadAISettings` callback, `handleAISubmit` handler, and the corresponding JSX block.
- Remove imports: `getAISettings`, `updateAISettings`, `AIProvider`, `Eye`, `EyeOff`.
- The page renders only: breadcrumb, page heading, personal info form, optional profile summary card.

---

## 5. AI Budget Assistant Page & Components

### Page (`app/dashboard/ai-budget-assistant/page.tsx`)

Server component. Fetches `subscription` and initial `threads` list. Wraps `listThreads` in try/catch and passes `[]` as fallback so the page never throws on a DB error.

```ts
const [subscription, threads] = await Promise.all([
  getActiveSubscription(),
  listThreads().catch(() => []),
])
```

Passes both to `<AIBudgetAssistantClient subscription={!!subscription} initialThreads={threads} />`.

### `components/dashboard/ai-budget-assistant-client.tsx` (Client Component)

Owns top-level layout and state:

| state | type | description |
|---|---|---|
| `threads` | `ChatThread[]` | updated optimistically on create/rename/delete |
| `activeThreadId` | `string \| null` | currently selected thread; `null` = new pending chat |
| `activeMessages` | `UIMessage[]` | messages for the active thread, pre-converted for `useChatRuntime` |
| `messagesLoading` | `boolean` | true while `getThreadMessages` is in-flight after thread switch |
| `settingsOpen` | `boolean` | controls AISettingsDrawer visibility |

**Thread switch flow:**
1. User clicks a thread → set `messagesLoading = true`, `activeThreadId = id`
2. Call `getThreadMessages(id)` → convert result to `UIMessage[]` (see conversion below)
3. Set `activeMessages`, `messagesLoading = false`

**New chat flow:**
1. User clicks "+ New chat" → set `activeThreadId = null`, `activeMessages = []`
2. Chat area renders with empty messages
3. On first message send (before calling `/api/chat`): call `createThread(firstMessageSlice(60))`, receive new thread ID, add thread optimistically to `threads` list, set `activeThreadId = newId`
4. Pass `threadId` to `<AIBudgetChat>`

**Message format conversion** (`ChatMessage[]` → `UIMessage[]`):
```ts
function toUIMessages(rows: ChatMessage[]): UIMessage[] {
  return rows.map(r => ({
    id: r.id,
    role: r.role,
    parts: [{ type: 'text' as const, text: r.content }],
    metadata: {},
  }))
}
```

**Mobile layout:** On screens below `lg`, `ThreadSidebar` is hidden by default and opens as a bottom sheet or slide-over triggered by a "Threads" button in the chat header. Use a `sheetOpen` boolean state and Radix `Sheet` (or equivalent) for this.

Layout:
```tsx
<div className="flex h-full">
  {/* Desktop: fixed left panel */}
  <aside className="hidden lg:flex w-64 flex-col border-r ...">
    <ThreadSidebar ... />
  </aside>
  {/* Chat area */}
  <div className="flex flex-1 flex-col min-w-0">
    <header>
      {/* Mobile: Threads button */}
      <Button className="lg:hidden" onClick={() => setSheetOpen(true)}>Threads</Button>
      <h1>AI Budget Assistant</h1>
      <Button onClick={() => setSettingsOpen(true)}>⚙ Settings</Button>
    </header>
    {messagesLoading ? <ThreadLoadingSkeleton /> : (
      <AIBudgetChat key={activeThreadId ?? 'new'} threadId={activeThreadId} initialMessages={activeMessages} onThreadCreated={handleThreadCreated} />
    )}
  </div>
  {/* Mobile sheet */}
  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
    <SheetContent side="left"><ThreadSidebar ... /></SheetContent>
  </Sheet>
  <AISettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
</div>
```

### `components/dashboard/thread-sidebar.tsx` (Client Component)

Props: `threads`, `activeThreadId`, `onSelect`, `onNewChat`, `onRename`, `onDelete`

- "+ New chat" button at top
- Thread list grouped by Today / Yesterday / Older using **browser local date** (`new Date(thread.updated_at).toLocaleDateString()` compared to today and yesterday in local time)
- Each thread row: title text + pencil icon (rename) + trash icon (delete)
- Inline rename: clicking pencil replaces label with `<input>` (auto-focused), saves on blur or Enter, cancels on Escape
- Active thread highlighted

### `components/dashboard/ai-budget-chat.tsx` (modified)

Props added:
- `threadId: string | null` — passed in request body to `/api/chat`
- `initialMessages: UIMessage[]` — passed to `useChatRuntime` as `initialMessages`
- `onThreadCreated?: (threadId: string) => void` — called after `createThread` succeeds (before API call)

The component re-initialises when `threadId` changes via `key={activeThreadId ?? 'new'}` on the parent — no internal key management needed.

`AssistantChatTransport` is extended to inject `threadId` into the request body:
```ts
new AssistantChatTransport({
  api: '/api/chat',
  body: { threadId },
})
```

### `components/dashboard/ai-settings-drawer.tsx` (new)

A Radix `Sheet` component (slide-over from the right). Props: `open`, `onOpenChange`.

Contains the AI settings form extracted verbatim from the current profile page:
- Active LLM provider selector
- Per-provider API key inputs with show/hide toggle (Eye/EyeOff)
- Custom system prompt textarea
- "Save AI settings" button (calls `updateAISettings` server action)

Loads settings on open via `getAISettings()`. Displays a spinner while loading.

---

## 6. Component Tree

```
AIBudgetAssistantPage (server)
└── AIBudgetAssistantClient (client)
    ├── ThreadSidebar (desktop, always visible lg+)
    ├── Sheet > ThreadSidebar (mobile, controlled by sheetOpen)
    ├── AIBudgetChat (key=activeThreadId ?? 'new')
    │   └── AssistantRuntimeProvider
    │       └── ThreadContent
    └── AISettingsDrawer (Sheet, controlled by settingsOpen)
```

---

## 7. Data Flow

1. User opens `/dashboard/ai-budget-assistant`
2. Page SSR: `listThreads()` called (try/catch, fallback `[]`), passed to client
3. Client renders thread list; most-recent thread is **not** auto-selected — starts on empty new-chat state
4. User clicks a thread → `messagesLoading = true` → `getThreadMessages(id)` called → converted to `UIMessage[]` → `messagesLoading = false`, chat renders with history
5. User types first message in new-chat state → client calls `createThread(title)` → on success, sets `activeThreadId`, adds thread to list optimistically → calls `/api/chat` with `{ messages, threadId }`
6. Stream completes → `onFinish` in API route calls `appendMessages(threadId, textMessages)`, trigger bumps `updated_at`
7. User renames thread → `renameThread(id, newTitle)` called → optimistic update in sidebar
8. User deletes thread → `deleteThread(id)` called → removed from list, if it was active chat clears to new-chat state

---

## 8. Error Handling

- `appendMessages` failure in `onFinish`: log server-side only; do not block or alter the streamed response (best-effort persistence). Conversation is still visible in current session.
- `getThreadMessages` failure: `activeMessages` remains `[]`; show an inline error banner in chat area with a "Retry" button.
- `createThread` failure before API call: show a toast error; do not call `/api/chat` (no thread to save to). User can retry by sending again.
- `listThreads` SSR failure: fallback to `[]`, page renders normally with empty sidebar.

---

## 9. Files Changed / Created

| action | path |
|---|---|
| **new** | `supabase/migrations/20260317000000_create_chat_threads.sql` |
| **new** | `app/actions/chat-threads.ts` |
| **modified** | `app/api/chat/route.ts` |
| **modified** | `app/dashboard/profile/page.tsx` |
| **modified** | `app/dashboard/ai-budget-assistant/page.tsx` |
| **new** | `components/dashboard/ai-budget-assistant-client.tsx` |
| **new** | `components/dashboard/thread-sidebar.tsx` |
| **modified** | `components/dashboard/ai-budget-chat.tsx` |
| **new** | `components/dashboard/ai-settings-drawer.tsx` |
