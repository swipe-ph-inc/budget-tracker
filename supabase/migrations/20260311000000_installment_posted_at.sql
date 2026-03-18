-- ============================================
-- Installment: track when a due installment is "posted" to the card's balance_owed
-- ============================================
-- When due_date <= today, we add the installment amount to credit_card.balance_owed
-- and set posted_at = now() so we only post once. Balance owed thus grows each month
-- as installments become due, not at plan creation.
-- ============================================

ALTER TABLE public.payment_installment
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.payment_installment.posted_at IS 'When this installment was added to the card balance_owed (due date reached).';

CREATE INDEX IF NOT EXISTS idx_payment_installment_posted_due
  ON public.payment_installment (credit_card_id, due_date)
  WHERE posted_at IS NULL AND status != 'completed';
