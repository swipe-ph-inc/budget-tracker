import Link from "next/link"
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-card">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/5" />
        <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-accent/50" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left content */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-accent-foreground">Trusted by 50,000+ users worldwide</span>
            </div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Smart Financial Management Made Simple
            </h1>
            <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Take full control of your finances with real-time analytics, seamless payments, and intelligent insights. Track expenses, grow savings, and invest wisely -- all in one platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full border-border text-base font-semibold text-foreground sm:w-auto">
                  See How It Works
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-accent text-xs font-semibold text-accent-foreground">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="h-4 w-4 fill-warning text-warning" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">4.9/5 from 2,000+ reviews</p>
              </div>
            </div>
          </div>

          {/* Right side - Dashboard preview */}
          <div className="relative">
            <div className="relative rounded-2xl border border-border bg-background p-3 shadow-2xl shadow-primary/10 sm:p-4">
              {/* Mock dashboard */}
              <div className="rounded-xl bg-card p-4 sm:p-5">
                {/* Mini stat cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="rounded-lg border border-border bg-background p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
                        <TrendingUp className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[10px] text-muted-foreground sm:text-xs">Income</span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-foreground sm:text-base">$78,000</p>
                    <span className="text-[10px] font-medium text-primary">+178%</span>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
                        <Shield className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[10px] text-muted-foreground sm:text-xs">Expense</span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-foreground sm:text-base">$43,000</p>
                    <span className="text-[10px] font-medium text-warning">-178%</span>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
                        <Zap className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[10px] text-muted-foreground sm:text-xs">Savings</span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-foreground sm:text-base">$56,000</p>
                    <span className="text-[10px] font-medium text-primary">+124%</span>
                  </div>
                </div>
                {/* Mini chart mockup */}
                <div className="mt-4 rounded-lg border border-border bg-background p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground sm:text-sm">Cashflow</p>
                    <span className="text-[10px] text-muted-foreground sm:text-xs">This Year</span>
                  </div>
                  <div className="mt-3 flex items-end gap-1.5 sm:gap-2">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col gap-0.5">
                        <div className="rounded-sm bg-primary/80" style={{ height: `${h * 0.6}px` }} />
                        <div className="rounded-sm bg-primary/25" style={{ height: `${(100 - h) * 0.35}px` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">+$2,450</p>
                  <p className="text-[10px] text-muted-foreground">This month savings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
