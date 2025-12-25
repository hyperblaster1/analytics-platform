"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type StoragePanelProps = {
  data: {
    committed: number | null;
    used: number | null;
    usedPercent: number | null;
    history: Array<{ timestamp: string; used: number | null }>;
  };
};

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "N/A";
  if (bytes >= 1_099_511_627_776)
    return `${(bytes / 1_099_511_627_776).toFixed(2)} TB`;
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}

export const StoragePanel = React.memo(function StoragePanel({
  data,
}: StoragePanelProps) {
  const chartData = useMemo(() => {
    const filtered = data.history.filter((point) => point.used !== null);
    // Limit to max 100 points for performance
    const limited =
      filtered.length > 100
        ? filtered.filter(
            (_, i) =>
              i % Math.ceil(filtered.length / 100) === 0 ||
              i === filtered.length - 1
          )
        : filtered;

    return limited.map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      used: point.used!,
      timeLabel: new Date(point.timestamp).toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data.history]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Storage Behavior
      </h2>

      {/* Storage info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted/50 dark:bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">
            Committed
          </div>
          <div className="text-lg font-semibold text-[var(--text-primary)]">
            {formatBytes(data.committed)}
          </div>
        </div>
        <div className="p-4 bg-muted/50 dark:bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">
            Used
          </div>
          <div className="text-lg font-semibold text-[var(--text-primary)]">
            {formatBytes(data.used)}
          </div>
        </div>
      </div>

      {/* Usage percentage */}
      {data.usedPercent !== null && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground dark:text-muted-foreground">
              Usage
            </span>
            <span className="font-medium text-[var(--text-primary)]">
              {data.usedPercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                data.usedPercent >= 90
                  ? "bg-red-500"
                  : data.usedPercent >= 70
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${data.usedPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Mini trend chart */}
      {chartData.length > 0 && (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                    return formatBytes(value);
                  }
                  return String(value);
                }}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="used"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});
