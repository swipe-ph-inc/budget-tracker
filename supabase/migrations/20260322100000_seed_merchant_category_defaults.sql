-- Seed extended default merchant categories for payments and budgeting.
-- Idempotent: safe if categories already exist (e.g. from 20260222124633_create_payment_tables.sql).
INSERT INTO public.merchant_category (name) VALUES
  ('Groceries'),
  ('Dining & Restaurants'),
  ('Transportation'),
  ('Gas & Fuel'),
  ('Education'),
  ('Travel'),
  ('Personal Care'),
  ('Gifts & Donations'),
  ('Banking & Fees'),
  ('Taxes'),
  ('Childcare'),
  ('Pets'),
  ('Home & Garden'),
  ('Clothing & Apparel'),
  ('Fitness & Sports'),
  ('Professional Services'),
  ('Loans & Debt Payments'),
  ('Automotive'),
  ('Office Supplies'),
  ('Mobile & Telecom')
ON CONFLICT (name) DO NOTHING;
