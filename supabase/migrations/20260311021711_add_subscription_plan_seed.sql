INSERT INTO public.subscription_plan (name, slug, description, interval, stripe_price_id, stripe_product_id, amount, currency)
  VALUES
    ('Pro Monthly', 'pro-monthly', 'Pro plan billed monthly', 'month', 'price_1RyUfZJndqOavrDArKima7qd', 'prod_SuJI2tlCACVuPC', 9.00, 'usd'),
    ('Pro Annual',  'pro-annual',  'Pro plan billed annually', 'year',  'price_1RyUynJndqOavrDAR12QjfOe',  'prod_SuJcPzkY7NM43W', 90.00, 'usd');