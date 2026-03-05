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
            <TrendingUp className="h-12 w-12 text-secondary mx-auto" />
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
      {/* Top Metrics Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Daily Average", value: `$${analytics.averageDaily.toFixed(0)}`, icon: DollarSign, trend: null },
          { label: "Avg Transaction", value: `$${analytics.averageTransaction.toFixed(0)}`, icon: Target, trend: null },
          { label: "Leading Category", value: analytics.topCategory || "N/A", icon: Calendar, trend: null },
          {
            label: "Monthly Momentum",
            value: `${analytics.monthlyComparison.changePercentage >= 0 ? "+" : ""}${analytics.monthlyComparison.changePercentage.toFixed(0)}%`,
            icon: analytics.monthlyComparison.changePercentage >= 0 ? TrendingUp : TrendingDown,
            trend: analytics.monthlyComparison.changePercentage >= 0 ? 'up' : 'down'
          }
        ].map((metric, i) => (
          <Card key={i} className="glass-strong bg-card/20 border-border/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                  <metric.icon className={`h-4 w-4 ${metric.trend === 'up' ? 'text-red-500' : metric.trend === 'down' ? 'text-green-500' : 'text-secondary'}`} />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{metric.label}</span>
              </div>
              <p className={`text-2xl font-black ${metric.trend === 'up' ? 'text-red-500' : metric.trend === 'down' ? 'text-green-500' : 'text-foreground'}`}>
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Trends */}
        <div className="lg:col-span-8 space-y-6">
          {/* Charts Bento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-strong bg-card/20 border-border/20 shadow-xl overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Weekly Trajectory
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="period" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={false} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-strong bg-card/20 border-border/20 shadow-xl overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Monthly Volume
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="period" hide />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "12px" }}
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[6, 6, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Comparative Intel */}
          <Card className="glass-strong bg-card/20 border-border/20 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Comparative Period Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">{analytics.monthlyComparison.currentMonth.month}</span>
                  <p className="text-xl font-black">${analytics.monthlyComparison.currentMonth.amount.toLocaleString()}</p>
                  <span className="text-[10px] text-muted-foreground">{analytics.monthlyComparison.currentMonth.transactionCount} entries</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">{analytics.monthlyComparison.previousMonth.month}</span>
                  <p className="text-xl font-black text-muted-foreground/60">${analytics.monthlyComparison.previousMonth.amount.toLocaleString()}</p>
                  <span className="text-[10px] text-muted-foreground">{analytics.monthlyComparison.previousMonth.transactionCount} entries</span>
                </div>
                <div className="bg-secondary/5 border border-secondary/10 rounded-2xl p-4 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-secondary">Delta</span>
                    {analytics.monthlyComparison.change >= 0 ? <ArrowUp className="h-3 w-3 text-red-500" /> : <ArrowDown className="h-3 w-3 text-green-500" />}
                  </div>
                  <p className={`text-xl font-black ${analytics.monthlyComparison.change >= 0 ? "text-red-500" : "text-green-500"}`}>
                    ${Math.abs(analytics.monthlyComparison.change).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Category Breakdown */}
        <div className="lg:col-span-4">
          <Card className="glass-strong bg-card/20 border-border/20 shadow-xl h-full flex flex-col">
            <CardHeader className="pb-6">
              <CardTitle className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Category Exposure</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              {analytics.categoryInsights.slice(0, 5).map((insight) => (
                <div key={insight.category} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(insight.category) }} />
                      <span className="text-sm font-bold">{insight.category}</span>
                    </div>
                    <span className="text-sm font-black">${insight.amount.toLocaleString()}</span>
                  </div>
                  <div className="relative h-1.5 w-full bg-card/30 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full transition-all duration-1000"
                      style={{
                        width: `${insight.percentage}%`,
                        backgroundColor: getCategoryColor(insight.category)
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium italic">
                    <span>{insight.transactionCount} records</span>
                    <span>{insight.percentage.toFixed(0)}% of total</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Smart Intelligence / AI Insights */}
      {insights.length > 0 && (
        <Card className="glass-strong bg-secondary/5 border-secondary/20 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-secondary/20" />
          <CardHeader className="pb-3 relative z-10 border-b border-white/5">
            <CardTitle className="flex items-center space-x-4">
              <div className="p-2.5 rounded-xl bg-secondary shadow-lg shadow-secondary/20">
                <Lightbulb className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-secondary block">Intelligence Briefing</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Autonomous Financial Forensics</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 py-8 px-6">
            <div className="max-w-4xl">
              <p className="text-xl md:text-2xl font-medium text-foreground/90 leading-tight tracking-tight italic">
                {insights[0]}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Processing Engine Active
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span>Deep Pattern Sync Complete</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
