"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, TrendingUp, Calendar, Undo2 } from "lucide-react"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseChart } from "@/components/expense-chart"
import { ExpenseList } from "@/components/expense-list"
import { ExpenseFilters, type FilterOptions } from "@/components/expense-filters"
import { BudgetManagement } from "@/components/budget-management"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { QuickAddButtons } from "@/components/quick-add-buttons"
import { RecurringExpenses } from "@/components/recurring-expenses"
import { DataExport } from "@/components/data-export"
import { ResponsiveNavigation } from "@/components/responsive-navigation"
import { ResponsiveHeader } from "@/components/responsive-header"
import { expenseDB, type Expense, type Budget, type RecurringExpense } from "@/lib/db"
import { filterExpenses, hasActiveFilters, getFilteredTotal, sortExpenses } from "@/lib/expense-utils"

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [undoExpense, setUndoExpense] = useState<Expense | null>(null)
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "budgets" | "analytics" | "recurring" | "export">("overview")

  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  })

  const filteredExpenses = useMemo(() => {
    const filtered = filterExpenses(expenses, filters)
    return sortExpenses(filtered, "date", "desc")
  }, [expenses, filters])

  const filteredTotal = useMemo(() => {
    return getFilteredTotal(filteredExpenses)
  }, [filteredExpenses])

  const hasFilters = useMemo(() => {
    return hasActiveFilters(filters)
  }, [filters])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedExpenses, savedBudgets, savedRecurring] = await Promise.all([
          expenseDB.getAllExpenses(),
          expenseDB.getAllBudgets(),
          expenseDB.getAllRecurringExpenses(),
        ])

        setExpenses(savedExpenses)
        setBudgets(savedBudgets)
        setRecurringExpenses(savedRecurring)
      } catch (error) {
        console.error("Failed to load data:", error)
        // Fallback to localStorage for migration
        const localStorageExpenses = localStorage.getItem("expenses")
        if (localStorageExpenses) {
          const parsedExpenses = JSON.parse(localStorageExpenses)
          setExpenses(parsedExpenses)
          // Migrate to IndexedDB
          for (const expense of parsedExpenses) {
            await expenseDB.addExpense(expense)
          }
          localStorage.removeItem("expenses")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const addExpense = async (expense: Omit<Expense, "id">) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    }

    try {
      await expenseDB.addExpense(newExpense)
      setExpenses((prev) => [...prev, newExpense])
      setShowForm(false)
    } catch (error) {
      console.error("Failed to add expense:", error)
    }
  }

  const editExpense = async (expense: Omit<Expense, "id">) => {
    if (!editingExpense) return

    const updatedExpense = {
      ...expense,
      id: editingExpense.id,
    }

    try {
      await expenseDB.updateExpense(updatedExpense)
      setExpenses((prev) => prev.map((exp) => (exp.id === editingExpense.id ? updatedExpense : exp)))
      setShowForm(false)
      setEditingExpense(null)
    } catch (error) {
      console.error("Failed to update expense:", error)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const deleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find((exp) => exp.id === id)
    if (!expenseToDelete) return

    try {
      await expenseDB.deleteExpense(id)
      setExpenses((prev) => prev.filter((expense) => expense.id !== id))

      // Set up undo functionality
      setUndoExpense(expenseToDelete)

      // Clear previous timeout if exists
      if (undoTimeout) {
        clearTimeout(undoTimeout)
      }

      // Set new timeout to clear undo option after 5 seconds
      const timeout = setTimeout(() => {
        setUndoExpense(null)
      }, 5000)

      setUndoTimeout(timeout)
    } catch (error) {
      console.error("Failed to delete expense:", error)
    }
  }

  const undoDelete = async () => {
    if (!undoExpense) return

    try {
      await expenseDB.addExpense(undoExpense)
      setExpenses((prev) => [...prev, undoExpense])
      setUndoExpense(null)

      if (undoTimeout) {
        clearTimeout(undoTimeout)
        setUndoTimeout(null)
      }
    } catch (error) {
      console.error("Failed to undo delete:", error)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
    })
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto"></div>
          <p className="text-muted-foreground">Loading your expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ResponsiveNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="md:ml-64">
        <div className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6 max-w-7xl">
          <ResponsiveHeader />

          {activeTab === "budgets" ? (
            <BudgetManagement expenses={expenses} />
          ) : activeTab === "analytics" ? (
            <AnalyticsDashboard expenses={expenses} />
          ) : activeTab === "recurring" ? (
            <RecurringExpenses onAddExpense={addExpense} />
          ) : activeTab === "export" ? (
            <DataExport expenses={expenses} budgets={budgets} recurring={recurringExpenses} />
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* Undo Banner */}
              {undoExpense && (
                <Card className="glass-strong border-amber-500/50">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <Undo2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span className="text-sm truncate">Deleted "{undoExpense.description}"</span>
                      </div>
                      <Button
                        onClick={undoDelete}
                        variant="outline"
                        size="sm"
                        className="text-amber-500 border-amber-500/50 hover:bg-amber-500/10 bg-transparent flex-shrink-0"
                      >
                        Undo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Total Expenses Card */}
                <Card className="glass-strong lg:col-span-1">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="p-2 md:p-3 rounded-full bg-secondary/20">
                        <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-secondary" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {hasFilters ? "Filtered" : "Total"} Expenses
                        </p>
                        <p className="text-2xl md:text-4xl font-bold text-foreground">
                          ${(hasFilters ? filteredTotal : totalExpenses).toLocaleString()}
                        </p>
                        {hasFilters && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {filteredExpenses.length} of {expenses.length} expenses
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {filteredExpenses.length > 0 && (
                  <Card className="glass lg:col-span-2">
                    <CardHeader className="pb-2 md:pb-4">
                      <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                        <span>{hasFilters ? "Filtered" : ""} Expense Breakdown</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 md:p-6">
                      <ExpenseChart expenses={filteredExpenses} />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Add Buttons */}
              <QuickAddButtons onQuickAdd={addExpense} />

              {expenses.length > 0 && (
                <div className="w-full">
                  <ExpenseFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClearFilters={clearFilters}
                    hasActiveFilters={hasFilters}
                  />
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 md:px-8 py-2 md:py-3 rounded-full w-full sm:w-auto"
                  size="lg"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Add Expense
                </Button>
              </div>

              {/* Recent/Filtered Expenses */}
              {filteredExpenses.length > 0 && (
                <Card className="glass">
                  <CardHeader className="pb-2 md:pb-4">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                      <span>{hasFilters ? "Filtered" : "Recent"} Expenses</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 md:p-6">
                    <ExpenseList
                      expenses={hasFilters ? filteredExpenses : filteredExpenses.slice(0, 10)}
                      onDelete={deleteExpense}
                      onEdit={handleEdit}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {expenses.length === 0 && (
                <Card className="glass">
                  <CardContent className="p-8 md:p-12 text-center">
                    <div className="space-y-4">
                      <div className="p-3 md:p-4 rounded-full bg-muted/20 w-fit mx-auto">
                        <DollarSign className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-foreground">No expenses yet</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Start tracking your expenses by adding your first entry
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Results State */}
              {expenses.length > 0 && filteredExpenses.length === 0 && hasFilters && (
                <Card className="glass">
                  <CardContent className="p-8 md:p-12 text-center">
                    <div className="space-y-4">
                      <div className="p-3 md:p-4 rounded-full bg-muted/20 w-fit mx-auto">
                        <Calendar className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-foreground">No matching expenses</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center p-4 z-50">
              <Card className="glass-modal w-full max-w-md mx-4">
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="text-base md:text-lg">
                    {editingExpense ? "Edit Expense" : "Add New Expense"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <ExpenseForm
                    onSubmit={editingExpense ? editExpense : addExpense}
                    onCancel={handleFormCancel}
                    editExpense={editingExpense || undefined}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
