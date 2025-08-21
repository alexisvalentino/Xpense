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
import { Plus, Target, Edit, Trash2, AlertTriangle, CheckCircle } from "lucide-react"
import { expenseDB, type Budget } from "@/lib/db"
import type { Expense } from "@/app/page"
import { getCategoryColor } from "@/lib/category-colors"
import { calculateBudgetProgress, getBudgetStatusColor, formatPeriod, type BudgetProgress } from "@/lib/budget-utils"

interface BudgetManagementProps {
  expenses: Expense[]
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

export function BudgetManagement({ expenses }: BudgetManagementProps) {
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

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading budgets...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-secondary" />
            <span>Budget Management</span>
          </CardTitle>
          <Button 
            onClick={() => setShowForm(true)} 
            size="sm" 
            className="bg-secondary hover:bg-secondary/90 rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Budget
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Form */}
        {showForm && (
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="text-lg">{editingBudget ? "Edit Budget" : "Add New Budget"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget-category">Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      {getAvailableCategories().map((cat) => (
                        <SelectItem key={cat} value={cat} className="glass-dropdown-item">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
                            {cat}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-limit">Budget Limit</Label>
                  <Input
                    id="budget-limit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="glass"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-period">Period</Label>
                  <Select value={period} onValueChange={(value: Budget["period"]) => setPeriod(value)}>
                    <SelectTrigger className="glass">
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
                    className="flex-1 bg-secondary hover:bg-secondary/90 rounded-full py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {editingBudget ? "Update Budget" : "Add Budget"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm} 
                    className="flex-1 glass bg-transparent rounded-full py-2 hover:bg-secondary/10 transition-all duration-200"
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
          <div className="space-y-3">
            {budgetProgress.map((progress) => (
              <Card key={progress.budget.id} className="glass-strong">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(progress.budget.category) }}
                        />
                        <h4 className="font-medium text-foreground">{progress.budget.category}</h4>
                        <Badge variant="outline" className="text-xs">
                          {formatPeriod(progress.budget.period)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={() => handleEdit(progress.budget)} 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full hover:bg-secondary/20 transition-all duration-200"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(progress.budget.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full text-destructive hover:text-destructive hover:bg-destructive/20 transition-all duration-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          ${progress.spent.toLocaleString()} of ${progress.budget.limit.toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          {progress.status === "safe" && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {(progress.status === "warning" ||
                            progress.status === "danger" ||
                            progress.status === "exceeded") && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                          <span className="font-medium" style={{ color: getBudgetStatusColor(progress.status) }}>
                            {progress.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={progress.percentage}
                        className="h-2"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.1)",
                        }}
                      />
                      {progress.remaining > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ${progress.remaining.toLocaleString()} remaining
                        </p>
                      )}
                      {progress.status === "exceeded" && (
                        <p className="text-xs text-red-500">
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
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-muted/20 w-fit mx-auto mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No budgets set</h3>
            <p className="text-muted-foreground mb-4">
              Create your first budget to start tracking your spending limits
            </p>
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-secondary hover:bg-secondary/90 rounded-full px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Budget
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
