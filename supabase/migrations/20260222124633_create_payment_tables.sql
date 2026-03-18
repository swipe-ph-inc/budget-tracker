-- ============================================
-- Payment & Transfer Tables
-- ============================================
-- Two flows: Transfer (account-to-account, any type) and Payment (to merchant).
-- Supports fees (local/international), installments, and recurring bills.
-- ============================================

-- Enums for type safety and UI consistency
-- Account = funding sources that hold money (assets). Credit cards are separate (liabilities).
CREATE TYPE public.account_type_enum AS ENUM (
  'savings',
  'current',
  'checking',
  'e_wallet',
  'cash',
  'other'
);

CREATE TYPE public.transfer_type_enum AS ENUM ('local', 'international');

CREATE TYPE public.transfer_method_enum AS ENUM (
  'instaPay',
  'pesoNet',
  'wire',
  'cash'
);

CREATE TYPE public.transaction_status_enum AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

-- Recurrence: how often a payment repeats. biweekly = once every 2 weeks (fortnightly).
CREATE TYPE public.recurrence_frequency_enum AS ENUM (
  'weekly',
  'biweekly',   -- once every 2 weeks (not twice per week)
  'monthly',
  'quarterly',
  'yearly'
);

-- --------------------------------------------
-- Account (user's funding sources that hold money: savings, current, e-wallet, etc.)
-- Excludes credit cards; those are liabilities and live in credit_card table.
-- --------------------------------------------
CREATE TABLE public.account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  account_type public.account_type_enum NOT NULL,
  name VARCHAR(255) NOT NULL,
  masked_identifier VARCHAR(50) NOT NULL,
  bank_name VARCHAR(255) DEFAULT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'PHP',
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  background_img_url TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  hidden BOOLEAN NOT NULL DEFAULT false,
  card_type VARCHAR(255) DEFAULT  NULL,
  card_network_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_user_id ON public.account(user_id);
CREATE INDEX idx_account_user_active ON public.account(user_id, is_active) WHERE is_active = true;

-- --------------------------------------------
-- Credit card (liability: debt, not money; separate from account)
-- Optional default_payment_account_id = "pay this card from this account" in this app; null = user pays elsewhere.
-- --------------------------------------------
CREATE TABLE public.credit_card (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  masked_identifier VARCHAR(50) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'PHP',
  credit_limit NUMERIC(18, 2) NOT NULL CHECK (credit_limit >= 0),
  balance_owed NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (balance_owed >= 0),
  statement_day SMALLINT DEFAULT NULL CHECK (statement_day >= 1 AND statement_day <= 28),
  payment_due_day SMALLINT DEFAULT NULL CHECK (payment_due_day >= 1 AND payment_due_day <= 31),
  default_payment_account_id UUID REFERENCES public.account(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  background_img_url text DEFAULT NULL,
  card_type VARCHAR(255) DEFAULT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  temporary_blocked BOOLEAN NOT NULL DEFAULT false,
  card_network_url text DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_card_user_id ON public.credit_card(user_id);
CREATE INDEX idx_credit_card_user_active ON public.credit_card(user_id, is_active) WHERE is_active = true;

-- --------------------------------------------
-- Recipient (saved beneficiaries for transfers)
-- --------------------------------------------
CREATE TABLE public.recipient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  bank_code VARCHAR(50) DEFAULT NULL,
  bank_name VARCHAR(255) DEFAULT NULL,
  country_code CHAR(2) DEFAULT NULL,
  currency CHAR(3) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipient_user_id ON public.recipient(user_id);

-- --------------------------------------------
-- Merchant category & merchant (for payments: bills, rent, subscriptions)
-- --------------------------------------------
CREATE TABLE public.merchant_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE public.merchant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.merchant_category(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_merchant_category_id ON public.merchant(category_id);

-- --------------------------------------------
-- Transfer (account-to-account: any type, local or international)
-- --------------------------------------------
CREATE TABLE public.transfer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.account(id) ON DELETE RESTRICT,
  to_recipient_id UUID REFERENCES public.recipient(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.account(id) ON DELETE SET NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  transfer_type public.transfer_type_enum NOT NULL,
  transfer_method public.transfer_method_enum NOT NULL,
  status public.transaction_status_enum NOT NULL DEFAULT 'pending',
  fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  fee_currency CHAR(3) DEFAULT NULL,
  note TEXT DEFAULT NULL,
  reference VARCHAR(255) DEFAULT NULL,
  scheduled_at TIMESTAMPTZ DEFAULT NULL,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT transfer_to_target CHECK (
    (to_recipient_id IS NOT NULL AND to_account_id IS NULL) OR
    (to_recipient_id IS NULL AND to_account_id IS NOT NULL)
  ),
  CONSTRAINT transfer_no_self CHECK (from_account_id != to_account_id OR to_account_id IS NULL)
);

CREATE INDEX idx_transfer_user_id ON public.transfer(user_id);
CREATE INDEX idx_transfer_from_account ON public.transfer(from_account_id);
CREATE INDEX idx_transfer_status_created ON public.transfer(status, created_at DESC);

-- --------------------------------------------
-- Payment (to merchant: from account OR charged to credit card)
-- From account = money leaves account. From card = charge added to card balance (debt).
-- For installment plans: amount = total; per-installment amounts in payment_installment.
-- --------------------------------------------
CREATE TABLE public.payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES public.account(id) ON DELETE RESTRICT,
  from_credit_card_id UUID REFERENCES public.credit_card(id) ON DELETE RESTRICT,
  merchant_id UUID NOT NULL REFERENCES public.merchant(id) ON DELETE RESTRICT,
  virtual_account VARCHAR(100) DEFAULT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),  -- total amount (for installments: full price; sum of installment amounts = this)
  currency CHAR(3) NOT NULL,
  status public.transaction_status_enum NOT NULL DEFAULT 'pending',
  fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  fee_currency CHAR(3) DEFAULT NULL,
  note TEXT DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  paid_at TIMESTAMPTZ DEFAULT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_frequency public.recurrence_frequency_enum DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_source CHECK (
    (from_account_id IS NOT NULL AND from_credit_card_id IS NULL) OR
    (from_account_id IS NULL AND from_credit_card_id IS NOT NULL)
  )
);

CREATE INDEX idx_payment_user_id ON public.payment(user_id);
CREATE INDEX idx_payment_from_account ON public.payment(from_account_id) WHERE from_account_id IS NOT NULL;
CREATE INDEX idx_payment_from_credit_card ON public.payment(from_credit_card_id) WHERE from_credit_card_id IS NOT NULL;
CREATE INDEX idx_payment_merchant ON public.payment(merchant_id);
CREATE INDEX idx_payment_status_created ON public.payment(status, created_at DESC);
CREATE INDEX idx_payment_due_date ON public.payment(due_date) WHERE due_date IS NOT NULL;

-- --------------------------------------------
-- Payment installment (per-due slice of an installment plan)
-- Option A: payment.amount = total; each row = per-installment amount; sum(amount) = payment.amount.
-- When payment is charged to a card (from_credit_card_id), these installments are "on" that card;
-- when each slice hits, app increases credit_card.balance_owed. Paying an installment = card_payment.
-- --------------------------------------------
CREATE TABLE public.payment_installment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payment(id) ON DELETE CASCADE,
  credit_card_id UUID REFERENCES public.credit_card(id) ON DELETE SET NULL,
  installment_number INT NOT NULL CHECK (installment_number >= 1),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),  -- this installment's amount (e.g. monthly slice)
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NULL,
  status public.transaction_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payment_id, installment_number)
);

