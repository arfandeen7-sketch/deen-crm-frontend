"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ScriptableContext,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { commonTooltipOptions } from "./palette";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export interface LineChartDatum {
  label: string;
  value: number;
}

export function LineChart({
  data,
  color = "#6366f1", // indigo-500
}: {
  data: LineChartDatum[];
  color?: string;
}) {
  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: "Count",
          data: data.map((d) => d.value),
          borderColor: color,
          backgroundColor: (context: ScriptableContext<"line">) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, `${color}40`); // 25% opacity
            gradient.addColorStop(1, `${color}00`); // 0% opacity
            return gradient;
          },
          borderWidth: 2,
          fill: true,
          tension: 0.1, // Slight curve
          // Highlight spikes: if a point is significantly higher than its neighbors
          pointRadius: (context: ScriptableContext<"line">) => {
            const index = context.dataIndex;
            const value = context.dataset.data[index] as number;
            const prev = context.dataset.data[index - 1] as number | undefined;
            const next = context.dataset.data[index + 1] as number | undefined;
            
            let isSpike = false;
            if (prev !== undefined && next !== undefined) {
              isSpike = value > prev * 1.5 && value > next * 1.5;
            } else if (prev !== undefined) {
              isSpike = value > prev * 1.5;
            } else if (next !== undefined) {
              isSpike = value > next * 1.5;
            }

            return isSpike ? 5 : 0;
          },
          pointBackgroundColor: color,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [data, color]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        ...commonTooltipOptions,
        callbacks: {
          label: (context: any) => `Count: ${context.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: Math.max(6, Math.floor(data.length / 5)),
          color: "#94a3b8", // slate-400
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#f1f5f9", // slate-100
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
          precision: 0, // Integer only
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
  }), [data.length]);

  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
