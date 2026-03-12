'use server'

import { createClient } from '@/lib/supabase/server'

const THIRTY_DAYS_S = 30 * 24 * 60 * 60 * 1000

function getOrigin(): string {
    const url = process.env.NEXT_PUBLIC_APP_URL
    if (url) return url.replace(/\/$/, '')
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
}

export async function forgotPassword(formData: FormData) {
    const email = (formData.get('email') as string)?.trim()

    if (!email) {
        return { success: false, error: 'Email is required.' }
    }

    const supabase = await createClient()
    const origin = getOrigin()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/v1/callback?next=/reset-password&type=recovery`,
    })

    if (error) {
        // Always return success to prevent email enumeration
    }

    return {
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link shortly.',
    }
}
