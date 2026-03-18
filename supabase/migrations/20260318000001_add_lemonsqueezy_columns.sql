-- Add LemonSqueezy columns to subscription and user_profile tables
-- Stripe columns are kept for backwards compatibility / data history

-- user_profile: store LemonSqueezy customer ID
ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS lemon_customer_id VARCHAR(255) UNIQUE DEFAULT NULL;

-- subscription: add LemonSqueezy-specific identifiers
-- stripe_subscription_id and stripe_customer_id remain for historical rows
ALTER TABLE public.subscription
  ADD COLUMN IF NOT EXISTS lemon_subscription_id VARCHAR(255) UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lemon_customer_id     VARCHAR(255)         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lemon_variant_id      VARCHAR(255)         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lemon_order_id        VARCHAR(255)         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lemon_product_id      VARCHAR(255)         DEFAULT NULL;

-- subscription_plan: add LemonSqueezy variant ID (mirrors stripe_price_id role)
ALTER TABLE public.subscription_plan
  ADD COLUMN IF NOT EXISTS lemon_variant_id VARCHAR(255) UNIQUE DEFAULT NULL;

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscription_lemon_id
  ON public.subscription(lemon_subscription_id)
  WHERE lemon_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscription_plan_lemon_variant
  ON public.subscription_plan(lemon_variant_id)
  WHERE lemon_variant_id IS NOT NULL;
