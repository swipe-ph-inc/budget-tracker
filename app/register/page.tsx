"use client"

import Link from "next/link"
import { useState } from "react"
import { Eye, EyeOff, ArrowRight, Check, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/lib/sign-in-google"
import { register } from "./action"

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 fields – keep in state so we can send them when submitting step 2
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 lg:flex">
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/clairo-logo.svg"
              alt="Clairo"
              className="h-9 w-auto object-contain"
              width={100}
              height={36}
            />
          </Link>
        </div>

        <div className="relative z-10">
          <h1 className="text-balance text-4xl font-bold leading-tight text-primary-foreground xl:text-5xl">
            Start your financial journey today
          </h1>
          <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-primary-foreground/80">
            Join thousands of users who trust Clairo to manage their finances, track investments, and achieve their savings goals.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {["Dashboard with real-time analytics", "Smart saving plans & investment tools", "Secure payments & transfers"].map(
              (feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-primary-foreground/90">{feature}</span>
                </div>
              )
            )}
          </div>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Clairo. All rights reserved.
        </p>

        {/* Background decoration */}
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-primary-foreground/5" />
        <div className="absolute -top-10 right-20 h-40 w-40 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right - Registration form */}
      <div className="flex w-full flex-col lg:w-1/2">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/clairo-logo.svg"
              alt="Clairo"
              className="h-8 w-auto object-contain"
              width={120}
              height={32}
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            {/* Top link */}
            <div className="mb-8 text-right">
              <span className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign In
                </Link>
              </span>
            </div>

            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {step === 1 ? "1" : <Check className="h-3.5 w-3.5" />}
              </div>
              <div className={`h-0.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-border"}`} />
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === 2 ? "bg-primary text-primary-foreground" : step >= 3 ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"
                }`}
              >
                {step >= 3 ? <Check className="h-3.5 w-3.5" /> : "2"}
              </div>
              <div className={`h-0.5 flex-1 rounded-full ${step === 3 ? "bg-primary" : "bg-border"}`} />
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === 3 ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"
                }`}
              >
                3
              </div>
            </div>

            {step === 1 ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Create your account</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter your personal details to get started
                  </p>
                </div>

                <form
                  className="mt-8 flex flex-col gap-5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setStep(2)
                  }}
                >
                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                        First name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="Andrew"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                        Last name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Forbist"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Email */}
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
                      className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground">
                      Phone number <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="mt-2 w-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : step === 2 ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Secure your account</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create a strong password to protect your finances
                  </p>
                </div>

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

                    if (password !== confirmPassword) {
                      setError("Passwords do not match.")
                      return
                    }
                    if (!termsAccepted) {
                      setError("You must agree to the Terms of Service and Privacy Policy.")
                      return
                    }
                    const allMet = passwordRequirements.every((req) => req.test(password))
                    if (!allMet) {
                      setError("Password does not meet all requirements.")
                      return
                    }

                    setIsSubmitting(true)
                    const formData = new FormData()
                    formData.set("email", email)
                    formData.set("firstName", firstName)
                    formData.set("lastName", lastName)
                    formData.set("phone", phone)
                    formData.set("password", password)

                    const result = await register(formData)
                    setIsSubmitting(false)

                    if (!result.success) {
                      setError(result.error)
                      return
                    }
                    if (result.message) {
                      setError(null)
                      setStep(3)
                    }
                  }}
                >
                  {/* Password */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
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

                    {/* Password strength */}
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
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      disabled={isSubmitting}
                      className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                    />
                    <label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
                      I agree to the{" "}
                      <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-border text-foreground hover:bg-accent"
                      onClick={() => {
                        setStep(1)
                        setError(null)
                      }}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isSubmitting ? "Creating…" : "Create Account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              /* Step 3: Confirmed - email verification */
              <div className="mt-8 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-7 w-7 text-primary" aria-hidden />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">Check your email</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  An email verification link has been sent to your email address. Please check your inbox and verify your email to complete registration.
                </p>
                <Link href="/login" className="mt-8 w-full sm:w-auto">
                  <Button className="w-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:min-w-[200px]">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            )}

            {/* Divider */}
            {step === 1 && (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">Or Continue with</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle("/dashboard")}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-5 py-4 text-base font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
