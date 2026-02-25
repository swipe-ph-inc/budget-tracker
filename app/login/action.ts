'use server'

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: "Email and password are required" };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email, password
    });

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
        redirect('/dashboard');
    }

    return { success: true, message: "Logged in successfully" };
}