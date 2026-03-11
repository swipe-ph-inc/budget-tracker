import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          404 – Page not found
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The link you followed may be broken, expired, or the page may have been moved.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/">
            <Button type="button" className="w-full sm:w-auto">
              Back to home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Go to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

