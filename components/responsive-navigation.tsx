"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import { 
  Menu, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Repeat, 
  Download, 
  X, 
  Wallet,
  Settings,
  User,
  Search,
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
  searchQuery?: string
  onSearchChange?: (q: string) => void
  notifications?: AppNotification[]
}

const navigationItems = [
  { id: "overview", label: "Overview", icon: TrendingUp, shortLabel: "Home" },
  { id: "budgets", label: "Budgets", icon: Target, shortLabel: "Budget" },
  { id: "analytics", label: "Analytics", icon: BarChart3, shortLabel: "Stats" },
  { id: "recurring", label: "Recurring", icon: Repeat, shortLabel: "Recurring" },
  { id: "export", label: "Export", icon: Download, shortLabel: "Export" },
] as const

export function ResponsiveNavigation({ activeTab, onTabChange, searchQuery = "", onSearchChange, notifications = [] }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

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
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Wallet className="h-7 w-7 text-primary" />
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
              className={`w-full justify-start h-12 text-base transition-all duration-200 ${
                activeTab === id 
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
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full pl-10 pr-4 py-2 bg-card/50 border border-border/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-10 p-0 glass-strong hover:bg-secondary/20 relative"
            onClick={() => setIsNotifOpen(true)}
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1rem] h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>
          <Sheet open={isNotifOpen} onOpenChange={setIsNotifOpen}>
            <SheetContent side="right" className="glass-modal w-[360px] p-0">
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[80vh]">
                {notifications.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-lg glass ${n.severity === 'danger' ? 'border border-red-500/30' : n.severity === 'warning' ? 'border border-amber-500/30' : 'border border-border/30'}`}>
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Profile Settings */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-10 p-0 glass-strong hover:bg-secondary/20"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  // Mobile Top Header
  const MobileHeader = () => (
    <div className="md:hidden sticky top-0 z-50 glass-strong border-b border-border/30 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Xpense</h1>
            <p className="text-xs text-muted-foreground">Smart Finance</p>
          </div>
        </div>

        {/* Search, Notifications, Profile and Mobile Menu */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 glass-strong hover:bg-secondary/20"
            onClick={() => setIsMobileSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 glass-strong hover:bg-secondary/20 relative"
            onClick={() => setIsNotifOpen(true)}
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1rem] h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>
          <Sheet open={isNotifOpen} onOpenChange={setIsNotifOpen}>
            <SheetContent side="right" className="glass-modal w-[360px] p-0">
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[70vh]">
                {notifications.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-lg glass ${n.severity === 'danger' ? 'border border-red-500/30' : n.severity === 'warning' ? 'border border-amber-500/30' : 'border border-border/30'}`}>
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Profile Settings */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 glass-strong hover:bg-secondary/20"
          >
            <User className="h-4 w-4" />
          </Button>
          
          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 glass-strong hover:bg-secondary/20"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="glass-modal w-[300px] sm:w-[350px] p-0">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
                      <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Xpense</h2>
                      <p className="text-sm text-muted-foreground">Smart Finance</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(false)} 
                    className="h-8 w-8 p-0 hover:bg-secondary/20"
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
                      className={`w-full justify-start h-12 text-base transition-all duration-200 ${
                        activeTab === id 
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
      {/* Mobile search overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-x-0 top-full z-50 p-3 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder="Search expenses..."
              className="w-full pl-10 pr-10 py-2 bg-card/50 border border-border/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setIsMobileSearchOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
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
