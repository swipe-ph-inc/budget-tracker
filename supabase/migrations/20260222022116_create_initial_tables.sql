-- User Profile Table (id = auth.users.id; create profile on signup via trigger or app)
CREATE TABLE IF NOT EXISTS public.user_profile(
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) DEFAULT NULL,
    middle_name VARCHAR(255) DEFAULT NULL,
    last_name VARCHAR(255) DEFAULT NULL,
    avatar_url text DEFAULT NULL,
    phone_number VARCHAR(255) DEFAULT NULL,
    currency VARCHAR(4) DEFAULT 'PHP',
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Profile Trigger to create profile on signup
-- SECURITY DEFINER so the trigger can INSERT despite RLS (auth.uid() may not be set during signup)
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profile (
        id,
        first_name,
        last_name,
        phone_number,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone_number',
        now(),
        now()
    );
    RETURN NEW;
END;
$$;

-- Fire after each new user is inserted in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_profile();

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Keep updated_at in sync on every UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profile_updated_at ON public.user_profile;
CREATE TRIGGER user_profile_updated_at
    BEFORE UPDATE ON public.user_profile
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- user_profile Table Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profile;
CREATE POLICY "Users can view own profile"
  ON public.user_profile
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profile;
CREATE POLICY "Users can update own profile"
  ON public.user_profile
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profile;
CREATE POLICY "Users can insert own profile"
  ON public.user_profile
  FOR INSERT
  WITH CHECK (auth.uid() = id);