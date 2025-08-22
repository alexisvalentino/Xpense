"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import type { Expense } from "@/lib/db"
import { calculateAnalytics, getInsightMessage } from "@/lib/analytics-utils"
import { getCategoryColor } from "@/lib/category-colors"
import { AnalyticsSkeleton } from "@/components/ui/skeleton-loaders"

interface AnalyticsDashboardProps {
  expenses: Expense[]
  isLoading?: boolean
}

export function AnalyticsDashboard({ expenses, isLoading = false }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => calculateAnalytics(expenses), [expenses])
  const insights = useMemo(() => getInsightMessage(analytics), [analytics])

  if (isLoading) {
    return <AnalyticsSkeleton />
  }

  if (expenses.length === 0) {
    return (
      <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl">
        <CardContent className="p-12 text-center">
          <div className="space-y-6">
            <div className="p-4 rounded-full bg-secondary/20 w-fit mx-auto border border-secondary/30">
              <TrendingUp className="h-12 w-12 text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">No data for analytics</h3>
              <p className="text-muted-foreground text-base">Add some expenses to see your spending insights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-secondary/20 border border-secondary/30">
              <DollarSign className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Daily Average</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-2">${analytics.averageDaily.toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-secondary/20 border border-secondary/30">
              <Target className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Avg Transaction</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-2">${analytics.averageTransaction.toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-secondary/20 border border-secondary/30">
              <Calendar className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Top Category</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-foreground mt-2">{analytics.topCategory || "N/A"}</p>
          </CardContent>
        </Card>

        <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg border ${
                analytics.monthlyComparison.changePercentage >= 0 
                  ? "bg-red-500/20 border-red-500/30" 
                  : "bg-green-500/20 border-green-500/30"
              }`}>
              {analytics.monthlyComparison.changePercentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              </div>
              <span className="text-sm text-muted-foreground">Monthly Change</span>
            </div>
            <p
              className={`text-2xl md:text-3xl font-bold mt-2 ${
                analytics.monthlyComparison.changePercentage >= 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              {analytics.monthlyComparison.changePercentage >= 0 ? "+" : ""}
              {analytics.monthlyComparison.changePercentage.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison */}
      <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-lg md:text-xl font-bold">
            <div className="p-2 rounded-lg bg-secondary/20 border border-secondary/30">
            <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <span>Monthly Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 glass-strong bg-card/20 rounded-lg border border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{analytics.monthlyComparison.currentMonth.month}</span>
                <span className="font-semibold text-lg">${analytics.monthlyComparison.currentMonth.amount.toLocaleString()}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {analytics.monthlyComparison.currentMonth.transactionCount} transactions
              </div>
            </div>
            <div className="space-y-3 p-4 glass-strong bg-card/20 rounded-lg border border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{analytics.monthlyComparison.previousMonth.month}</span>
                <span className="font-semibold text-lg">
                  ${analytics.monthlyComparison.previousMonth.amount.toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {analytics.monthlyComparison.previousMonth.transactionCount} transactions
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 glass-strong bg-card/20 rounded-lg border border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Change</span>
              <div className="flex items-center space-x-2">
                {analytics.monthlyComparison.change >= 0 ? (
                  <ArrowUp className="h-4 w-4 text-red-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-green-500" />
                )}
                <span
                  className={`font-semibold text-lg ${
                    analytics.monthlyComparison.change >= 0 ? "text-red-500" : "text-green-500"
                  }`}
                >
                  ${Math.abs(analytics.monthlyComparison.change).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Insights */}
      <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-lg md:text-xl font-bold">
            <div className="p-2 rounded-lg bg-secondary/20 border border-secondary/30">
            <TrendingUp className="h-5 w-5 text-secondary" />
            </div>
            <span>Category Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {analytics.categoryInsights.slice(0, 5).map((insight) => (
            <div key={insight.category} className="space-y-3 p-4 glass-strong bg-card/20 rounded-lg border border-border/30">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div
                    className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getCategoryColor(insight.category) }}
                    />
                  <span className="font-semibold text-base">{insight.category}</span>
                    <div className="flex items-center space-x-1">
                    {insight.trend === "up" && <ArrowUp className="h-4 w-4 text-red-500" />}
                    {insight.trend === "down" && <ArrowDown className="h-4 w-4 text-green-500" />}
                    {insight.trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">${insight.amount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{insight.percentage.toFixed(0)}% of total</div>
                </div>
              </div>
              <Progress value={insight.percentage} className="h-3" />
              <div className="text-sm text-muted-foreground">
                {insight.transactionCount} transactions • ${insight.averagePerTransaction.toFixed(0)} avg
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Spending Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base font-semibold">
              <div className="w-1 h-4 bg-secondary rounded-full"></div>
              <span>Weekly Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-strong bg-card/20 border-border/30 shadow-lg backdrop-blur-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base font-semibold">
              <div className="w-1 h-4 bg-secondary rounded-full"></div>
              <span>Monthly Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Spending Summary */}
      <Card className="glass-strong bg-card/20 border-border/30 shadow-xl backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-lg md:text-xl font-bold">
            <div className="p-2 rounded-lg bg-secondary/20 border border-secondary/30">
              <Lightbulb className="h-5 w-5 text-secondary" />
            </div>
            <span>Spending Summary</span>
            </CardTitle>
          <p className="text-sm text-muted-foreground">
            Key insights and patterns from your spending data
          </p>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Top Spending Category */}
            <div className="p-4 glass-strong bg-card/20 rounded-lg border border-border/30">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg bg-secondary/20 border border-secondary/30">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">Top Category</h4>
              </div>
              <p className="text-lg font-bold text-foreground mb-1">{analytics.topCategory || "N/A"}</p>
              <p className="text-xs text-muted-foreground">
                {analytics.categoryInsights.find(c => c.category === analytics.topCategory)?.percentage.toFixed(0) || 0}% of total spending
              </p>
            </div>

            {/* Average Daily Spending */}
            <div className="p-4 glass-strong bg-card/20 rounded-lg border border-border/30">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg bg-secondary/20 border border-secondary/30">
                  <Calendar className="h-4 w-4 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">Daily Average</h4>
              </div>
              <p className="text-lg font-bold text-foreground mb-1">${analytics.averageDaily.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">
                Based on {analytics.weeklyTrends.length} weeks of data
              </p>
            </div>

            {/* Monthly Comparison */}
            <div className="p-4 glass-strong bg-card/20 rounded-lg border border-border/30">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg border ${
                  analytics.monthlyComparison.changePercentage >= 0 
                    ? "bg-red-500/20 border-red-500/30" 
                    : "bg-green-500/20 border-green-500/30"
                }`}>
                  {analytics.monthlyComparison.changePercentage >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <h4 className="font-semibold text-foreground text-sm">Monthly Change</h4>
              </div>
              <p className={`text-lg font-bold mb-1 ${
                analytics.monthlyComparison.changePercentage >= 0 ? "text-red-500" : "text-green-500"
              }`}>
                {analytics.monthlyComparison.changePercentage >= 0 ? "+" : ""}
                {analytics.monthlyComparison.changePercentage.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">
                vs. previous month
              </p>
            </div>
          </div>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-foreground text-base">Smart Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((insight, index) => (
                  <div key={index} className="p-3 glass-strong bg-secondary/10 rounded-lg border border-secondary/30">
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground leading-relaxed">{insight}</p>
                    </div>
                </div>
              ))}
              </div>
            </div>
          )}
          </CardContent>
        </Card>
    </div>
  )
}
