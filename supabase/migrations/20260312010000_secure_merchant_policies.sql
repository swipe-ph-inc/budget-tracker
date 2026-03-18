-- Tighten RLS on merchant so users can only see and manage their own merchants.

ALTER TABLE public.merchant
  ADD COLUMN IF NOT EXISTS user_id uuid
    REFERENCES public.user_profile(id) ON DELETE CASCADE;

-- Automatically associate new merchants with the currently authenticated user.
ALTER TABLE public.merchant
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Enforce row level security.
ALTER TABLE public.merchant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant FORCE ROW LEVEL SECURITY;

-- Replace any previous per-user policies with stricter ownership-based rules.
DROP POLICY IF EXISTS "Merchant readable by owner" ON public.merchant;
DROP POLICY IF EXISTS "Merchant insert by owner" ON public.merchant;
DROP POLICY IF EXISTS "Merchant update by owner" ON public.merchant;
DROP POLICY IF EXISTS "Merchant delete by owner" ON public.merchant;

CREATE POLICY "Merchant readable by owner"
  ON public.merchant
  FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Merchant insert by owner"
  ON public.merchant
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Merchant update by owner"
  ON public.merchant
  FOR UPDATE
  TO authenticated
  USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Merchant delete by owner"
  ON public.merchant
  FOR DELETE
  TO authenticated
  USING (user_id IS NOT NULL AND auth.uid() = user_id);

