"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

type CreditsChartProps = {
  data: {
    current: number | null;
    delta24h: number | null;
    series20d: Array<{ timestamp: string; credits: number }>;
    series7d: Array<{ timestamp: string; credits: number }>;
  };
};

export const CreditsChart = React.memo(function CreditsChart({
  data,
}: CreditsChartProps) {
  const [range, setRange] = useState<"20d" | "7d">("20d");

  const series = range === "20d" ? data.series20d : data.series7d;
  const chartData = useMemo(() => {
    // Limit to max 200 points for performance
    const limitedSeries =
      series.length > 200
        ? series.filter(
            (_, i) =>
              i % Math.ceil(series.length / 200) === 0 ||
              i === series.length - 1
          )
        : series;

    return limitedSeries.map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      credits: point.credits,
      timeLabel: new Date(point.timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  }, [series]);

  // Determine label based on delta
  const delta = data.delta24h;
  let velocityLabel = "Stalled";
  if (delta !== null) {
    if (delta > 100) {
      velocityLabel = "Consistent";
    } else if (delta > 0) {
      velocityLabel = "Bursty";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Credits Velocity
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setRange("7d")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              range === "7d"
                ? "bg-primary text-white dark:text-foreground"
                : "bg-muted dark:bg-muted/50 text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/70"
            }`}
          >
            7d
          </button>
          <button
            onClick={() => setRange("20d")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              range === "20d"
                ? "bg-primary text-white dark:text-foreground"
                : "bg-muted dark:bg-muted/50 text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/70"
            }`}
          >
            20d
          </button>
        </div>
      </div>

      {/* Delta display */}
      <div className="flex items-center gap-4">
        <div>
          <span className="text-sm text-muted-foreground">24h change: </span>
          <span className="text-sm font-semibold">
            {delta !== null
              ? `${delta > 0 ? "+" : "-"}${delta} credits`
              : "N/A"}
          </span>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Label: </span>
          <span className="text-sm font-medium">{velocityLabel}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="creditsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--primary)"
                  stopOpacity={0.3}
                />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              minTickGap={20}
            />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.375rem",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: unknown) => {
                if (typeof value === "number") {
                  return `${value.toLocaleString()} credits`;
                }
                return String(value);
              }}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="credits"
              stroke="var(--primary)"
              fill="url(#creditsGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
