"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, FileSpreadsheet, Printer, Upload, Trash2 } from "lucide-react"
import type { Expense, Budget, RecurringExpense } from "@/lib/db"
import { expenseDB } from "@/lib/db"
import { calculateAnalytics } from "@/lib/analytics-utils"
import {
  generateCSV,
  generateBudgetCSV,
  generateRecurringCSV,
  generateImportableExpensesCSV,
  generateImportableBudgetsCSV,
  generateImportableRecurringCSV,
  generateImportableQuickAddCSV,
  parseExpensesFromCSV,
  parseBudgetsFromCSV,
  parseRecurringFromCSV,
  parseQuickAddFromCSV,
  generateReportHTML,
  downloadFile,
  printReport,
  getDateRangePresets,
  type ReportData,
} from "@/lib/export-utils"

interface DataExportProps {
  expenses: Expense[]
  budgets: Budget[]
  recurring: RecurringExpense[]
}

export function DataExport({ expenses, budgets, recurring }: DataExportProps) {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  const datePresets = getDateRangePresets()

  const getFilteredExpenses = () => {
    if (!dateFrom && !dateTo) return expenses

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      const fromDate = dateFrom ? new Date(dateFrom) : new Date("1900-01-01")
      const toDate = dateTo ? new Date(dateTo) : new Date("2100-12-31")

      return expenseDate >= fromDate && expenseDate <= toDate
    })
  }

  const handlePresetSelect = (preset: string) => {
    const presetData = datePresets[preset as keyof typeof datePresets]
    setDateFrom(presetData.from)
    setDateTo(presetData.to)
  }

  const handleExportCSV = async (type: "expenses" | "budgets" | "recurring" | "all") => {
    setIsExporting(true)
    try {
      const timestamp = new Date().toISOString().split("T")[0]

      switch (type) {
        case "expenses":
          const filteredExpenses = getFilteredExpenses()
          const csvContent = generateImportableExpensesCSV(filteredExpenses)
          downloadFile(csvContent, `expenses-importable-${timestamp}.csv`, "text/csv")
          break

        case "budgets":
          const budgetCSV = generateImportableBudgetsCSV(budgets)
          downloadFile(budgetCSV, `budgets-importable-${timestamp}.csv`, "text/csv")
          break

        case "recurring":
          const recurringCSV = generateImportableRecurringCSV(recurring)
          downloadFile(recurringCSV, `recurring-expenses-importable-${timestamp}.csv`, "text/csv")
          break

        case "all":
          const allData = {
            expenses: getFilteredExpenses(),
            budgets,
            recurring,
            quickAdd: await expenseDB.getAllQuickAddOptions(),
          }
          const jsonContent = JSON.stringify(allData, null, 2)
          downloadFile(jsonContent, `expense-data-${timestamp}.json`, "application/json")
          break
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateReport = async (action: "download" | "print") => {
    setIsExporting(true)
    try {
      const filteredExpenses = getFilteredExpenses()
      const analytics = calculateAnalytics(filteredExpenses)

      const reportData: ReportData = {
        expenses: filteredExpenses,
        budgets,
        recurring,
        analytics,
        dateRange: {
          from:
            dateFrom || filteredExpenses[filteredExpenses.length - 1]?.date || new Date().toISOString().split("T")[0],
          to: dateTo || filteredExpenses[0]?.date || new Date().toISOString().split("T")[0],
        },
        generatedAt: new Date().toISOString(),
      }

      const htmlContent = generateReportHTML(reportData)

      if (action === "download") {
        const timestamp = new Date().toISOString().split("T")[0]
        downloadFile(htmlContent, `expense-report-${timestamp}.html`, "text/html")
      } else {
        printReport(htmlContent)
      }
    } catch (error) {
      console.error("Report generation failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsExporting(true)
    try {
      const content = await file.text()
      let importedCount = 0

      // Check if it's a JSON file (contains expenses, budgets, etc.)
      if (content.trim().startsWith('{')) {
        try {
          const data = JSON.parse(content)

          // Import expenses
          if (data.expenses && Array.isArray(data.expenses)) {
            for (const expense of data.expenses) {
              try {
                await expenseDB.addExpense(expense)
                importedCount++
              } catch (error) {
                console.warn("Failed to import expense:", expense, error)
              }
            }
          }

          // Import budgets
          if (data.budgets && Array.isArray(data.budgets)) {
            for (const budget of data.budgets) {
              try {
                await expenseDB.addBudget(budget)
                importedCount++
              } catch (error) {
                console.warn("Failed to import budget:", budget, error)
              }
            }
          }

          // Import recurring expenses
          if (data.recurring && Array.isArray(data.recurring)) {
            for (const recurring of data.recurring) {
              try {
                await expenseDB.addRecurringExpense(recurring)
                importedCount++
              } catch (error) {
                console.warn("Failed to import recurring expense:", recurring, error)
              }
            }
          }

          // Import quick add options
          if (data.quickAdd && Array.isArray(data.quickAdd)) {
            for (const quickAdd of data.quickAdd) {
              try {
                await expenseDB.addQuickAddOption(quickAdd)
                importedCount++
              } catch (error) {
                console.warn("Failed to import quick add option:", quickAdd, error)
              }
            }
          }
        } catch (jsonError) {
          throw new Error("Invalid JSON format")
        }
      } else {
        // Handle CSV files
        const fileName = file.name.toLowerCase()
        
        if (fileName.includes('expenses') || fileName.includes('expense')) {
          const expenses = parseExpensesFromCSV(content)
          for (const expense of expenses) {
            try {
              await expenseDB.addExpense(expense)
              importedCount++
            } catch (error) {
              console.warn("Failed to import expense:", expense, error)
            }
          }
        } else if (fileName.includes('budget')) {
          const budgets = parseBudgetsFromCSV(content)
          for (const budget of budgets) {
            try {
              await expenseDB.addBudget(budget)
              importedCount++
            } catch (error) {
              console.warn("Failed to import budget:", budget, error)
            }
          }
        } else if (fileName.includes('recurring')) {
          const recurring = parseRecurringFromCSV(content)
          for (const recurringExpense of recurring) {
            try {
              await expenseDB.addRecurringExpense(recurringExpense)
              importedCount++
            } catch (error) {
              console.warn("Failed to import recurring expense:", recurringExpense, error)
            }
          }
        } else if (fileName.includes('quick') || fileName.includes('quickadd')) {
          const quickAdd = parseQuickAddFromCSV(content)
          for (const quickAddOption of quickAdd) {
            try {
              await expenseDB.addQuickAddOption(quickAddOption)
              importedCount++
            } catch (error) {
              console.warn("Failed to import quick add option:", quickAddOption, error)
            }
          }
        } else {
          throw new Error("Unrecognized CSV file type. Please use files exported from this app.")
        }
      }

      // Show success message
      alert(`Successfully imported ${importedCount} items! The page will refresh to show your data.`)
      
      // Refresh the page to show imported data
      window.location.reload()
    } catch (error) {
      console.error("Import failed:", error)
      alert(`Failed to import data: ${error.message}. Please check the file format and try again.`)
    } finally {
      setIsExporting(false)
      // Reset file input
      event.target.value = ""
    }
  }

  const handleClearAllData = async () => {
    if (!confirm("⚠️ WARNING: This will permanently delete ALL your data including expenses, budgets, recurring expenses, and quick add options. This action cannot be undone. Are you sure you want to continue?")) {
      return
    }

    if (!confirm("Are you absolutely sure? This will delete everything and cannot be recovered.")) {
      return
    }

    setIsExporting(true)
    try {
      await expenseDB.clearAllData()
      alert("All data has been cleared. The page will refresh.")
      window.location.reload()
    } catch (error) {
      console.error("Failed to clear data:", error)
      alert("Failed to clear data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5 text-secondary" />
          <span>Data Export & Reports</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Report Period</Label>
            <p className="text-sm text-muted-foreground">Select a date range for your reports and exports</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(datePresets).map(([key, preset]) => (
              <Button
                key={key}
                onClick={() => handlePresetSelect(key)}
                variant="outline"
                size="sm"
                className="glass bg-transparent rounded-full py-2 hover:bg-secondary/10 transition-all duration-200 hover:scale-105"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="glass"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Export Options */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Export Data</Label>
            <p className="text-sm text-muted-foreground">Download your data in various formats</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Button
               onClick={() => handleExportCSV("expenses")}
               disabled={isExporting}
               variant="outline"
               className="glass bg-transparent justify-start rounded-xl py-3 hover:bg-secondary/10 transition-all duration-200 hover:scale-105"
             >
               <FileSpreadsheet className="h-4 w-4 mr-2" />
               Export Expenses (Importable CSV)
             </Button>

             <Button
               onClick={() => handleExportCSV("budgets")}
               disabled={isExporting}
               variant="outline"
               className="glass bg-transparent justify-start rounded-xl py-3 hover:bg-secondary/10 transition-all duration-200 hover:scale-105"
             >
               <FileSpreadsheet className="h-4 w-4 mr-2" />
               Export Budgets (Importable CSV)
             </Button>

             <Button
               onClick={() => handleExportCSV("recurring")}
               disabled={isExporting}
               variant="outline"
               className="glass bg-transparent justify-start rounded-xl py-3 hover:bg-secondary/10 transition-all duration-200 hover:scale-105"
             >
               <FileSpreadsheet className="h-4 w-4 mr-2" />
               Export Recurring (Importable CSV)
             </Button>

            <Button
              onClick={() => handleExportCSV("all")}
              disabled={isExporting}
              variant="outline"
              className="glass bg-transparent justify-start rounded-xl py-3 hover:bg-secondary/10 transition-all duration-200 hover:scale-105"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All Data (JSON)
            </Button>
          </div>
        </div>

        <Separator />

        {/* Report Generation */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Generate Reports</Label>
            <p className="text-sm text-muted-foreground">Create detailed reports with charts and insights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => handleGenerateReport("download")}
              disabled={isExporting}
              className="bg-secondary hover:bg-secondary/90 justify-start rounded-xl py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download HTML Report
            </Button>

            <Button
              onClick={() => handleGenerateReport("print")}
              disabled={isExporting}
              variant="outline"
              className="glass bg-transparent justify-start rounded-xl py-3 hover:bg-secondary/10 transition-all duration-200 hover:scale-105"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        <Separator />

        {/* Import Data */}
        <div className="space-y-4">
                     <div>
             <Label className="text-base font-medium">Import Data</Label>
             <p className="text-sm text-muted-foreground">Import previously exported data (JSON or CSV format)</p>
           </div>

                     <div className="flex items-center space-x-4">
             <Input type="file" accept=".json,.csv" onChange={handleImportData} disabled={isExporting} className="glass rounded-xl" />
             <Button 
               disabled={isExporting} 
               variant="outline" 
               className="glass bg-transparent rounded-xl px-6 py-2 hover:bg-secondary/10 transition-all duration-200"
             >
               <Upload className="h-4 w-4 mr-2" />
               Import
             </Button>
           </div>
        </div>

        <Separator />

        {/* Data Management */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Data Management</Label>
            <p className="text-sm text-muted-foreground">Manage your data storage</p>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleClearAllData}
              disabled={isExporting}
              variant="outline" 
              className="glass bg-transparent text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl px-6 py-2 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </div>

        {/* Summary */}
        {(dateFrom || dateTo) && (
          <div className="p-4 glass-strong rounded-lg">
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Selected Period:</strong> {dateFrom ? new Date(dateFrom).toLocaleDateString() : "Beginning"} -{" "}
                {dateTo ? new Date(dateTo).toLocaleDateString() : "Today"}
              </p>
              <p>
                <strong>Expenses in Period:</strong> {getFilteredExpenses().length} transactions
              </p>
              <p>
                <strong>Total Amount:</strong> $
                {getFilteredExpenses()
                  .reduce((sum, expense) => sum + expense.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
