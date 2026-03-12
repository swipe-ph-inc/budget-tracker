'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPassword(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password) {
        return { success: false, error: 'Password is required.' }
    }
    if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters.' }
    }
    if (password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match.' }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { success: false, error: 'Unable to reset password. The link may have expired. Please request a new one.' }
    }

    redirect('/dashboard')
}
