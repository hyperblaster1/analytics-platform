"use client";

import React from "react";

export type MetricStatProps = {
  label: string;
  value: React.ReactNode;
  progress?: number; // 0-100 for progress bar
  highlight?: boolean;
};

export function MetricStat({
  label,
  value,
  progress,
  highlight = false,
}: MetricStatProps) {
  return (
    <div className="flex justify-between items-center min-h-6">
      {/* Label */}
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      {/* Value - either text or progress bar with numeric value */}
      {progress !== undefined ? (
        <div className="flex items-center gap-2">
          {/* Numeric value */}
          <span className="text-xs text-muted-foreground font-medium">
            {progress != null ? `${Math.round(progress)}%` : "N/A"}
          </span>
          {/* Progress bar */}
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progress >= 80
                  ? "bg-green-500"
                  : progress >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }}
            />
          </div>
        </div>
      ) : (
        <div
          className={
            highlight
              ? "font-bold text-foreground transition-all duration-300 ease-out"
              : "font-semibold text-foreground transition-all duration-300 ease-out"
          }
        >
          {value}
        </div>
      )}
    </div>
  );
}
