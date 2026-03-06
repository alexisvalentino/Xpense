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
  const headers = ["Transaction Date", "Vendor/Description", "Amount (USD)", "Category", "Internal ID"]
  const rows = expenses.map((expense) => [
    new Date(expense.date).toISOString().split('T')[0],
    `"${expense.description.replace(/"/g, '""')}"`,
    expense.amount.toFixed(2),
    expense.category,
    expense.id,
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export function generateBudgetCSV(budgets: Budget[]): string {
  const headers = ["Category", "Spending Limit (USD)", "Reset Period", "Creation Date", "Internal ID"]
  const rows = budgets.map((budget) => [
    budget.category,
    budget.limit.toFixed(2),
    budget.period,
    new Date(budget.createdAt).toISOString().split('T')[0],
    budget.id
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export function generateRecurringCSV(recurring: RecurringExpense[]): string {
  const headers = ["Description", "Amount (USD)", "Category", "Frequency", "Next Due Date", "Status", "Internal ID"]
  const rows = recurring.map((expense) => [
    `"${expense.description.replace(/"/g, '""')}"`,
    expense.amount.toFixed(2),
    expense.category,
    expense.frequency,
    expense.nextDue,
    expense.isActive ? "Active" : "Paused",
    expense.id
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
  const headers = ["id", "icon", "label", "amount", "category", "description", "order", "createdAt"]
  const rows = quickAdd.map((option) => [
    option.id,
    option.icon,
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
      icon: quickAdd.icon || "ShoppingBag",
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
    <title>Xpense Insight Report - ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}</title>
    <style>
        :root {
            --background: #09090b;
            --foreground: #fafafa;
            --card: rgba(24, 24, 27, 0.4);
            --border: rgba(255, 255, 255, 0.1);
            --secondary: #9333ea;
            --muted: #71717a;
            --accent: #22c55e;
        }
        
        * { box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, system-ui, sans-serif;
            background-color: var(--background);
            color: var(--foreground);
            line-height: 1.5;
            margin: 0;
            padding: 40px 20px;
            -webkit-print-color-adjust: exact;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        header {
            margin-bottom: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border);
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-box {
            width: 40px;
            height: 40px;
            background: rgba(147, 51, 234, 0.1);
            border: 1px solid var(--border);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--secondary);
            font-size: 24px;
            font-weight: 900;
        }

        .brand h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            tracking: 0.2em;
        }

        .report-meta {
            text-align: right;
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.1em;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 32px;
        }

        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 24px;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(12px);
        }

        .glow-rail {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--secondary);
            box-shadow: 0 0 15px var(--secondary);
        }

        .stat-label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: var(--muted);
            letter-spacing: 0.1em;
            margin-bottom: 8px;
            display: block;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: -0.02em;
        }

        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 24px;
        }

        section h2 {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            color: var(--muted);
            letter-spacing: 0.2em;
            margin-bottom: 16px;
        }

        .category-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .category-name {
            font-size: 13px;
            font-weight: 700;
        }

        .category-amount {
            font-size: 13px;
            font-weight: 900;
            color: var(--secondary);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        th {
            text-align: left;
            padding: 12px;
            color: var(--muted);
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border-bottom: 1px solid var(--border);
        }

        td {
            padding: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            font-weight: 600;
        }

        .td-amount {
            font-weight: 900;
            text-align: right;
        }

        .tr-row:hover {
            background: rgba(255,255,255,0.02);
        }

        footer {
            margin-top: 60px;
            text-align: center;
            font-size: 10px;
            color: var(--muted);
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.2em;
        }

        @media print {
            body { background: white; color: black; padding: 0; }
            .card { border: 1px solid #ddd; backdrop-filter: none; background: white; }
            .glow-rail { display: none; }
            header, footer { border-color: #eee; }
        }

        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .main-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="brand">
                <div class="logo-box">X</div>
                <h1>Xpense</h1>
            </div>
            <div class="report-meta">
                Intelligence Briefing<br>
                ${new Date(dateRange.from).toLocaleDateString()} — ${new Date(dateRange.to).toLocaleDateString()}
            </div>
        </header>

        <div class="stats-grid">
            <div class="card">
                <div class="glow-rail"></div>
                <span class="stat-label">Total Outflow</span>
                <div class="stat-value">$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="card">
                <div class="glow-rail" style="background: var(--accent); box-shadow: 0 0 15px var(--accent);"></div>
                <span class="stat-label">Entries</span>
                <div class="stat-value">${expenses.length}</div>
            </div>
            <div class="card">
                <div class="glow-rail"></div>
                <span class="stat-label">Daily Avg</span>
                <div class="stat-value">$${analytics.averageDaily.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="card">
                <div class="glow-rail" style="background: var(--accent); box-shadow: 0 0 15px var(--accent);"></div>
                <span class="stat-label">Categories</span>
                <div class="stat-value">${Object.keys(categoryTotals).length}</div>
            </div>
        </div>

        <div class="main-grid">
            <section>
                <h2>Capital Allocation</h2>
                <div class="card">
                    ${Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([category, amount]) => `
                        <div class="category-item">
                            <span class="category-name">${category}</span>
                            <span class="category-amount">$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    `,
      )
      .join("")}
                </div>
            </section>

            <section>
                <h2>Transaction Ledger</h2>
                <div class="card" style="padding: 0;">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50)
      .map(
        (expense) => `
                                <tr class="tr-row">
                                    <td>${new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                                    <td>${expense.description}</td>
                                    <td class="td-amount">$${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            `,
      )
      .join("")}
                        </tbody>
                    </table>
                </div>
                ${expenses.length > 50 ? `<p style="font-size: 10px; color: var(--muted); text-align: center; margin-top: 12px; font-weight: 700; text-transform: uppercase;">Showing latest 50 of ${expenses.length} entries</p>` : ''}
            </section>
        </div>

        ${budgets.length > 0
      ? `
        <section style="margin-top: 32px;">
            <h2>Financial Thresholds (Budgets)</h2>
            <div class="card" style="padding: 0;">
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Threshold</th>
                            <th>Period</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${budgets.map(budget => {
        const spent = categoryTotals[budget.category] || 0;
        const percent = Math.min((spent / budget.limit) * 100, 100);
        const isOver = spent > budget.limit;
        return `
                            <tr class="tr-row">
                                <td>${budget.category}</td>
                                <td>$${budget.limit.toLocaleString()}</td>
                                <td>${budget.period}</td>
                                <td style="color: ${isOver ? '#ef4444' : '#22c55e'}">${isOver ? 'Exceeded' : 'Healthy'}</td>
                            </tr>
                        `;
      }).join("")}
                    </tbody>
                </table>
            </div>
        </section>
        `
      : ""
    }

        <footer>
            Generated via Xpense Intelligence Engine &bull; ${new Date(generatedAt).toLocaleString()}
        </footer>
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
      from: new Date(new Date(today).setDate(today.getDate() - today.getDay())).toISOString().split("T")[0],
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
