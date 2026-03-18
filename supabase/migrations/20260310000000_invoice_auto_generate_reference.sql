-- ============================================
-- Invoice: support auto-generation from subscription, installment, recurring payment
-- ============================================
-- Adds reference_type and reference_id so we can:
-- 1. Generate one invoice per subscription due date (reference_type='subscription', reference_id=payment_schedule.id, due_date=next_due_date)
-- 2. Generate one invoice per installment (reference_type='installment', reference_id=payment_installment.id)
-- 3. Generate one invoice per recurring payment (reference_type='recurring_payment', reference_id=payment.id)
-- Uniqueness: (user_id, reference_type, reference_id, due_date) to avoid duplicates when ensuring invoices.
-- ============================================

ALTER TABLE public.invoice
  ADD COLUMN IF NOT EXISTS reference_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reference_id UUID DEFAULT NULL;

COMMENT ON COLUMN public.invoice.reference_type IS 'Source of auto-generated invoice: subscription | installment | recurring_payment';
COMMENT ON COLUMN public.invoice.reference_id IS 'ID of payment_schedule (subscription), payment_installment, or payment (recurring)';

-- One invoice per (user, type, reference, due_date). For subscription multiple due_dates per schedule are allowed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_reference_unique
  ON public.invoice (user_id, reference_type, reference_id, due_date)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL AND due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_reference ON public.invoice (reference_type, reference_id)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
