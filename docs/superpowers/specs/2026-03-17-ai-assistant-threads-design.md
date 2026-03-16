# Design: AI Budget Assistant Thread History

**Date:** 2026-03-17
**Status:** Approved

---

## Summary

Separate the Profile settings page from AI Budget Assistant settings, and add persistent, thread-based conversation history to the AI Budget Assistant. Users can create multiple conversations, switch between them, and rename threads. The assistant page gains a left-panel thread list (ChatGPT-style), an active chat area, and a settings drawer.

---

## 1. Database Migration

Two new tables added via a single migration file `supabase/migrations/20260317000000_create_chat_threads.sql`.

### `chat_thread`

| column | type | constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE, NOT NULL |
| `title` | `text` | NOT NULL |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

### `chat_message`

| column | type | constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `thread_id` | `uuid` | FK → `chat_thread(id)` ON DELETE CASCADE, NOT NULL |
| `role` | `text` | NOT NULL, CHECK IN ('user', 'assistant') |
| `content` | `text` | NOT NULL |
| `created_at` | `timestamptz` | default `now()` |

### RLS Policies

- `chat_thread`: `SELECT / INSERT / UPDATE / DELETE` — `auth.uid() = user_id`
- `chat_message`: all ops via `EXISTS (SELECT 1 FROM chat_thread WHERE id = thread_id AND user_id = auth.uid())`

---

## 2. Server Actions (`app/actions/chat-threads.ts`)

All functions are `"use server"` and require an authenticated user.

| function | signature | description |
|---|---|---|
| `listThreads` | `() → Thread[]` | All threads for current user, `updated_at DESC` |
| `createThread` | `(title: string) → Thread` | Insert and return new thread |
| `renameThread` | `(id, title) → Result` | Update title |
| `deleteThread` | `(id) → Result` | Delete (cascades messages) |
| `getThreadMessages` | `(threadId) → Message[]` | All messages, `created_at ASC` |
| `saveMessages` | `(threadId, messages: {role, content}[]) → void` | Bulk upsert messages after exchange; bumps `updated_at` on thread |

---

## 3. API Route Changes (`app/api/chat/route.ts`)

- Request body gains optional `threadId?: string`
- `onFinish` callback:
  1. If no `threadId` → call `createThread(firstUserMessageTrimmed.slice(0, 60))`, return new `threadId` in `X-Thread-Id` response header
  2. If `threadId` exists → call `saveMessages(threadId, allMessages)` and bump `updated_at`
- All other route logic (auth, Pro gate, provider resolution, MCP tools) is unchanged

---

## 4. Profile Page (`app/dashboard/profile/page.tsx`)

- Remove the entire "AI Budget Assistant" section (state, load function, submit handler, and JSX)
- Remove imports: `getAISettings`, `updateAISettings`, `AIProvider`, `Eye`, `EyeOff`
- The page renders only the personal info form and optional profile summary card

---

## 5. AI Budget Assistant Page & Components

### Page (`app/dashboard/ai-budget-assistant/page.tsx`)

Remains a server component. Fetches `subscription` and initial `threads` list via server actions. Passes both to the new client component `AIBudgetAssistantClient`.

### New: `components/dashboard/ai-budget-assistant-client.tsx` (Client Component)

Owns the top-level layout and all state:
- `activeThreadId: string | null` — which thread is selected
- `threads: Thread[]` — list, updated optimistically on create/rename/delete
- `pendingNewThread: boolean` — true when user clicked "+ New chat" but hasn't sent yet

Renders the three-part layout:
```
[ThreadSidebar] | [ChatArea]    [SettingsDrawer (overlay)]
```

### New: `components/dashboard/thread-sidebar.tsx` (Client Component)

- "+ New chat" button at top
- Thread list grouped by Today / Yesterday / Older
- Each thread row: title + pencil icon for rename + trash icon for delete
- Active thread highlighted
- Inline rename: clicking pencil replaces label with an `<input>`, saves on blur/Enter

### Modified: `components/dashboard/ai-budget-chat.tsx`

- Accepts `initialMessages: {role, content}[]` and `threadId: string | null` as props
- Passes `threadId` in the request body to `/api/chat`
- Reads `X-Thread-Id` response header after first message to capture the auto-created thread ID, then fires `onThreadCreated(newThreadId, title)` callback
- `useChatRuntime` re-initialises when `threadId` changes (key prop on `AssistantRuntimeProvider`)

### New: `components/dashboard/ai-settings-drawer.tsx` (Client Component)

- Slide-over drawer (Radix `Dialog` or a `Sheet` component)
- Triggered by the "⚙ Settings" button in the page header
- Contains the exact AI settings form extracted from the current profile page:
  - Active LLM provider selector
  - Per-provider API key inputs with show/hide toggle
  - Custom system prompt textarea
  - "Save AI settings" button

---

## 6. Component Tree

```
AIBudgetAssistantPage (server)
└── AIBudgetAssistantClient (client)
    ├── ThreadSidebar
    │   └── ThreadItem (×N)
    ├── AIBudgetChat (key=threadId)
    │   └── AssistantRuntimeProvider
    │       └── ThreadContent
    └── AISettingsDrawer
```

---

## 7. Data Flow

1. User opens `/dashboard/ai-budget-assistant`
2. Page server-fetches `threads` list, passes to client
3. User clicks a thread → `activeThreadId` updates → `getThreadMessages(id)` called → messages passed as `initialMessages` to `AIBudgetChat`
4. User sends a message → `/api/chat` called with `{ messages, threadId }`
5. On finish: messages saved to `chat_message`; if new thread, `X-Thread-Id` header returned → client adds thread to sidebar
6. User clicks "+ New chat" → `pendingNewThread = true`, `activeThreadId = null`, chat cleared
7. User renames thread → `renameThread(id, newTitle)` called → thread list updated optimistically

---

## 8. Error Handling

- If `saveMessages` fails, log server-side; do not block the streaming response (best-effort persistence)
- If `getThreadMessages` fails, show an inline error in the chat area with a retry button
- If `createThread` fails on finish, the conversation is still shown in the current session (no data loss for the user in that session)

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
