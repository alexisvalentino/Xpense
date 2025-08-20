"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, FileSpreadsheet, Printer, Upload } from "lucide-react"
import type { Expense, Budget, RecurringExpense } from "@/lib/db"
import { expenseDB } from "@/lib/db"
import { calculateAnalytics } from "@/lib/analytics-utils"
import {
  generateCSV,
  generateBudgetCSV,
  generateRecurringCSV,
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
          const csvContent = generateCSV(filteredExpenses)
          downloadFile(csvContent, `expenses-${timestamp}.csv`, "text/csv")
          break

        case "budgets":
          const budgetCSV = generateBudgetCSV(budgets)
          downloadFile(budgetCSV, `budgets-${timestamp}.csv`, "text/csv")
          break

        case "recurring":
          const recurringCSV = generateRecurringCSV(recurring)
          downloadFile(recurringCSV, `recurring-expenses-${timestamp}.csv`, "text/csv")
          break

        case "all":
          const allData = {
            expenses: getFilteredExpenses(),
            budgets,
            recurring,
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
      const data = JSON.parse(content)

      // Import expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const expense of data.expenses) {
          await expenseDB.addExpense(expense)
        }
      }

      // Import budgets
      if (data.budgets && Array.isArray(data.budgets)) {
        for (const budget of data.budgets) {
          await expenseDB.addBudget(budget)
        }
      }

      // Import recurring expenses
      if (data.recurring && Array.isArray(data.recurring)) {
        for (const recurring of data.recurring) {
          await expenseDB.addRecurringExpense(recurring)
        }
      }

      // Refresh the page to show imported data
      window.location.reload()
    } catch (error) {
      console.error("Import failed:", error)
      alert("Failed to import data. Please check the file format.")
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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(datePresets).map(([key, preset]) => (
              <Button
                key={key}
                onClick={() => handlePresetSelect(key)}
                variant="outline"
                size="sm"
                className="glass bg-transparent"
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
              className="glass bg-transparent justify-start"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Expenses (CSV)
            </Button>

            <Button
              onClick={() => handleExportCSV("budgets")}
              disabled={isExporting}
              variant="outline"
              className="glass bg-transparent justify-start"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Budgets (CSV)
            </Button>

            <Button
              onClick={() => handleExportCSV("recurring")}
              disabled={isExporting}
              variant="outline"
              className="glass bg-transparent justify-start"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Recurring (CSV)
            </Button>

            <Button
              onClick={() => handleExportCSV("all")}
              disabled={isExporting}
              variant="outline"
              className="glass bg-transparent justify-start"
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
              className="bg-secondary hover:bg-secondary/90 justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download HTML Report
            </Button>

            <Button
              onClick={() => handleGenerateReport("print")}
              disabled={isExporting}
              variant="outline"
              className="glass bg-transparent justify-start"
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
            <p className="text-sm text-muted-foreground">Import previously exported data (JSON format)</p>
          </div>

          <div className="flex items-center space-x-4">
            <Input type="file" accept=".json" onChange={handleImportData} disabled={isExporting} className="glass" />
            <Button disabled={isExporting} variant="outline" className="glass bg-transparent">
              <Upload className="h-4 w-4 mr-2" />
              Import
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
