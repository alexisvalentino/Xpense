"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Edit } from "lucide-react"
import type { Expense } from "@/app/page"
import { getCategoryColor } from "@/lib/category-colors"

interface ExpenseListProps {
  expenses: Expense[]
  onDelete: (id: string) => void
  onEdit: (expense: Expense) => void
}

export function ExpenseList({ expenses, onDelete, onEdit }: ExpenseListProps) {
  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div key={expense.id} className="flex items-center justify-between p-3 glass rounded-lg">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">{expense.description}</h4>
              <span className="text-lg font-bold text-secondary">${expense.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(expense.category) }} />
                <span>{expense.category}</span>
              </div>
              <span>•</span>
              <span>{new Date(expense.date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(expense)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(expense.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
