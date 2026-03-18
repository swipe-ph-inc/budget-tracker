-- ============================================
-- Credit card block / unblock activity logging
-- ============================================
-- Trigger that records an activity row when a card is blocked, unblocked,
-- temporarily blocked, or temporarily unblocked. Uses activity_type
-- 'credit_card_updated' with metadata.action for the specific action.
-- ============================================

-- Trigger function: record activity when credit card is blocked, unblocked, or temporarily blocked/unblocked
CREATE OR REPLACE FUNCTION public.credit_card_block_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_occurred_at TIMESTAMPTZ := now();
  v_metadata JSONB;
  v_action TEXT;
  v_summary TEXT;
BEGIN
  v_metadata := jsonb_build_object(
    'credit_card_id', NEW.id,
    'credit_card_name', NEW.name,
    'masked_identifier', NEW.masked_identifier
  );

  -- Block: is_blocked changed to true
  IF (NEW.is_blocked IS TRUE AND (OLD.is_blocked IS NOT TRUE)) THEN
    v_action := 'blocked';
    v_summary := 'Credit card blocked: ' || COALESCE(NEW.name, NEW.masked_identifier);
    v_metadata := v_metadata || jsonb_build_object('action', v_action);
    INSERT INTO public.activity (
      user_id,
      activity_type,
      reference_id,
      reference_table,
      summary,
      metadata,
      occurred_at
    ) VALUES (
      NEW.user_id,
      'credit_card_updated'::public.activity_type_enum,
      NEW.id::text,
      'credit_card',
      v_summary,
      v_metadata,
      v_occurred_at
    );
  END IF;

  -- Unblock: is_blocked changed from true to false/null
  IF (NEW.is_blocked IS NOT TRUE AND (OLD.is_blocked IS TRUE)) THEN
    v_action := 'unblocked';
    v_summary := 'Credit card unblocked: ' || COALESCE(NEW.name, NEW.masked_identifier);
    v_metadata := v_metadata || jsonb_build_object('action', v_action);
    INSERT INTO public.activity (
      user_id,
      activity_type,
      reference_id,
      reference_table,
      summary,
      metadata,
      occurred_at
    ) VALUES (
      NEW.user_id,
      'credit_card_updated'::public.activity_type_enum,
      NEW.id::text,
      'credit_card',
      v_summary,
      v_metadata,
      v_occurred_at
    );
  END IF;

  -- Temporary block: temporary_blocked changed to true
  IF (NEW.temporary_blocked IS TRUE AND (OLD.temporary_blocked IS NOT TRUE)) THEN
    v_action := 'temporary_blocked';
    v_summary := 'Credit card temporarily blocked: ' || COALESCE(NEW.name, NEW.masked_identifier);
    v_metadata := v_metadata || jsonb_build_object('action', v_action);
    INSERT INTO public.activity (
      user_id,
      activity_type,
      reference_id,
      reference_table,
      summary,
      metadata,
      occurred_at
    ) VALUES (
      NEW.user_id,
      'credit_card_updated'::public.activity_type_enum,
      NEW.id::text,
      'credit_card',
      v_summary,
      v_metadata,
      v_occurred_at
    );
  END IF;

  -- Temporary unblock: temporary_blocked changed from true to false/null
  IF (NEW.temporary_blocked IS NOT TRUE AND (OLD.temporary_blocked IS TRUE)) THEN
    v_action := 'temporary_unblocked';
    v_summary := 'Credit card temporary block removed: ' || COALESCE(NEW.name, NEW.masked_identifier);
    v_metadata := v_metadata || jsonb_build_object('action', v_action);
    INSERT INTO public.activity (
      user_id,
      activity_type,
      reference_id,
      reference_table,
      summary,
      metadata,
      occurred_at
    ) VALUES (
      NEW.user_id,
      'credit_card_updated'::public.activity_type_enum,
      NEW.id::text,
      'credit_card',
      v_summary,
      v_metadata,
      v_occurred_at
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if present, then create
DROP TRIGGER IF EXISTS credit_card_block_activity_trigger ON public.credit_card;
CREATE TRIGGER credit_card_block_activity_trigger
  AFTER UPDATE ON public.credit_card
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_card_block_activity();
