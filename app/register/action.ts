'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getRegisterLimiter } from '@/lib/rate-limit'

const EMAIL_CONFIRM_MESSAGE = 'Please check your email to confirm your account.'
const EMAIL_EXISTS_MESSAGE = 'An account with this email already exists.'
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export type RegisterResult =
    | { success: true; message?: string }
    | { success: false; error: string }

function getAppOrigin(): string {
    const url = process.env.NEXT_PUBLIC_APP_URL
    if (url) return url.replace(/\/$/, '')
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
}

export async function register(formData: FormData): Promise<RegisterResult> {
    const email = (formData.get('email') as string)?.trim()
    const password = (formData.get('password') as string) ?? ''
    const firstName = (formData.get('firstName') as string)?.trim() ?? ''
    const lastName = (formData.get('lastName') as string)?.trim() ?? ''
    const phone = (formData.get('phone') as string)?.trim() || undefined
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || firstName + lastName

    if (!email) {
        return { success: false, error: 'Email is required.' }
    }
    if (!password) {
        return { success: false, error: 'Password is required.' }
    }
    if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters.' }
    }

    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
    const limiter = getRegisterLimiter()
    if (limiter) {
        const { success } = await limiter.limit(ip)
        if (!success) {
            return { success: false, error: 'Too many registration attempts. Please try again later.' }
        }
    }

    const supabase = await createClient()
    const origin = getAppOrigin()

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                phone_number: phone,
                display_name: displayName,
            },
            emailRedirectTo: `${origin}/auth/v1/callback?next=/auth/v1/verification`,
        },
    })

    if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('already') || msg.includes('registered')) {
            return { success: false, error: EMAIL_EXISTS_MESSAGE }
        }
        return { success: false, error: GENERIC_ERROR_MESSAGE }
    }

    if (data?.user && !data.user.identities?.length) {
        return { success: false, error: EMAIL_EXISTS_MESSAGE }
    }

    if (data?.session) {
        redirect('/dashboard')
    }

    return { success: true, message: EMAIL_CONFIRM_MESSAGE }
}
