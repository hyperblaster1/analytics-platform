"use client";

import React, { useEffect, useState, useRef } from "react";
import { GlobalPnode } from "../types";
import { MetricStat } from "@/components/stats/MetricStat";

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
  const isReachable = node.reachable && latest;

  const ramUsed = latest?.ramUsedBytes ?? 0;
  const ramTotal = latest?.ramTotalBytes ?? 0;
  const ramRatio = ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0;
  const toGb = (bytes: number) => bytes / 1_073_741_824;

  // Format credits to k notation (e.g., 22500 -> 22.5k)
  const formatCredits = (credits: number | null): string => {
    if (credits == null) return "N/A";
    if (credits < 1000) return credits.toString();
    const thousands = credits / 1000;
    // Remove trailing zeros (e.g., 1.0k -> 1k, but 22.5k stays 22.5k)
    const formatted = thousands.toFixed(1).replace(/\.0$/, "");
    return `${formatted}k`;
  };

  const cpuPercent = latest?.cpuPercent ?? 0;
  const cpuValue = cpuPercent > 0 ? cpuPercent.toFixed(1) : "0.0";

  // Format RAM - separate number and unit
  const ramValue =
    ramUsed > 0 ? { number: toGb(ramUsed).toFixed(2), unit: "GB" } : null;

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

  const uptime = formatUptime(latest?.uptimeSeconds ?? null);

  // Format throughput with semantic handling
  const formatThroughput = (bytesPerSecond: number | null) => {
    if (bytesPerSecond == null || bytesPerSecond < 1024) {
      return { value: "Idle", isIdle: true };
    }
    return {
      value: `${(bytesPerSecond / 1024).toFixed(1)} KB/s`,
      isIdle: false,
    };
  };

  const throughput = formatThroughput(latest?.bytesPerSecond ?? null);

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Credits (Primary Metric) */}
      <div>
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
      </div>

      {/* Separator */}
      <div className="border-t border-muted-foreground/20" />

      {/* Row 2: State / Capacity */}
      <div className="grid grid-cols-2 gap-4">
        {/* CPU */}
        <MetricStat
          label="CPU"
          value={
            isReachable ? (
              <AnimatedValue valueKey={cpuPercent}>
                <span className="text-muted-foreground"> {cpuValue}%</span>
              </AnimatedValue>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )
          }
          progress={isReachable ? cpuPercent : undefined}
        />

        {/* RAM */}
        <MetricStat
          label="RAM"
          value={
            isReachable && ramValue ? (
              <div className="flex items-baseline">
                <AnimatedValue valueKey={ramRatio}>
                  <span className="text-lg text-muted-foreground font-semibold">
                    {ramValue.number}
                  </span>
                </AnimatedValue>
                <AnimatedValue valueKey={ramRatio}>
                  <span className="text-xs text-muted-foreground">
                    {ramValue.unit}
                  </span>
                </AnimatedValue>
              </div>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )
          }
          progress={isReachable ? ramRatio : undefined}
        />
      </div>

      {/* Separator */}
      <div className="border-t border-muted-foreground/20" />

      {/* Row 3: Behavior / Activity */}
      <div className="grid grid-cols-2 gap-4">
        {/* Uptime */}
        <MetricStat
          label="Uptime"
          value={
            isReachable && latest?.uptimeSeconds != null ? (
              <div className="flex items-baseline gap-1">
                <AnimatedValue valueKey={latest.uptimeSeconds}>
                  <span className="text-lg text-muted-foreground font-semibold">
                    {uptime.hours}h
                  </span>
                </AnimatedValue>
                {uptime.minutes !== null && (
                  <AnimatedValue valueKey={latest.uptimeSeconds}>
                    <span className="text-xs text-muted-foreground">
                      {uptime.minutes}m
                    </span>
                  </AnimatedValue>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )
          }
        />

        {/* Throughput */}
        <MetricStat
          label="Throughput"
          value={
            isReachable ? (
              throughput.isIdle ? (
                <span className="text-muted-foreground">Idle</span>
              ) : (
                <AnimatedValue valueKey={latest?.bytesPerSecond ?? null}>
                  <span className="font-mono">{throughput.value}</span>
                </AnimatedValue>
              )
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )
          }
        />
      </div>
    </div>
  );
}
