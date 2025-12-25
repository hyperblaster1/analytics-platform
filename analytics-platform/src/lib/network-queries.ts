// src/lib/network-queries.ts
import { prisma } from "./db";

export async function getLatestNetworkSnapshot() {
  const snapshot = await prisma.networkSnapshot.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      versionStats: {
        orderBy: { nodeCount: "desc" },
      },
      seedVisibility: {
        orderBy: { seedBaseUrl: "asc" },
      },
      creditsStat: true,
    },
  });

  if (!snapshot) {
    return null;
  }

  // Calculate version percentages
  const totalNodes = snapshot.totalNodes;
  const versionStats = snapshot.versionStats.map((vs) => ({
    version: vs.version,
    nodeCount: vs.nodeCount,
    percentage: totalNodes > 0 ? (vs.nodeCount / totalNodes) * 100 : 0,
  }));

  // Get time series data for both 7d and 20d
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

  const [timeSeries7d, timeSeries20d] = await Promise.all([
    prisma.networkSnapshot.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        totalNodes: true,
        medianUptimeSeconds: true,
        totalStorageCommitted: true,
      },
      take: 100,
    }),
    prisma.networkSnapshot.findMany({
      where: {
        createdAt: { gte: twentyDaysAgo },
      },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        totalNodes: true,
        medianUptimeSeconds: true,
        totalStorageCommitted: true,
      },
      take: 200,
    }),
  ]);

  return {
    snapshot: {
      id: snapshot.id,
      ingestionRunId: snapshot.ingestionRunId,
      createdAt: snapshot.createdAt.toISOString(),
      totalNodes: snapshot.totalNodes,
      reachableNodes: snapshot.reachableNodes,
      unreachableNodes: snapshot.unreachableNodes,
      reachablePercent: snapshot.reachablePercent,
      medianUptimeSeconds: snapshot.medianUptimeSeconds,
      p90UptimeSeconds: snapshot.p90UptimeSeconds,
      totalStorageCommitted: snapshot.totalStorageCommitted.toString(),
      totalStorageUsed: snapshot.totalStorageUsed.toString(),
      nodesBackedOff: snapshot.nodesBackedOff,
      nodesFailingStats: snapshot.nodesFailingStats,
      versionStats,
      seedVisibility: snapshot.seedVisibility.map((sv) => ({
        seedBaseUrl: sv.seedBaseUrl,
        nodesSeen: sv.nodesSeen,
        freshNodes: sv.freshNodes,
        staleNodes: sv.staleNodes,
        offlineNodes: sv.offlineNodes,
      })),
      creditsStat: snapshot.creditsStat
        ? {
            medianCredits: snapshot.creditsStat.medianCredits,
            p90Credits: snapshot.creditsStat.p90Credits,
          }
        : null,
    },
    timeSeries7d: timeSeries7d.map((ts) => ({
      timestamp: ts.createdAt.toISOString(),
      nodesOnline: ts.totalNodes,
      medianUptime: ts.medianUptimeSeconds,
      totalStorageCommitted: ts.totalStorageCommitted.toString(),
    })),
    timeSeries20d: timeSeries20d.map((ts) => ({
      timestamp: ts.createdAt.toISOString(),
      nodesOnline: ts.totalNodes,
      medianUptime: ts.medianUptimeSeconds,
      totalStorageCommitted: ts.totalStorageCommitted.toString(),
    })),
  };
}
