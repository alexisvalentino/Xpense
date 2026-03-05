"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { Expense } from "@/lib/db"
import { getCategoryColor } from "@/lib/category-colors"

interface ExpenseChartProps {
  expenses: Expense[]
  compact?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
  }>
}

interface LabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}

export function ExpenseChart({ expenses, compact = false }: ExpenseChartProps) {
  // Group expenses by category
  const categoryData = expenses.reduce(
    (acc, expense) => {
      const existing = acc.find((item) => item.name === expense.category)
      if (existing) {
        existing.value += expense.amount
      } else {
        acc.push({
          name: expense.category,
          value: expense.amount,
        })
      }
      return acc
    },
    [] as { name: string; value: number }[],
  )

  // Sort by value descending
  categoryData.sort((a, b) => b.value - a.value)

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="glass-strong p-2 rounded-lg border border-white/10 shadow-xl backdrop-blur-md">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{data.name}</p>
          <p className="text-sm font-black text-secondary">${data.value.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) => {
    if (cx === undefined || cy === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined || percent === undefined) return null
    if (percent < 0.1 || compact) return null // Hide labels in compact mode

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-[10px] font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className={compact ? "h-full w-full" : "h-80"}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={compact ? 60 : 100}
            innerRadius={compact ? 35 : 40}
            stroke="none"
            dataKey="value"
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {!compact && (
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                color: "hsl(var(--foreground))",
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
