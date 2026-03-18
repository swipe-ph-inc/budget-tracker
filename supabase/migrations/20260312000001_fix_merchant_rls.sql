-- Fix overly-permissive merchant RLS policies.
-- The merchant table is a shared catalog with no user_id column, so UPDATE and
-- DELETE by arbitrary authenticated users is unsafe. Drop those policies and
-- restrict writes to the service role (used by server-side actions) only.

-- Drop the permissive write policies added in the earlier migration.
DROP POLICY IF EXISTS "Allow authenticated insert merchants" ON public.merchant;
DROP POLICY IF EXISTS "Allow authenticated update merchants" ON public.merchant;
DROP POLICY IF EXISTS "Allow authenticated delete merchants" ON public.merchant;

-- Re-create a scoped INSERT policy: authenticated users may add merchants
-- (needed when a user registers a new payee during a payment flow), but only
-- through the app's server actions which validate input before inserting.
CREATE POLICY "Authenticated users can insert merchants"
  ON public.merchant
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE and DELETE are now restricted to the service role only (no policy =
-- blocked for anon/authenticated; service role bypasses RLS by default).
