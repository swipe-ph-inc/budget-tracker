-- ============================================
-- Income (money coming into an account)
-- ============================================

CREATE TYPE public.income_source_enum AS ENUM (
  'salary',
  'freelance',
  'refund',
  'interest',
  'dividend',
  'rent_income',
  'gift',
  'other'
);

CREATE TABLE public.income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.account(id) ON DELETE RESTRICT,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  source public.income_source_enum NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_income_user_id ON public.income(user_id);
CREATE INDEX idx_income_account_id ON public.income(account_id);
CREATE INDEX idx_income_received_at ON public.income(user_id, received_at DESC);

CREATE OR REPLACE FUNCTION public.income_balance_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.account SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.account SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.account_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS income_after_insert ON public.income;
CREATE TRIGGER income_after_insert
  AFTER INSERT ON public.income
  FOR EACH ROW EXECUTE FUNCTION public.income_balance_sync();

DROP TRIGGER IF EXISTS income_after_delete ON public.income;
CREATE TRIGGER income_after_delete
  AFTER DELETE ON public.income
  FOR EACH ROW EXECUTE FUNCTION public.income_balance_sync();

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own income" ON public.income;
CREATE POLICY "Users can view own income" ON public.income FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own income" ON public.income;
CREATE POLICY "Users can insert own income" ON public.income FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own income" ON public.income;
CREATE POLICY "Users can update own income" ON public.income FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own income" ON public.income;
CREATE POLICY "Users can delete own income" ON public.income FOR DELETE USING (auth.uid() = user_id);
