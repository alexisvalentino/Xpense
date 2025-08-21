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
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {/* Amount and Category Row - Mobile: Stacked, Desktop: Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="glass h-11 text-base"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">Category</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger className="glass h-11 text-base">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown max-h-60">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
        <Textarea
          id="description"
          placeholder="What did you spend on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass min-h-[80px] text-base resize-none"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="glass h-11 text-base"
          required
        />
      </div>

      {/* Action Buttons - Mobile: Stacked, Desktop: Side by side */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
        <Button 
          type="submit" 
          className="flex-1 bg-secondary hover:bg-secondary/90 h-11 text-base font-medium"
        >
          {editExpense ? "Update Expense" : "Add Expense"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="flex-1 glass bg-transparent h-11 text-base font-medium"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
