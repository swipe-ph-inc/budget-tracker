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
      className={cn(className)}
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
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
      className={cn(className)}
    >
      <CircleAlert className="h-4 w-4" aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
