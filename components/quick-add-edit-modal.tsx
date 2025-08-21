"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Settings, Plus, Trash2, GripVertical } from "lucide-react"
import type { QuickAddOption } from "@/lib/db"
import { iconMap, categoryOptions, getQuickAddOptions, addQuickAddOption, updateQuickAddOption, deleteQuickAddOption, reorderQuickAddOptions } from "@/lib/quick-add-utils"

interface QuickAddEditModalProps {
  onOptionsChange: () => void
}

export function QuickAddEditModal({ onOptionsChange }: QuickAddEditModalProps) {
  const [options, setOptions] = useState<QuickAddOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<QuickAddOption | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state for new/edit option
  const [formData, setFormData] = useState({
    icon: "Coffee",
    label: "",
    amount: "",
    category: "Food & Dining",
    description: "",
  })

  useEffect(() => {
    if (isOpen) {
      loadOptions()
    }
  }, [isOpen])

  const loadOptions = async () => {
    try {
      const loadedOptions = await getQuickAddOptions()
      setOptions(loadedOptions)
    } catch (error) {
      console.error("Error loading options:", error)
    }
  }

  const handleEdit = (option: QuickAddOption) => {
    setEditingOption(option)
    setFormData({
      icon: option.icon,
      label: option.label,
      amount: option.amount.toString(),
      category: option.category,
      description: option.description,
    })
  }

  const handleAdd = () => {
    setEditingOption(null)
    setFormData({
      icon: "Coffee",
      label: "",
      amount: "",
      category: "Food & Dining",
      description: "",
    })
  }

  const handleSave = async () => {
    if (!formData.label || !formData.amount || !formData.description) {
      alert("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      if (editingOption) {
        // Update existing option
        await updateQuickAddOption({
          ...editingOption,
          icon: formData.icon,
          label: formData.label,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
        })
      } else {
        // Add new option
        await addQuickAddOption({
          icon: formData.icon,
          label: formData.label,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          order: options.length,
        })
      }
      
      await loadOptions()
      onOptionsChange()
      setEditingOption(null)
      setFormData({
        icon: "Coffee",
        label: "",
        amount: "",
        category: "Food & Dining",
        description: "",
      })
    } catch (error) {
      console.error("Error saving option:", error)
      alert("Error saving option")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quick add option?")) return

    setIsLoading(true)
    try {
      await deleteQuickAddOption(id)
      await loadOptions()
      onOptionsChange()
    } catch (error) {
      console.error("Error deleting option:", error)
      alert("Error deleting option")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newOptions = [...options]
    const [movedOption] = newOptions.splice(fromIndex, 1)
    newOptions.splice(toIndex, 0, movedOption)
    
    setOptions(newOptions)
    
    try {
      await reorderQuickAddOptions(newOptions)
      onOptionsChange()
    } catch (error) {
      console.error("Error reordering options:", error)
      await loadOptions() // Revert on error
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-secondary/20"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Quick Add Options</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Add/Edit Form */}
          <div className="space-y-4 p-4 glass rounded-lg">
            <h3 className="font-medium">
              {editingOption ? "Edit Option" : "Add New Option"}
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    {Object.entries(iconMap).map(([key, value]) => (
                      <SelectItem key={key} value={key} className="glass-dropdown-item">
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Coffee"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category} className="glass-dropdown-item">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Morning coffee"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : editingOption ? "Update" : "Add"}
              </Button>
              {editingOption && (
                <Button 
                  variant="outline" 
                  onClick={() => setEditingOption(null)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Existing Options List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Current Options</h3>
              <Button onClick={handleAdd} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </div>
            
            {options.map((option, index) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 p-3 glass rounded-lg group"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">${option.amount}</span>
                  </div>
                </div>
                
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(option)}
                    className="h-7 w-7 p-0"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(option.id)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
