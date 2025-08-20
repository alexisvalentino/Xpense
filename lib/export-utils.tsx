import type { Expense, Budget, RecurringExpense } from "./db"
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
  const headers = ["Category", "Amount", "Period", "Created Date"]
  const rows = budgets.map((budget) => [budget.category, budget.amount.toString(), budget.period, budget.createdAt])

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
            <div class="value">$${analytics.dailyAverage.toLocaleString()}</div>
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
                            <td class="amount">$${budget.amount.toLocaleString()}</td>
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
