import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center sm:px-12 sm:py-20">
          <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to take control of your finances?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
            Start for free and take full control of your money — track spending, set saving goals, and manage payments all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full bg-card text-base font-semibold text-foreground hover:bg-card/90 sm:w-auto">
                Start For Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline" className="w-full border-primary-foreground/30 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
