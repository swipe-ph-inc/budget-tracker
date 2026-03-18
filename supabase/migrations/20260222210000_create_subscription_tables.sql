-- ============================================
-- Subscription (Stripe-integrated; monthly and annual plans)
-- ============================================

CREATE TYPE public.subscription_interval_enum AS ENUM ('month', 'year');

CREATE TYPE public.subscription_status_enum AS ENUM (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

-- Plan catalog: create one row per Stripe Price (e.g. Pro Monthly, Pro Annual). Sync from Stripe or insert after creating Products/Prices in Stripe Dashboard.
CREATE TABLE public.subscription_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  interval public.subscription_interval_enum NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_product_id VARCHAR(255) NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'usd',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_plan_slug ON public.subscription_plan(slug);
CREATE INDEX idx_subscription_plan_active ON public.subscription_plan(is_active) WHERE is_active = true;

CREATE TABLE public.subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255) DEFAULT NULL,
  plan_id UUID REFERENCES public.subscription_plan(id) ON DELETE SET NULL,
  status public.subscription_status_enum NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ DEFAULT NULL,
  current_period_end TIMESTAMPTZ DEFAULT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ DEFAULT NULL,
  trial_start TIMESTAMPTZ DEFAULT NULL,
  trial_end TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_user_id ON public.subscription(user_id);
CREATE INDEX idx_subscription_stripe_id ON public.subscription(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_subscription_status ON public.subscription(user_id, status);

ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

DROP TRIGGER IF EXISTS subscription_plan_updated_at ON public.subscription_plan;
CREATE TRIGGER subscription_plan_updated_at
  BEFORE UPDATE ON public.subscription_plan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS subscription_updated_at ON public.subscription;
CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON public.subscription
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.activity_on_subscription_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name TEXT;
  v_summary TEXT := 'Subscription started';
BEGIN
  IF NEW.plan_id IS NOT NULL THEN
    SELECT name INTO v_plan_name FROM public.subscription_plan WHERE id = NEW.plan_id;
    v_summary := 'Subscribed to ' || COALESCE(v_plan_name, 'plan');
  END IF;
  PERFORM public.activity_insert(
    NEW.user_id,
    'subscription_started'::public.activity_type_enum,
    NULL,
    NULL,
    NEW.created_at,
    NEW.id,
    'subscription',
    v_summary,
    jsonb_build_object('subscription_id', NEW.id, 'stripe_subscription_id', NEW.stripe_subscription_id, 'stripe_price_id', NEW.stripe_price_id, 'plan_id', NEW.plan_id, 'status', NEW.status::text)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_subscription_insert ON public.subscription;
CREATE TRIGGER activity_subscription_insert
  AFTER INSERT ON public.subscription
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_subscription_insert();

CREATE OR REPLACE FUNCTION public.activity_on_subscription_canceled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name TEXT;
  v_summary TEXT := 'Subscription canceled';
BEGIN
  IF NEW.plan_id IS NOT NULL THEN
    SELECT name INTO v_plan_name FROM public.subscription_plan WHERE id = NEW.plan_id;
    v_summary := 'Unsubscribed from ' || COALESCE(v_plan_name, 'plan');
  END IF;
  PERFORM public.activity_insert(
    NEW.user_id,
    'subscription_canceled'::public.activity_type_enum,
    NULL,
    NULL,
    COALESCE(NEW.canceled_at, now()),
    NEW.id,
    'subscription',
    v_summary,
    jsonb_build_object('subscription_id', NEW.id, 'stripe_subscription_id', NEW.stripe_subscription_id, 'canceled_at', NEW.canceled_at, 'cancel_at_period_end', NEW.cancel_at_period_end)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_subscription_canceled ON public.subscription;
CREATE TRIGGER activity_subscription_canceled
  AFTER UPDATE ON public.subscription
  FOR EACH ROW
  WHEN (
    (NEW.status = 'canceled'::public.subscription_status_enum AND (OLD.status IS DISTINCT FROM 'canceled'::public.subscription_status_enum))
    OR (NEW.canceled_at IS NOT NULL AND OLD.canceled_at IS NULL)
  )
  EXECUTE FUNCTION public.activity_on_subscription_canceled();

ALTER TABLE public.subscription_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plans are readable by authenticated users" ON public.subscription_plan;
CREATE POLICY "Plans are readable by authenticated users" ON public.subscription_plan
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscription;
CREATE POLICY "Users can view own subscription" ON public.subscription
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscription;
CREATE POLICY "Users can update own subscription" ON public.subscription
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscription rows are created/updated by your backend (e.g. Stripe webhooks) using service role; no client INSERT policy.
