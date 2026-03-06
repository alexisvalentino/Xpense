"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Coffee, Utensils, Car, ShoppingBag, Zap, Home, Heart, Gamepad2, BookOpen, Plane, Train, Bus, Bike, Wifi, Phone, Tv, Music, Camera, Gift, Star } from "lucide-react"
import { QuickAddSkeleton } from "@/components/ui/skeleton-loaders"
import type { Expense } from "@/lib/db"
import type { QuickAddOption } from "@/lib/db"
import { getQuickAddOptionsWithSmartDefaults } from "@/lib/quick-add-utils"
import { QuickAddEditModal } from "./quick-add-edit-modal"

interface QuickAddButtonsProps {
  onQuickAdd: (expense: Omit<Expense, "id">) => void
}

export function QuickAddButtons({ onQuickAdd }: QuickAddButtonsProps) {
  const [options, setOptions] = useState<QuickAddOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Icon mapping for quick add options
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      Coffee,
      Utensils,
      Car,
      ShoppingBag,
      Zap,
      Home,
      Heart,
      Gamepad2,
      BookOpen,
      Plane,
      Train,
      Bus,
      Bike,
      Wifi,
      Phone,
      Tv,
      Music,
      Camera,
      Gift,
      Star,
    }
    return iconMap[iconName] || Plus
  }

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      setIsLoading(true)
      const loadedOptions = await getQuickAddOptionsWithSmartDefaults()
      setOptions(loadedOptions)
    } catch (error) {
      console.error("Error loading quick add options:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAdd = (option: QuickAddOption) => {
    onQuickAdd({
      amount: option.amount,
      category: option.category,
      description: option.description,
      date: new Date().toISOString().split("T")[0],
    })
  }

  const handleOptionsChange = () => {
    loadOptions()
  }

  if (isLoading) {
    return <QuickAddSkeleton />
  }

  return (
    <Card className="glass-strong bg-card/20 md:bg-card/20 border-white/10 md:border-white/20 shadow-none md:shadow-xl backdrop-blur-xl border-none md:border-solid relative overflow-hidden group">
      {/* Top Glow Highlight */}
      <div
        className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
        style={{
          backgroundColor: "hsl(var(--secondary))",
          boxShadow: `0 0 20px 2px hsl(var(--secondary))`
        }}
      />
      <CardHeader className="pb-2 md:pb-4 px-0 md:px-6">
        <CardTitle className="flex items-center justify-between text-sm md:text-lg font-bold uppercase tracking-wider md:tracking-normal">
          <div className="flex items-center space-x-2 opacity-60 md:opacity-100">
            <Plus className="h-4 w-4 text-secondary md:h-5 md:w-5" />
            <span className="text-[10px] md:text-base">Quick Actions</span>
          </div>
          <QuickAddEditModal onOptionsChange={handleOptionsChange} />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 md:p-4">
        {options.length === 0 ? (
          <div className="text-center py-8">
            <div className="space-y-4">
              <Button
                onClick={() => {
                  // Trigger the edit modal to open
                  const settingsButton = document.querySelector('[data-settings-trigger]') as HTMLButtonElement
                  if (settingsButton) {
                    settingsButton.click()
                  }
                }}
                className="h-16 w-16 mx-auto rounded-full glass-strong bg-card/20 border-border/30 hover:border-secondary/50 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-lg"
              >
                <Plus className="h-8 w-8 text-secondary" />
              </Button>
              <div className="space-y-1">
                <div className="text-muted-foreground">
                  <p className="text-sm font-medium">No quick add options configured</p>
                  <p className="text-xs">Click the plus icon to create your first quick add option</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: Horizontal scrollable list */}
            <div className="md:hidden">
              <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 snap-x">
                {options.slice(0, 5).map((option) => {
                  const IconComponent = getIconComponent(option.icon)
                  return (
                    <Button
                      key={option.id}
                      onClick={() => handleQuickAdd(option)}
                      variant="outline"
                      className="glass-strong bg-card/10 border-border/20 hover:border-secondary/40 flex items-center space-x-2 h-8 py-0 px-2.5 min-w-[85px] hover:bg-secondary/10 flex-shrink-0 rounded-full transition-all duration-200 active:scale-95 shadow-sm backdrop-blur-md snap-center"
                    >
                      <IconComponent className="h-3 w-3 text-secondary shrink-0" />
                      <div className="text-left min-w-0 flex-1 flex items-baseline gap-1">
                        <span className="text-[9px] font-bold text-foreground truncate">{option.label}</span>
                        <span className="text-[8px] font-black text-secondary/70 shrink-0">${option.amount}</span>
                      </div>
                    </Button>
                  )
                })}
                {/* Add New Button for Mobile - if not full */}
                {options.length < 5 && (
                  <Button
                    onClick={() => {
                      const settingsButton = document.querySelector('[data-settings-trigger]') as HTMLButtonElement
                      if (settingsButton) settingsButton.click()
                    }}
                    variant="outline"
                    className="glass-strong bg-card/5 border-dashed border-border/30 hover:border-secondary/40 flex items-center space-x-2 h-8 py-0 px-2.5 min-w-[70px] hover:bg-secondary/5 flex-shrink-0 rounded-full transition-all duration-200 active:scale-95 border snap-center"
                  >
                    <Plus className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                    <span className="text-[9px] font-bold text-muted-foreground truncate">New</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop: Grid layout - Refined for Side-by-Side row */}
            <div className="hidden md:grid md:grid-cols-3 gap-3">
              {options.slice(0, 6).map((option) => {
                const IconComponent = getIconComponent(option.icon)
                return (
                  <Button
                    key={option.id}
                    onClick={() => handleQuickAdd(option)}
                    variant="outline"
                    className="group glass-strong bg-card/10 border-border/20 hover:border-secondary/50 flex flex-col items-center justify-center space-y-2 h-24 py-4 px-2 hover:bg-secondary/5 transition-all duration-300 hover:scale-[1.02] rounded-2xl shadow-sm hover:shadow-secondary/5 backdrop-blur-md relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-8 w-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="text-center relative z-10">
                      <div className="text-[10px] font-black text-foreground/90 uppercase tracking-wider truncate w-full px-1">{option.label}</div>
                      <div className="text-[10px] font-bold text-secondary/70">${option.amount}</div>
                    </div>
                  </Button>
                )
              })}
              {/* Add New Button for Desktop - if not full */}
              {options.length < 6 && (
                <Button
                  onClick={() => {
                    const settingsButton = document.querySelector('[data-settings-trigger]') as HTMLButtonElement
                    if (settingsButton) settingsButton.click()
                  }}
                  variant="outline"
                  className="glass-strong bg-card/5 border-dashed border-border/30 hover:border-secondary/40 flex flex-col items-center justify-center space-y-2 h-24 py-4 px-2 hover:bg-secondary/5 transition-all duration-300 hover:scale-[1.02] rounded-2xl border-2"
                >
                  <div className="h-8 w-8 rounded-xl bg-muted/5 flex items-center justify-center text-muted-foreground/40 group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider">Configure</div>
                  </div>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
