-- ============================================
-- Activity (unified history: financial events + account/card/profile updates)
-- ============================================

CREATE TYPE public.activity_type_enum AS ENUM (
  'payment',
  'transfer',
  'income',
  'card_payment',
  'account_updated',
  'credit_card_updated',
  'profile_updated',
  'subscription_started',
  'subscription_canceled'
);

CREATE TABLE public.activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  activity_type public.activity_type_enum NOT NULL,
  amount NUMERIC(18, 2) DEFAULT NULL,
  currency CHAR(3) DEFAULT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference_id UUID DEFAULT NULL,
  reference_table VARCHAR(64) DEFAULT NULL,
  summary TEXT DEFAULT NULL,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_user_id ON public.activity(user_id);
CREATE INDEX idx_activity_user_occurred ON public.activity(user_id, occurred_at DESC);
CREATE INDEX idx_activity_type ON public.activity(user_id, activity_type);

ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON public.activity;
CREATE POLICY "Users can view own activity" ON public.activity FOR SELECT USING (auth.uid() = user_id);

-- --------------------------------------------
-- Helper: insert activity row (called by triggers)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.activity_insert(
  p_user_id UUID,
  p_activity_type public.activity_type_enum,
  p_amount NUMERIC DEFAULT NULL,
  p_currency CHAR(3) DEFAULT NULL,
  p_occurred_at TIMESTAMPTZ DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_table VARCHAR(64) DEFAULT NULL,
  p_summary TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity (user_id, activity_type, amount, currency, occurred_at, reference_id, reference_table, summary, metadata)
  VALUES (
    p_user_id,
    p_activity_type,
    p_amount,
    p_currency,
    COALESCE(p_occurred_at, now()),
    p_reference_id,
    p_reference_table,
    p_summary,
    p_metadata
  );
END;
$$;

-- --------------------------------------------
-- Financial: payment INSERT
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.activity_on_payment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary TEXT;
  v_merchant_name TEXT;
BEGIN
  SELECT name INTO v_merchant_name FROM public.merchant WHERE id = NEW.merchant_id;
  v_summary := 'Payment' || COALESCE(' – ' || v_merchant_name, '');
  PERFORM public.activity_insert(
    NEW.user_id,
    'payment'::public.activity_type_enum,
    -NEW.amount,
    NEW.currency,
    COALESCE(NEW.paid_at, now()),
    NEW.id,
    'payment',
    v_summary,
    jsonb_build_object('merchant_id', NEW.merchant_id, 'payment_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_payment_insert ON public.payment;
CREATE TRIGGER activity_payment_insert
  AFTER INSERT ON public.payment
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_payment_insert();

-- --------------------------------------------
-- Financial: transfer INSERT
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.activity_on_transfer_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.activity_insert(
    NEW.user_id,
    'transfer'::public.activity_type_enum,
    -NEW.amount,
    NEW.currency,
    COALESCE(NEW.completed_at, now()),
    NEW.id,
    'transfer',
    'Transfer',
    jsonb_build_object('transfer_id', NEW.id, 'from_account_id', NEW.from_account_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_transfer_insert ON public.transfer;
CREATE TRIGGER activity_transfer_insert
  AFTER INSERT ON public.transfer
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_transfer_insert();

-- --------------------------------------------
-- Financial: income INSERT
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.activity_on_income_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.activity_insert(
    NEW.user_id,
    'income'::public.activity_type_enum,
    NEW.amount,
    NEW.currency,
    NEW.received_at,
    NEW.id,
    'income',
    'Income – ' || NEW.source::text,
    jsonb_build_object('income_id', NEW.id, 'source', NEW.source::text, 'account_id', NEW.account_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_income_insert ON public.income;
CREATE TRIGGER activity_income_insert
  AFTER INSERT ON public.income
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_income_insert();

-- --------------------------------------------
-- Financial: card_payment INSERT
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.activity_on_card_payment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_name TEXT;
BEGIN
  SELECT name INTO v_card_name FROM public.credit_card WHERE id = NEW.credit_card_id;
  PERFORM public.activity_insert(
    NEW.user_id,
    'card_payment'::public.activity_type_enum,
    -NEW.amount,
    NEW.currency,
    COALESCE(NEW.paid_at, now()),
    NEW.id,
    'card_payment',
    'Card payment' || COALESCE(' – ' || v_card_name, ''),
    jsonb_build_object('card_payment_id', NEW.id, 'credit_card_id', NEW.credit_card_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_card_payment_insert ON public.card_payment;
CREATE TRIGGER activity_card_payment_insert
  AFTER INSERT ON public.card_payment
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_card_payment_insert();

-- --------------------------------------------
-- Account UPDATE (log when balance or meaningful fields change)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.activity_on_account_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary TEXT := 'Account updated';
  v_meta JSONB := '{}'::jsonb;
BEGIN
  IF OLD.balance IS DISTINCT FROM NEW.balance THEN
    v_summary := 'Account balance updated';
    v_meta := jsonb_build_object('account_id', NEW.id, 'old_balance', OLD.balance, 'new_balance', NEW.balance, 'currency', NEW.currency);
  ELSIF OLD.name IS DISTINCT FROM NEW.name OR OLD.masked_identifier IS DISTINCT FROM NEW.masked_identifier OR OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    v_meta := jsonb_build_object('account_id', NEW.id, 'name', NEW.name);
  ELSE
    RETURN NEW;
  END IF;
  PERFORM public.activity_insert(
    NEW.user_id,
    'account_updated'::public.activity_type_enum,
    NULL,
    NEW.currency,
    now(),
    NEW.id,
    'account',
    v_summary,
    v_meta
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_account_update ON public.account;
CREATE TRIGGER activity_account_update
  AFTER UPDATE ON public.account
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_account_update();

-- --------------------------------------------
-- Credit card UPDATE (log when balance_owed, credit_limit, or meaningful fields change)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.activity_on_credit_card_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary TEXT := 'Credit card updated';
  v_meta JSONB := '{}'::jsonb;
BEGIN
  IF OLD.balance_owed IS DISTINCT FROM NEW.balance_owed THEN
    v_summary := 'Card balance updated';
    v_meta := jsonb_build_object('credit_card_id', NEW.id, 'old_balance_owed', OLD.balance_owed, 'new_balance_owed', NEW.balance_owed);
  ELSIF OLD.credit_limit IS DISTINCT FROM NEW.credit_limit THEN
    v_summary := 'Card credit limit updated';
    v_meta := jsonb_build_object('credit_card_id', NEW.id, 'old_credit_limit', OLD.credit_limit, 'new_credit_limit', NEW.credit_limit);
  ELSIF OLD.name IS DISTINCT FROM NEW.name OR OLD.payment_due_day IS DISTINCT FROM NEW.payment_due_day OR OLD.statement_day IS DISTINCT FROM NEW.statement_day OR OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    v_meta := jsonb_build_object('credit_card_id', NEW.id, 'name', NEW.name);
  ELSE
    RETURN NEW;
  END IF;
  PERFORM public.activity_insert(
    NEW.user_id,
    'credit_card_updated'::public.activity_type_enum,
    NULL,
    NEW.currency,
    now(),
    NEW.id,
    'credit_card',
    v_summary,
    v_meta
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_credit_card_update ON public.credit_card;
CREATE TRIGGER activity_credit_card_update
  AFTER UPDATE ON public.credit_card
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_credit_card_update();

-- --------------------------------------------
-- User profile UPDATE (log when profile info changes)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.activity_on_user_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed TEXT[] := ARRAY[]::TEXT[];
  v_meta JSONB := '{}'::jsonb;
BEGIN
  IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN v_changed := array_append(v_changed, 'first_name'); END IF;
  IF OLD.middle_name IS DISTINCT FROM NEW.middle_name THEN v_changed := array_append(v_changed, 'middle_name'); END IF;
  IF OLD.last_name IS DISTINCT FROM NEW.last_name THEN v_changed := array_append(v_changed, 'last_name'); END IF;
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN v_changed := array_append(v_changed, 'avatar_url'); END IF;
  IF OLD.phone_number IS DISTINCT FROM NEW.phone_number THEN v_changed := array_append(v_changed, 'phone_number'); END IF;
  IF OLD.currency IS DISTINCT FROM NEW.currency THEN v_changed := array_append(v_changed, 'currency'); END IF;

  IF array_length(v_changed, 1) IS NULL OR array_length(v_changed, 1) = 0 THEN
    RETURN NEW;
  END IF;

  v_meta := jsonb_build_object('user_id', NEW.id, 'changed_fields', to_jsonb(v_changed));
  PERFORM public.activity_insert(
    NEW.id,
    'profile_updated'::public.activity_type_enum,
    NULL,
    NULL,
    now(),
    NEW.id,
    'user_profile',
    'Profile updated',
    v_meta
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_user_profile_update ON public.user_profile;
CREATE TRIGGER activity_user_profile_update
  AFTER UPDATE ON public.user_profile
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_user_profile_update();
