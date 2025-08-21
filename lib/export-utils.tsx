import type { Expense, Budget, RecurringExpense, QuickAddOption } from "./db"
import type { AnalyticsData } from "./analytics-utils"

export interface ReportData {
  expenses: Expense[]
  budgets: Budget[]
  recurring: RecurringExpense[]
  analytics: AnalyticsData
  dateRange: {
    from: string
    to: string
  }
  generatedAt: string
}

// Export functions for viewing (existing)
export function generateCSV(expenses: Expense[]): string {
  const headers = ["Date", "Description", "Amount", "Category"]
  const rows = expenses.map((expense) => [
    expense.date,
    `"${expense.description.replace(/"/g, '""')}"`,
    expense.amount.toString(),
    expense.category,
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export function generateBudgetCSV(budgets: Budget[]): string {
  const headers = ["Category", "Limit", "Period", "Created Date"]
  const rows = budgets.map((budget) => [budget.category, budget.limit.toString(), budget.period, budget.createdAt])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export function generateRecurringCSV(recurring: RecurringExpense[]): string {
  const headers = ["Description", "Amount", "Category", "Frequency", "Next Due", "Active"]
  const rows = recurring.map((expense) => [
    `"${expense.description.replace(/"/g, '""')}"`,
    expense.amount.toString(),
    expense.category,
    expense.frequency,
    expense.nextDue,
    expense.isActive.toString(),
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

// New functions for importable CSV exports
export function generateImportableExpensesCSV(expenses: Expense[]): string {
  const headers = ["id", "date", "description", "amount", "category"]
  const rows = expenses.map((expense) => [
    expense.id,
    expense.date,
    `"${expense.description.replace(/"/g, '""')}"`,
    expense.amount.toString(),
    expense.category,
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export function generateImportableBudgetsCSV(budgets: Budget[]): string {
  const headers = ["id", "category", "limit", "period", "createdAt"]
  const rows = budgets.map((budget) => [
    budget.id,
    budget.category,
    budget.limit.toString(),
    budget.period,
    budget.createdAt,
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export function generateImportableRecurringCSV(recurring: RecurringExpense[]): string {
  const headers = ["id", "description", "amount", "category", "frequency", "nextDue", "isActive", "createdAt"]
  const rows = recurring.map((expense) => [
    expense.id,
    `"${expense.description.replace(/"/g, '""')}"`,
    expense.amount.toString(),
    expense.category,
    expense.frequency,
    expense.nextDue,
    expense.isActive.toString(),
    expense.createdAt,
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export function generateImportableQuickAddCSV(quickAdd: QuickAddOption[]): string {
  const headers = ["id", "label", "amount", "category", "description", "order", "createdAt"]
  const rows = quickAdd.map((option) => [
    option.id,
    `"${option.label.replace(/"/g, '""')}"`,
    option.amount.toString(),
    option.category,
    `"${option.description.replace(/"/g, '""')}"`,
    option.order.toString(),
    option.createdAt,
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

// CSV parsing functions for import
export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split('\n')
  return lines.map(line => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  })
}

export function parseExpensesFromCSV(csvContent: string): Expense[] {
  const rows = parseCSV(csvContent)
  if (rows.length < 2) return []
  
  const headers = rows[0]
  const dataRows = rows.slice(1)
  
  return dataRows.map(row => {
    const expense: any = {}
    headers.forEach((header, index) => {
      expense[header] = row[index]
    })
    
    return {
      id: expense.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: expense.date,
      description: expense.description,
      amount: parseFloat(expense.amount) || 0,
      category: expense.category,
      createdAt: expense.createdAt || new Date().toISOString(),
    } as Expense
  })
}

export function parseBudgetsFromCSV(csvContent: string): Budget[] {
  const rows = parseCSV(csvContent)
  if (rows.length < 2) return []
  
  const headers = rows[0]
  const dataRows = rows.slice(1)
  
  return dataRows.map(row => {
    const budget: any = {}
    headers.forEach((header, index) => {
      budget[header] = row[index]
    })
    
    return {
      id: budget.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      category: budget.category,
      limit: parseFloat(budget.limit) || 0,
      period: budget.period || 'monthly',
      createdAt: budget.createdAt || new Date().toISOString(),
    } as Budget
  })
}

export function parseRecurringFromCSV(csvContent: string): RecurringExpense[] {
  const rows = parseCSV(csvContent)
  if (rows.length < 2) return []
  
  const headers = rows[0]
  const dataRows = rows.slice(1)
  
  return dataRows.map(row => {
    const recurring: any = {}
    headers.forEach((header, index) => {
      recurring[header] = row[index]
    })
    
    return {
      id: recurring.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      description: recurring.description,
      amount: parseFloat(recurring.amount) || 0,
      category: recurring.category,
      frequency: recurring.frequency || 'monthly',
      nextDue: recurring.nextDue || new Date().toISOString().split('T')[0],
      isActive: recurring.isActive === 'true',
      createdAt: recurring.createdAt || new Date().toISOString(),
    } as RecurringExpense
  })
}

export function parseQuickAddFromCSV(csvContent: string): QuickAddOption[] {
  const rows = parseCSV(csvContent)
  if (rows.length < 2) return []
  
  const headers = rows[0]
  const dataRows = rows.slice(1)
  
  return dataRows.map(row => {
    const quickAdd: any = {}
    headers.forEach((header, index) => {
      quickAdd[header] = row[index]
    })
    
    return {
      id: quickAdd.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      label: quickAdd.label,
      amount: parseFloat(quickAdd.amount) || 0,
      category: quickAdd.category,
      description: quickAdd.description,
      order: parseInt(quickAdd.order) || 0,
      createdAt: quickAdd.createdAt || new Date().toISOString(),
    } as QuickAddOption
  })
}

export function generateReportHTML(data: ReportData): string {
  const { expenses, budgets, analytics, dateRange, generatedAt } = data

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const categoryTotals = expenses.reduce(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>,
  )

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Report - ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
        }
        .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .section-header {
            background: #f1f5f9;
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
        }
        .section-header h2 {
            margin: 0;
            color: #334155;
        }
        .section-content {
            padding: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
        }
        .amount {
            font-weight: 600;
            color: #dc2626;
        }
        .category-bar {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .category-name {
            width: 120px;
            font-weight: 500;
        }
        .category-amount {
            margin-left: auto;
            font-weight: 600;
            color: #2563eb;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding: 20px;
            background: white;
            border-radius: 8px;
        }
        @media print {
            body { background: white; }
            .section { box-shadow: none; border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Expense Report</h1>
        <p><strong>Period:</strong> ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}</p>
        <p><strong>Generated:</strong> ${new Date(generatedAt).toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Expenses</h3>
            <div class="value">$${totalExpenses.toLocaleString()}</div>
        </div>
        <div class="summary-card">
            <h3>Transactions</h3>
            <div class="value">${expenses.length}</div>
        </div>
        <div class="summary-card">
            <h3>Categories</h3>
            <div class="value">${Object.keys(categoryTotals).length}</div>
        </div>
        <div class="summary-card">
            <h3>Daily Average</h3>
            <div class="value">$${analytics.averageDaily.toLocaleString()}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <h2>Spending by Category</h2>
        </div>
        <div class="section-content">
            ${Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(
                ([category, amount]) => `
                <div class="category-bar">
                    <span class="category-name">${category}</span>
                    <span class="category-amount">$${amount.toLocaleString()}</span>
                </div>
            `,
              )
              .join("")}
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <h2>Recent Transactions</h2>
        </div>
        <div class="section-content">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${expenses
                      .slice(0, 20)
                      .map(
                        (expense) => `
                        <tr>
                            <td>${new Date(expense.date).toLocaleDateString()}</td>
                            <td>${expense.description}</td>
                            <td>${expense.category}</td>
                            <td class="amount">$${expense.amount.toLocaleString()}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    </div>

    ${
      budgets.length > 0
        ? `
    <div class="section">
        <div class="section-header">
            <h2>Budget Overview</h2>
        </div>
        <div class="section-content">
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Budget</th>
                        <th>Period</th>
                    </tr>
                </thead>
                <tbody>
                    ${budgets
                      .map(
                        (budget) => `
                        <tr>
                            <td>${budget.category}</td>
                            <td class="amount">$${budget.limit.toLocaleString()}</td>
                            <td>${budget.period}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    </div>
    `
        : ""
    }

    <div class="footer">
        <p>This report was generated automatically by your Expense Tracker app.</p>
    </div>
</body>
</html>
  `
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function printReport(htmlContent: string): void {
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }
}

export function getDateRangePresets() {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  return {
    "this-week": {
      label: "This Week",
      from: new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
    "this-month": {
      label: "This Month",
      from: new Date(currentYear, currentMonth, 1).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
    "last-month": {
      label: "Last Month",
      from: new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0],
      to: new Date(currentYear, currentMonth, 0).toISOString().split("T")[0],
    },
    "last-3-months": {
      label: "Last 3 Months",
      from: new Date(currentYear, currentMonth - 3, 1).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
    "this-year": {
      label: "This Year",
      from: new Date(currentYear, 0, 1).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
  }
}