CREATE INDEX idx_payment_installment_payment ON public.payment_installment(payment_id);
CREATE INDEX idx_payment_installment_credit_card ON public.payment_installment(credit_card_id) WHERE credit_card_id IS NOT NULL;

-- --------------------------------------------
-- Card payment (user pays their card from an account; reduces credit_card.balance_owed)
-- Optional payment_installment_id = "this payment was for this installment" (mark installment paid).
-- --------------------------------------------
CREATE TABLE public.card_payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.account(id) ON DELETE RESTRICT,
  credit_card_id UUID NOT NULL REFERENCES public.credit_card(id) ON DELETE CASCADE,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  status public.transaction_status_enum NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ DEFAULT NULL,
  payment_installment_id UUID REFERENCES public.payment_installment(id) ON DELETE SET NULL,
  note TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_payment_user_id ON public.card_payment(user_id);
CREATE INDEX idx_card_payment_credit_card ON public.card_payment(credit_card_id);
CREATE INDEX idx_card_payment_from_account ON public.card_payment(from_account_id);

-- --------------------------------------------
-- Transaction fee breakdown (optional: multiple fee lines per transfer/payment)
-- --------------------------------------------
CREATE TYPE public.fee_type_enum AS ENUM (
  'local_transfer',
  'international_transfer',
  'wire_fee',
  'currency_conversion',
  'merchant_payment',
  'other'
);

