"use client";

import React, { useMemo } from "react";

type UptimeContinuityProps = {
  data: {
    continuity: { h1: number; h6: number; h24: number };
    timeline: Array<{ timestamp: string; hasStats: boolean }>;
  };
};

export const UptimeContinuity = React.memo(function UptimeContinuity({
  data,
}: UptimeContinuityProps) {
  const getColor = (value: number) => {
    if (value >= 95) return "bg-green-500";
    if (value >= 80) return "bg-amber-500";
    return "bg-red-500";
  };

  const getTextColor = (value: number) => {
    if (value >= 95) return "text-green-700 dark:text-green-400";
    if (value >= 80) return "text-amber-700 dark:text-amber-400";
    return "text-red-700 dark:text-red-400";
  };

  // Create stepped timeline visualization - limit to 50 points for performance
  const timelineData = useMemo(() => {
    if (data.timeline.length <= 50) return data.timeline;
    const step = Math.ceil(data.timeline.length / 50);
    return data.timeline.filter(
      (_, i) => i % step === 0 || i === data.timeline.length - 1
    );
  }, [data.timeline]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Uptime Continuity
      </h2>

      {/* Three tiles */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-muted/50 dark:bg-muted/50 rounded-lg text-center">
          <div
            className={`text-2xl font-bold ${getTextColor(data.continuity.h1)}`}
          >
            {data.continuity.h1.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
            1h
          </div>
        </div>
        <div className="p-4 bg-muted/50 dark:bg-muted/50 rounded-lg text-center">
          <div
            className={`text-2xl font-bold ${getTextColor(data.continuity.h6)}`}
          >
            {data.continuity.h6.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
            6h
          </div>
        </div>
        <div className="p-4 bg-muted/90 dark:bg-muted/50 rounded-lg text-center">
          <div
            className={`text-2xl font-bold ${getTextColor(
              data.continuity.h24
            )}`}
          >
            {data.continuity.h24.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
            24h
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="text-xs text-muted-foreground dark:text-muted-foreground">
        Continuity measures the percentage of time stats were successfully
        collected from the node, not just raw uptime seconds.
      </div>

      {/* Mini timeline */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">
          Stats Collection Timeline (24h)
        </div>
        <div className="h-8 bg-muted rounded flex items-center gap-0.5 p-1">
          {timelineData.map((point, i) => (
            <div
              key={i}
              className={`flex-1 h-full rounded ${
                point.hasStats ? "bg-green-500" : "bg-red-500/30"
              }`}
              title={new Date(point.timestamp).toLocaleString()}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
