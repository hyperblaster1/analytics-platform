"use client";

import React from "react";

type HealthSummaryProps = {
  data: {
    uptime: { continuity: { h1: number; h6: number; h24: number } };
    credits: { delta24h: number | null };
    successRate: { rate24h: number };
  };
};

export const HealthSummary = React.memo(function HealthSummary({
  data,
}: HealthSummaryProps) {
  // Calculate health score
  // Health = (Uptime continuity × 40%) + (Credits velocity × 35%) + (Success rate × 25%)

  const uptimeScore = data.uptime.continuity.h24; // Use 24h continuity (0-100)
  const uptimeFactor = (uptimeScore / 100) * 40;

  // Credits velocity: normalize delta24h to 0-100 scale
  // Assume positive delta is good, negative is bad
  // For simplicity, map -1000 to 0, +1000 to 100
  const creditsDelta = data.credits.delta24h ?? 0;
  const creditsVelocity = Math.max(
    0,
    Math.min(100, (creditsDelta + 1000) / 20)
  );
  const creditsFactor = (creditsVelocity / 100) * 35;

  const successRate = data.successRate.rate24h; // 0-100
  const successFactor = (successRate / 100) * 25;

  const healthScore = Math.round(uptimeFactor + creditsFactor + successFactor);
  const healthColor =
    healthScore >= 80
      ? "text-green-600 dark:text-green-400"
      : healthScore >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const healthBandColor =
    healthScore >= 80
      ? "#22c55e" // green-500
      : healthScore >= 50
      ? "#f59e0b" // amber-500
      : "#ef4444"; // red-500

  // Helper function to get color for contributory factors
  const getFactorColor = (value: number) => {
    if (value >= 80) return "#22c55e"; // green-500
    if (value >= 50) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };

  // Calculate SVG circle parameters for circular progress
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Health Summary
      </h2>

      {/* Circular progress bar with contributory factors */}
      <div className="border border-[var(--card-border)] bg-muted/70 dark:bg-muted/70 rounded-lg px-6 py-6">
        <div className="flex gap-6">
          {/* Circular progress bar */}
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="hsl(var(--muted-foreground) / 0.2)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={healthBandColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            {/* Score text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${healthColor}`}>
                {healthScore}
              </div>
              <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                Health Score
              </div>
            </div>
          </div>

          {/* Contributory factors */}
          <div className="flex-1 flex flex-col justify-center gap-4">
            {/* Credits velocity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Credits velocity (24h)
                </span>
                <span className="text-sm font-medium text-muted-foreground pr-1">
                  {creditsDelta !== null
                    ? `${creditsDelta > 0 ? "+" : ""}${creditsDelta}`
                    : "N/A"}
                </span>
              </div>
              <div className="h-2 bg-muted/70 dark:bg-muted/70 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, creditsVelocity))}%`,
                    backgroundColor: getFactorColor(creditsVelocity),
                  }}
                />
              </div>
            </div>

            {/* Uptime continuity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Uptime continuity (24h)
                </span>
                <span className="text-sm font-medium text-muted-foreground pr-1">
                  {uptimeScore.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted/70 dark:bg-muted/70 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, uptimeScore))}%`,
                    backgroundColor: getFactorColor(uptimeScore),
                  }}
                />
              </div>
            </div>

            {/* Success rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Success rate (24h)
                </span>
                <span className="text-sm font-medium text-muted-foreground pr-1">
                  {successRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted/70 dark:bg-muted/70 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, successRate))}%`,
                    backgroundColor: getFactorColor(successRate),
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Explanation - full width, not part of flex */}
        <div className="text-sm text-muted-foreground mt-2 border-[var(--card-border)]">
          Health = (Uptime continuity × 40%) + (Credits velocity × 35%) +
          (Success rate × 25%)
        </div>
      </div>
    </div>
  );
});
