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
        <div key={expense.id} className="glass rounded-xl overflow-hidden border-white/5 shadow-sm transition-all hover:bg-card/30">
          {/* Mobile: Stacked layout, Desktop: Side by side */}
          <div className="p-3 md:p-4">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm md:text-base truncate">
                  {expense.description}
                </h4>
              </div>
              <div className="ml-3 text-right">
                <span className="text-base md:text-lg font-black text-secondary">
                  ${expense.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Details Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-[10px] md:text-xs text-muted-foreground/70">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getCategoryColor(expense.category) }}
                  />
                  <span>{expense.category}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  <span>
                    {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(expense)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(expense.id)}
                  className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
