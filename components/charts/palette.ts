import { Chart as ChartJS, TooltipItem, DefaultDataPoint } from "chart.js";

// Fixed categorical palette (max 8 colors)
export const CHART_COLORS = [
  "#1a1a1a", // Ink
  "#6f6f6a", // Ink 3
  "#3a3a38",
  "#a8a8a2",
  "#4a4a47", // Ink 2
  "#cfcfc9",
  "#8a8a85",
  "#e6e6e1" // Line
];

export const OTHER_COLOR = "#d4d4cf"; // "Other" grouping

// Semantic colors
export const SEMANTIC_COLORS = {
  success: "#1a1a1a",
  warning: "#8a8a85",
  danger: "#b42318"
};

// Common Chart.js tooltip configuration
export const commonTooltipOptions = {
  backgroundColor: "#1a1a1a",
  titleColor: "#ffffff",
  bodyColor: "#b9b9b4",
  padding: 12,
  cornerRadius: 12,
  displayColors: true,
  boxPadding: 4,
};