CREATE TABLE public.transaction_fee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES public.transfer(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payment(id) ON DELETE CASCADE,
  fee_type public.fee_type_enum NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT transaction_fee_source CHECK (
    (transfer_id IS NOT NULL AND payment_id IS NULL) OR
    (transfer_id IS NULL AND payment_id IS NOT NULL)
  )
);

CREATE INDEX idx_transaction_fee_transfer ON public.transaction_fee(transfer_id);
CREATE INDEX idx_transaction_fee_payment ON public.transaction_fee(payment_id);

-- --------------------------------------------
-- updated_at triggers (depends on set_updated_at from create_initial_tables)
-- --------------------------------------------
DROP TRIGGER IF EXISTS account_updated_at ON public.account;
CREATE TRIGGER account_updated_at
  BEFORE UPDATE ON public.account
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS transfer_updated_at ON public.transfer;
CREATE TRIGGER transfer_updated_at
  BEFORE UPDATE ON public.transfer
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS payment_updated_at ON public.payment;
CREATE TRIGGER payment_updated_at
  BEFORE UPDATE ON public.payment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS credit_card_updated_at ON public.credit_card;
CREATE TRIGGER credit_card_updated_at
  BEFORE UPDATE ON public.credit_card
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS card_payment_updated_at ON public.card_payment;
CREATE TRIGGER card_payment_updated_at
  BEFORE UPDATE ON public.card_payment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------
-- RLS
-- --------------------------------------------
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_installment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_fee ENABLE ROW LEVEL SECURITY;

-- merchant_category and merchant: read-only for all authenticated users (no RLS or permissive read)
ALTER TABLE public.merchant_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant ENABLE ROW LEVEL SECURITY;

-- Account: own rows only
DROP POLICY IF EXISTS "Users can view own accounts" ON public.account;
CREATE POLICY "Users can view own accounts" ON public.account FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.account;
CREATE POLICY "Users can insert own accounts" ON public.account FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own accounts" ON public.account;
CREATE POLICY "Users can update own accounts" ON public.account FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.account;
CREATE POLICY "Users can delete own accounts" ON public.account FOR DELETE USING (auth.uid() = user_id);

-- Credit card: own rows only
DROP POLICY IF EXISTS "Users can view own credit cards" ON public.credit_card;
CREATE POLICY "Users can view own credit cards" ON public.credit_card FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own credit cards" ON public.credit_card;
CREATE POLICY "Users can insert own credit cards" ON public.credit_card FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own credit cards" ON public.credit_card;
CREATE POLICY "Users can update own credit cards" ON public.credit_card FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own credit cards" ON public.credit_card;
CREATE POLICY "Users can delete own credit cards" ON public.credit_card FOR DELETE USING (auth.uid() = user_id);

