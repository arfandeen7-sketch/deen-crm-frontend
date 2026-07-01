import { Chart as ChartJS, TooltipItem, DefaultDataPoint } from "chart.js";

// Fixed categorical palette (max 8 colors)
export const CHART_COLORS = [
  "#6366f1", // Indigo
  "#0ea5e9", // Sky
  "#14b8a6", // Teal
  "#f59e0b", // Amber
  "#ef4444", // Rose
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#10b981", // Emerald
];

export const OTHER_COLOR = "#94a3b8"; // Slate 400 for "Other" grouping

// Semantic colors
export const SEMANTIC_COLORS = {
  success: "#10b981", // Emerald
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Rose
};

// Common Chart.js tooltip configuration
export const commonTooltipOptions = {
  backgroundColor: "rgba(15, 23, 42, 0.9)", // slate-900
  titleColor: "#f8fafc", // slate-50
  bodyColor: "#cbd5e1", // slate-300
  padding: 12,
  cornerRadius: 8,
  displayColors: true,
  boxPadding: 4,
};
