# Xpense

A modern expense tracker focused on simplicity, speed, and beautiful visuals.

## Features

- Expense Management: add, edit, delete; quick add; undo delete
- Budgets: weekly/monthly/yearly, progress bars, alerts (warning/danger/exceeded)
- Analytics: category breakdown, trends, comparisons, smart insights
- Recurring Expenses: subscriptions/bills with due statuses and one-tap execution
- Export/Import: JSON full backup and importable CSV (expenses, budgets, recurring, quick add)
- Reports: downloadable/printable HTML report with charts and summaries
- Search: desktop and mobile search that filters in real time
- Notifications: budget and recurring alerts (overdue/due soon)
- UI/UX: glassmorphism, responsive, accessible, dark theme

## Tech Stack

- Framework: Next.js 15 (App Router)
- Library: React 19 + TypeScript
- Styling: Tailwind CSS
- UI: Radix UI primitives + custom components
- Charts: Recharts
- Storage: IndexedDB (client-side persistence)
- Icons: Lucide React

## Getting Started

Prerequisites: Node.js 18+ and pnpm (or npm).

Install and run locally:

```bash
pnpm install
pnpm dev
```

Build and start production:

```bash
pnpm build
pnpm start
```
