"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CHART_COLORS, OTHER_COLOR, commonTooltipOptions } from "./palette";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export interface DistributionDatum {
  label: string;
  value: number;
}

export function DistributionBarChart({
  data,
  useCategoricalColors = false,
  accentColor = CHART_COLORS[0],
}: {
  data: DistributionDatum[];
  useCategoricalColors?: boolean;
  accentColor?: string;
}) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return { labels: [], datasets: [] };

    // Sort descending
    let sorted = [...data].sort((a, b) => b.value - a.value);

    // Group < 2% into Other
    const threshold = total * 0.02;
    const mainCategories = sorted.filter((d) => d.value >= threshold);
    const tailCategories = sorted.filter((d) => d.value < threshold);

    let processedData = [...mainCategories];

    if (tailCategories.length > 0) {
      const otherValue = tailCategories.reduce((sum, d) => sum + d.value, 0);
      processedData.push({ label: "Other", value: otherValue });
      // We can sort again to place Other correctly or keep it at the end
      processedData.sort((a, b) => b.value - a.value);
    }

    const labels = processedData.map((d) => d.label);
    const values = processedData.map((d) => d.value);

    const backgroundColors = processedData.map((d, i) => {
      if (d.label === "Other") return OTHER_COLOR;
      return useCategoricalColors ? CHART_COLORS[i % CHART_COLORS.length] : accentColor;
    });

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: backgroundColors,
          borderRadius: 4,
          barPercentage: 0.7,
        },
      ],
      total,
      rawProcessedData: processedData, // to use in custom labels
    };
  }, [data, useCategoricalColors, accentColor]);

  const options = useMemo(() => ({
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        ...commonTooltipOptions,
        callbacks: {
          label: (context: any) => {
            const value = context.raw as number;
            const percentage = ((value / (chartData.total || 1)) * 100).toFixed(1);
            return ` ${value} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        display: false, // Hide X axis
        beginAtZero: true,
      },
      y: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#475569", // slate-600
          font: {
            size: 12,
            weight: 500,
          },
          mirror: false,
          padding: 8,
          crossAlign: "near" as const,
        },
      },
    },
    layout: {
      padding: {
        right: 60, // Space for custom data labels drawn via plugin
      },
    },
    animation: {
      onComplete: (context: any) => {
        const chart = context.chart;
        const ctx = chart.ctx;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);

        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#64748b"; // slate-500
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          if (value === undefined || value === null) return;
          const pct = ((value / (chartData.total || 1)) * 100).toFixed(0);
          ctx.fillText(`${value} (${pct}%)`, bar.x + 8, bar.y);
        });
      },
    },
  }), [chartData.total]);

  if (data.length === 0 || chartData.total === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-slate-400">
        No data available
      </div>
    );
  }

  // Adjust height based on number of items to prevent squishing
  const height = Math.max(200, chartData.labels.length * 40);

  return (
    <div style={{ height: `${height}px`, width: "100%" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
