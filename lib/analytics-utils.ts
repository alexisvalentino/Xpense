import type { Expense } from "@/lib/db"

export interface SpendingTrend {
  period: string
  amount: number
  change: number
  changePercentage: number
}

export interface CategoryInsight {
  category: string
  amount: number
  percentage: number
  averagePerTransaction: number
  transactionCount: number
  trend: "up" | "down" | "stable"
}

export interface MonthlyComparison {
  currentMonth: {
    month: string
    amount: number
    transactionCount: number
  }
  previousMonth: {
    month: string
    amount: number
    transactionCount: number
  }
  change: number
  changePercentage: number
}

export interface AnalyticsData {
  totalSpent: number
  averageDaily: number
  averageTransaction: number
  topCategory: string
  monthlyComparison: MonthlyComparison
  categoryInsights: CategoryInsight[]
  weeklyTrends: SpendingTrend[]
  monthlyTrends: SpendingTrend[]
}

export function calculateAnalytics(expenses: Expense[]): AnalyticsData {
  if (expenses.length === 0) {
    return {
      totalSpent: 0,
      averageDaily: 0,
      averageTransaction: 0,
      topCategory: "",
      monthlyComparison: {
        currentMonth: { month: "", amount: 0, transactionCount: 0 },
        previousMonth: { month: "", amount: 0, transactionCount: 0 },
        change: 0,
        changePercentage: 0,
      },
      categoryInsights: [],
      weeklyTrends: [],
      monthlyTrends: [],
    }
  }

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const averageTransaction = totalSpent / expenses.length

  const uniqueDates = new Set(expenses.map((e) => new Date(e.date).toDateString()))
  const daysWithExpenses = uniqueDates.size
  const averageDaily = totalSpent / Math.max(1, daysWithExpenses)

  // Calculate date range for daily average (unused but kept for future use)
  // const dates = expenses.map((e) => new Date(e.date))
  // const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  // const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
  // const daysDiff = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Category insights
  const categoryTotals = expenses.reduce(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const topCategory = Object.entries(categoryTotals).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

  const categoryInsights: CategoryInsight[] = Object.entries(categoryTotals)
    .map(([category, amount]) => {
      const categoryExpenses = expenses.filter((e) => e.category === category)
      const transactionCount = categoryExpenses.length
      const averagePerTransaction = amount / transactionCount
      const percentage = (amount / totalSpent) * 100

      const sortedExpenses = categoryExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      let trend: "up" | "down" | "stable" = "stable"
      if (sortedExpenses.length >= 4) {
        // Compare last 30 days vs previous 30 days
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        const recentExpenses = sortedExpenses.filter((e) => new Date(e.date) >= thirtyDaysAgo)
        const previousExpenses = sortedExpenses.filter((e) => {
          const date = new Date(e.date)
          return date >= sixtyDaysAgo && date < thirtyDaysAgo
        })

        if (recentExpenses.length > 0 && previousExpenses.length > 0) {
          const recentTotal = recentExpenses.reduce((sum, e) => sum + e.amount, 0)
          const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0)
          const change = ((recentTotal - previousTotal) / previousTotal) * 100

          if (change > 15) trend = "up"
          else if (change < -15) trend = "down"
        }
      }

      return {
        category,
        amount,
        percentage,
        averagePerTransaction,
        transactionCount,
        trend,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const currentMonthExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.date)
    return expenseDate >= currentMonth && expenseDate < nextMonth
  })

  const previousMonthExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.date)
    return expenseDate >= previousMonth && expenseDate < currentMonth
  })

  const currentMonthAmount = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const previousMonthAmount = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const monthlyChange = currentMonthAmount - previousMonthAmount
  const monthlyChangePercentage =
    previousMonthAmount > 0 ? (monthlyChange / previousMonthAmount) * 100 : currentMonthAmount > 0 ? 100 : 0

  const monthlyComparison: MonthlyComparison = {
    currentMonth: {
      month: currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      amount: currentMonthAmount,
      transactionCount: currentMonthExpenses.length,
    },
    previousMonth: {
      month: previousMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      amount: previousMonthAmount,
      transactionCount: previousMonthExpenses.length,
    },
    change: monthlyChange,
    changePercentage: monthlyChangePercentage,
  }

  const weeklyTrends: SpendingTrend[] = []
  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - i * 7)
    weekEnd.setHours(23, 59, 59, 999)

    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const weekExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date)
      return expenseDate >= weekStart && expenseDate <= weekEnd
    })

    const weekAmount = weekExpenses.reduce((sum, e) => sum + e.amount, 0)

    // Calculate change from previous week
    const prevWeekEnd = new Date(weekStart)
    prevWeekEnd.setDate(weekStart.getDate() - 1)
    prevWeekEnd.setHours(23, 59, 59, 999)

    const prevWeekStart = new Date(prevWeekEnd)
    prevWeekStart.setDate(prevWeekEnd.getDate() - 6)
    prevWeekStart.setHours(0, 0, 0, 0)

    const prevWeekExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date)
      return expenseDate >= prevWeekStart && expenseDate <= prevWeekEnd
    })

    const prevWeekAmount = prevWeekExpenses.reduce((sum, e) => sum + e.amount, 0)
    const change = weekAmount - prevWeekAmount
    const changePercentage = prevWeekAmount > 0 ? (change / prevWeekAmount) * 100 : weekAmount > 0 ? 100 : 0

    weeklyTrends.push({
      period: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      amount: weekAmount,
      change,
      changePercentage,
    })
  }

  const monthlyTrends: SpendingTrend[] = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)

    const monthExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date)
      return expenseDate >= monthStart && expenseDate <= monthEnd
    })

    const monthAmount = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

    // Calculate change from previous month
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0, 23, 59, 59, 999)

    const prevMonthExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date)
      return expenseDate >= prevMonthStart && expenseDate <= prevMonthEnd
    })

    const prevMonthAmount = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const change = monthAmount - prevMonthAmount
    const changePercentage = prevMonthAmount > 0 ? (change / prevMonthAmount) * 100 : monthAmount > 0 ? 100 : 0

    monthlyTrends.push({
      period: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      amount: monthAmount,
      change,
      changePercentage,
    })
  }

  return {
    totalSpent,
    averageDaily,
    averageTransaction,
    topCategory,
    monthlyComparison,
    categoryInsights,
    weeklyTrends,
    monthlyTrends,
  }
}

export function getInsightMessage(analytics: AnalyticsData): string[] {
  const insights: string[] = []

  if (analytics.monthlyComparison.changePercentage > 20) {
    insights.push(`Your spending increased by ${analytics.monthlyComparison.changePercentage.toFixed(0)}% this month`)
  } else if (analytics.monthlyComparison.changePercentage < -20) {
    insights.push(
      `Great job! You reduced spending by ${Math.abs(analytics.monthlyComparison.changePercentage).toFixed(0)}% this month`,
    )
  }

  if (analytics.topCategory) {
    const topCategoryInsight = analytics.categoryInsights[0]
    insights.push(
      `${analytics.topCategory} is your biggest expense category at ${topCategoryInsight.percentage.toFixed(0)}% of total spending`,
    )
  }

  const highSpendingCategories = analytics.categoryInsights.filter((c) => c.percentage > 30)
  if (highSpendingCategories.length > 0) {
    insights.push(
      `Consider reviewing your ${highSpendingCategories[0].category.toLowerCase()} expenses - they make up over 30% of your spending`,
    )
  }

  if (analytics.averageTransaction > 100) {
    insights.push(
      `Your average transaction is $${analytics.averageTransaction.toFixed(0)} - consider tracking smaller purchases too`,
    )
  }

  return insights
}
