-- Fix subscription plan prices to match what is displayed in the UI ($9.99/mo, $99.99/yr)
UPDATE public.subscription_plan
SET amount = 9.99
WHERE slug = 'pro-monthly';

UPDATE public.subscription_plan
SET amount = 99.99
WHERE slug = 'pro-annual';
