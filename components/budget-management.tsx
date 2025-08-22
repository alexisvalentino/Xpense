"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BudgetCardSkeleton } from "@/components/ui/skeleton-loaders"
import { Plus, Target, Edit, Trash2, AlertTriangle, CheckCircle } from "lucide-react"
import { expenseDB, type Budget } from "@/lib/db"
import type { Expense } from "@/lib/db"
import { getCategoryColor } from "@/lib/category-colors"
import { calculateBudgetProgress, getBudgetStatusColor, formatPeriod, type BudgetProgress } from "@/lib/budget-utils"

interface BudgetManagementProps {
  expenses: Expense[]
  isLoading?: boolean
}

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Other",
]

export function BudgetManagement({ expenses, isLoading: externalLoading }: BudgetManagementProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [category, setCategory] = useState("")
  const [limit, setLimit] = useState("")
  const [period, setPeriod] = useState<Budget["period"]>("monthly")

  useEffect(() => {
    loadBudgets()
  }, [])

  useEffect(() => {
    if (budgets.length > 0) {
      const progress = budgets.map((budget) => calculateBudgetProgress(budget, expenses))
      setBudgetProgress(progress)
    }
  }, [budgets, expenses])

  const loadBudgets = async () => {
    try {
      const savedBudgets = await expenseDB.getAllBudgets()
      setBudgets(savedBudgets)
    } catch (error) {
      console.error("Failed to load budgets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!category || !limit) return

    const budgetData = {
      category,
      limit: Number.parseFloat(limit),
      period,
      createdAt: new Date().toISOString(),
    }

    try {
      if (editingBudget) {
        const updatedBudget = { ...budgetData, id: editingBudget.id }
        await expenseDB.updateBudget(updatedBudget)
        setBudgets((prev) => prev.map((b) => (b.id === editingBudget.id ? updatedBudget : b)))
      } else {
        const newBudget = { ...budgetData, id: Date.now().toString() }
        await expenseDB.addBudget(newBudget)
        setBudgets((prev) => [...prev, newBudget])
      }

      resetForm()
    } catch (error) {
      console.error("Failed to save budget:", error)
    }
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setCategory(budget.category)
    setLimit(budget.limit.toString())
    setPeriod(budget.period)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await expenseDB.deleteBudget(id)
      setBudgets((prev) => prev.filter((b) => b.id !== id))
    } catch (error) {
      console.error("Failed to delete budget:", error)
    }
  }

  const resetForm = () => {
    setCategory("")
    setLimit("")
    setPeriod("monthly")
    setEditingBudget(null)
    setShowForm(false)
  }

  const getAvailableCategories = () => {
    const usedCategories = budgets.map((b) => b.category)
    return categories.filter(
      (cat) => !usedCategories.includes(cat) || (editingBudget && editingBudget.category === cat),
    )
  }

  if (isLoading || externalLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <BudgetCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl">
      <CardHeader className="pb-4 md:pb-6">
        <CardTitle className="flex items-center space-x-3 text-xl md:text-2xl font-bold">
          <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/30">
            <Target className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
          </div>
          <span>Budget Management</span>
        </CardTitle>
        <p className="text-sm md:text-base text-muted-foreground">
          Set spending limits and track your budget progress across different categories
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add/Edit Budget Form */}
        {showForm && (
          <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">
                {editingBudget ? "Edit Budget" : "Add New Budget"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget-category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="glass-strong bg-card/20 border-border/30">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="glass-dropdown-item">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget-limit">Monthly Limit ($)</Label>
                    <Input
                      id="budget-limit"
                      type="number"
                      step="0.01"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      placeholder="0.00"
                      className="glass-strong bg-card/20 border-border/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-period">Period</Label>
                  <Select value={period} onValueChange={(value: Budget["period"]) => setPeriod(value)}>
                    <SelectTrigger className="glass-strong bg-card/20 border-border/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      <SelectItem value="weekly" className="glass-dropdown-item">
                        Weekly
                      </SelectItem>
                      <SelectItem value="monthly" className="glass-dropdown-item">
                        Monthly
                      </SelectItem>
                      <SelectItem value="yearly" className="glass-dropdown-item">
                        Yearly
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 md:px-8 py-3 md:py-4 rounded-xl w-full h-12 md:h-14 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-secondary/30 hover:border-secondary/50 touch-manipulation"
                  >
                    {editingBudget ? "Update Budget" : "Add Budget"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm} 
                    className="flex-1 glass-strong bg-card/20 border-border/30 rounded-xl py-3 md:py-4 h-12 md:h-14 hover:bg-secondary/10 transition-all duration-200 text-base md:text-lg font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Budget Progress List */}
        {budgetProgress.length > 0 ? (
          <div className="space-y-4">
            {budgetProgress.map((progress) => (
              <Card key={progress.budget.id} className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getCategoryColor(progress.budget.category) }}
                        />
                        <h4 className="font-semibold text-foreground text-base md:text-lg">{progress.budget.category}</h4>
                        <Badge variant="outline" className="text-xs glass-strong bg-card/20 border-border/30">
                          {formatPeriod(progress.budget.period)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={() => handleEdit(progress.budget)} 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-secondary/20 transition-all duration-200 glass-strong bg-card/20 border-border/30"
                        >
                          <Edit className="h-4 w-4 text-secondary" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(progress.budget.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/20 transition-all duration-200 glass-strong bg-card/20 border-border/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm md:text-base">
                        <span className="text-muted-foreground">
                          ${progress.spent.toLocaleString()} of ${progress.budget.limit.toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          {progress.status === "safe" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {(progress.status === "warning" ||
                            progress.status === "danger" ||
                            progress.status === "exceeded") && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          <span className="font-semibold" style={{ color: getBudgetStatusColor(progress.status) }}>
                            {progress.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={progress.percentage}
                        className="h-3"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.1)",
                        }}
                      />
                      {progress.remaining > 0 && (
                        <p className="text-sm text-muted-foreground">
                          ${progress.remaining.toLocaleString()} remaining
                        </p>
                      )}
                      {progress.status === "exceeded" && (
                        <p className="text-sm text-red-500 font-medium">
                          Over budget by ${(progress.spent - progress.budget.limit).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-secondary/20 w-fit mx-auto mb-6 border border-secondary/30">
              <Target className="h-10 w-10 text-secondary" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">No budgets set</h3>
            <p className="text-muted-foreground mb-6 text-base md:text-lg">
              Create your first budget to start tracking your spending limits
            </p>
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 md:px-8 py-3 md:py-4 rounded-xl w-full sm:w-auto h-12 md:h-14 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-secondary/30 hover:border-secondary/50 touch-manipulation"
            >
              <Plus className="h-5 w-5 md:h-6 md:w-6 mr-2" />
              Add Your First Budget
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
