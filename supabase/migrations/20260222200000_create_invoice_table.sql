-- ============================================
-- Invoice (uploaded document; saving as invoice can create a payment)
-- ============================================

CREATE TYPE public.invoice_status_enum AS ENUM (
  'draft',
  'pending',
  'paid',
  'overdue',
  'unpaid'
);

CREATE TABLE public.invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES public.merchant(id) ON DELETE SET NULL,
  invoice_number VARCHAR(64) DEFAULT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'PHP',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE DEFAULT NULL,
  file_url TEXT DEFAULT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  note TEXT DEFAULT NULL,
  status public.invoice_status_enum NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_user_id ON public.invoice(user_id);
CREATE INDEX idx_invoice_status ON public.invoice(user_id, status);
CREATE INDEX idx_invoice_invoice_date ON public.invoice(user_id, invoice_date DESC);
CREATE UNIQUE INDEX idx_invoice_number_user ON public.invoice(user_id, invoice_number) WHERE invoice_number IS NOT NULL;

ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoice(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_payment_invoice_id ON public.payment(invoice_id) WHERE invoice_id IS NOT NULL;

DROP TRIGGER IF EXISTS invoice_updated_at ON public.invoice;
CREATE TRIGGER invoice_updated_at
  BEFORE UPDATE ON public.invoice
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.invoice_sync_status_from_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_id IS NOT NULL AND NEW.status = 'completed' THEN
    UPDATE public.invoice SET status = 'paid'::public.invoice_status_enum, updated_at = now() WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_after_update_invoice_status ON public.payment;
CREATE TRIGGER payment_after_update_invoice_status
  AFTER UPDATE OF status ON public.payment
  FOR EACH ROW
  WHEN (NEW.invoice_id IS NOT NULL AND NEW.status = 'completed')
  EXECUTE FUNCTION public.invoice_sync_status_from_payment();

ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoice;
CREATE POLICY "Users can manage own invoices" ON public.invoice
  FOR ALL USING (auth.uid() = user_id);
