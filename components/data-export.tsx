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
import { useToast } from "@/components/ui/toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

interface DataExportProps {
  expenses: Expense[]
  budgets: Budget[]
  recurring: RecurringExpense[]
}

export function DataExport({ expenses, budgets, recurring }: DataExportProps) {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const { toast } = useToast()

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

  const handleExportCSV = async (type: "expenses" | "budgets" | "recurring" | "quickadd" | "all") => {
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

        case "quickadd":
          const quickAddData = await expenseDB.getAllQuickAddOptions()
          const quickAddCSV = generateImportableQuickAddCSV(quickAddData)
          downloadFile(quickAddCSV, `quickadd-importable-${timestamp}.csv`, "text/csv")
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

      toast({
        message: "Export successful",
        description: `Your ${type === 'all' ? 'data backup' : type} has been downloaded.`,
        type: "success",
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        message: "Export failed",
        description: "There was an error generating your file.",
        type: "error",
      })
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

      toast({
        message: action === "download" ? "Report downloaded" : "Printing report...",
        type: "success",
      })
    } catch (error) {
      console.error("Report generation failed:", error)
      toast({
        message: "Report failed",
        description: "Failed to generate report.",
        type: "error",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsExporting(true)
    try {
      setSelectedFileName(file.name)
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
      toast({
        message: "Import successful",
        description: `Successfully imported ${importedCount} items! Refreshing to update dashboard...`,
        type: "success",
      })

      // Refresh the page after a short delay to allow toast to be seen
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Import failed:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      toast({
        message: "Import failed",
        description: errorMessage,
        type: "error",
      })
    } finally {
      setIsExporting(false)
      // Reset file input and state
      event.target.value = ""
      setSelectedFileName(null)
    }
  }

  const handleClearAllData = async () => {
    setIsConfirmOpen(true)
  }

  const confirmClearAll = async () => {
    setIsExporting(true)
    try {
      await expenseDB.clearAllData()
      toast({
        message: "All data cleared",
        description: "Your dashboard has been reset. Refreshing...",
        type: "info",
      })

      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Failed to clear data:", error)
      toast({
        message: "Error",
        description: "Failed to clear data records.",
        type: "error",
      })
    } finally {
      setIsExporting(false)
      setIsConfirmOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl font-bold">
            <Download className="h-6 w-6 text-secondary" />
            <span>Reports & Data</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate detailed reports or manage your data backups
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Top Section: Date Selection & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary" />
                  Visual Report Period
                </Label>
                <div className="flex gap-2">
                  {Object.entries(datePresets).slice(0, 3).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePresetSelect(key)}
                      className="text-[10px] uppercase tracking-wider h-6 px-2 hover:bg-secondary/10 hover:text-secondary"
                    >
                      {key.split('-').map(w => w[0]).join('')}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="glass-strong bg-card/10 border-border/20 h-11 text-xs"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="glass-strong bg-card/10 border-border/20 h-11 text-xs"
                />
              </div>
            </div>

            <div className="glass-strong bg-secondary/5 border border-secondary/20 rounded-xl p-4 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Scope Summary</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">${getFilteredExpenses().reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">in {getFilteredExpenses().length} items</span>
              </div>
            </div>
          </div>

          <Separator className="bg-border/20" />

          {/* Primary Actions: The Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* BIG CARD: Intelligence Report */}
            <Card className="lg:col-span-1 glass-strong bg-secondary/10 border-secondary/20 shadow-lg hover:shadow-secondary/5 transition-all duration-300 overflow-hidden group">
              <CardContent className="p-5 md:p-6 flex flex-col h-full">
                <div className="mb-4">
                  <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center mb-3">
                    <FileText className="h-5 w-5 text-secondary" />
                  </div>
                  <h4 className="text-base md:text-lg font-bold text-foreground">Visual Intelligence</h4>
                  <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">Full analytics report with charts and categorized spending breakdowns.</p>
                </div>
                <div className="mt-auto flex gap-2">
                  <Button
                    onClick={() => handleGenerateReport("download")}
                    className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xs h-10 font-bold"
                  >
                    <Download className="mr-2 h-3.5 w-3.5" /> Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport("print")}
                    className="aspect-square p-0 border-secondary/30 text-secondary hover:bg-secondary/10 h-10 w-10 shrink-0"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CARD: Spreadsheet */}
            <Card className="glass-strong bg-card/10 border-border/20 hover:border-secondary/30 transition-all cursor-pointer group" onClick={() => handleExportCSV("expenses")}>
              <CardContent className="p-5 md:p-6 flex flex-row sm:flex-col justify-between items-center sm:items-start h-full gap-4">
                <div className="flex items-center sm:block gap-4">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground group-hover:text-secondary sm:mb-3 transition-colors shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Spreadsheet Export</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 sm:line-clamp-none">Download as CSV for Excel/Sheets.</p>
                  </div>
                </div>
                <div className="sm:mt-4 flex items-center text-[10px] font-black uppercase text-secondary sm:opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Download <Download className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>

            {/* CARD: Full Backup */}
            <Card className="glass-strong bg-card/10 border-border/20 hover:border-secondary/30 transition-all cursor-pointer group" onClick={() => handleExportCSV("all")}>
              <CardContent className="p-5 md:p-6 flex flex-row sm:flex-col justify-between items-center sm:items-start h-full gap-4">
                <div className="flex items-center sm:block gap-4">
                  <Database className="h-6 w-6 text-muted-foreground group-hover:text-secondary sm:mb-3 transition-colors shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Database Backup</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 sm:line-clamp-none">Snapshot of all expenses and settings.</p>
                  </div>
                </div>
                <div className="sm:mt-4 flex items-center text-[10px] font-black uppercase text-secondary sm:opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Generate <Database className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row: Minimal Maintenance */}
          <div className="pt-4 border-t border-border/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1 w-full max-w-xl">
                <div className="p-2 rounded-full bg-card/20 border border-border/10">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">Restore from Backup</span>
                    {selectedFileName && <span className="text-[10px] text-secondary animate-pulse">{selectedFileName}</span>}
                  </div>
                  <div className="relative group">
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json,.csv"
                      onChange={handleImportData}
                      className="hidden"
                    />
                    <div
                      onClick={() => document.getElementById('import-file')?.click()}
                      className="h-10 rounded-lg border border-dashed border-border/30 bg-card/5 hover:bg-card/10 hover:border-secondary/50 transition-all flex items-center justify-center cursor-pointer text-[11px] text-muted-foreground"
                    >
                      Drop file here or <span className="text-secondary font-bold mx-1">Browse</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Danger Zone</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllData}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-[11px] h-8"
                >
                  <Trash2 className="h-3 w-3 mr-2" /> Reset Dashboard
                </Button>
              </div>
            </div>
          </div>

          {/* Summary (Conditional) */}
          {(dateFrom || dateTo) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] text-muted-foreground px-4 py-2 glass-strong bg-secondary/5 rounded-lg border border-secondary/10">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{dateFrom || 'Start'} to {dateTo || 'Today'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                <span>{getFilteredExpenses().length} Transactions</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="font-bold text-secondary">${getFilteredExpenses().reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmClearAll}
        title="Clear All Data?"
        description="This will permanently delete all expenses, budgets, and recurring settings. This action cannot be undone."
        confirmText="Clear Everything"
        type="danger"
        isLoading={isExporting}
      />
    </div >
  )
}
