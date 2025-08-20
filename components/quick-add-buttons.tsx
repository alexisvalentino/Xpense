"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, Car, ShoppingBag, Utensils, Zap, Plus } from "lucide-react"
import type { Expense } from "@/app/page"

interface QuickAddButtonsProps {
  onQuickAdd: (expense: Omit<Expense, "id">) => void
}

const quickExpenses = [
  {
    icon: Coffee,
    label: "Coffee",
    amount: 5,
    category: "Food & Dining",
    description: "Coffee",
  },
  {
    icon: Utensils,
    label: "Lunch",
    amount: 15,
    category: "Food & Dining",
    description: "Lunch",
  },
  {
    icon: Car,
    label: "Gas",
    amount: 50,
    category: "Transportation",
    description: "Gas",
  },
  {
    icon: ShoppingBag,
    label: "Groceries",
    amount: 80,
    category: "Shopping",
    description: "Groceries",
  },
  {
    icon: Zap,
    label: "Utilities",
    amount: 120,
    category: "Bills & Utilities",
    description: "Utilities",
  },
]

export function QuickAddButtons({ onQuickAdd }: QuickAddButtonsProps) {
  const handleQuickAdd = (quickExpense: (typeof quickExpenses)[0]) => {
    onQuickAdd({
      amount: quickExpense.amount,
      category: quickExpense.category,
      description: quickExpense.description,
      date: new Date().toISOString().split("T")[0],
    })
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5 text-secondary" />
          <span>Quick Add</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickExpenses.map((expense) => (
            <Button
              key={expense.label}
              onClick={() => handleQuickAdd(expense)}
              variant="outline"
              className="glass bg-transparent flex flex-col items-center space-y-2 h-auto py-4 hover:bg-secondary/10"
            >
              <expense.icon className="h-5 w-5 text-secondary" />
              <div className="text-center">
                <div className="text-sm font-medium">{expense.label}</div>
                <div className="text-xs text-muted-foreground">${expense.amount}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
