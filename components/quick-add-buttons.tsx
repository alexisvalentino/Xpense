"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import type { Expense } from "@/lib/db"
import type { QuickAddOption } from "@/lib/db"
import { getQuickAddOptions } from "@/lib/quick-add-utils"
import { QuickAddEditModal } from "./quick-add-edit-modal"

interface QuickAddButtonsProps {
  onQuickAdd: (expense: Omit<Expense, "id">) => void
}

export function QuickAddButtons({ onQuickAdd }: QuickAddButtonsProps) {
  const [options, setOptions] = useState<QuickAddOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      setIsLoading(true)
      const loadedOptions = await getQuickAddOptions()
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
    return (
      <Card className="glass">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
              <span>Quick Add</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center justify-between text-base md:text-lg">
          <div className="flex items-center space-x-2">
            <Plus className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
            <span>Quick Add</span>
          </div>
          <QuickAddEditModal onOptionsChange={handleOptionsChange} />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        {options.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No quick add options configured</p>
            <p className="text-sm">Click the settings icon to add your first option</p>
          </div>
        ) : (
          <>
            {/* Mobile: Horizontal scrollable list */}
            <div className="md:hidden">
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                {options.slice(0, 5).map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => handleQuickAdd(option)}
                    variant="outline"
                    className="glass bg-transparent flex flex-col items-center space-y-2 h-auto py-3 px-4 min-w-[80px] hover:bg-secondary/10 flex-shrink-0"
                  >
                    <div className="h-4 w-4 text-secondary">
                      {/* Icon placeholder - you can map icons here if needed */}
                      <Plus className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">${option.amount}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden md:grid md:grid-cols-5 gap-3">
              {options.slice(0, 5).map((option) => (
                <Button
                  key={option.id}
                  onClick={() => handleQuickAdd(option)}
                  variant="outline"
                  className="glass bg-transparent flex flex-col items-center space-y-2 h-auto py-4 hover:bg-secondary/10 transition-all duration-200 hover:scale-105"
                >
                  <div className="h-5 w-5 text-secondary">
                    {/* Icon placeholder - you can map icons here if needed */}
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">${option.amount}</div>
                  </div>
                </Button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
