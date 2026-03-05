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
  budgets?: Budget[]
  onAddBudget?: (budget: Omit<Budget, "id" | "createdAt">) => Promise<void> | void
  onUpdateBudget?: (budget: Budget) => Promise<void> | void
  onDeleteBudget?: (id: string) => Promise<void> | void
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

export function BudgetManagement({ expenses, isLoading: externalLoading, budgets: controlledBudgets, onAddBudget, onUpdateBudget, onDeleteBudget }: BudgetManagementProps) {
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
    if (controlledBudgets) {
      setBudgets(controlledBudgets)
      setIsLoading(false)
      return
    }
    loadBudgets()
  }, [controlledBudgets])

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
        const updatedBudget: Budget = { ...budgetData, id: editingBudget.id }
        if (onUpdateBudget) {
          await onUpdateBudget(updatedBudget)
        } else {
          await expenseDB.updateBudget(updatedBudget)
          setBudgets((prev) => prev.map((b) => (b.id === editingBudget.id ? updatedBudget : b)))
        }
      } else {
        const newBudget: Budget = { ...budgetData, id: Date.now().toString() }
        if (onAddBudget) {
          await onAddBudget({ category: newBudget.category, limit: newBudget.limit, period: newBudget.period })
        } else {
          await expenseDB.addBudget(newBudget)
          setBudgets((prev) => [...prev, newBudget])
        }
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
      if (onDeleteBudget) {
        await onDeleteBudget(id)
      } else {
        await expenseDB.deleteBudget(id)
        setBudgets((prev) => prev.filter((b) => b.id !== id))
      }
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
    <div className="space-y-6">
      {/* Header with Control */}
      <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl shrink-0">
        <CardHeader className="p-4 md:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center space-x-3 text-lg md:text-xl font-bold">
              <Target className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
              <span>Budget Control Center</span>
            </CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? "ghost" : "outline"}
              size="sm"
              className={`rounded-full px-4 h-9 transition-all duration-300 w-full sm:w-auto ${showForm
                ? "text-muted-foreground hover:bg-card/20"
                : "bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20"
                }`}
            >
              {showForm ? "Close Form" : <><Plus className="h-4 w-4 mr-2" /> New Limit</>}
            </Button>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Keep your spending in check by setting category-based limits.</p>
        </CardHeader>

        {showForm && (
          <CardContent className="p-4 md:pb-8">
            <Card className="glass-strong bg-secondary/5 border-secondary/20 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-1 bg-secondary/10 border-b border-secondary/10">
                <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 block">Budget Configuration</span>
              </div>
              <CardContent className="p-4 md:p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground font-bold">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="glass-strong bg-card/10 border-border/20 h-11">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown">
                          {getAvailableCategories().map(cat => (
                            <SelectItem key={cat} value={cat} className="glass-dropdown-item">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground font-bold">Limit ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        placeholder="0.00"
                        className="glass-strong bg-card/10 border-border/20 h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2 md:col-span-1">
                      <Label className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground font-bold">Period</Label>
                      <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                        <SelectTrigger className="glass-strong bg-card/10 border-border/20 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown">
                          {["weekly", "monthly", "yearly"].map(p => (
                            <SelectItem key={p} value={p} className="capitalize glass-dropdown-item">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={resetForm} className="h-10 px-6 w-full sm:w-auto">Cancel</Button>
                    <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-10 px-8 rounded-lg shadow-lg shadow-secondary/20 w-full sm:w-auto font-bold">
                      {editingBudget ? "Save Changes" : "Create Budget"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </CardContent>
        )}
      </Card>

      {/* Bento Grid of Budget Progress */}
      {budgetProgress.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetProgress.map((progress) => (
            <Card key={progress.budget.id} className="relative glass-strong bg-card/20 border-border/20 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
              {/* Status Indicator Bar */}
              <div
                className="absolute top-0 left-0 w-full h-1 transition-opacity opacity-70"
                style={{ backgroundColor: getBudgetStatusColor(progress.status) }}
              />

              <CardContent className="p-4 md:p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 md:p-2 rounded-xl bg-card/20 border border-border/10 backdrop-blur-md">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: getCategoryColor(progress.budget.category) }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm md:text-base text-foreground line-clamp-1">{progress.budget.category}</h4>
                      <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{formatPeriod(progress.budget.period)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button onClick={() => handleEdit(progress.budget)} variant="secondary" size="sm" className="h-7 w-7 p-0 rounded-full bg-secondary/20 hover:bg-secondary/40"><Edit className="h-3 w-3" /></Button>
                    <Button onClick={() => handleDelete(progress.budget.id)} variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full hover:bg-destructive/20 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div className="flex flex-col">
                      <span className="text-xl md:text-2xl font-black text-foreground">${progress.spent.toLocaleString()}</span>
                      <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Spent so far</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase opacity-60">of ${progress.budget.limit.toLocaleString()}</span>
                      <Badge variant="outline" className={`text-[10px] border-none font-black mt-1 ${progress.status === 'safe' ? 'text-green-500 bg-green-500/10' :
                        progress.status === 'warning' ? 'text-amber-500 bg-amber-500/10' :
                          'text-red-500 bg-red-500/10'
                        }`}>
                        {progress.percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Progress
                      value={progress.percentage}
                      className="h-2 rounded-full overflow-hidden bg-card/30"
                      style={{
                        ['--progress-foreground' as any]: getBudgetStatusColor(progress.status)
                      } as React.CSSProperties}
                    />
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground italic tracking-tight">
                      {progress.remaining > 0 ? (
                        <span>${progress.remaining.toLocaleString()} left in budget</span>
                      ) : (
                        <span className="text-red-500 font-black">Over by ${(progress.spent - progress.budget.limit).toLocaleString()}</span>
                      )}
                      <div className="flex items-center gap-1">
                        {progress.status === "safe" && <CheckCircle className="h-3 w-3 text-green-500" />}
                        {(progress.status === "warning" || progress.status === "danger" || progress.status === "exceeded") &&
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-strong bg-card/10 border-border/20 h-64 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 rounded-full bg-muted/10 border border-muted/20">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">No Constraints</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">Define your first budget to stay on top of your finances.</p>
            </div>
            <Button onClick={() => setShowForm(true)} variant="outline" className="h-10 rounded-full border-secondary/30 text-secondary hover:bg-secondary/10">
              Set Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
