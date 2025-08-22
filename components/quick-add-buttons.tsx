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
    <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center justify-between text-base md:text-lg font-semibold">
          <div className="flex items-center space-x-2">
            <Plus className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
            <span>Quick Add</span>
          </div>
          <QuickAddEditModal onOptionsChange={handleOptionsChange} />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-4">
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
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                {options.slice(0, 5).map((option) => {
                  const IconComponent = getIconComponent(option.icon)
                  return (
                    <Button
                      key={option.id}
                      onClick={() => handleQuickAdd(option)}
                      variant="outline"
                      className="glass-strong bg-card/20 border-border/30 hover:border-secondary/50 flex flex-col items-center space-y-2 h-auto py-4 px-4 min-w-[90px] hover:bg-secondary/10 flex-shrink-0 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-lg"
                    >
                      <div className="h-5 w-5 text-secondary">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-foreground">{option.label}</div>
                        <div className="text-xs text-muted-foreground">${option.amount}</div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden md:grid md:grid-cols-5 gap-4">
              {options.slice(0, 5).map((option) => {
                const IconComponent = getIconComponent(option.icon)
                return (
                  <Button
                    key={option.id}
                    onClick={() => handleQuickAdd(option)}
                    variant="outline"
                    className="glass-strong bg-card/20 border-border/30 hover:border-secondary/50 flex flex-col items-center space-y-3 h-auto py-6 hover:bg-secondary/10 transition-all duration-200 hover:scale-105 rounded-xl shadow-lg hover:shadow-xl backdrop-blur-lg"
                  >
                    <div className="h-6 w-6 text-secondary">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-foreground">{option.label}</div>
                      <div className="text-xs text-muted-foreground">${option.amount}</div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
