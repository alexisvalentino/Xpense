// IndexedDB wrapper for persistent expense, budget, and recurring expense storage
export interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
}

export interface Budget {
  id: string
  category: string
  limit: number
  period: "monthly" | "weekly" | "yearly"
  createdAt: string
}

export interface RecurringExpense {
  id: string
  amount: number
  category: string
  description: string
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  nextDue: string
  isActive: boolean
  createdAt: string
}

export interface QuickAddOption {
  id: string
  icon: string
  label: string
  amount: number
  category: string
  description: string
  order: number
  createdAt: string
}

class ExpenseDB {
  private dbName = "ExpenseTrackerDB"
  private version = 4
  private expenseStoreName = "expenses"
  private budgetStoreName = "budgets"
  private recurringStoreName = "recurring"
  private quickAddStoreName = "quickAdd"

  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create expenses store if it doesn't exist
        if (!db.objectStoreNames.contains(this.expenseStoreName)) {
          const expenseStore = db.createObjectStore(this.expenseStoreName, { keyPath: "id" })
          expenseStore.createIndex("date", "date", { unique: false })
          expenseStore.createIndex("category", "category", { unique: false })
        }

        // Create budgets store if it doesn't exist
        if (!db.objectStoreNames.contains(this.budgetStoreName)) {
          const budgetStore = db.createObjectStore(this.budgetStoreName, { keyPath: "id" })
          budgetStore.createIndex("category", "category", { unique: false })
        }

        // Create recurring expenses store if it doesn't exist
        if (!db.objectStoreNames.contains(this.recurringStoreName)) {
          const recurringStore = db.createObjectStore(this.recurringStoreName, { keyPath: "id" })
          recurringStore.createIndex("nextDue", "nextDue", { unique: false })
          recurringStore.createIndex("isActive", "isActive", { unique: false })
        }

