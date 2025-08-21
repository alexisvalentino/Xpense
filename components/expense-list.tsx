"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Edit, Calendar, Tag } from "lucide-react"
import type { Expense } from "@/lib/db"
import { getCategoryColor } from "@/lib/category-colors"
import { ExpenseCardSkeleton } from "@/components/ui/skeleton-loaders"

interface ExpenseListProps {
  expenses: Expense[]
  onDelete: (id: string) => void
  onEdit: (expense: Expense) => void
  isLoading?: boolean
}

export function ExpenseList({ expenses, onDelete, onEdit, isLoading = false }: ExpenseListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ExpenseCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div key={expense.id} className="glass rounded-lg overflow-hidden">
          {/* Mobile: Stacked layout, Desktop: Side by side */}
          <div className="p-4 md:p-5">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground text-base md:text-lg truncate">
                  {expense.description}
                </h4>
              </div>
              <div className="ml-3 text-right">
                <span className="text-lg md:text-xl font-bold text-secondary">
                  ${expense.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Details Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: getCategoryColor(expense.category) }} 
                    />
                    <span className="hidden sm:inline">{expense.category}</span>
                    <span className="sm:hidden">{expense.category.split(' ')[0]}</span>
                  </div>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {new Date(expense.date).toLocaleDateString()}
                  </span>
                  <span className="sm:hidden">
                    {new Date(expense.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(expense)}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(expense.id)}
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
