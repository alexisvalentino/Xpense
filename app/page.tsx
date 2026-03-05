"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  Undo2,
  Search,
  Target,
  TrendingDown,
} from "lucide-react";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseChart } from "@/components/expense-chart";
import { ExpenseList } from "@/components/expense-list";
import type { FilterOptions } from "@/components/expense-filters";
import { BudgetManagement } from "@/components/budget-management";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { QuickAddButtons } from "@/components/quick-add-buttons";
import { RecurringExpenses } from "@/components/recurring-expenses";
import { DataExport } from "@/components/data-export";
import { ResponsiveNavigation } from "@/components/responsive-navigation";
import { ResponsiveHeader } from "@/components/responsive-header";
import { MainPageSkeleton } from "@/components/ui/skeleton-loaders";
import {
  expenseDB,
  type Expense,
  type Budget,
  type RecurringExpense,
} from "@/lib/db";
import { calculateBudgetProgress } from "@/lib/budget-utils";
import {
  filterExpenses,
  hasActiveFilters,
  getFilteredTotal,
  sortExpenses,
} from "@/lib/expense-utils";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "budgets" | "analytics" | "recurring" | "export"
  >("overview");
  const { toast } = useToast();
  const [recentCount, setRecentCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  type AppNotification = {
    id: string;
    title: string;
    message: string;
    severity: "info" | "warning" | "danger";
  };

  const filteredExpenses = useMemo(() => {
    let result = sortExpenses(expenses, "date", "desc");
    if (searchQuery) {
      result = filterExpenses(result, { search: searchQuery });
    }
    return result;
  }, [expenses, searchQuery]);

  const notifications = useMemo<AppNotification[]>(() => {
    const items: AppNotification[] = [];

    // Budget notifications
    for (const budget of budgets) {
      const progress = calculateBudgetProgress(budget, expenses);
      if (progress.status === "warning") {
        items.push({
          id: `budget-${budget.id}-warning`,
          title: `Budget warning: ${budget.category}`,
          message: `You\'ve used ${progress.percentage.toFixed(0)}% of your ${budget.category} budget. $${progress.remaining.toLocaleString()} remaining.`,
          severity: "warning",
        });
      } else if (progress.status === "danger") {
        items.push({
          id: `budget-${budget.id}-danger`,
          title: `Budget high: ${budget.category}`,
          message: `You\'re at ${progress.percentage.toFixed(0)}% of your ${budget.category} budget. Consider reducing spending.`,
          severity: "danger",
        });
      } else if (progress.status === "exceeded") {
        items.push({
          id: `budget-${budget.id}-exceeded`,
          title: `Budget exceeded: ${budget.category}`,
          message: `You exceeded the ${budget.category} budget by $${(progress.spent - budget.limit).toLocaleString()}.`,
          severity: "danger",
        });
      }
    }

    // Recurring due notifications (overdue, due today, in <=3 days)
    const getDueStatus = (nextDue: string) => {
      const due = new Date(nextDue);
      const today = new Date();
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { status: "overdue", text: "Overdue" };
      if (diffDays === 0) return { status: "due", text: "Due today" };
      if (diffDays <= 3)
        return { status: "soon", text: `Due in ${diffDays} days` };
      return { status: "future", text: `Due in ${diffDays} days` };
    };

    for (const r of recurringExpenses) {
      if (!r.isActive) continue;
      const due = getDueStatus(r.nextDue);
      if (
        due.status === "overdue" ||
        due.status === "due" ||
        due.status === "soon"
      ) {
        items.push({
          id: `recurring-${r.id}-${due.status}`,
          title: `Recurring: ${r.description}`,
          message: `${due.text} • $${r.amount} • ${r.category}`,
          severity: due.status === "soon" ? "info" : "warning",
        });
      }
    }

    return items;
  }, [budgets, expenses, recurringExpenses]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedExpenses, savedBudgets, savedRecurring] = await Promise.all(
          [
            expenseDB.getAllExpenses(),
            expenseDB.getAllBudgets(),
            expenseDB.getAllRecurringExpenses(),
          ],
        );

        setExpenses(savedExpenses);
        setBudgets(savedBudgets);
        setRecurringExpenses(savedRecurring);
      } catch (error) {
        console.error("Failed to load data:", error);
        // Fallback to localStorage for migration
        const localStorageExpenses = localStorage.getItem("expenses");
        if (localStorageExpenses) {
          const parsedExpenses = JSON.parse(localStorageExpenses);
          setExpenses(parsedExpenses);
          // Migrate to IndexedDB
          for (const expense of parsedExpenses) {
            await expenseDB.addExpense(expense);
          }
          localStorage.removeItem("expenses");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-toast notifications
  const [shownNotifs, setShownNotifs] = useState<Set<string>>(new Set());

  useEffect(() => {
    notifications.forEach((n) => {
      if (
        isMounted &&
        !shownNotifs.has(n.id) &&
        (n.severity === "danger" || n.severity === "warning")
      ) {
        toast({
          message: n.title,
          description: n.message,
          type: n.severity === "danger" ? "error" : "warning",
        });
        setShownNotifs((prev) => new Set(prev).add(n.id));
      }
    });
  }, [notifications, toast, isMounted, shownNotifs]);

  const addExpense = async (expense: Omit<Expense, "id">) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    };

    try {
      await expenseDB.addExpense(newExpense);
      setExpenses((prev) => [...prev, newExpense]);
      setShowForm(false);
      toast({
        message: "Expense added",
        description: `"${expense.description}" has been recorded.`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({
        message: "Error",
        description: "Failed to add expense. Please try again.",
        type: "error",
      });
    }
  };

  const editExpense = async (expense: Omit<Expense, "id">) => {
    if (!editingExpense) return;

    const updatedExpense = {
      ...expense,
      id: editingExpense.id,
    };

    try {
      await expenseDB.updateExpense(updatedExpense);
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === editingExpense.id ? updatedExpense : exp,
        ),
      );
      setShowForm(false);
      setEditingExpense(null);
      toast({
        message: "Expense updated",
        description: "Your changes have been saved.",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to update expense:", error);
      toast({
        message: "Error",
        description: "Failed to update expense. Please try again.",
        type: "error",
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const deleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find((exp) => exp.id === id);
    if (!expenseToDelete) return;

    try {
      await expenseDB.deleteExpense(id);
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));

      toast({
        message: "Expense deleted",
        description: `"${expenseToDelete.description}" has been removed.`,
        type: "info",
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await expenseDB.addExpense(expenseToDelete);
              setExpenses((prev) => [...prev, expenseToDelete]);
              toast({
                message: "Restored",
                description: "Expense has been restored successfully.",
                type: "success",
              });
            } catch (error) {
              console.error("Failed to restore expense:", error);
            }
          },
        },
      });
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  // Budget CRUD - lifted to app level
  const addBudget = async (data: Omit<Budget, "id" | "createdAt">) => {
    const newBudget: Budget = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    try {
      await expenseDB.addBudget(newBudget);
      setBudgets((prev) => [...prev, newBudget]);
      toast({
        message: "Budget created",
        description: `${data.category} budget set to $${data.limit.toLocaleString()}.`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to add budget:", error);
      toast({
        message: "Error",
        description: "Failed to create budget.",
        type: "error",
      });
    }
  };

  const updateBudget = async (budget: Budget) => {
    try {
      await expenseDB.updateBudget(budget);
      setBudgets((prev) => prev.map((b) => (b.id === budget.id ? budget : b)));
      toast({
        message: "Budget updated",
        description: `Changes to ${budget.category} budget saved.`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to update budget:", error);
      toast({
        message: "Error",
        description: "Failed to update budget.",
        type: "error",
      });
    }
  };

  const deleteBudgetById = async (id: string) => {
    try {
      await expenseDB.deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      toast({
        message: "Budget deleted",
        type: "info",
      });
    } catch (error) {
      console.error("Failed to delete budget:", error);
      toast({
        message: "Error",
        description: "Failed to delete budget.",
        type: "error",
      });
    }
  };

  // Recurring CRUD - lifted to app level
  const addRecurring = async (
    data: Omit<RecurringExpense, "id" | "createdAt">,
  ) => {
    const newRecurring: RecurringExpense = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    try {
      await expenseDB.addRecurringExpense(newRecurring);
      setRecurringExpenses((prev) => [...prev, newRecurring]);
      toast({
        message: "Recurring entry added",
        description: `"${data.description}" will now repeat.`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to add recurring expense:", error);
      toast({
        message: "Error",
        description: "Failed to add recurring expense.",
        type: "error",
      });
    }
  };

  const updateRecurring = async (recurring: RecurringExpense) => {
    try {
      await expenseDB.updateRecurringExpense(recurring);
      setRecurringExpenses((prev) =>
        prev.map((r) => (r.id === recurring.id ? recurring : r)),
      );
      toast({
        message: "Recurring entry updated",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to update recurring expense:", error);
      toast({
        message: "Error",
        description: "Failed to update recurring expense.",
        type: "error",
      });
    }
  };

  const deleteRecurringById = async (id: string) => {
    try {
      await expenseDB.deleteRecurringExpense(id);
      setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
      toast({
        message: "Recurring entry removed",
        type: "info",
      });
    } catch (error) {
      console.error("Failed to delete recurring expense:", error);
      toast({
        message: "Error",
        description: "Failed to delete recurring expense.",
        type: "error",
      });
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  if (isLoading) {
    return <MainPageSkeleton />;
  }

  const incrementRecent = () => setRecentCount((c) => c + 10);

  return (
    <div className="min-h-screen bg-background">
      <ResponsiveNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="md:ml-64 transition-all duration-300">
        <div className="container mx-auto px-4 md:px-6 py-2 md:py-6 space-y-2 md:space-y-6 max-w-7xl pb-safe pt-[54px] md:pt-24">
          <ResponsiveHeader />

          {activeTab === "budgets" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BudgetManagement
                expenses={expenses}
                isLoading={isLoading}
                budgets={budgets}
                onAddBudget={addBudget}
                onUpdateBudget={updateBudget}
                onDeleteBudget={deleteBudgetById}
              />
            </div>
          ) : activeTab === "analytics" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnalyticsDashboard expenses={expenses} isLoading={isLoading} budgets={budgets} />
            </div>
          ) : activeTab === "recurring" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RecurringExpenses
                onAddExpense={addExpense}
                recurringExpenses={recurringExpenses}
                onAddRecurring={addRecurring}
                onUpdateRecurring={updateRecurring}
                onDeleteRecurring={deleteRecurringById}
              />
            </div>
          ) : activeTab === "export" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DataExport
                expenses={expenses}
                budgets={budgets}
                recurring={recurringExpenses}
              />
            </div>
          ) : (
            <div className="space-y-3 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Dynamic Notification Hub */}
              {notifications.length > 0 && (
                <div className="flex gap-2.5 overflow-x-auto pb-4 pt-1 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl glass-strong border-[1px] transition-all duration-300 hover:scale-[1.02] cursor-default max-w-[280px] min-w-[240px] shadow-lg snap-center",
                        n.severity === "danger"
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : n.severity === "warning"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                            : "bg-secondary/10 border-secondary/20 text-secondary"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl flex-shrink-0",
                        n.severity === "danger" ? "bg-red-500/20" : n.severity === "warning" ? "bg-amber-500/20" : "bg-secondary/20"
                      )}>
                        {n.severity === "danger" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <Target className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase font-black leading-tight tracking-wider truncate">
                          {n.title}
                        </span>
                        <span className="text-[9px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {n.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Central Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6">
                {/* Balance & Quick Actions Tile */}
                <div className="lg:col-span-8 flex flex-col gap-3 md:gap-6">
                  <Card className="relative overflow-hidden glass-strong border-secondary/20 shadow-2xl flex-1 group">
                    <div className="absolute -right-16 -top-16 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <CardContent className="relative p-4 md:p-8 h-full flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0">
                          <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60">
                            Current Balance
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl xs:text-4xl md:text-7xl font-black tracking-tighter text-foreground drop-shadow-2xl">
                              {isMounted ? `$${totalExpenses.toLocaleString()}` : "$0"}
                            </span>
                            <span className="text-[10px] font-bold text-secondary opacity-80 sm:hidden">
                              USD
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowForm(true)}
                          className={cn(
                            "hidden md:flex bg-secondary hover:bg-secondary/90 text-secondary-foreground h-14 px-8 rounded-2xl font-black shadow-lg shadow-secondary/20 transition-all text-base"
                          )}
                        >
                          <Plus className="h-6 w-6 mr-2 stroke-[3px]" />
                          Quick Entry
                        </Button>
                      </div>

                      <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t border-white/5 grid grid-cols-2 md:flex md:flex-wrap gap-0 md:gap-6 items-center divide-x divide-white/5 md:divide-none">
                        <div className="flex items-center gap-2 pr-2 md:pr-0">
                          <div className="p-1.5 md:p-2 rounded-lg bg-green-500/10 shrink-0">
                            <TrendingDown className="h-3 md:h-5 w-3 md:w-5 text-green-500" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase block leading-tight">
                              Avg Daily
                            </span>
                            <span className="text-[10px] md:text-sm font-bold">$142.50</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pl-4 md:pl-0">
                          <div className="p-1.5 md:p-2 rounded-lg bg-red-500/10 shrink-0">
                            <TrendingUp className="h-3 md:h-5 w-3 md:w-5 text-red-500" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase block leading-tight">
                              Main Expense
                            </span>
                            <span className="text-[10px] md:text-sm font-bold truncate block">
                              Food
                            </span>
                          </div>
                        </div>
                        <div className="ml-auto hidden xl:block">
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                            System Live
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-3 -mx-4 px-4 md:mx-0 md:px-0">
                    <QuickAddButtons onQuickAdd={addExpense} />
                  </div>
                </div>

                {/* Categories & Insights Tile */}
                <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
                  <Card className="glass-strong bg-card/20 border-border/30 shadow-xl flex-1 flex flex-col min-h-[260px] md:min-h-[300px]">
                    <CardHeader className="p-4 md:p-6 pb-2">
                      <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-secondary" />
                        Allocation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center p-0">
                      <div className="w-full h-[180px] md:h-[220px]">
                        <ExpenseChart expenses={filteredExpenses} compact />
                      </div>
                      <div className="p-3 md:p-4 w-full grid grid-cols-3 border-t border-white/5 divide-x divide-white/5">
                        <div className="text-center px-1 overflow-hidden">
                          <span className="text-[8px] md:text-[9px] uppercase font-bold text-muted-foreground block truncate">
                            Top Source
                          </span>
                          <span className="text-[10px] md:text-xs font-bold block truncate">Groceries</span>
                        </div>
                        <div className="text-center px-1 overflow-hidden">
                          <span className="text-[8px] md:text-[9px] uppercase font-bold text-muted-foreground block truncate">
                            Efficiency
                          </span>
                          <span className="text-[10px] md:text-xs font-bold text-green-500 block truncate">
                            Gold
                          </span>
                        </div>
                        <div className="text-center px-1 overflow-hidden">
                          <span className="text-[8px] md:text-[9px] uppercase font-bold text-muted-foreground block truncate">
                            Items
                          </span>
                          <span className="text-[10px] md:text-xs font-bold block truncate">
                            {expenses.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Transactions Section */}
              {filteredExpenses.length > 0 ? (
                <Card className="glass-strong bg-card/20 border-border/20 shadow-xl overflow-hidden">
                  <CardHeader className="p-4 md:p-6 pb-2 md:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-secondary" />
                        Recent Activity
                      </CardTitle>
                    </div>
                    <div className="flex flex-col xs:flex-row items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                        <Input
                          placeholder="Search entries..."
                          className="pl-9 h-9 bg-card/10 border-white/5 rounded-xl text-xs focus:bg-card/20 focus:border-secondary/30 transition-all placeholder:text-muted-foreground/50 w-full"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-muted-foreground hover:text-secondary uppercase font-bold tracking-widest hidden sm:flex"
                      >
                        Statements
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-2 md:pt-4">
                    <ExpenseList
                      expenses={filteredExpenses.slice(0, recentCount)}
                      onDelete={deleteExpense}
                      onEdit={handleEdit}
                      isLoading={isLoading}
                    />
                    {filteredExpenses.length > recentCount && (
                      <div className="mt-8 flex justify-center">
                        <Button
                          onClick={incrementRecent}
                          variant="outline"
                          className="rounded-full px-8 h-10 border-border/20 bg-card/10 hover:bg-secondary/10 hover:text-secondary transition-all text-xs font-bold"
                        >
                          Load More Activities
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-strong bg-card/10 border-border/20 border-dashed p-20 text-center">
                  <div className="max-w-xs mx-auto space-y-6">
                    <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto border border-muted/20">
                      <DollarSign className="h-10 w-10 text-muted-foreground opacity-30" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">
                        Initialize Financial Ledger
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Start by recording your first transaction to unlock deep
                        insights.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowForm(true)}
                      className="bg-secondary text-secondary-foreground px-8 h-12 rounded-xl font-bold w-full"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Entry
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="w-full max-w-md glass-modal bg-card/40 border-border/50 shadow-2xl backdrop-blur-xl">
              <DialogHeader className="pb-2 md:pb-4">
                <DialogTitle className="text-base md:text-lg">
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {editingExpense
                    ? "Update your expense details"
                    : "Add a new expense to your tracker"}
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 md:p-6">
                <ExpenseForm
                  onSubmit={editingExpense ? editExpense : addExpense}
                  onCancel={handleFormCancel}
                  editExpense={editingExpense || undefined}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Mobile Floating Action Button */}
          <div className="md:hidden fixed bottom-6 right-6 z-40">
            <Button
              onClick={() => setShowForm(true)}
              className="h-14 w-14 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-secondary/30 hover:border-secondary/50 float-animation"
              size="lg"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
