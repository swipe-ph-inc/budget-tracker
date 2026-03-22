"use client"

import * as React from "react"
import { CheckCircle2, CircleAlert } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export interface StatusMessageProps {
  /** Message body (required). */
  message: string
  /** Optional short title above the message. */
  title?: string
  /** Additional class name for the root element. */
  className?: string
}

const statusAlertLayout =
  "flex w-full min-w-0 max-w-full flex-row items-start gap-3 p-3 sm:p-4 [&>svg]:static [&>svg]:shrink-0 [&>svg]:translate-y-0 [&>svg+div]:translate-y-0 [&>svg~*]:pl-0"

const statusTextWrap = "min-w-0 flex-1 space-y-1"

const statusDescription =
  "break-words [overflow-wrap:anywhere] text-xs leading-snug sm:text-sm sm:leading-relaxed"

/**
 * Reusable success indicator. Use after a successful mutation or action.
 */
export function SuccessMessage({
  message,
  title = "Success",
  className,
}: StatusMessageProps) {
  return (
    <Alert
      variant="success"
      role="status"
      aria-live="polite"
      className={cn(statusAlertLayout, className)}
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden />
      <div className={statusTextWrap}>
        <AlertTitle className="text-sm font-medium sm:text-base">{title}</AlertTitle>
        <AlertDescription className={statusDescription}>{message}</AlertDescription>
      </div>
    </Alert>
  )
}

/**
 * Reusable error indicator. Use when an action fails or validation fails.
 */
export function ErrorMessage({
  message,
  title = "Error",
  className,
}: StatusMessageProps) {
  return (
    <Alert
      variant="destructive"
      role="alert"
      aria-live="assertive"
      className={cn(statusAlertLayout, className)}
    >
      <CircleAlert className="mt-0.5 h-4 w-4" aria-hidden />
      <div className={statusTextWrap}>
        <AlertTitle className="text-sm font-medium sm:text-base">{title}</AlertTitle>
        <AlertDescription className={statusDescription}>{message}</AlertDescription>
      </div>
    </Alert>
  )
}
