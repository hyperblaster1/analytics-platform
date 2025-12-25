"use client";

import React from "react";

type SuccessRateChartProps = {
  data: {
    rate24h: number;
    failures: Array<{ timestamp: string }>;
  };
};

export const SuccessRateChart = React.memo(function SuccessRateChart({
  data,
}: SuccessRateChartProps) {
  const getColor = (rate: number) => {
    if (rate >= 95) return "text-green-600 dark:text-green-400";
    if (rate >= 80) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBarColor = (rate: number) => {
    if (rate >= 95) return "bg-green-500";
    if (rate >= 80) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Success Rate
      </h2>

      {/* Rate display */}
      <div className="text-center py-4 bg-muted/50 dark:bg-muted/50 rounded-lg">
        <div className={`text-4xl font-bold ${getColor(data.rate24h)}`}>
          {data.rate24h.toFixed(1)}%
        </div>
        <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
          Rolling 24h success rate
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(
            data.rate24h
          )} transition-all duration-500`}
          style={{ width: `${data.rate24h}%` }}
        />
      </div>

      {/* Failures */}
      {data.failures.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-[var(--text-primary)]">
            Failures ({data.failures.length})
          </div>
          <div className="space-y-1">
            {data.failures.slice(0, 5).map((failure, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>{new Date(failure.timestamp).toLocaleString()}</span>
              </div>
            ))}
            {data.failures.length > 5 && (
              <div className="text-xs text-muted-foreground">
                +{data.failures.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltip explanation */}
      <div className="text-xs text-muted-foreground dark:text-muted-foreground italic">
        Failures represent missed data responses, not gossip visibility.
      </div>
    </div>
  );
});
