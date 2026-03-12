"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { forgotPassword } from "./action"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        {sent ? (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              If an account with that email exists, we sent a password reset link. Check your inbox and follow the instructions.
            </p>
            <Link href="/login" className="mt-8 w-full sm:w-auto">
              <Button className="w-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:min-w-[200px]">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Forgot your password?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            {error && (
              <div
                className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <form
              className="mt-8 flex flex-col gap-5"
              onSubmit={async (e) => {
                e.preventDefault()
                setError(null)
                setIsSubmitting(true)
                const formData = new FormData()
                formData.set("email", email)
                const result = await forgotPassword(formData)
                setIsSubmitting(false)
                if (!result.success) {
                  setError((result as { success: false; error: string }).error)
                  return
                }
                setSent(true)
              }}
            >
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? "Sending…" : "Send Reset Link"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
