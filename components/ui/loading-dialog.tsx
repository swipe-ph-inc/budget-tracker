"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export interface LoadingDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  /** Shown next to the spinner. */
  title?: string
  /** Optional supporting line (e.g. what is loading). */
  description?: string
  /**
   * When true, overlay click and Escape do not close the dialog.
   * Parent can still set `open` to false. Default true for blocking loaders.
   */
  preventDismiss?: boolean
  className?: string
  contentClassName?: string
  /** Override spinner size. */
  spinnerClassName?: string
  /** Full custom body; when set, title/description/spinner layout is not rendered. */
  children?: React.ReactNode
}

/**
 * Modal dialog centered on screen with a Spinner. Uses shadcn Dialog + Spinner.
 * Hides the default close button; use `preventDismiss={false}` to allow closing.
 */
export function LoadingDialog({
  open,
  onOpenChange,
  title = "Loading",
  description,
  preventDismiss = true,
  className,
  contentClassName,
  spinnerClassName,
  children,
}: LoadingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "z-[100] w-full max-w-[min(100%-2rem,24rem)] gap-6 border bg-background p-6 sm:max-w-sm",
          "[&>button]:hidden",
          contentClassName,
        )}
        onPointerDownOutside={(e) => {
          if (preventDismiss) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (preventDismiss) e.preventDefault()
        }}
        aria-busy={open}
      >
        {children ? (
          <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            {children}
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-4 text-center",
              className,
            )}
          >
            <Spinner className={cn("size-8 text-muted-foreground", spinnerClassName)} />
            <DialogHeader className="space-y-2 sm:text-center">
              <DialogTitle className="text-base font-medium">{title}</DialogTitle>
              {description ? (
                <DialogDescription className="text-xs sm:text-sm">
                  {description}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  Please wait.
                </DialogDescription>
              )}
            </DialogHeader>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
