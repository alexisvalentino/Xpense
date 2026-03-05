"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet"

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
  { id: "budgets", label: "Budgets", icon: Target, shortLabel: "Budget" },
  { id: "analytics", label: "Analytics", icon: BarChart3, shortLabel: "Stats" },
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
    <div className="hidden md:block fixed left-0 top-0 h-full w-64 glass-sidebar border-r border-border/20 z-40">
      <div className="p-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 rounded-lg bg-black/20 backdrop-blur-sm">
            <img src="/x-logo.svg" alt="Xpense Logo" className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Xpense</h1>
            <p className="text-sm text-muted-foreground">Smart Finance</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-3">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              onClick={() => onTabChange(id as typeof activeTab)}
              variant={activeTab === id ? "default" : "ghost"}
              className={`w-full justify-start h-12 text-base transition-all duration-200 ${activeTab === id
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg scale-105"
                : "hover:bg-secondary/20 hover:scale-102"
                }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {label}
              {activeTab === id && (
                <div className="ml-auto w-2 h-2 bg-primary-foreground rounded-full" />
              )}
            </Button>
          ))}
        </nav>



        {/* Bottom Section */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 glass-strong rounded-xl border border-border/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <User className="h-4 w-4 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Guest User</p>
                <p className="text-xs text-muted-foreground">Free Plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Desktop Top Header
  const DesktopHeader = () => (
    <div className="hidden md:block fixed top-0 left-64 right-0 z-30 glass-strong border-b border-border/30 backdrop-blur-xl">
      <div className="flex items-center justify-center px-4 md:px-6 lg:px-8 py-3 md:py-4 h-16">
        {/* Centered Brand / Title in Header */}
        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-50">
          Dashboard Engine
        </h2>
      </div>
    </div>
  )

  // Mobile Top Header
  const MobileHeader = () => (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5 backdrop-blur-xl bg-background/80">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
            <img src="/x-logo.svg" alt="Xpense Logo" className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-foreground leading-tight">Xpense</h1>
            <p className="text-[10px] text-muted-foreground leading-none">Smart Finance</p>
          </div>
        </div>

        {/* Profile and Mobile Menu */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 glass-strong hover:bg-secondary/20 backdrop-blur-sm"
              >
                <Menu className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Mobile navigation menu for Xpense application</SheetDescription>
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-black/20 backdrop-blur-sm">
                      <img src="/x-logo.svg" alt="Xpense Logo" className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Xpense</h2>
                      <p className="text-sm text-muted-foreground">Smart Finance</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-secondary/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-6 space-y-3">
                  {navigationItems.map(({ id, label, icon: Icon }) => (
                    <Button
                      key={id}
                      onClick={() => handleTabChange(id as typeof activeTab)}
                      variant={activeTab === id ? "default" : "ghost"}
                      className={`w-full justify-start h-12 text-base transition-all duration-200 ${activeTab === id
                        ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                        : "hover:bg-secondary/20"
                        }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {label}
                      {activeTab === id && (
                        <div className="ml-auto w-2 h-2 bg-primary-foreground rounded-full" />
                      )}
                    </Button>
                  ))}
                </nav>

                {/* Bottom Section - User Profile */}
                <div className="p-6 border-t border-border/30">
                  <div className="p-4 glass-strong rounded-xl border border-border/30">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-secondary/20">
                        <User className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">Guest User</p>
                        <p className="text-xs text-muted-foreground">Free Plan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
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
