"use client";

import React, { useEffect, useState, useRef } from "react";
import { GlobalPnode } from "../../types";
import { MetricStat } from "@/app/components/shared/MetricStat";

type CardStatCounterProps = {
  node: GlobalPnode;
};

// Animated value wrapper for subtle transitions
function AnimatedValue({
  children,
  valueKey,
}: {
  children: React.ReactNode;
  valueKey?: string | number | null;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevKeyRef = useRef(valueKey);

  useEffect(() => {
    if (prevKeyRef.current !== valueKey) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      prevKeyRef.current = valueKey;
      return () => clearTimeout(timer);
    }
  }, [valueKey]);

  return (
    <span
      className={`inline-block transition-all duration-300 ease-out ${
        isAnimating ? "opacity-60 translate-y-0.5" : "opacity-100 translate-y-0"
      }`}
    >
      {children}
    </span>
  );
}

export function CardStatCounter({ node }: CardStatCounterProps) {
  const latest = node.latestStats;
  const isPublic = node.isPublic && latest;

  // Format credits to k notation (e.g., 22500 -> 22.5k)
  const formatCredits = (credits: number | null): string => {
    if (credits == null) return "N/A";
    if (credits < 1000) return credits.toString();
    const thousands = credits / 1000;
    // Remove trailing zeros (e.g., 1.0k -> 1k, but 22.5k stays 22.5k)
    const formatted = thousands.toFixed(1).replace(/\.0$/, "");
    return `${formatted}k`;
  };

  // Format uptime as separate hours and minutes
  const formatUptime = (uptimeSeconds: number | null) => {
    if (uptimeSeconds == null) {
      return {
        hours: "N/A",
        minutes: null,
      };
    }
    const totalHours = Math.floor(uptimeSeconds / 3600);
    const remainingSeconds = uptimeSeconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    return {
      hours: totalHours.toString(),
      minutes: minutes.toString(),
    };
  };

  // Calculate health score using same formula as HealthSummary
  // Health = (Uptime continuity × 40%) + (Credits velocity × 35%) + (Success rate × 25%)
  // Note: This is an approximation since we don't have exact uptime continuity in card data
  const calculateHealthScore = (): number => {
    // Uptime continuity approximation (40%): Use uptimeSeconds as proxy
    // If uptime >= 24h, estimate continuity as 100%; otherwise scale proportionally
    const uptimeSeconds = latest?.uptimeSeconds ?? 0;
    const uptimeContinuity =
      uptimeSeconds >= 86400
        ? 100
        : Math.min(100, (uptimeSeconds / 86400) * 100);
    const uptimeFactor = (uptimeContinuity / 100) * 40;

    // Credits velocity (35%): normalize delta24h to 0-100 scale
    // Map -1000 to 0, +1000 to 100 (same as HealthSummary)
    const creditsDelta = node.creditDelta24h ?? 0;
    const creditsVelocity = Math.max(
      0,
      Math.min(100, (creditsDelta + 1000) / 20)
    );
    const creditsFactor = (creditsVelocity / 100) * 35;

    // Success rate (25%): 0 for private nodes, otherwise estimate from public status
    const successRate = isPublic ? 100 : 0;
    const successFactor = (successRate / 100) * 25;

    return Math.round(uptimeFactor + creditsFactor + successFactor);
  };

  const healthScore = calculateHealthScore();

  // Get storage percent from node data (0-100)
  // If null or undefined, show 0
  const storagePercent: number | undefined =
    node.storageUsagePercent != null ? node.storageUsagePercent : 0;

  const uptime = formatUptime(latest?.uptimeSeconds ?? null);

  return (
    <div className="space-y-1">
      {/* Credits */}
      <MetricStat
        label="Credits"
        value={
          <AnimatedValue valueKey={node.latestCredits}>
            <span className="text-muted-foreground">
              {formatCredits(node.latestCredits)}
            </span>
          </AnimatedValue>
        }
        highlight={true}
      />

      {/* Uptime */}
      <MetricStat
        label="Uptime"
        value={
          latest?.uptimeSeconds != null ? (
            <AnimatedValue valueKey={latest.uptimeSeconds}>
              <span className="text-muted-foreground">
                {uptime.hours}h
                {uptime.minutes !== null ? ` ${uptime.minutes}m` : ""}
              </span>
            </AnimatedValue>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )
        }
      />

      {/* Storage Percent - with progress bar */}
      <MetricStat
        label="Storage Percent"
        value={null}
        progress={storagePercent}
      />

      {/* Health Score - with progress bar */}
      <MetricStat label="Health Score" value={null} progress={healthScore} />
    </div>
  );
}