        // Create quick add options store if it doesn't exist
        if (!db.objectStoreNames.contains(this.quickAddStoreName)) {
          const quickAddStore = db.createObjectStore(this.quickAddStoreName, { keyPath: "id" })
          quickAddStore.createIndex("order", "order", { unique: false })
        }
      }
    })
  }

  async getAllExpenses(): Promise<Expense[]> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.expenseStoreName], "readonly")
      const store = transaction.objectStore(this.expenseStoreName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addExpense(expense: Expense): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.expenseStoreName], "readwrite")
      const store = transaction.objectStore(this.expenseStoreName)
      const request = store.add(expense)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deleteExpense(id: string): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.expenseStoreName], "readwrite")
      const store = transaction.objectStore(this.expenseStoreName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updateExpense(expense: Expense): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.expenseStoreName], "readwrite")
      const store = transaction.objectStore(this.expenseStoreName)
      const request = store.put(expense)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.expenseStoreName], "readonly")
      const store = transaction.objectStore(this.expenseStoreName)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async exportData(): Promise<string> {
    const expenses = await this.getAllExpenses()
    const budgets = await this.getAllBudgets()
    const recurring = await this.getAllRecurringExpenses()
    const quickAdd = await this.getAllQuickAddOptions()
    return JSON.stringify({ expenses, budgets, recurring, quickAdd }, null, 2)
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData)
    const expenses: Expense[] = data.expenses || []
    const budgets: Budget[] = data.budgets || []
    const recurring: RecurringExpense[] = data.recurring || []
    const quickAdd: QuickAddOption[] = data.quickAdd || []
    const db = await this.openDB()

    return new Promise((resolve, reject) => {
      const expenseTransaction = db.transaction([this.expenseStoreName], "readwrite")
      const expenseStore = expenseTransaction.objectStore(this.expenseStoreName)

      // Clear existing data
      expenseStore.clear()

      // Add imported data
      expenses.forEach((expense) => {
        expenseStore.add(expense)
      })

      const budgetTransaction = db.transaction([this.budgetStoreName], "readwrite")
      const budgetStore = budgetTransaction.objectStore(this.budgetStoreName)

      // Clear existing data
      budgetStore.clear()

      // Add imported data
      budgets.forEach((budget) => {
        budgetStore.add(budget)
      })

      const recurringTransaction = db.transaction([this.recurringStoreName], "readwrite")
      const recurringStore = recurringTransaction.objectStore(this.recurringStoreName)

      // Clear existing data
      recurringStore.clear()

      // Add imported data
      recurring.forEach((recurringExpense) => {
        recurringStore.add(recurringExpense)
      })

      const quickAddTransaction = db.transaction([this.quickAddStoreName], "readwrite")
      const quickAddStore = quickAddTransaction.objectStore(this.quickAddStoreName)

      // Clear existing data
      quickAddStore.clear()

      // Add imported data
      quickAdd.forEach((option) => {
        quickAddStore.add(option)
      })

      expenseTransaction.onerror = () => reject(expenseTransaction.error)
      expenseTransaction.oncomplete = () => {
        budgetTransaction.onerror = () => reject(budgetTransaction.error)
        budgetTransaction.oncomplete = () => {
          recurringTransaction.onerror = () => reject(recurringTransaction.error)
          recurringTransaction.oncomplete = () => {
            quickAddTransaction.onerror = () => reject(quickAddTransaction.error)
            quickAddTransaction.oncomplete = () => resolve()
          }
        }
      }
    })
  }

  async clearAllData(): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const expenseTransaction = db.transaction([this.expenseStoreName], "readwrite")
      const expenseStore = expenseTransaction.objectStore(this.expenseStoreName)
      const expenseRequest = expenseStore.clear()

      const budgetTransaction = db.transaction([this.budgetStoreName], "readwrite")
      const budgetStore = budgetTransaction.objectStore(this.budgetStoreName)
      const budgetRequest = budgetStore.clear()

      const recurringTransaction = db.transaction([this.recurringStoreName], "readwrite")
      const recurringStore = recurringTransaction.objectStore(this.recurringStoreName)
      const recurringRequest = recurringStore.clear()

      const quickAddTransaction = db.transaction([this.quickAddStoreName], "readwrite")
      const quickAddStore = quickAddTransaction.objectStore(this.quickAddStoreName)
      const quickAddRequest = quickAddStore.clear()

      expenseTransaction.onerror = () => reject(expenseTransaction.error)
      budgetTransaction.onerror = () => reject(budgetTransaction.error)
      recurringTransaction.onerror = () => reject(recurringTransaction.error)
      quickAddTransaction.onerror = () => reject(quickAddTransaction.error)

      expenseRequest.onsuccess = () => {
        budgetRequest.onsuccess = () => {
          recurringRequest.onsuccess = () => {
            quickAddRequest.onsuccess = () => resolve()
          }
        }
      }
    })
  }

  async getAllBudgets(): Promise<Budget[]> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.budgetStoreName], "readonly")
      const store = transaction.objectStore(this.budgetStoreName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addBudget(budget: Budget): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.budgetStoreName], "readwrite")
      const store = transaction.objectStore(this.budgetStoreName)
      const request = store.add(budget)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updateBudget(budget: Budget): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.budgetStoreName], "readwrite")
      const store = transaction.objectStore(this.budgetStoreName)
      const request = store.put(budget)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deleteBudget(id: string): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.budgetStoreName], "readwrite")
      const store = transaction.objectStore(this.budgetStoreName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getBudgetByCategory(category: string): Promise<Budget | undefined> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.budgetStoreName], "readonly")
      const store = transaction.objectStore(this.budgetStoreName)
      const index = store.index("category")
      const request = index.get(category)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAllRecurringExpenses(): Promise<RecurringExpense[]> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.recurringStoreName], "readonly")
      const store = transaction.objectStore(this.recurringStoreName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addRecurringExpense(recurring: RecurringExpense): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.recurringStoreName], "readwrite")
      const store = transaction.objectStore(this.recurringStoreName)
      const request = store.add(recurring)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updateRecurringExpense(recurring: RecurringExpense): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.recurringStoreName], "readwrite")
      const store = transaction.objectStore(this.recurringStoreName)
      const request = store.put(recurring)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.recurringStoreName], "readwrite")
      const store = transaction.objectStore(this.recurringStoreName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getAllQuickAddOptions(): Promise<QuickAddOption[]> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.quickAddStoreName], "readonly")
      const store = transaction.objectStore(this.quickAddStoreName)
      const index = store.index("order")
      const request = index.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addQuickAddOption(option: QuickAddOption): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.quickAddStoreName], "readwrite")
      const store = transaction.objectStore(this.quickAddStoreName)
      const request = store.add(option)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updateQuickAddOption(option: QuickAddOption): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.quickAddStoreName], "readwrite")
      const store = transaction.objectStore(this.quickAddStoreName)
      const request = store.put(option)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deleteQuickAddOption(id: string): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.quickAddStoreName], "readwrite")
      const store = transaction.objectStore(this.quickAddStoreName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async initializeDefaultQuickAddOptions(): Promise<void> {
    const existingOptions = await this.getAllQuickAddOptions()
    if (existingOptions.length > 0) return // Already initialized

    const defaultOptions: Omit<QuickAddOption, "id" | "createdAt">[] = [
      {
        icon: "Coffee",
        label: "Coffee",
        amount: 5,
        category: "Food & Dining",
        description: "Coffee",
        order: 0,
      },
      {
        icon: "Utensils",
        label: "Lunch",
        amount: 15,
        category: "Food & Dining",
        description: "Lunch",
        order: 1,
      },
      {
        icon: "Car",
        label: "Gas",
        amount: 50,
        category: "Transportation",
        description: "Gas",
        order: 2,
      },
      {
        icon: "ShoppingBag",
        label: "Groceries",
        amount: 80,
        category: "Shopping",
        description: "Groceries",
        order: 3,
      },
      {
        icon: "Zap",
        label: "Utilities",
        amount: 120,
        category: "Bills & Utilities",
        description: "Utilities",
        order: 4,
      },
    ]

    for (const option of defaultOptions) {
      await this.addQuickAddOption({
        ...option,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      })
    }
  }

  async clearAllQuickAddOptions(): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.quickAddStoreName], "readwrite")
      const store = transaction.objectStore(this.quickAddStoreName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        // Store a flag in localStorage to indicate user has cleared all options
        if (typeof window !== 'undefined') {
          localStorage.setItem('quickAddOptionsCleared', 'true')
        }
        resolve()
      }
    })
  }

  async hasUserClearedOptions(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('quickAddOptionsCleared') === 'true'
    }
    return false
  }

  async resetClearedOptionsFlag(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quickAddOptionsCleared')
    }
  }
}

export const expenseDB = new ExpenseDB()
