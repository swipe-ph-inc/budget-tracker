-- ============================================
-- Payment Schedule & Payment Type Extensions
-- ============================================
-- Adds: payment_type enum, payment_schedule table (recurring/subscription + auto-pay),
-- and extends payment table. No changes to payment_installment (existing schema sufficient).
-- ============================================

-- --------------------------------------------
-- Payment type enum (one_time, recurring, subscription, installment)
-- --------------------------------------------
CREATE TYPE public.payment_type_enum AS ENUM (
  'one_time',
  'recurring',
  'subscription',
  'installment'
);

-- --------------------------------------------
-- Payment schedule (template for recurring/subscription auto-pay)
-- When auto_pay_enabled: cron/job creates payment rows and advances next_due_date.
-- --------------------------------------------
CREATE TABLE public.payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchant(id) ON DELETE RESTRICT,
  schedule_type public.payment_type_enum NOT NULL,  -- 'recurring' | 'subscription'
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  virtual_account VARCHAR(100) DEFAULT NULL,
  fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  note TEXT DEFAULT NULL,
  recurrence_frequency public.recurrence_frequency_enum NOT NULL,
  next_due_date DATE NOT NULL,
  auto_pay_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_pay_account_id UUID REFERENCES public.account(id) ON DELETE SET NULL,
  auto_pay_credit_card_id UUID REFERENCES public.credit_card(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_schedule_auto_source CHECK (
    (NOT auto_pay_enabled) OR
    (auto_pay_account_id IS NOT NULL AND auto_pay_credit_card_id IS NULL) OR
    (auto_pay_account_id IS NULL AND auto_pay_credit_card_id IS NOT NULL)
  )
);

CREATE INDEX idx_payment_schedule_user_id ON public.payment_schedule(user_id);
CREATE INDEX idx_payment_schedule_next_due ON public.payment_schedule(next_due_date) WHERE status = 'active' AND auto_pay_enabled = true;

-- --------------------------------------------
-- Extend payment table
-- --------------------------------------------
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS payment_schedule_id UUID
  REFERENCES public.payment_schedule(id) ON DELETE SET NULL;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS payment_type public.payment_type_enum
  NOT NULL DEFAULT 'one_time';
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS auto_charge_installments BOOLEAN
  NOT NULL DEFAULT false;  -- When true, auto-charge card when each installment is due

CREATE INDEX IF NOT EXISTS idx_payment_schedule ON public.payment(payment_schedule_id);

-- --------------------------------------------
-- updated_at trigger for payment_schedule
-- --------------------------------------------
DROP TRIGGER IF EXISTS payment_schedule_updated_at ON public.payment_schedule;
CREATE TRIGGER payment_schedule_updated_at
  BEFORE UPDATE ON public.payment_schedule
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------
-- RLS for payment_schedule
-- --------------------------------------------
ALTER TABLE public.payment_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment schedules" ON public.payment_schedule;
CREATE POLICY "Users can view own payment schedules" ON public.payment_schedule
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment schedules" ON public.payment_schedule;
CREATE POLICY "Users can insert own payment schedules" ON public.payment_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment schedules" ON public.payment_schedule;
CREATE POLICY "Users can update own payment schedules" ON public.payment_schedule
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment schedules" ON public.payment_schedule;
CREATE POLICY "Users can delete own payment schedules" ON public.payment_schedule
  FOR DELETE USING (auth.uid() = user_id);
