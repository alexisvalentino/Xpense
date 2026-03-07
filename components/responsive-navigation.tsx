"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import {
  Menu,
  TrendingUp,
  Target,
  BarChart3,
  Repeat,
  Download,
  X,
  Settings,
  User,
  Bell
} from "lucide-react"

interface AppNotification {
  id: string
  title: string
  message: string
  severity: "info" | "warning" | "danger"
}

interface NavigationProps {
  activeTab: "overview" | "budgets" | "analytics" | "recurring" | "export"
  onTabChange: (tab: "overview" | "budgets" | "analytics" | "recurring" | "export") => void
}

const navigationItems = [
  { id: "overview", label: "Overview", icon: TrendingUp, shortLabel: "Home" },
  { id: "analytics", label: "Analytics", icon: BarChart3, shortLabel: "Stats" },
  { id: "budgets", label: "Budgets", icon: Target, shortLabel: "Budget" },
  { id: "recurring", label: "Recurring", icon: Repeat, shortLabel: "Recurring" },
  { id: "export", label: "Export", icon: Download, shortLabel: "Export" },
] as const

export function ResponsiveNavigation({ activeTab, onTabChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  const handleTabChange = (tab: typeof activeTab) => {
    onTabChange(tab)
    setIsOpen(false)
  }

  // Desktop Sidebar Navigation
  const DesktopNavigation = () => (
    <div className="hidden md:block fixed left-0 top-0 h-full w-[240px] bg-background/50 border-r border-border/10 z-40">
      <div className="flex flex-col h-full py-8 px-4">
        <div className="flex items-center gap-3 px-3 mb-10">
          <div className="p-1.5 rounded-xl bg-primary/5 border border-white/10 shadow-sm">
            <img src="/x-logo.svg" alt="Xpense Logo" className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-extrabold tracking-[0.2em] text-foreground uppercase pt-0.5">Xpense</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              onClick={() => onTabChange(id as typeof activeTab)}
              variant="ghost"
              className={`w-full justify-start h-11 px-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-300 rounded-xl relative group ${activeTab === id
                ? "bg-secondary/10 text-secondary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              <Icon className={cn(
                "h-4 w-4 mr-3 transition-transform duration-300",
                activeTab === id ? "scale-110" : "group-hover:scale-110"
              )} />
              {label}
              {activeTab === id && (
                <div className="absolute right-3 w-1 h-4 bg-secondary rounded-full shadow-[0_0_8px_rgba(var(--secondary),0.4)]" />
              )}
            </Button>
          ))}
        </nav>

        {/* Bottom Section - Minimalist User */}
        <div className="pt-6 border-t border-border/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-black text-xs">
              G
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-foreground truncate uppercase tracking-tighter">Guest</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Standard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Desktop Top Header - Simplified (Only for Spacing/Context)
  const DesktopHeader = () => (
    <div className="hidden md:block fixed top-0 left-[240px] right-0 z-30 h-4" />
  )

  // Mobile Top Header
  const MobileHeader = () => (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 border-b border-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-primary/5 border border-white/10 shadow-sm">
            <img src="/x-logo.svg" alt="Xpense Logo" className="h-5 w-5" />
          </div>
          <h1 className="text-sm font-extrabold text-foreground uppercase tracking-[0.2em] pt-0.5">Xpense</h1>
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-secondary/10 rounded-xl"
            >
              <Menu className="h-4 w-4 text-muted-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-background/95 border-r border-white/5 backdrop-blur-2xl">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Mobile navigation menu for Xpense application</SheetDescription>
            <div className="h-full flex flex-col pt-8 pb-6">
              <div className="px-6 mb-10 flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-primary/5 border border-white/10 shadow-sm">
                  <img src="/x-logo.svg" alt="Xpense Logo" className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-extrabold tracking-[0.2em] text-foreground uppercase pt-0.5">Xpense</h2>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 px-4 space-y-1">
                {navigationItems.map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    onClick={() => handleTabChange(id as typeof activeTab)}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-12 px-4 text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl relative group",
                      activeTab === id
                        ? "bg-secondary/10 text-secondary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 mr-4 transition-transform duration-300",
                      activeTab === id ? "scale-110" : "group-hover:scale-110"
                    )} />
                    {label}
                    {activeTab === id && (
                      <div className="absolute right-4 w-1 h-5 bg-secondary rounded-full shadow-[0_0_8px_rgba(var(--secondary),0.4)]" />
                    )}
                  </Button>
                ))}
              </nav>

              {/* Bottom Section - User Profile */}
              <div className="px-4 mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="h-9 w-9 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-black text-xs">
                    G
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-foreground truncate uppercase tracking-tighter">Guest</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Standard Plan</span>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )




  return (
    <>
      <DesktopNavigation />
      <DesktopHeader />
      <MobileHeader />
    </>
  )
}
