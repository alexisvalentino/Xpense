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
    <div className="space-y-4 md:space-y-8">
      {/* Header Card */}
      <Card className="glass-strong bg-card/20 border-white/20 shadow-xl backdrop-blur-xl relative overflow-hidden group mt-4 md:mt-0">
        {/* Top Glow Highlight */}
        <div
          className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
          style={{
            backgroundColor: "#22c55e", // Matching green icon
            boxShadow: `0 0 20px 2px #22c55e`
          }}
        />
        <CardHeader className="p-3 md:p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-xl font-bold">
              <Repeat className="h-6 w-6 text-secondary" />
              <span>Subscription Management</span>
            </CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? "ghost" : "outline"}
              size="sm"
              className={`rounded-full px-4 h-9 transition-all duration-300 ${showForm
                ? "text-muted-foreground hover:bg-card/20"
                : "bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20"
                }`}
            >
              {showForm ? "Close Form" : <><Plus className="h-4 w-4 mr-2" /> New Template</>}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Manage your recurring bills, subscriptions, and automated entries.</p>
        </CardHeader>

        {showForm && (
          <CardContent className="pb-8">
            <Card className="glass-strong bg-secondary/5 border-secondary/20 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-1 bg-secondary/10 border-b border-secondary/10">
                <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 block">Template Creator</span>
              </div>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
                      <Input
                        placeholder="e.g. Netflix"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="glass-strong bg-card/10 border-border/20 h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="glass-strong bg-card/10 border-border/20 h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Frequency</Label>
                      <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                        <SelectTrigger className="glass-strong bg-card/10 border-border/20 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown">
                          {["daily", "weekly", "monthly", "yearly"].map(f => (
                            <SelectItem key={f} value={f} className="capitalize glass-dropdown-item">{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger className="glass-strong bg-card/10 border-border/20 h-11">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown">
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat} className="glass-dropdown-item">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
                                {cat}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={resetForm} className="h-10 px-6">Cancel</Button>
                    <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-10 px-8 rounded-lg shadow-lg shadow-secondary/20">
                      {editingRecurring ? "Save Changes" : "Create Template"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </CardContent>
        )}
      </Card>

      {/* Bento Grid of Recurring Items */}
      {recurringExpenses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringExpenses.map((expense) => {
            const dueStatus = getDueStatus(expense.nextDue)
            return (
              <Card key={expense.id} className="relative glass-strong bg-card/20 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                {/* Top Glow Highlight */}
                <div
                  className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
                  style={{
                    backgroundColor: getCategoryColor(expense.category),
                    boxShadow: `0 0 20px 2px ${getCategoryColor(expense.category)}`
                  }}
                />

                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-2xl bg-card/10 border border-white/5 backdrop-blur-md flex items-center justify-center">
                        <Repeat className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-black text-sm uppercase tracking-tight text-foreground truncate">{expense.description}</h4>
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black opacity-50 truncate">{expense.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Button onClick={() => handleEdit(expense)} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-secondary/10 hover:text-secondary"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button onClick={() => handleDelete(expense.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-black text-foreground">${expense.amount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground font-medium">/ {expense.frequency}</span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[10px] border-none font-bold uppercase transition-colors ${dueStatus.status === 'overdue' ? 'bg-destructive/20 text-destructive' :
                          dueStatus.status === 'due' ? 'bg-secondary/20 text-secondary' : 'bg-card/30 text-muted-foreground'
                          }`}
                      >
                        <Clock className="h-3 w-3 mr-1" /> {dueStatus.text}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase ${expense.isActive ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {expense.isActive ? 'Active' : 'Paused'}
                        </span>
                        <Switch
                          checked={expense.isActive}
                          onCheckedChange={() => handleToggleActive(expense)}
                          className="scale-75 data-[state=checked]:bg-secondary"
                        />
                      </div>
                    </div>

                    {expense.isActive && (dueStatus.status === "overdue" || dueStatus.status === "due") && (
                      <Button
                        onClick={() => handleExecuteRecurring(expense)}
                        className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xs font-bold h-9 rounded-lg"
                      >
                        Post Expense Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="glass-strong bg-card/10 border-border/20 h-64 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 rounded-full bg-muted/10 border border-muted/20">
              <Repeat className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Clean Slate</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">You haven't automated any expenses yet.</p>
            </div>
            <Button onClick={() => setShowForm(true)} variant="outline" className="h-10 rounded-full border-secondary/30 text-secondary hover:bg-secondary/10">
              Add Your First Recurring Bill
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
