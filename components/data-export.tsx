"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, FileSpreadsheet, Printer, Upload, Trash2, Repeat, Target, Database, Calendar } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to import data: ${errorMessage}. Please check the file format and try again.`)
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
    <div className="space-y-6">
      {/* Main Export Card */}
      <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl">
        <CardHeader className="pb-4 md:pb-6">
          <CardTitle className="flex items-center space-x-3 text-xl md:text-2xl font-bold">
            <Download className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
            <span>Data Export & Import</span>
        </CardTitle>
          <p className="text-sm md:text-base text-muted-foreground">
            Export your data in various formats or import data from other sources
          </p>
      </CardHeader>
      <CardContent className="space-y-6">
          {/* Date Range Selection - Much Better Design */}
          <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-lg font-semibold">
                <Calendar className="h-5 w-5 text-secondary" />
                <span>Export Date Range</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose a specific date range or use a quick preset for your export
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Presets - Clean Dropdown */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Quick Presets</Label>
                <Select onValueChange={handlePresetSelect}>
                  <SelectTrigger className="glass-strong bg-card/20 border-border/30 h-12">
                    <SelectValue placeholder="Select a preset date range" />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    {Object.entries(datePresets).map(([key, preset]) => (
                      <SelectItem key={key} value={key} className="glass-dropdown-item">
                        <div className="flex items-center justify-between w-full">
                          <span>{key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {preset.from} - {preset.to}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range - Clean and Simple */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Custom Date Range</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-from" className="text-xs text-muted-foreground">From Date</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="glass-strong bg-card/20 border-border/30 h-12 text-foreground placeholder:text-muted-foreground focus:border-secondary/50 focus:ring-secondary/20 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to" className="text-xs text-muted-foreground">To Date</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="glass-strong bg-card/20 border-border/30 h-12 text-foreground placeholder:text-muted-foreground focus:border-secondary/50 focus:ring-secondary/20 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Current Selection Summary */}
              {(dateFrom || dateTo) && (
                <div className="flex items-center space-x-2 text-sm p-2 glass-strong bg-secondary/10 rounded-lg border border-secondary/30">
                  <Calendar className="h-4 w-4 text-secondary" />
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium text-foreground">
                    {dateFrom ? new Date(dateFrom).toLocaleDateString() : "Beginning"} - {dateTo ? new Date(dateTo).toLocaleDateString() : "Today"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options - Bento Grid */}
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-6 bg-secondary rounded-full"></div>
              <h3 className="text-lg font-semibold text-foreground">Export Options</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => handleExportCSV("expenses")}>
                <CardContent className="p-4 text-center space-y-3">
                  <FileText className="h-6 w-6 text-secondary mx-auto" />
          <div>
                    <h4 className="font-semibold text-foreground text-sm">Expenses CSV</h4>
                    <p className="text-xs text-muted-foreground">Download all expenses</p>
          </div>
                </CardContent>
              </Card>

              <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => handleExportCSV("budgets")}>
                <CardContent className="p-4 text-center space-y-3">
                  <Target className="h-6 w-6 text-secondary mx-auto" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Budgets CSV</h4>
                    <p className="text-xs text-muted-foreground">Export budget settings</p>
        </div>
                </CardContent>
              </Card>

              <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => handleExportCSV("recurring")}>
                <CardContent className="p-4 text-center space-y-3">
                  <Repeat className="h-6 w-6 text-secondary mx-auto" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Recurring CSV</h4>
                    <p className="text-xs text-muted-foreground">Export templates</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => handleExportCSV("all")}>
                <CardContent className="p-4 text-center space-y-3">
                  <Database className="h-6 w-6 text-secondary mx-auto" />
          <div>
                    <h4 className="font-semibold text-foreground text-sm">All Data JSON</h4>
                    <p className="text-xs text-muted-foreground">Complete backup</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Report Generation - Bento Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => handleGenerateReport("download")}>
              <CardContent className="p-6 text-center space-y-4">
                <FileText className="h-8 w-8 text-secondary mx-auto" />
                <div>
                  <h4 className="font-semibold text-foreground text-lg">Download HTML Report</h4>
                  <p className="text-sm text-muted-foreground">Generate and download detailed report</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => handleGenerateReport("print")}>
              <CardContent className="p-6 text-center space-y-4">
                <Printer className="h-8 w-8 text-secondary mx-auto" />
                <div>
                  <h4 className="font-semibold text-foreground text-lg">Print Report</h4>
                  <p className="text-sm text-muted-foreground">Print directly or save as PDF</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Import Section - Bento Style */}
          <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                <div className="w-1 h-4 bg-secondary rounded-full"></div>
                <span>Import Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Upload className="h-6 w-6 text-secondary" />
                     <div>
                  <h4 className="font-semibold text-foreground">Import from JSON file</h4>
                  <p className="text-sm text-muted-foreground">Restore your data from a backup</p>
                </div>
           </div>
              <p className="text-sm text-muted-foreground">
                Import expenses, budgets, recurring expenses, and quick add options from a previously exported JSON file.
              </p>
              <div className="flex items-center space-x-3">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="glass-strong bg-card/20 border-border/30 flex-1 h-11 text-foreground placeholder:text-muted-foreground focus:border-secondary/50 focus:ring-secondary/20"
                  placeholder="Choose a JSON file to import..."
                />
             <Button 
               variant="outline" 
                  onClick={() => document.getElementById("import-file")?.click()}
                  className="glass-strong bg-card/20 border-border/30 hover:border-secondary/50 hover:bg-secondary/10 text-foreground hover:text-secondary px-6 h-11 transition-all duration-200"
             >
                  Browse
             </Button>
           </div>
            </CardContent>
          </Card>

          {/* Data Management - Bento Style */}
          <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                <div className="w-1 h-4 bg-secondary rounded-full"></div>
                <span>Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your data storage and perform maintenance operations.
              </p>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleClearAllData}
              disabled={isExporting}
              variant="outline" 
                  className="glass-strong bg-card/20 border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10 text-destructive hover:text-destructive px-6 py-3 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div>
            </CardContent>
          </Card>

          {/* Export Summary - Enhanced */}
        {(dateFrom || dateTo) && (
            <Card className="glass-strong bg-secondary/10 border-secondary/30 shadow-lg backdrop-blur-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                  <FileText className="h-4 w-4 text-secondary" />
                  <span>Export Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 glass-strong bg-card/20 rounded-lg border border-border/30">
                    <span className="text-muted-foreground block mb-1">Selected Period</span>
                    <p className="font-semibold text-foreground">
                      {dateFrom ? new Date(dateFrom).toLocaleDateString() : "Beginning"} - {dateTo ? new Date(dateTo).toLocaleDateString() : "Today"}
                    </p>
                  </div>
                  <div className="p-3 glass-strong bg-card/20 rounded-lg border border-border/30">
                    <span className="text-muted-foreground block mb-1">Expenses in Period</span>
                    <p className="font-semibold text-foreground">{getFilteredExpenses().length} transactions</p>
                  </div>
                  <div className="p-3 glass-strong bg-card/20 rounded-lg border border-border/30">
                    <span className="text-muted-foreground block mb-1">Total Amount</span>
                    <p className="font-semibold text-foreground">
                      ${getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
              </CardContent>
            </Card>
        )}
      </CardContent>
    </Card>
    </div>
  )
}
