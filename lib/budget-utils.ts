import type { Expense, Budget } from "@/lib/db"

export interface BudgetProgress {
  budget: Budget
  spent: number
  remaining: number
  percentage: number
  status: "safe" | "warning" | "danger" | "exceeded"
}

export function calculateBudgetProgress(
  budget: Budget,
  expenses: Expense[],
  currentDate: Date = new Date(),
): BudgetProgress {
  const periodExpenses = getExpensesForPeriod(expenses, budget.period, currentDate).filter(
    (expense) => expense.category === budget.category,
  )

  const spent = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const remaining = Math.max(0, budget.limit - spent)
  const percentage = Math.min(100, (spent / budget.limit) * 100)

  let status: BudgetProgress["status"] = "safe"
  if (percentage >= 100) {
    status = "exceeded"
  } else if (percentage >= 90) {
    status = "danger"
  } else if (percentage >= 75) {
    status = "warning"
  }

  return {
    budget,
    spent,
    remaining,
    percentage,
    status,
  }
}

export function getExpensesForPeriod(
  expenses: Expense[],
  period: Budget["period"],
  currentDate: Date = new Date(),
): Expense[] {
  const now = new Date(currentDate)
  let startDate: Date

  switch (period) {
    case "weekly":
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
      break
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1) // Start of month
      break
    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1) // Start of year
      break
  }

  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return expenseDate >= startDate && expenseDate <= now
  })
}

export function getBudgetStatusColor(status: BudgetProgress["status"]): string {
  switch (status) {
    case "safe":
      return "#10b981" // green
    case "warning":
      return "#f59e0b" // amber
    case "danger":
      return "#ef4444" // red
    case "exceeded":
      return "#dc2626" // dark red
  }
}

export function formatPeriod(period: Budget["period"]): string {
  switch (period) {
    case "weekly":
      return "This Week"
    case "monthly":
      return "This Month"
    case "yearly":
      return "This Year"
  }
}
