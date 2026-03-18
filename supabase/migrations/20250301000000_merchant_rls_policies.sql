-- RLS policies for merchant table
-- Run this in Supabase SQL Editor if you're not using Supabase CLI migrations
-- Error: "new row violates row-level security policy for table merchant"

-- Ensure RLS is enabled
ALTER TABLE public.merchant ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all merchants
CREATE POLICY "Allow authenticated read merchants"
  ON public.merchant
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert merchants
CREATE POLICY "Allow authenticated insert merchants"
  ON public.merchant
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update merchants
CREATE POLICY "Allow authenticated update merchants"
  ON public.merchant
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete merchants
CREATE POLICY "Allow authenticated delete merchants"
  ON public.merchant
  FOR DELETE
  TO authenticated
  USING (true);
