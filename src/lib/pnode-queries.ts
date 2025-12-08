// src/lib/pnode-queries.ts
import { prisma } from '@/lib/db';

export async function getGlobalPnodeView() {
  const pnodes = await prisma.pnode.findMany({
    include: {
      gossipObservations: {
        orderBy: { observedAt: 'desc' },
      },
      statsSamples: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  return pnodes.map((p) => {
    const latestGossip = p.gossipObservations[0] ?? null;
    const latestStats = p.statsSamples[0] ?? null;

    const seedIdsSeen = Array.from(
      new Set(p.gossipObservations.map((obs) => obs.seedId)),
    );

    // Derive a Date for "last seen" (gossip-based)
    const gossipLastSeen =
      latestGossip?.lastSeenTimestamp != null
        ? new Date(Number(latestGossip.lastSeenTimestamp) * 1000)
        : latestGossip?.observedAt ?? null;

    return {
      id: p.id,
      pubkey: p.pubkey,
      reachable: p.reachable,
      failureCount: p.failureCount,
      lastStatsAttemptAt: p.lastStatsAttemptAt
        ? p.lastStatsAttemptAt.toISOString()
        : null,
      lastStatsSuccessAt: p.lastStatsSuccessAt
        ? p.lastStatsSuccessAt.toISOString()
        : null,

      // Gossip-derived
      latestAddress: latestGossip?.address ?? null,
      latestVersion: latestGossip?.version ?? null,
      gossipLastSeen: gossipLastSeen ? gossipLastSeen.toISOString() : null,

      // Per-seed observation metrics
      seedIdsSeen,
      seedsSeenCount: seedIdsSeen.length,

      // Latest stats sample
      latestStats: latestStats
        ? {
            timestamp: latestStats.timestamp.toISOString(),
            cpuPercent: latestStats.cpuPercent,
            ramUsedBytes: latestStats.ramUsedBytes
              ? Number(latestStats.ramUsedBytes)
              : null,
            ramTotalBytes: latestStats.ramTotalBytes
              ? Number(latestStats.ramTotalBytes)
              : null,
            uptimeSeconds: latestStats.uptimeSeconds,
            packetsInPerSec: latestStats.packetsInPerSec,
            packetsOutPerSec: latestStats.packetsOutPerSec,
            totalBytes: latestStats.totalBytes
              ? Number(latestStats.totalBytes)
              : null,
            activeStreams: latestStats.activeStreams,
          }
        : null,
    };
  });
}

export async function getAllSeeds() {
  return prisma.seed.findMany({
    where: { enabled: true },
    orderBy: { id: 'asc' },
  });
}

