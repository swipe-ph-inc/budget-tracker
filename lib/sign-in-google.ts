import { createClient } from "@/lib/supabase/client";

/**
 * Redirects the user to Google OAuth. Use in client components only.
 * After sign-in, user is sent to /auth/callback then to `next` (default /dashboard).
 */
export function signInWithGoogle(next = "/dashboard") {
  const supabase = createClient();
  const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/v1/callback?next=${encodeURIComponent(next)}`;
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}
