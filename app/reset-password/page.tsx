"use client"

import Link from "next/link"
import { useState } from "react"
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resetPassword } from "./action"

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a strong password to secure your account.
        </p>

        {error && (
          <div
            className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}{" "}
            {error.includes("expired") && (
              <Link href="/forgot-password" className="font-medium underline">
                Request a new link.
              </Link>
            )}
          </div>
        )}

        <form
          className="mt-8 flex flex-col gap-5"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            const allMet = passwordRequirements.every((req) => req.test(password))
            if (!allMet) {
              setError("Password does not meet all requirements.")
              return
            }
            setIsSubmitting(true)
            const formData = new FormData()
            formData.set("password", password)
            formData.set("confirmPassword", confirmPassword)
            const result = await resetPassword(formData)
            setIsSubmitting(false)
            if (result && !result.success) {
              setError(result.error)
            }
          }}
        >
          {/* New password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              {passwordRequirements.map((req) => {
                const met = req.test(password)
                return (
                  <div key={req.label} className="flex items-center gap-2">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        met ? "bg-primary" : "border border-border bg-background"
                      }`}
                    >
                      {met && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    <span className={`text-xs ${met ? "text-foreground" : "text-muted-foreground"}`}>
                      {req.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? "Updating…" : "Update Password"}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
