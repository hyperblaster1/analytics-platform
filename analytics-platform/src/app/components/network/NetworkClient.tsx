"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type NetworkSnapshot = {
  id: number;
  ingestionRunId: number;
  createdAt: string;
  totalNodes: number;
  reachableNodes: number;
  unreachableNodes: number;
  reachablePercent: number;
  medianUptimeSeconds: number;
  p90UptimeSeconds: number;
  totalStorageCommitted: string;
  totalStorageUsed: string;
  nodesBackedOff: number;
  nodesFailingStats: number;
  versionStats: Array<{
    version: string;
    nodeCount: number;
    percentage: number;
  }>;
  seedVisibility: Array<{
    seedBaseUrl: string;
    nodesSeen: number;
    freshNodes: number;
    staleNodes: number;
    offlineNodes: number;
  }>;
  creditsStat: {
    medianCredits: number;
    p90Credits: number;
  } | null;
};

type TimeSeriesPoint = {
  timestamp: string;
  nodesOnline: number;
  medianUptime: number;
  totalStorageCommitted: string;
};

type NetworkData = {
  snapshot: NetworkSnapshot;
  timeSeries7d: TimeSeriesPoint[];
  timeSeries20d: TimeSeriesPoint[];
};

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatStorage(bytes: string): string {
  const value = BigInt(bytes);
  const gb = Number(value) / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  const mb = Number(value) / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export default function NetworkClient() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "20d">("20d");

  // Calculate time series data - must be at top level before conditional returns
  const timeSeriesData = useMemo(() => {
    if (!data) return null;
    const series = timeRange === "20d" ? data.timeSeries20d : data.timeSeries7d;
    return {
      nodesOnline: series.map((p) => ({
        value: p.nodesOnline,
        timeLabel: new Date(p.timestamp).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
      medianUptime: series.map((p) => ({
        value: p.medianUptime,
        timeLabel: new Date(p.timestamp).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
      totalStorageCommitted: series.map((p) => ({
        value: Number(BigInt(p.totalStorageCommitted)),
        timeLabel: new Date(p.timestamp).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    };
  }, [data, timeRange]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/network", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
        const networkData = await res.json();
        setData(networkData);
      } catch (err) {
        console.error("Failed to fetch network data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load network data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full  px-9 mx-auto py-8">
        <div className="text-center text-muted-foreground">
          Loading network metrics...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full  px-9 mx-auto py-8">
        <div className="text-center text-red-600 dark:text-red-400">
          {error || "No network data available"}
        </div>
      </div>
    );
  }

  const { snapshot } = data;

  return (
    <div className="w-full  px-9 mx-auto py-6 space-y-6">
      {/* Section 1: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-muted/50 dark:bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Total Nodes</div>
          <div className="text-2xl font-semibold text-[var(--text-primary)]">
            {snapshot.totalNodes.toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-muted/50 dark:bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Reachable %</div>
          <div className="text-2xl font-semibold text-[var(--text-primary)]">
            {snapshot.reachablePercent.toFixed(1)}%
          </div>
        </div>
        <div className="p-4 bg-muted/50 dark:bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">
            Median Uptime
          </div>
          <div className="text-2xl font-semibold text-[var(--text-primary)]">
            {formatUptime(snapshot.medianUptimeSeconds)}
          </div>
        </div>
        <div className="p-4 bg-muted/50 dark:bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">
            Storage Committed
          </div>
          <div className="text-2xl font-semibold text-[var(--text-primary)]">
            {formatStorage(snapshot.totalStorageCommitted)}
          </div>
        </div>
      </div>

      {/* Section 2: Version Adoption */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Version Adoption
        </h2>
        <div className="space-y-2">
          {snapshot.versionStats.map((vs) => (
            <div key={vs.version} className="flex items-center gap-4">
              <div className="w-24 text-sm text-muted-foreground truncate">
                {vs.version || "unknown"}
              </div>
              <div className="flex-1 h-6 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${vs.percentage}%` }}
                />
              </div>
              <div className="w-16 text-sm font-medium text-[var(--text-primary)] text-right">
                {vs.percentage.toFixed(1)}%
              </div>
              <div className="w-12 text-xs text-muted-foreground text-right">
                ({vs.nodeCount})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Gossip Visibility */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Gossip Visibility
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-4 text-muted-foreground">
                  Seed
                </th>
                <th className="text-right py-2 px-4 text-muted-foreground">
                  Seen
                </th>
                <th className="text-right py-2 px-4 text-muted-foreground">
                  Fresh
                </th>
                <th className="text-right py-2 px-4 text-muted-foreground">
                  Stale
                </th>
                <th className="text-right py-2 px-4 text-muted-foreground">
                  Offline
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshot.seedVisibility.map((sv) => (
                <tr key={sv.seedBaseUrl} className="border-b border-border/50">
                  <td className="py-2 px-4 text-[var(--text-primary)] truncate max-w-xs">
                    {sv.seedBaseUrl}
                  </td>
                  <td className="py-2 px-4 text-right">{sv.nodesSeen}</td>
                  <td className="py-2 px-4 text-right text-green-600 dark:text-green-400">
                    {sv.freshNodes}
                  </td>
                  <td className="py-2 px-4 text-right text-amber-600 dark:text-amber-400">
                    {sv.staleNodes}
                  </td>
                  <td className="py-2 px-4 text-right text-red-600 dark:text-red-400">
                    {sv.offlineNodes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Storage Capacity */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Storage Capacity
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Used</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {formatStorage(snapshot.totalStorageUsed)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Committed</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {formatStorage(snapshot.totalStorageCommitted)}
            </span>
          </div>
          {snapshot.totalStorageCommitted !== "0" && (
            <div className="h-2 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (Number(BigInt(snapshot.totalStorageUsed)) /
                      Number(BigInt(snapshot.totalStorageCommitted))) *
                      100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Section 5: Credits */}
      {snapshot.creditsStat && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Credits Distribution
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Median</div>
              <div className="text-xl font-semibold text-[var(--text-primary)]">
                {snapshot.creditsStat.medianCredits.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">P90</div>
              <div className="text-xl font-semibold text-[var(--text-primary)]">
                {snapshot.creditsStat.p90Credits.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 6: Trends */}
      {timeSeriesData && timeSeriesData.nodesOnline.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Trends ({timeRange})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange("7d")}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  timeRange === "7d"
                    ? "bg-primary text-white dark:text-foreground"
                    : "bg-muted dark:bg-muted/50 text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/70"
                }`}
              >
                7d
              </button>
              <button
                onClick={() => setTimeRange("20d")}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  timeRange === "20d"
                    ? "bg-primary text-white dark:text-foreground"
                    : "bg-muted dark:bg-muted/50 text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/70"
                }`}
              >
                20d
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nodes Online */}
            <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">
                Nodes Online
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData.nodesOnline}>
                    <defs>
                      <linearGradient
                        id="nodesOnlineGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--primary)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="timeLabel"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      minTickGap={20}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.375rem",
                        padding: "4px 8px",
                      }}
                      formatter={(value: unknown) => [
                        typeof value === "number"
                          ? value.toLocaleString()
                          : String(value),
                        "Nodes",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--primary)"
                      fill="url(#nodesOnlineGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Median Uptime */}
            <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">
                Median Uptime
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData.medianUptime}>
                    <defs>
                      <linearGradient
                        id="medianUptimeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--primary)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="timeLabel"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      minTickGap={20}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.375rem",
                        padding: "4px 8px",
                      }}
                      formatter={(value: unknown) => [
                        typeof value === "number"
                          ? formatUptime(value)
                          : String(value),
                        "Uptime",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--primary)"
                      fill="url(#medianUptimeGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Storage Committed */}
            <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">
                Storage Committed
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData.totalStorageCommitted}>
                    <defs>
                      <linearGradient
                        id="storageCommittedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--primary)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="timeLabel"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      minTickGap={20}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.375rem",
                        padding: "4px 8px",
                      }}
                      formatter={(value: unknown) => [
                        typeof value === "number"
                          ? formatStorage(value.toString())
                          : String(value),
                        "Storage",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--primary)"
                      fill="url(#storageCommittedGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