-- Recipient: own rows only
DROP POLICY IF EXISTS "Users can view own recipients" ON public.recipient;
CREATE POLICY "Users can view own recipients" ON public.recipient FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own recipients" ON public.recipient;
CREATE POLICY "Users can insert own recipients" ON public.recipient FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own recipients" ON public.recipient;
CREATE POLICY "Users can update own recipients" ON public.recipient FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own recipients" ON public.recipient;
CREATE POLICY "Users can delete own recipients" ON public.recipient FOR DELETE USING (auth.uid() = user_id);

-- Transfer: own rows only
DROP POLICY IF EXISTS "Users can view own transfers" ON public.transfer;
CREATE POLICY "Users can view own transfers" ON public.transfer FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own transfers" ON public.transfer;
CREATE POLICY "Users can insert own transfers" ON public.transfer FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own transfers" ON public.transfer;
CREATE POLICY "Users can update own transfers" ON public.transfer FOR UPDATE USING (auth.uid() = user_id);

-- Payment: own rows only
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment;
CREATE POLICY "Users can view own payments" ON public.payment FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payment;
CREATE POLICY "Users can insert own payments" ON public.payment FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own payments" ON public.payment;
CREATE POLICY "Users can update own payments" ON public.payment FOR UPDATE USING (auth.uid() = user_id);

-- Card payment: own rows only
DROP POLICY IF EXISTS "Users can view own card payments" ON public.card_payment;
CREATE POLICY "Users can view own card payments" ON public.card_payment FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own card payments" ON public.card_payment;
CREATE POLICY "Users can insert own card payments" ON public.card_payment FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own card payments" ON public.card_payment;
CREATE POLICY "Users can update own card payments" ON public.card_payment FOR UPDATE USING (auth.uid() = user_id);

-- Payment installment: via payment ownership
DROP POLICY IF EXISTS "Users can view own payment installments" ON public.payment_installment;
CREATE POLICY "Users can view own payment installments" ON public.payment_installment
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.payment p WHERE p.id = payment_id AND p.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Users can insert own payment installments" ON public.payment_installment;
CREATE POLICY "Users can insert own payment installments" ON public.payment_installment
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.payment p WHERE p.id = payment_id AND p.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Users can update own payment installments" ON public.payment_installment;
CREATE POLICY "Users can update own payment installments" ON public.payment_installment
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.payment p WHERE p.id = payment_id AND p.user_id = auth.uid())
  );

-- Transaction fee: via transfer or payment ownership
DROP POLICY IF EXISTS "Users can view own transaction fees" ON public.transaction_fee;
CREATE POLICY "Users can view own transaction fees" ON public.transaction_fee
  FOR SELECT USING (
    (transfer_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.transfer t WHERE t.id = transfer_id AND t.user_id = auth.uid()))
    OR
    (payment_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.payment p WHERE p.id = payment_id AND p.user_id = auth.uid()))
  );
DROP POLICY IF EXISTS "Users can insert own transaction fees" ON public.transaction_fee;
CREATE POLICY "Users can insert own transaction fees" ON public.transaction_fee
  FOR INSERT WITH CHECK (
    (transfer_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.transfer t WHERE t.id = transfer_id AND t.user_id = auth.uid()))
    OR
    (payment_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.payment p WHERE p.id = payment_id AND p.user_id = auth.uid()))
  );

-- Merchant category & merchant: allow read for authenticated (so users can pick categories/merchants)
DROP POLICY IF EXISTS "Authenticated can read merchant categories" ON public.merchant_category;
CREATE POLICY "Authenticated can read merchant categories" ON public.merchant_category
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can read merchants" ON public.merchant;
CREATE POLICY "Authenticated can read merchants" ON public.merchant
  FOR SELECT TO authenticated USING (true);

-- Seed common merchant categories (optional; run once)
INSERT INTO public.merchant_category (name) VALUES
  ('Healthcare'),
  ('E-commerce'),
  ('Internet & Cable TV'),
  ('Insurance'),
  ('Utilities'),
  ('Entertainment'),
  ('Rent & Mortgage'),
  ('Subscription')
ON CONFLICT (name) DO NOTHING;
