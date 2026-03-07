import { Skeleton } from "./skeleton"
import { Card, CardContent, CardHeader } from "./card"

// Skeleton for expense cards
export function ExpenseCardSkeleton() {
  return (
    <Card className="glass">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for budget cards
export function BudgetCardSkeleton() {
  return (
    <Card className="glass-strong bg-card/20 border-white/20 shadow-xl backdrop-blur-xl relative overflow-hidden group">
      {/* Top Glow Highlight */}
      <div
        className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
        style={{
          backgroundColor: "#22c55e",
          boxShadow: `0 0 20px 2px #22c55e`
        }}
      />
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full bg-secondary/10" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2 w-full bg-card/30" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for quick add buttons
export function QuickAddSkeleton() {
  return (
    <Card className="glass-strong bg-card/20 border-white/20 shadow-xl overflow-hidden group min-h-[220px] relative">
      {/* Top Glow Highlight */}
      <div
        className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
        style={{
          backgroundColor: "hsl(var(--secondary))",
          boxShadow: `0 0 20px 2px hsl(var(--secondary))`
        }}
      />
      <CardHeader className="p-3 md:p-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center space-y-3 p-4">
              <Skeleton className="h-10 w-10 rounded-xl bg-secondary/10" />
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for recurring expense cards
export function RecurringExpenseSkeleton() {
  return (
    <Card className="glass-strong bg-card/20 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
      {/* Top Glow Highlight */}
      <div
        className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
        style={{
          backgroundColor: "#22c55e",
          boxShadow: `0 0 20px 2px #22c55e`
        }}
      />
      <CardContent className="p-4 md:p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-2xl bg-card/10" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-2 w-full bg-card/30 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for analytics dashboard
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 md:mt-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-strong bg-card/20 border-border/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-8 w-8 rounded-lg bg-secondary/10" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="glass-strong bg-card/20 border-border/20 shadow-xl overflow-hidden group">
        {/* Top Glow Highlight */}
        <div
          className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500"
          style={{
            backgroundColor: "hsl(var(--secondary))",
            boxShadow: `0 0 20px 2px hsl(var(--secondary))`
          }}
        />
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="h-[250px] pt-4">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// Skeleton for expense form
export function ExpenseFormSkeleton() {
  return (
    <Card className="glass">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

// Main page skeleton
export function MainPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="md:ml-[240px] transition-all duration-300">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-4 space-y-4 md:space-y-4 max-w-7xl pb-safe pt-20 md:pt-10">
          {/* Header */}
          <div className="hidden md:flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Balance Card */}
          <Card className="relative overflow-hidden glass-strong border-white/20 shadow-2xl group min-h-[220px] md:min-h-[300px]">
            {/* Top Glow Highlight */}
            <div
              className="absolute top-0 left-0 w-full h-0.5 transition-all duration-500 z-20"
              style={{
                backgroundColor: "hsl(var(--secondary))",
                boxShadow: `0 0 20px 2px hsl(var(--secondary))`
              }}
            />
            <CardContent className="relative p-4 md:p-12 h-full flex flex-col justify-between overflow-hidden">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-[1px] w-8" />
                </div>
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-12 w-48 md:h-20 md:w-64" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-lg" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Add */}
          <QuickAddSkeleton />

          {/* Expense List */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ExpenseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}




