"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Expense } from "@/app/page"
import { getCategoryColor } from "@/lib/category-colors"

interface ExpenseFormProps {
  onSubmit: (expense: Omit<Expense, "id">) => void
  onCancel: () => void
  editExpense?: Expense
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

export function ExpenseForm({ onSubmit, onCancel, editExpense }: ExpenseFormProps) {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    if (editExpense) {
      setAmount(editExpense.amount.toString())
      setCategory(editExpense.category)
      setDescription(editExpense.description)
      setDate(editExpense.date)
    }
  }, [editExpense])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || !category || !description) {
      return
    }

    onSubmit({
      amount: Number.parseFloat(amount),
      category,
      description,
      date,
    })

    // Reset form
    setAmount("")
    setCategory("")
    setDescription("")
    setDate(new Date().toISOString().split("T")[0])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="glass"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger className="glass">
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What did you spend on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="glass"
          required
        />
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1 bg-secondary hover:bg-secondary/90">
          {editExpense ? "Update Expense" : "Add Expense"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 glass bg-transparent">
          Cancel
        </Button>
      </div>
    </form>
  )
}
