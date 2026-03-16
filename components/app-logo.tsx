"use client"

import { SITE_LOGO_PATH, SITE_NAME } from "@/lib/site"
import { cn } from "@/lib/utils"

type AppLogoProps = {
  /** When true, uses smaller dimensions (e.g. for collapsed sidebar). */
  collapsed?: boolean
  className?: string
}

const DEFAULT_SIZE = { expanded: 56, collapsed: 40 }

export function AppLogo({ collapsed = false, className }: AppLogoProps) {
  const size = collapsed ? DEFAULT_SIZE.collapsed : DEFAULT_SIZE.expanded
  return (
    <img
      src={SITE_LOGO_PATH}
      alt={SITE_NAME}
      width={size}
      height={size}
      className={cn("h-14 w-auto object-contain", collapsed && "h-10", className)}
    />
  )
}
