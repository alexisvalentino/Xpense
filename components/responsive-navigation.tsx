"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, TrendingUp, Target, BarChart3, Repeat, Download, X, Wallet } from "lucide-react"

interface NavigationProps {
  activeTab: "overview" | "budgets" | "analytics" | "recurring" | "export"
  onTabChange: (tab: "overview" | "budgets" | "analytics" | "recurring" | "export") => void
}

const navigationItems = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "budgets", label: "Budgets", icon: Target },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "recurring", label: "Recurring", icon: Repeat },
  { id: "export", label: "Export", icon: Download },
] as const

export function ResponsiveNavigation({ activeTab, onTabChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTabChange = (tab: typeof activeTab) => {
    onTabChange(tab)
    setIsOpen(false)
  }

  return (
    <>
      <div className="hidden md:block fixed left-0 top-0 h-full w-64 glass-sidebar border-r border-border/20 z-40">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">ExpenseTracker</h1>
              <p className="text-xs text-muted-foreground">Smart Finance</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                onClick={() => onTabChange(id as typeof activeTab)}
                variant={activeTab === id ? "default" : "ghost"}
                className={`w-full justify-start h-11 ${
                  activeTab === id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-4 w-4 mr-3" />
                {label}
              </Button>
            ))}
          </nav>
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">ExpenseTracker</h1>
              <p className="text-xs text-muted-foreground">Smart Finance</p>
            </div>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="glass bg-transparent">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="glass-modal w-[280px] sm:w-[350px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">ExpenseTracker</h2>
                    <p className="text-xs text-muted-foreground">Smart Finance</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="space-y-2">
                {navigationItems.map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    onClick={() => handleTabChange(id as typeof activeTab)}
                    variant={activeTab === id ? "default" : "ghost"}
                    className={`w-full justify-start h-11 ${
                      activeTab === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {label}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
