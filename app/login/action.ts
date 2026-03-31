'use server'

import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { safeRedirect } from "@/lib/safe-redirect"
import { getLoginLimiter } from "@/lib/rate-limit"

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'
const THIRTY_DAYS = 30 * 24 * 60 * 60

function getOrigin(): string {
    const url = process.env.NEXT_PUBLIC_APP_URL
    if (url) return url.replace(/\/$/, '')
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
}

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const next = (formData.get('next') as string) || '/dashboard';
    const rememberMe = formData.get('rememberMe') === '1';

    if (!email || !password) {
        return { success: false, error: "Email and password are required" };
    }

    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
    const limiter = getLoginLimiter()
    if (limiter) {
        const { success } = await limiter.limit(ip)
        if (!success) {
            return { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' }
        }
    }

    const cookieStore = await cookies();

    // Create a custom Supabase client for login that respects the rememberMe flag.
    // When rememberMe is false, auth cookies are set without maxAge/expires (session-only).
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        if (rememberMe) {
                            cookieStore.set(name, value, options);
                        } else {
                            const { maxAge: _m, expires: _e, ...sessionOptions } = options ?? {};
                            cookieStore.set(name, value, sessionOptions);
                        }
                    });
                    // Store the preference so createClient() uses the same strategy on refresh.
                    const prefOpts = rememberMe
                        ? { maxAge: THIRTY_DAYS, httpOnly: true, sameSite: 'lax' as const, path: '/' }
                        : { httpOnly: true, sameSite: 'lax' as const, path: '/' };
                    cookieStore.set('clairo-persistent', rememberMe ? '1' : '0', prefOpts);
                },
            },
        }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid') || msg.includes('credentials')) {
            return { success: false, error: "Invalid email or password" };
        }
        return { success: false, error: GENERIC_ERROR_MESSAGE };
    }

    if (data?.user && !data.user.identities?.length) {
        return { success: false, error: "An account with this email already exists" };
    }

    if (data?.session) {
        const destination = safeRedirect(getOrigin(), next).pathname
        redirect(destination);
    }

    return { success: true, message: "Logged in successfully" };
}
