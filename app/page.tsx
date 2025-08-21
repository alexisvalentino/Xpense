"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, TrendingUp, Calendar, Undo2 } from "lucide-react"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseChart } from "@/components/expense-chart"
import { ExpenseList } from "@/components/expense-list"
import type { FilterOptions } from "@/components/expense-filters"
import { BudgetManagement } from "@/components/budget-management"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { QuickAddButtons } from "@/components/quick-add-buttons"
import { RecurringExpenses } from "@/components/recurring-expenses"
import { DataExport } from "@/components/data-export"
import { ResponsiveNavigation } from "@/components/responsive-navigation"
import { ResponsiveHeader } from "@/components/responsive-header"
import { MainPageSkeleton } from "@/components/ui/skeleton-loaders"
import { expenseDB, type Expense, type Budget, type RecurringExpense } from "@/lib/db"
import { calculateBudgetProgress } from "@/lib/budget-utils"
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
  const [searchQuery, setSearchQuery] = useState("")

  type AppNotification = {
    id: string
    title: string
    message: string
    severity: "info" | "warning" | "danger"
  }

  const filteredExpenses = useMemo(() => {
    const sorted = sortExpenses(expenses, "date", "desc")
    if (!searchQuery.trim()) return sorted
    const q = searchQuery.toLowerCase()
    return sorted.filter((e) =>
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.amount.toString().includes(q)
    )
  }, [expenses, searchQuery])

  const notifications = useMemo<AppNotification[]>(() => {
    const items: AppNotification[] = []

    // Budget notifications
    for (const budget of budgets) {
      const progress = calculateBudgetProgress(budget, expenses)
      if (progress.status === "warning") {
        items.push({
          id: `budget-${budget.id}-warning`,
          title: `Budget warning: ${budget.category}`,
          message: `You\'ve used ${progress.percentage.toFixed(0)}% of your ${budget.category} budget. $${progress.remaining.toLocaleString()} remaining.`,
          severity: "warning",
        })
      } else if (progress.status === "danger") {
        items.push({
          id: `budget-${budget.id}-danger`,
          title: `Budget high: ${budget.category}`,
          message: `You\'re at ${progress.percentage.toFixed(0)}% of your ${budget.category} budget. Consider reducing spending.`,
          severity: "danger",
        })
      } else if (progress.status === "exceeded") {
        items.push({
          id: `budget-${budget.id}-exceeded`,
          title: `Budget exceeded: ${budget.category}`,
          message: `You exceeded the ${budget.category} budget by $${(progress.spent - budget.limit).toLocaleString()}.`,
          severity: "danger",
        })
      }
    }

    // Recurring due notifications (overdue, due today, in <=3 days)
    const getDueStatus = (nextDue: string) => {
      const due = new Date(nextDue)
      const today = new Date()
      const diffTime = due.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays < 0) return { status: "overdue", text: "Overdue" }
      if (diffDays === 0) return { status: "due", text: "Due today" }
      if (diffDays <= 3) return { status: "soon", text: `Due in ${diffDays} days` }
      return { status: "future", text: `Due in ${diffDays} days"` }
    }

    for (const r of recurringExpenses) {
      if (!r.isActive) continue
      const due = getDueStatus(r.nextDue)
      if (due.status === "overdue" || due.status === "due" || due.status === "soon") {
        items.push({
          id: `recurring-${r.id}-${due.status}`,
          title: `Recurring: ${r.description}`,
          message: `${due.text} • $${r.amount} • ${r.category}`,
          severity: due.status === "soon" ? "info" : "warning",
        })
      }
    }

    return items
  }, [budgets, expenses, recurringExpenses])

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



  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (isLoading) {
    return <MainPageSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      <ResponsiveNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notifications={notifications}
      />
      <div className="md:ml-64">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 max-w-7xl pb-safe md:pt-24">
          <ResponsiveHeader />

          {activeTab === "budgets" ? (
            <BudgetManagement expenses={expenses} isLoading={isLoading} />
          ) : activeTab === "analytics" ? (
            <AnalyticsDashboard expenses={expenses} isLoading={isLoading} />
          ) : activeTab === "recurring" ? (
            <RecurringExpenses onAddExpense={addExpense} isLoading={isLoading} />
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
                        <span className="text-sm truncate">Deleted &quot;{undoExpense.description}&quot;</span>
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
                          Total Expenses
                        </p>
                        <p className="text-2xl md:text-4xl font-bold text-foreground">
                          ${totalExpenses.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {filteredExpenses.length > 0 && (
                  <Card className="glass lg:col-span-2">
                    <CardHeader className="pb-2 md:pb-4">
                      <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                        <span>Expense Breakdown</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 md:p-6">
                      <ExpenseChart expenses={filteredExpenses} />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Add Buttons */}
              <QuickAddButtons 
                onQuickAdd={addExpense} 
              />



              <div className="flex justify-center">
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 md:px-8 py-3 md:py-4 rounded-full w-full sm:w-auto h-12 md:h-14 text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <Plus className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                  Add Expense
                </Button>
              </div>

              {/* Recent/Filtered Expenses */}
              {filteredExpenses.length > 0 && (
                <Card className="glass">
                  <CardHeader className="pb-2 md:pb-4">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                                              <span>Recent Expenses</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 md:p-6">
                    <ExpenseList
                      expenses={filteredExpenses.slice(0, 10)}
                      onDelete={deleteExpense}
                      onEdit={handleEdit}
                      isLoading={isLoading}
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
