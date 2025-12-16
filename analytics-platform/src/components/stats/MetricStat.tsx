"use client";

import React from "react";

export type MetricStatProps = {
  label: string;
  value: React.ReactNode;
  progress?: number;
  highlight?: boolean;
};

export function MetricStat({
  label,
  value,
  progress,
  highlight = false,
}: MetricStatProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      {/* Value */}
      <div
        className={
          highlight
            ? "text-2xl font-bold text-foreground transition-all duration-300 ease-out"
            : "text-lg font-semibold text-foreground transition-all duration-300 ease-out"
        }
      >
        {value}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
