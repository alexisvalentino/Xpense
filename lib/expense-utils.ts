import type { Expense } from "@/app/page"
import type { FilterOptions } from "@/components/expense-filters"

export function filterExpenses(expenses: Expense[], filters: FilterOptions): Expense[] {
  return expenses.filter((expense) => {
    // Search filter
    if (filters.search && !expense.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    // Category filter
    if (filters.category && expense.category !== filters.category) {
      return false
    }

    // Date range filter
    if (filters.dateFrom && expense.date < filters.dateFrom) {
      return false
    }
    if (filters.dateTo && expense.date > filters.dateTo) {
      return false
    }

    // Amount range filter
    if (filters.minAmount && expense.amount < Number.parseFloat(filters.minAmount)) {
      return false
    }
    if (filters.maxAmount && expense.amount > Number.parseFloat(filters.maxAmount)) {
      return false
    }

    return true
  })
}

export function hasActiveFilters(filters: FilterOptions): boolean {
  return !!(
    filters.search ||
    filters.category ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.minAmount ||
    filters.maxAmount
  )
}

export function getFilteredTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0)
}

export function sortExpenses(
  expenses: Expense[],
  sortBy: "date" | "amount" | "category" = "date",
  order: "asc" | "desc" = "desc",
): Expense[] {
  return [...expenses].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case "amount":
        comparison = a.amount - b.amount
        break
      case "category":
        comparison = a.category.localeCompare(b.category)
        break
    }

    return order === "desc" ? -comparison : comparison
  })
}
