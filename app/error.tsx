"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log to your own monitoring here instead of exposing details to users
    // console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
          Something went wrong
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          We hit an unexpected error
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page could not be loaded right now. Your data is safe. You can try again or go back to your dashboard.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto"
          >
            Try again
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Back to dashboard
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">
          If this keeps happening, please contact support with reference ID{" "}
          <span className="font-mono text-xs">
            {error.digest ?? "N/A"}
          </span>
          .
        </p>
      </div>
    </div>
  )
}

