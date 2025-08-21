import { expenseDB, type QuickAddOption } from "./db"

// Icon mapping for quick add options
export const iconMap: Record<string, string> = {
  Coffee: "Coffee",
  Utensils: "Utensils", 
  Car: "Car",
  ShoppingBag: "ShoppingBag",
  Zap: "Zap",
  Home: "Home",
  Heart: "Heart",
  Gamepad2: "Gamepad2",
  BookOpen: "BookOpen",
  Plane: "Plane",
  Train: "Train",
  Bus: "Bus",
  Bike: "Bike",
  Wifi: "Wifi",
  Phone: "Phone",
  Tv: "Tv",
  Music: "Music",
  Camera: "Camera",
  Gift: "Gift",
  Star: "Star",
}

// Available categories for quick add options
export const categoryOptions = [
  "Food & Dining",
  "Transportation", 
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health & Fitness",
  "Education",
  "Travel",
  "Home & Garden",
  "Personal Care",
  "Gifts & Donations",
  "Business",
  "Other"
]

// Get all quick add options
export async function getQuickAddOptions(): Promise<QuickAddOption[]> {
  try {
    return await expenseDB.getAllQuickAddOptions()
  } catch (error) {
    console.error("Error getting quick add options:", error)
    return []
  }
}

// Get quick add options with smart defaults initialization
export async function getQuickAddOptionsWithSmartDefaults(): Promise<QuickAddOption[]> {
  try {
    const options = await expenseDB.getAllQuickAddOptions()
    
    // If no options exist, check if user has explicitly cleared them
    if (options.length === 0) {
      const hasUserCleared = await expenseDB.hasUserClearedOptions()
      
      // Only initialize defaults if user hasn't explicitly cleared them
      if (!hasUserCleared) {
        await expenseDB.initializeDefaultQuickAddOptions()
        return await expenseDB.getAllQuickAddOptions()
      }
    }
    
    return options
  } catch (error) {
    console.error("Error getting quick add options:", error)
    return []
  }
}

// Get quick add options with defaults initialization (for first time users)
export async function getQuickAddOptionsWithDefaults(): Promise<QuickAddOption[]> {
  try {
    await expenseDB.initializeDefaultQuickAddOptions()
    return await expenseDB.getAllQuickAddOptions()
  } catch (error) {
    console.error("Error getting quick add options:", error)
    return []
  }
}

// Add new quick add option
export async function addQuickAddOption(option: Omit<QuickAddOption, "id" | "createdAt">): Promise<void> {
  try {
    const newOption: QuickAddOption = {
      ...option,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await expenseDB.addQuickAddOption(newOption)
    // Reset the cleared flag when user adds a new option
    await expenseDB.resetClearedOptionsFlag()
  } catch (error) {
    console.error("Error adding quick add option:", error)
    throw error
  }
}

// Update existing quick add option
export async function updateQuickAddOption(option: QuickAddOption): Promise<void> {
  try {
    await expenseDB.updateQuickAddOption(option)
  } catch (error) {
    console.error("Error updating quick add option:", error)
    throw error
  }
}

// Delete quick add option
export async function deleteQuickAddOption(id: string): Promise<void> {
  try {
    await expenseDB.deleteQuickAddOption(id)
  } catch (error) {
    console.error("Error deleting quick add option:", error)
    throw error
  }
}

// Reorder quick add options
export async function reorderQuickAddOptions(options: QuickAddOption[]): Promise<void> {
  try {
    for (let i = 0; i < options.length; i++) {
      await expenseDB.updateQuickAddOption({
        ...options[i],
        order: i,
      })
    }
  } catch (error) {
    console.error("Error reordering quick add options:", error)
    throw error
  }
}

// Clear all quick add options
export async function clearAllQuickAddOptions(): Promise<void> {
  try {
    await expenseDB.clearAllQuickAddOptions()
  } catch (error) {
    console.error("Error clearing quick add options:", error)
    throw error
  }
}

// For testing: Reset the cleared flag (useful for development)
export async function resetQuickAddDefaults(): Promise<void> {
  try {
    await expenseDB.resetClearedOptionsFlag()
  } catch (error) {
    console.error("Error resetting quick add defaults:", error)
    throw error
  }
}


