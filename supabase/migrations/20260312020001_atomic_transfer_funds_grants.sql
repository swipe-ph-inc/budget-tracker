-- Grant execute only to authenticated users (service role can also call it)
REVOKE ALL ON FUNCTION public.atomic_transfer_funds(UUID, UUID, NUMERIC, UUID) FROM PUBLIC;
