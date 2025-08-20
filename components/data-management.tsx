"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Upload, Trash2, Database } from "lucide-react"
import { expenseDB } from "@/lib/db"
import type { Expense } from "@/lib/db"

interface DataManagementProps {
  expenses: Expense[]
  onDataImported: (expenses: Expense[]) => void
}

export function DataManagement({ expenses, onDataImported }: DataManagementProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const jsonData = await expenseDB.exportData()
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `expenses-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsImporting(true)
      try {
        const text = await file.text()
        await expenseDB.importData(text)
        const importedExpenses = await expenseDB.getAllExpenses()
        onDataImported(importedExpenses)
      } catch (error) {
        console.error("Import failed:", error)
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
  }

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to delete all expense data? This cannot be undone.")) {
      return
    }

    setIsClearing(true)
    try {
      await expenseDB.clearAllData()
      onDataImported([])
    } catch (error) {
      console.error("Clear data failed:", error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-secondary" />
          <span>Data Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={handleExport}
            disabled={isExporting || expenses.length === 0}
            variant="outline"
            className="glass-button bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>

          <Button
            onClick={handleImport}
            disabled={isImporting}
            variant="outline"
            className="glass-button bg-transparent"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Import"}
          </Button>

          <Button
            onClick={handleClearData}
            disabled={isClearing || expenses.length === 0}
            variant="destructive"
            className="glass-button"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isClearing ? "Clearing..." : "Clear All"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Your data is stored locally in IndexedDB for persistence. Use export/import for backups.
        </p>
      </CardContent>
    </Card>
  )
}
