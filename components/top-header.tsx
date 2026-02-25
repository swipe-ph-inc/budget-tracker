"use client"

import { Search, MessageSquare, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TopHeaderProps {
  title: string
}

export function TopHeader({ title }: TopHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6 lg:py-4">
      {/* Title - with left padding on mobile for hamburger */}
      <h1 className="pl-12 text-xl font-bold text-foreground lg:pl-0 lg:text-2xl">{title}</h1>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Search Bar - hidden on mobile, shown on md+ */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search placeholder"
            className="h-10 w-48 rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring lg:w-64"
          />
        </div>

        {/* Action Icons */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:h-10 lg:w-10">
          <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5" />
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:h-10 lg:w-10">
          <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary lg:right-2 lg:top-2" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 lg:gap-3">
          <span className="hidden text-sm font-medium text-foreground sm:block">Andrew Forbist</span>
          <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" alt="Andrew Forbist" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">AF</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
