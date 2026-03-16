import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types'

export async function createClient() {
    const cookieStore = await cookies();
    // Respect the "Remember Me" preference set at login time.
    // clairo-persistent='0' means session-only cookies (no maxAge/expires).
    const persistent = cookieStore.get('clairo-persistent')?.value !== '0';

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            if (persistent) {
                                cookieStore.set(name, value, options);
                            } else {
                                // Strip maxAge/expires so auth cookies expire when the browser closes.
                                const { maxAge: _m, expires: _e, ...sessionOptions } = options ?? {};
                                cookieStore.set(name, value, sessionOptions);
                            }
                        });
                    } catch (error) {
                        if (process.env.NODE_ENV !== 'production') {
                            // eslint-disable-next-line no-console
                            console.error('[supabase] Error setting cookies', {
                                message: error instanceof Error ? error.message : String(error),
                            });
                        }
                    }
                }
            }
        }
    );
}