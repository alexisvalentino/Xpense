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
    <div className="space-y-4 md:space-y-8">
      <Card className="glass-strong bg-card/20 border-white/20 shadow-xl backdrop-blur-xl relative overflow-hidden group mt-4 md:mt-0">
        {/* Top Glow Highlight */}
        <div
          className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
          style={{
            backgroundColor: "hsl(var(--secondary))",
            boxShadow: `0 0 20px 2px hsl(var(--secondary))`
          }}
        />
        <CardHeader className="p-3 md:p-6 pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl font-bold">
            <Download className="h-6 w-6 text-secondary" />
            <span>Reports & Data</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate detailed reports or manage your data backups
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Top Section: Date Selection - Refined Range Picker */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[10px] md:text-xs uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-secondary" />
                  Date Range Filter
                </Label>
                <div className="flex gap-1.5">
                  {Object.entries(datePresets).slice(0, 3).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePresetSelect(key)}
                      className="text-[9px] font-black uppercase tracking-tighter h-6 px-2.5 rounded-lg border border-white/5 hover:bg-secondary/10 hover:text-secondary hover:border-secondary/20 transition-all"
                    >
                      {key.split('-').map(w => w === 'last' ? 'L' : w === 'this' ? 'T' : w[0].toUpperCase()).join('')}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 glass-strong bg-card/10 border border-white/20 p-1.5 rounded-2xl">
                <div className="relative group cursor-pointer" onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input) input.showPicker();
                }}>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-muted-foreground/40 pointer-events-none group-focus-within:text-secondary/50 transition-colors">Start</span>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-14 pr-10 h-11 bg-transparent border-none text-[11px] font-bold focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer w-full"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none group-hover:text-secondary/50 transition-colors" />
                </div>
                <div className="relative group cursor-pointer border-t sm:border-t-0 sm:border-l border-white/5" onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input) input.showPicker();
                }}>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-muted-foreground/40 pointer-events-none group-focus-within:text-secondary/50 transition-colors">End</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-12 pr-10 h-11 bg-transparent border-none text-[11px] font-bold focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer w-full"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none group-hover:text-secondary/50 transition-colors" />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-64 glass-strong bg-secondary/5 border border-white/20 rounded-2xl p-4 flex flex-col justify-center min-h-[96px] relative overflow-hidden group">
              {/* Top Glow Highlight */}
              <div
                className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  boxShadow: `0 0 20px 2px hsl(var(--secondary))`
                }}
              />
              <span className="text-[9px] font-black uppercase tracking-widest text-secondary/60 mb-2">Scope Summary</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">${getFilteredExpenses().reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">/{getFilteredExpenses().length} items</span>
              </div>
            </div>
          </div>

          <Separator className="bg-border/20" />

          {/* Primary Actions: The Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* BIG CARD: Intelligence Report */}
            <Card className="lg:col-span-1 glass-strong bg-secondary/10 border-white/20 shadow-lg hover:shadow-secondary/5 transition-all duration-300 overflow-hidden group relative">
              {/* Top Glow Highlight */}
              <div
                className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  boxShadow: `0 0 20px 2px hsl(var(--secondary))`
                }}
              />
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
            <Card className="glass-strong bg-card/10 border-white/20 hover:border-secondary/30 transition-all cursor-pointer group relative overflow-hidden" onClick={() => handleExportCSV("expenses")}>
              {/* Top Glow Highlight */}
              <div
                className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500 opacity-0 group-hover:opacity-100"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  boxShadow: `0 0 20px 2px hsl(var(--secondary))`
                }}
              />
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
            <Card className="glass-strong bg-card/10 border-white/20 hover:border-secondary/30 transition-all cursor-pointer group relative overflow-hidden" onClick={() => handleExportCSV("all")}>
              {/* Top Glow Highlight */}
              <div
                className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500 opacity-0 group-hover:opacity-100"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  boxShadow: `0 0 20px 2px hsl(var(--secondary))`
                }}
              />
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
              <div className="flex items-center gap-6 flex-1 w-full max-w-2xl group/restore relative p-4 rounded-2xl glass-strong bg-card/5 border border-white/10 hover:border-white/20 transition-all">
                {/* Subtle Glow background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover/restore:opacity-100 transition-opacity" />

                <div className="p-3 rounded-full bg-card/20 border border-white/20 shadow-lg group-hover/restore:bg-secondary/10 group-hover/restore:border-secondary/30 transition-all shrink-0">
                  <Upload className="h-5 w-5 text-muted-foreground group-hover/restore:text-secondary transition-colors" />
                </div>
                <div className="flex-1 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Restore from Backup</span>
                    {selectedFileName && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-secondary">{selectedFileName}</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json,.csv"
                      onChange={handleImportData}
                      className="hidden"
                    />
                    <div
                      onClick={() => document.getElementById('import-file')?.click()}
                      className="h-11 rounded-xl border border-dashed border-white/20 bg-card/5 hover:bg-card/10 hover:border-secondary/50 transition-all flex items-center justify-center cursor-pointer text-[11px] text-muted-foreground gap-3 group/drop"
                    >
                      <Database className="h-3.5 w-3.5 opacity-40 group-hover/drop:opacity-100 transition-opacity" />
                      <span>Drop file here or <span className="text-secondary font-bold mx-1">Browse</span></span>
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
