-- AI Usage Tracking
-- Tracks per-user monthly usage of AI features (chat messages and receipt scans).
-- Limits: Free = 10/month, Pro = unlimited (enforced in application layer).
--
-- Apply to remote: from repo root, `supabase link` then `supabase db push`
-- (requires this migration to run before `pnpm db:types` will include `ai_usage`).

CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TABLE public.ai_usage (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  month_start         DATE        NOT NULL DEFAULT date_trunc('month', now())::date,
  chat_messages_used  INT         NOT NULL DEFAULT 0 CHECK (chat_messages_used >= 0),
  receipt_scans_used  INT         NOT NULL DEFAULT 0 CHECK (receipt_scans_used >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_start)
);

-- Auto-update updated_at (EXECUTE FUNCTION — Postgres 14+ / Supabase)
CREATE TRIGGER ai_usage_updated_at
  BEFORE UPDATE ON public.ai_usage
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Index for fast per-user monthly lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON public.ai_usage (user_id, month_start);

-- RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON public.ai_usage FOR SELECT
  USING (user_id = auth.uid());

-- Atomic increment functions (called from server-side admin client, bypass RLS)
CREATE OR REPLACE FUNCTION public.increment_ai_chat_usage(p_user_id UUID, p_month DATE)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.ai_usage (user_id, month_start, chat_messages_used)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month_start)
  DO UPDATE SET
    chat_messages_used = public.ai_usage.chat_messages_used + 1,
    updated_at = now();
$$;

CREATE OR REPLACE FUNCTION public.increment_ai_receipt_usage(p_user_id UUID, p_month DATE)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.ai_usage (user_id, month_start, receipt_scans_used)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month_start)
  DO UPDATE SET
    receipt_scans_used = public.ai_usage.receipt_scans_used + 1,
    updated_at = now();
$$;
