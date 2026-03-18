-- atomic_transfer_funds
-- Performs a balance transfer between two accounts in a single serializable transaction,
-- preventing race conditions and double-spend issues that arise from separate read-then-update calls.
--
-- Parameters:
--   p_from_account_id  UUID  – source account
--   p_to_account_id    UUID  – destination account
--   p_amount           NUMERIC – positive amount to transfer (validated > 0)
--   p_user_id          UUID  – must own both accounts (enforced inside the function)
--
-- Returns: JSON with { success: boolean, error?: string }

CREATE OR REPLACE FUNCTION public.atomic_transfer_funds(
    p_from_account_id UUID,
    p_to_account_id   UUID,
    p_amount          NUMERIC,
    p_user_id         UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_from_balance   NUMERIC;
    v_to_balance     NUMERIC;
    v_from_owner     UUID;
    v_to_owner       UUID;
BEGIN
    -- Basic validation
    IF p_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Transfer amount must be greater than zero.');
    END IF;

    IF p_from_account_id = p_to_account_id THEN
        RETURN json_build_object('success', false, 'error', 'Source and destination accounts must be different.');
    END IF;

    -- Lock both rows in a deterministic order (lower UUID first) to prevent deadlocks.
    IF p_from_account_id < p_to_account_id THEN
        SELECT user_id, balance INTO v_from_owner, v_from_balance
        FROM account WHERE id = p_from_account_id FOR UPDATE;

        SELECT user_id, balance INTO v_to_owner, v_to_balance
        FROM account WHERE id = p_to_account_id FOR UPDATE;
    ELSE
        SELECT user_id, balance INTO v_to_owner, v_to_balance
        FROM account WHERE id = p_to_account_id FOR UPDATE;

        SELECT user_id, balance INTO v_from_owner, v_from_balance
        FROM account WHERE id = p_from_account_id FOR UPDATE;
    END IF;

    -- Verify accounts exist
    IF v_from_owner IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Source account not found.');
    END IF;

    IF v_to_owner IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Destination account not found.');
    END IF;

    -- Enforce ownership – the caller must own both accounts
    IF v_from_owner <> p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'You do not own the source account.');
    END IF;

    IF v_to_owner <> p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'You do not own the destination account.');
    END IF;

    -- Sufficient funds check
    IF v_from_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient funds in source account.');
    END IF;

    -- Perform the atomic balance update
    UPDATE account SET balance = balance - p_amount WHERE id = p_from_account_id;
    UPDATE account SET balance = balance + p_amount WHERE id = p_to_account_id;

    RETURN json_build_object('success', true);
END;
$$;
