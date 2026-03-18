-- ============================================
-- Saving plan: keep current_amount in sync with contributions/withdrawals
-- ============================================
-- On INSERT/UPDATE/DELETE of saving_plan_contribution, recompute saving_plan.current_amount
-- and set status to 'completed' when current_amount >= target_amount.
-- ============================================

CREATE OR REPLACE FUNCTION public.saving_plan_sync_current_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
  v_delta NUMERIC;
  v_old_delta NUMERIC := 0;
  v_new_delta NUMERIC := 0;
  v_current NUMERIC;
  v_target NUMERIC;
  v_target_date DATE;
  v_new_status public.saving_plan_status_enum;
BEGIN
  -- Resolve which plan and what change
  IF TG_OP = 'DELETE' THEN
    v_plan_id := OLD.saving_plan_id;
    IF OLD.contribution_type = 'contribution' THEN
      v_delta := -OLD.amount;
    ELSE
      v_delta := OLD.amount;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    v_plan_id := NEW.saving_plan_id;
    IF OLD.contribution_type = 'contribution' THEN
      v_old_delta := OLD.amount;
    ELSE
      v_old_delta := -OLD.amount;
    END IF;
    IF NEW.contribution_type = 'contribution' THEN
      v_new_delta := NEW.amount;
    ELSE
      v_new_delta := -NEW.amount;
    END IF;
    v_delta := v_new_delta - v_old_delta;
  ELSE
    -- INSERT
    v_plan_id := NEW.saving_plan_id;
    IF NEW.contribution_type = 'contribution' THEN
      v_delta := NEW.amount;
    ELSE
      v_delta := -NEW.amount;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND v_delta = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Update current_amount
  UPDATE public.saving_plan
  SET
    current_amount = GREATEST(0, current_amount + v_delta),
    updated_at = now()
  WHERE id = v_plan_id;

  -- Set status: completed if current_amount >= target_amount
  SELECT sp.current_amount, sp.target_amount, sp.target_date
  INTO v_current, v_target, v_target_date
  FROM public.saving_plan sp
  WHERE sp.id = v_plan_id;

  IF v_current >= v_target THEN
    v_new_status := 'completed'::public.saving_plan_status_enum;
  ELSIF v_target_date IS NOT NULL AND current_date > v_target_date THEN
    v_new_status := 'behind_schedule'::public.saving_plan_status_enum;
  ELSE
    v_new_status := 'in_progress'::public.saving_plan_status_enum;
  END IF;

  UPDATE public.saving_plan
  SET status = v_new_status
  WHERE id = v_plan_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS saving_plan_contribution_sync_amount ON public.saving_plan_contribution;
CREATE TRIGGER saving_plan_contribution_sync_amount
  AFTER INSERT OR UPDATE OF amount, contribution_type OR DELETE
  ON public.saving_plan_contribution
  FOR EACH ROW
  EXECUTE FUNCTION public.saving_plan_sync_current_amount();
