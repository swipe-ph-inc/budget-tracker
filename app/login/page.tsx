"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/lib/sign-in-google"
import { login } from "./action"

function LoginPageContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/dashboard"
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter()
  
  return (
    <div className="flex min-h-screen">
      {/* Left - Branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 lg:flex">
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/clairo-logo.svg"
              alt="Budget Partner"
              className="h-9 w-auto object-contain"
              width={100}
              height={36}
            />
          </Link>
        </div>

        <div className="relative z-10">
          <h1 className="text-balance text-4xl font-bold leading-tight text-primary-foreground xl:text-5xl">
            Take control of your finances
          </h1>
          <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-primary-foreground/80">
            Track spending, manage investments, and reach your savings goals with powerful analytics and insights.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-2">
            {["AF", "SJ", "MK", "TG"].map((initials, i) => (
              <div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-primary-foreground/20 text-xs font-semibold text-primary-foreground"
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-sm text-primary-foreground/80">
            <span className="font-semibold text-primary-foreground">50,000+</span> users trust Budget Partner
          </p>
        </div>

        {/* Background decoration */}
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-primary-foreground/5" />
        <div className="absolute -top-10 right-20 h-40 w-40 rounded-full bg-primary-foreground/5" />
        <div className="absolute bottom-40 left-10 h-24 w-24 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right - Login form */}
      <div className="flex w-full flex-col lg:w-1/2">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/clairo-logo.svg"
              alt="Budget Partner"
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
                {"Don't have an account? "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Sign Up
                </Link>
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Welcome back</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your credentials to access your account
              </p>
            </div>

            <form className="mt-8 flex flex-col gap-5" onSubmit={async (e) => {
              e.preventDefault()
              setError(undefined)

              if(!email || !password){
                setError("Email and password are required")
              }

              setIsSubmitting(true)
              const formData = new FormData()
              formData.set("email", email)
              formData.set("password", password)
              formData.set("next", next)
              formData.set("rememberMe", rememberMe ? "1" : "0")

              const result = await login(formData)
              setIsSubmitting(false)

              if(!result.success){
                setError(result.error ?? undefined)
                return
              }

              if(result.message){
                setError(undefined)
                router.push(next)
              }
            }}>
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
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
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground">
                  Keep me signed in for 30 days
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? "Signing in…" : "Sign In"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">Or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Social login */}
            <div>
              <button
                type="button"
                onClick={() => signInWithGoogle(next)}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-5 py-4 text-base font-medium text-foreground transition-colors hover:bg-accent"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
