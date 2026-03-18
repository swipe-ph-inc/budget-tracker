-- ============================================
-- Notifications & Budget
-- ============================================
-- Notifications: installment due/past due, subscription credited, card statement/payment due, budget warnings.
-- Budget: weekly/monthly targets; spending is computed from payments/transfers (Account table unchanged).
-- ============================================

CREATE TYPE public.notification_type_enum AS ENUM (
  'installment_due',
  'installment_past_due',
  'subscription_credited',
  'card_statement_due',
  'card_payment_due',
  'budget_warning',
  'budget_exceeded',
  'general'
);

CREATE TYPE public.notification_channel_enum AS ENUM ('in_app', 'email');

-- --------------------------------------------
-- Notification (in-app + optional email sent flag)
-- metadata: jsonb for related ids (payment_installment_id, credit_card_id, budget_id, etc.)
-- --------------------------------------------
CREATE TABLE public.notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  type public.notification_type_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT DEFAULT NULL,
  metadata JSONB DEFAULT NULL,
  read_at TIMESTAMPTZ DEFAULT NULL,
  email_sent_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_user_id ON public.notification(user_id);
CREATE INDEX idx_notification_user_unread ON public.notification(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notification_created ON public.notification(user_id, created_at DESC);

-- --------------------------------------------
-- Notification preference (per user: which types to send via email / show in-app)
-- --------------------------------------------
CREATE TABLE public.notification_preference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  notification_type public.notification_type_enum NOT NULL,
  channel public.notification_channel_enum NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_type, channel)
);

CREATE INDEX idx_notification_preference_user ON public.notification_preference(user_id);

-- --------------------------------------------
-- Budget (weekly or monthly spending target)
-- Behavior: Account table is NOT changed. Budget is a target (e.g. "spend at most 5000 this month").
-- "Spent" is computed at read time: sum of payment.amount (from account or charged to card) and
-- optionally outbound transfers in that period. When spent >= amount (or e.g. 80%), create
-- notification (budget_warning / budget_exceeded). No balance or column on account.
-- --------------------------------------------
CREATE TYPE public.budget_period_enum AS ENUM ('week', 'month', 'quarter', 'year');

CREATE TABLE public.budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  name VARCHAR(255) DEFAULT NULL,
  period_type public.budget_period_enum NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'PHP',
  period_start_date DATE NOT NULL,
  category_id UUID REFERENCES public.merchant_category(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_user_id ON public.budget(user_id);
CREATE INDEX idx_budget_user_period ON public.budget(user_id, period_type, period_start_date);

-- --------------------------------------------
-- Triggers
-- --------------------------------------------
DROP TRIGGER IF EXISTS notification_preference_updated_at ON public.notification_preference;
CREATE TRIGGER notification_preference_updated_at
  BEFORE UPDATE ON public.notification_preference
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS budget_updated_at ON public.budget;
CREATE TRIGGER budget_updated_at
  BEFORE UPDATE ON public.budget
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------
-- RLS
-- --------------------------------------------
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification;
CREATE POLICY "Users can view own notifications" ON public.notification FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notification;
CREATE POLICY "Users can update own notifications" ON public.notification FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preference;
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preference
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budget;
CREATE POLICY "Users can manage own budgets" ON public.budget
  FOR ALL USING (auth.uid() = user_id);
