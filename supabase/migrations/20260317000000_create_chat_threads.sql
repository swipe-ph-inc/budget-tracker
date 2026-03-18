-- ============================================================
-- Chat thread persistence for AI Budget Assistant
-- ============================================================

-- Enable moddatetime extension for auto-updating updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ---- chat_thread -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_thread (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-bump updated_at on every UPDATE
CREATE TRIGGER set_chat_thread_updated_at
  BEFORE UPDATE ON public.chat_thread
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Index for fast per-user listing ordered by recency
CREATE INDEX IF NOT EXISTS chat_thread_user_id_updated_at_idx
  ON public.chat_thread (user_id, updated_at DESC);

-- ---- chat_message -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_message (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   uuid        NOT NULL REFERENCES public.chat_thread(id) ON DELETE CASCADE,
  role        text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for loading a thread's messages in order
CREATE INDEX IF NOT EXISTS chat_message_thread_id_created_at_idx
  ON public.chat_message (thread_id, created_at ASC);

-- ---- Row Level Security -------------------------------------------------
ALTER TABLE public.chat_thread  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message ENABLE ROW LEVEL SECURITY;

-- chat_thread: owner-only access
CREATE POLICY "chat_thread_select" ON public.chat_thread
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chat_thread_insert" ON public.chat_thread
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_thread_update" ON public.chat_thread
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "chat_thread_delete" ON public.chat_thread
  FOR DELETE USING (auth.uid() = user_id);

-- chat_message: access gated through chat_thread ownership
CREATE POLICY "chat_message_select" ON public.chat_message
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_thread
      WHERE id = chat_message.thread_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_message_insert" ON public.chat_message
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_thread
      WHERE id = chat_message.thread_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_message_delete" ON public.chat_message
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chat_thread
      WHERE id = chat_message.thread_id AND user_id = auth.uid()
    )
  );
