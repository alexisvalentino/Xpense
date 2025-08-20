"use client"

import { ThemeToggle } from "@/components/theme-toggle"

export function ResponsiveHeader() {
  return (
    <div className="flex items-center justify-between mb-6 md:mb-4">
      <div className="hidden md:block flex-1">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </div>

      <div className="md:hidden ml-auto">
        <ThemeToggle />
      </div>
    </div>
  )
}
