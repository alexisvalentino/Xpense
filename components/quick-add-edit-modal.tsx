"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Settings, Plus, Trash2, GripVertical, Coffee, Utensils, Car, ShoppingBag, Zap, Home, Heart, Gamepad2, BookOpen, Plane, Train, Bus, Bike, Wifi, Phone, Tv, Music, Camera, Gift, Star } from "lucide-react"
import type { QuickAddOption } from "@/lib/db"
import { iconMap, categoryOptions, getQuickAddOptionsWithSmartDefaults, addQuickAddOption, updateQuickAddOption, deleteQuickAddOption, reorderQuickAddOptions, clearAllQuickAddOptions } from "@/lib/quick-add-utils"
import { getCategoryColor } from "@/lib/category-colors"
import { useToast } from "@/components/ui/toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

interface QuickAddEditModalProps {
  onOptionsChange: () => void
}

export function QuickAddEditModal({ onOptionsChange }: QuickAddEditModalProps) {
  const [options, setOptions] = useState<QuickAddOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<QuickAddOption | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "warning",
    onConfirm: () => { },
  })

  // Icon mapping for quick add options
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      Coffee,
      Utensils,
      Car,
      ShoppingBag,
      Zap,
      Home,
      Heart,
      Gamepad2,
      BookOpen,
      Plane,
      Train,
      Bus,
      Bike,
      Wifi,
      Phone,
      Tv,
      Music,
      Camera,
      Gift,
      Star,
    }
    return iconMap[iconName] || Plus
  }

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
      const loadedOptions = await getQuickAddOptionsWithSmartDefaults()
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
      toast({
        message: "Missing information",
        description: "Please fill in all required fields.",
        type: "warning",
      })
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
      toast({
        message: editingOption ? "Option updated" : "Option added",
        description: `"${formData.label}" is now ready to use.`,
        type: "success",
      })
    } catch (error) {
      console.error("Error saving option:", error)
      toast({
        message: "Error",
        description: "Failed to save quick add option.",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Option",
      description: "Are you sure you want to delete this quick add option?",
      type: "danger",
      onConfirm: async () => {
        setIsLoading(true)
        try {
          await deleteQuickAddOption(id)
          await loadOptions()
          onOptionsChange()
          toast({
            message: "Option deleted",
            type: "info",
          })
        } catch (error) {
          console.error("Error deleting option:", error)
          toast({
            message: "Error",
            description: "Failed to delete option.",
            type: "error",
          })
        } finally {
          setIsLoading(false)
          setConfirmState(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const handleClearAll = async () => {
    setConfirmState({
      isOpen: true,
      title: "Clear All Options",
      description: "Are you sure you want to delete all quick add options? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        setIsLoading(true)
        try {
          await clearAllQuickAddOptions()
          await loadOptions()
          onOptionsChange()
          toast({
            message: "Quick add options cleared",
            type: "info",
          })
        } catch (error) {
          console.error("Error clearing all options:", error)
          toast({
            message: "Error",
            description: "Failed to clear options.",
            type: "error",
          })
        } finally {
          setIsLoading(false)
          setConfirmState(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
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
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-secondary/20 rounded-lg transition-all duration-200 glass-strong bg-card/20 border-border/30 hover:border-secondary/50 shadow-lg hover:shadow-xl backdrop-blur-lg"
            data-settings-trigger
          >
            <Settings className="h-5 w-5 text-secondary" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[98%] sm:w-full max-w-2xl max-h-[92vh] overflow-y-auto glass-modal bg-card/40 border-border/50 shadow-2xl backdrop-blur-xl p-3.5 sm:p-8">
          <DialogHeader className="pb-4 md:pb-6">
            <DialogTitle className="text-lg md:text-xl font-bold">Quick Add Options</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs md:text-sm">Manage your quick add buttons for faster entry</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 md:space-y-6">
            {/* Add/Edit Form */}
            <div className="space-y-3 sm:space-y-5 p-3 sm:p-6 glass-strong bg-card/20 rounded-xl border border-border/30 shadow-lg backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base md:text-lg">
                  {editingOption ? "Edit Option" : "Add New Option"}
                </h3>
                {editingOption && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingOption(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon" className="text-sm font-medium">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger className="glass h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown max-h-60">
                      {Object.entries(iconMap).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="glass-dropdown-item">
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label" className="text-sm font-medium">Label</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g., Coffee"
                    className="glass h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="glass h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="glass h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown max-h-60">
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category} className="glass-dropdown-item">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(category) }} />
                            {category}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Morning coffee"
                  className="glass h-10"
                />
              </div>

              <div className="flex pt-3">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 h-10 font-medium"
                >
                  {isLoading ? "Saving..." : editingOption ? "Update Option" : "Add Option"}
                </Button>
              </div>
            </div>

            {/* Existing Options List */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div>
                  <h3 className="font-semibold text-base md:text-lg">Current Options</h3>
                  <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5">
                    {options.length} option{options.length !== 1 ? 's' : ''} configured
                  </p>
                </div>
                {options.length > 0 && (
                  <Button
                    onClick={handleClearAll}
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40 hover:bg-destructive/5 self-start sm:self-auto"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {options.length === 0 ? (
                <div className="text-center py-8">
                  <div className="space-y-3">
                    <div className="h-12 w-12 mx-auto rounded-full bg-secondary/20 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-muted-foreground">
                      <p className="text-base font-medium">No quick add options yet</p>
                      <p className="text-sm">Use the form above to create your first option</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-4 bg-background/20 rounded-lg border border-secondary/10 group hover:border-secondary/20 hover:bg-background/30 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move hover:text-foreground transition-colors flex-shrink-0" />
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                            {(() => {
                              const IconComponent = getIconComponent(option.icon)
                              return <IconComponent className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary" />
                            })()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs md:text-sm font-medium truncate">{option.label}</span>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(option.category) }} />
                              <span className="text-[10px] md:text-xs text-muted-foreground truncate">{option.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">${option.amount}</span>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(option)}
                            className="h-8 w-8 p-0 hover:bg-secondary/20"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(option.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        description={confirmState.description}
        type={confirmState.type}
        isLoading={isLoading}
        confirmText="Delete"
      />
    </>
  )
}
