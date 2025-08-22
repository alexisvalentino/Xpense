"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { RecurringExpenseSkeleton } from "@/components/ui/skeleton-loaders"
import { Plus, Repeat, Edit, Trash2, Clock } from "lucide-react"
import { expenseDB, type RecurringExpense, type Expense } from "@/lib/db"
import { getCategoryColor } from "@/lib/category-colors"

interface RecurringExpensesProps {
  onAddExpense: (expense: Omit<Expense, "id">) => void
  isLoading?: boolean
  recurringExpenses?: RecurringExpense[]
  onAddRecurring?: (recurring: Omit<RecurringExpense, "id" | "createdAt">) => Promise<void> | void
  onUpdateRecurring?: (recurring: RecurringExpense) => Promise<void> | void
  onDeleteRecurring?: (id: string) => Promise<void> | void
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

export function RecurringExpenses({ onAddExpense, isLoading: externalLoading, recurringExpenses: controlledRecurring, onAddRecurring, onUpdateRecurring, onDeleteRecurring }: RecurringExpensesProps) {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [frequency, setFrequency] = useState<RecurringExpense["frequency"]>("monthly")

  useEffect(() => {
    if (controlledRecurring) {
      setRecurringExpenses(controlledRecurring)
      setIsLoading(false)
      return
    }
    loadRecurringExpenses()
  }, [controlledRecurring])

  const loadRecurringExpenses = async () => {
    try {
      const saved = await expenseDB.getAllRecurringExpenses()
      setRecurringExpenses(saved)
    } catch (error) {
      console.error("Failed to load recurring expenses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateNextDue = (frequency: RecurringExpense["frequency"], fromDate = new Date()): string => {
    const nextDue = new Date(fromDate)

    switch (frequency) {
      case "daily":
        nextDue.setDate(nextDue.getDate() + 1)
        break
      case "weekly":
        nextDue.setDate(nextDue.getDate() + 7)
        break
      case "monthly":
        nextDue.setMonth(nextDue.getMonth() + 1)
        break
      case "yearly":
        nextDue.setFullYear(nextDue.getFullYear() + 1)
        break
    }

    return nextDue.toISOString().split("T")[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || !category || !description) return

    const recurringData = {
      amount: Number.parseFloat(amount),
      category,
      description,
      frequency,
      nextDue: calculateNextDue(frequency),
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    try {
      if (editingRecurring) {
        const updated: RecurringExpense = { ...recurringData, id: editingRecurring.id }
        if (onUpdateRecurring) {
          await onUpdateRecurring(updated)
        } else {
          await expenseDB.updateRecurringExpense(updated)
          setRecurringExpenses((prev) => prev.map((r) => (r.id === editingRecurring.id ? updated : r)))
        }
      } else {
        const newRecurring: RecurringExpense = { ...recurringData, id: Date.now().toString() }
        if (onAddRecurring) {
          await onAddRecurring({ amount: newRecurring.amount, category: newRecurring.category, description: newRecurring.description, frequency: newRecurring.frequency, nextDue: newRecurring.nextDue, isActive: true })
        } else {
          await expenseDB.addRecurringExpense(newRecurring)
          setRecurringExpenses((prev) => [...prev, newRecurring])
        }
      }

      resetForm()
    } catch (error) {
      console.error("Failed to save recurring expense:", error)
    }
  }

  const handleEdit = (recurring: RecurringExpense) => {
    setEditingRecurring(recurring)
    setAmount(recurring.amount.toString())
    setCategory(recurring.category)
    setDescription(recurring.description)
    setFrequency(recurring.frequency)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      if (onDeleteRecurring) {
        await onDeleteRecurring(id)
      } else {
        await expenseDB.deleteRecurringExpense(id)
        setRecurringExpenses((prev) => prev.filter((r) => r.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete recurring expense:", error)
    }
  }

  const handleToggleActive = async (recurring: RecurringExpense) => {
    const updated = { ...recurring, isActive: !recurring.isActive }
    try {
      if (onUpdateRecurring) {
        await onUpdateRecurring(updated)
      } else {
        await expenseDB.updateRecurringExpense(updated)
        setRecurringExpenses((prev) => prev.map((r) => (r.id === recurring.id ? updated : r)))
      }
    } catch (error) {
      console.error("Failed to toggle recurring expense:", error)
    }
  }

  const handleExecuteRecurring = async (recurring: RecurringExpense) => {
    // Add the expense
    onAddExpense({
      amount: recurring.amount,
      category: recurring.category,
      description: recurring.description,
      date: new Date().toISOString().split("T")[0],
    })

    // Update next due date
    const updated = {
      ...recurring,
      nextDue: calculateNextDue(recurring.frequency),
    }

    try {
      if (onUpdateRecurring) {
        await onUpdateRecurring(updated)
      } else {
        await expenseDB.updateRecurringExpense(updated)
        setRecurringExpenses((prev) => prev.map((r) => (r.id === recurring.id ? updated : r)))
      }
    } catch (error) {
      console.error("Failed to update recurring expense:", error)
    }
  }

  const resetForm = () => {
    setAmount("")
    setCategory("")
    setDescription("")
    setFrequency("monthly")
    setEditingRecurring(null)
    setShowForm(false)
  }

  const getDueStatus = (nextDue: string) => {
    const due = new Date(nextDue)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { status: "overdue", text: "Overdue", color: "destructive" }
    if (diffDays === 0) return { status: "due", text: "Due today", color: "secondary" }
    if (diffDays <= 3) return { status: "soon", text: `Due in ${diffDays} days`, color: "default" }
    return { status: "future", text: `Due in ${diffDays} days`, color: "outline" }
  }

  if (isLoading || externalLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <RecurringExpenseSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl">
      <CardHeader className="pb-4 md:pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3 text-xl md:text-2xl font-bold">
            <Repeat className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
            <span>Recurring Expenses</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form */}
        {showForm && (
          <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">
                {editingRecurring ? "Edit Recurring Expense" : "Add Recurring Expense"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurring-amount">Amount</Label>
                    <Input
                      id="recurring-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="glass-strong bg-card/20 border-border/30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurring-frequency">Frequency</Label>
                    <Select
                      value={frequency}
                      onValueChange={(value: RecurringExpense["frequency"]) => setFrequency(value)}
                    >
                      <SelectTrigger className="glass-strong bg-card/20 border-border/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        <SelectItem value="daily" className="glass-dropdown-item">
                          Daily
                        </SelectItem>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurring-category">Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="glass-strong bg-card/20 border-border/30">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      {categories.map((cat) => (
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
                  <Label htmlFor="recurring-description">Description</Label>
                  <Input
                    id="recurring-description"
                    placeholder="e.g., Netflix subscription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="glass-strong bg-card/20 border-border/30"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 md:px-8 py-3 md:py-4 rounded-xl w-full h-12 md:h-14 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-secondary/30 hover:border-secondary/50 touch-manipulation"
                  >
                    {editingRecurring ? "Update" : "Add Recurring Expense"}
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

        {/* Recurring Expenses List */}
        {recurringExpenses.length > 0 ? (
          <div className="space-y-3">
            {recurringExpenses.map((recurring) => {
              const dueStatus = getDueStatus(recurring.nextDue)
              return (
                <Card key={recurring.id} className="glass-strong">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(recurring.category) }}
                          />
                          <div>
                            <h4 className="font-medium text-foreground">{recurring.description}</h4>
                            <p className="text-sm text-muted-foreground">{recurring.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${recurring.amount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground capitalize">{recurring.frequency}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={dueStatus.color as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {dueStatus.text}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={recurring.isActive}
                              onCheckedChange={() => handleToggleActive(recurring)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {recurring.isActive ? "Active" : "Paused"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {recurring.isActive && (dueStatus.status === "overdue" || dueStatus.status === "due") && (
                            <Button
                              onClick={() => handleExecuteRecurring(recurring)}
                              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-secondary/30 hover:border-secondary/50 touch-manipulation text-sm font-semibold"
                            >
                              Add Now
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleEdit(recurring)} 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full hover:bg-secondary/20 transition-all duration-200"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(recurring.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full text-destructive hover:text-destructive hover:bg-destructive/20 transition-all duration-200"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-muted/20 w-fit mx-auto mb-4">
              <Repeat className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No recurring expenses</h3>
            <p className="text-muted-foreground mb-4">Set up recurring expenses like subscriptions and bills</p>
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 md:px-8 py-3 md:py-4 rounded-xl w-full sm:w-auto h-12 md:h-14 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-secondary/30 hover:border-secondary/50 touch-manipulation"
            >
              <Plus className="h-5 w-5 md:h-6 md:w-6 mr-2" />
              Add Your First Recurring Expense
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
