-- ============================================
-- Saving Plan (goal to save toward; distinct from budget which is spend limit)
-- ============================================

CREATE TYPE public.saving_plan_status_enum AS ENUM (
  'in_progress',
  'completed',
  'behind_schedule'
);

CREATE TYPE public.saving_plan_contribution_type_enum AS ENUM (
  'contribution',
  'withdrawal'
);

CREATE TABLE public.saving_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) DEFAULT NULL,
  target_amount NUMERIC(18, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'PHP',
  target_date DATE DEFAULT NULL,
  account_id UUID REFERENCES public.account(id) ON DELETE SET NULL,
  status public.saving_plan_status_enum NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saving_plan_user_id ON public.saving_plan(user_id);
CREATE INDEX idx_saving_plan_status ON public.saving_plan(user_id, status);

CREATE TABLE public.saving_plan_contribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saving_plan_id UUID NOT NULL REFERENCES public.saving_plan(id) ON DELETE CASCADE,
  contribution_type public.saving_plan_contribution_type_enum NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  from_account_id UUID REFERENCES public.account(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.account(id) ON DELETE SET NULL,
  note TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saving_plan_contribution_plan ON public.saving_plan_contribution(saving_plan_id);
CREATE INDEX idx_saving_plan_contribution_created ON public.saving_plan_contribution(saving_plan_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.saving_plan_update_current_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta NUMERIC(18, 2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_delta := CASE WHEN NEW.contribution_type = 'contribution' THEN NEW.amount ELSE -NEW.amount END;
    UPDATE public.saving_plan
    SET current_amount = GREATEST(0, current_amount + v_delta),
        updated_at = now()
    WHERE id = NEW.saving_plan_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_delta := CASE WHEN OLD.contribution_type = 'contribution' THEN -OLD.amount ELSE OLD.amount END;
    UPDATE public.saving_plan
    SET current_amount = GREATEST(0, current_amount + v_delta),
        updated_at = now()
    WHERE id = OLD.saving_plan_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS saving_plan_contribution_after_insert ON public.saving_plan_contribution;
CREATE TRIGGER saving_plan_contribution_after_insert
  AFTER INSERT ON public.saving_plan_contribution
  FOR EACH ROW EXECUTE FUNCTION public.saving_plan_update_current_amount();

DROP TRIGGER IF EXISTS saving_plan_contribution_after_delete ON public.saving_plan_contribution;
CREATE TRIGGER saving_plan_contribution_after_delete
  AFTER DELETE ON public.saving_plan_contribution
  FOR EACH ROW EXECUTE FUNCTION public.saving_plan_update_current_amount();

CREATE OR REPLACE FUNCTION public.saving_plan_update_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.current_amount >= NEW.target_amount THEN
    NEW.status := 'completed'::public.saving_plan_status_enum;
  ELSIF NEW.target_date IS NOT NULL AND CURRENT_DATE > NEW.target_date AND NEW.current_amount < NEW.target_amount THEN
    NEW.status := 'behind_schedule'::public.saving_plan_status_enum;
  ELSE
    NEW.status := 'in_progress'::public.saving_plan_status_enum;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saving_plan_before_update_status ON public.saving_plan;
CREATE TRIGGER saving_plan_before_update_status
  BEFORE UPDATE OF current_amount, target_amount, target_date ON public.saving_plan
  FOR EACH ROW EXECUTE FUNCTION public.saving_plan_update_status();

DROP TRIGGER IF EXISTS saving_plan_updated_at ON public.saving_plan;
CREATE TRIGGER saving_plan_updated_at
  BEFORE UPDATE ON public.saving_plan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.saving_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_plan_contribution ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own saving plans" ON public.saving_plan;
CREATE POLICY "Users can manage own saving plans" ON public.saving_plan
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own saving plan contributions" ON public.saving_plan_contribution;
CREATE POLICY "Users can view own saving plan contributions" ON public.saving_plan_contribution
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.saving_plan sp WHERE sp.id = saving_plan_id AND sp.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Users can insert own saving plan contributions" ON public.saving_plan_contribution;
CREATE POLICY "Users can insert own saving plan contributions" ON public.saving_plan_contribution
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.saving_plan sp WHERE sp.id = saving_plan_id AND sp.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Users can delete own saving plan contributions" ON public.saving_plan_contribution;
CREATE POLICY "Users can delete own saving plan contributions" ON public.saving_plan_contribution
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.saving_plan sp WHERE sp.id = saving_plan_id AND sp.user_id = auth.uid())
  );
