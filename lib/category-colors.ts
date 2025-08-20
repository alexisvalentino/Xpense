export const categoryColors: Record<string, string> = {
  "Food & Dining": "#ef4444", // red-500
  Transportation: "#3b82f6", // blue-500
  Shopping: "#8b5cf6", // violet-500
  Entertainment: "#f59e0b", // amber-500
  "Bills & Utilities": "#10b981", // emerald-500
  Healthcare: "#ec4899", // pink-500
  Travel: "#06b6d4", // cyan-500
  Education: "#84cc16", // lime-500
  Other: "#6b7280", // gray-500
}

export const getCategoryColor = (category: string): string => {
  return categoryColors[category] || categoryColors["Other"]
}
