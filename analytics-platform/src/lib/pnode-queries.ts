// src/lib/pnode-queries.ts
import { prisma } from "@/lib/db";
import { bigIntToNumberSafe } from "@/lib/storage-analytics";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaClient } from "@prisma/client";

type PnodeWithRelations = Prisma.PnodeGetPayload<{
  include: {
    gossipObservations: true;
    statsSamples: true;
  };
}>;

// Type helpers that will be correct once Prisma client is regenerated
type PnodeGossipObservation =
  PnodeWithRelations["gossipObservations"][number] & {
    seedBaseUrl: string;
  };
type PnodeStatsSample = PnodeWithRelations["statsSamples"][number] & {
  seedBaseUrl: string | null;
};

export async function getGlobalPnodeView() {
  const pnodes = (await prisma.pnode.findMany({
    include: {
      gossipObservations: {
        orderBy: { observedAt: "desc" },
        take: 1, // CRITICAL FIX: Only load latest observation per pnode to prevent memory leak
      },
      statsSamples: {
        orderBy: { timestamp: "desc" },
        take: 2, // Reduced from 10: only need latest + previous for throughput calculation
      },
    },
  })) as PnodeWithRelations[];

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // OPTIMIZATION: Single query to get all seed mappings for all pnodes (prevents N+1 queries)
  const pnodeIds = pnodes.map((p) => p.id);
  const allSeedMappings = await prisma.pnodeGossipObservation.findMany({
    where: { pnodeId: { in: pnodeIds } },
    select: { pnodeId: true, seedBaseUrl: true },
    distinct: ["pnodeId", "seedBaseUrl"],
  });

  // Group seed mappings by pnodeId
  const seedMappingsByPnodeId = new Map<number, string[]>();
  for (const mapping of allSeedMappings) {
    const existing = seedMappingsByPnodeId.get(mapping.pnodeId) || [];
    if (!existing.includes(mapping.seedBaseUrl)) {
      existing.push(mapping.seedBaseUrl);
    }
    seedMappingsByPnodeId.set(mapping.pnodeId, existing);
  }

  // OPTIMIZATION: Batch compute all credit deltas in 2 queries instead of N*2 queries
  const pubkeys = pnodes
    .map((p) => p.pubkey)
    .filter((p): p is string => p != null);
  const creditDeltasByPubkey = await computeCreditDeltas24hBatch(
    pubkeys,
    twentyFourHoursAgo
  );

  // Process pnodes (no longer need Promise.all since credit deltas are pre-computed)
  const pnodesWithCredits = pnodes.map((p: PnodeWithRelations) => {
    const latestGossip = (p.gossipObservations[0] ??
      null) as PnodeGossipObservation | null;
    // Get the latest stats sample, but prefer one with bytesPerSecond calculated
    const latestStatsWithThroughput =
      (p.statsSamples.find((s) => {
        const sample = s as PnodeStatsSample;
        return (
          sample.bytesPerSecond !== null && sample.bytesPerSecond !== undefined
        );
      }) as PnodeStatsSample | undefined) ?? null;
    const latestStats = (latestStatsWithThroughput ??
      p.statsSamples[0] ??
      null) as PnodeStatsSample | null;

    // Get seed mappings from pre-loaded map (avoids N+1 queries)
    const seedBaseUrlsSeen: string[] = seedMappingsByPnodeId.get(p.id) || [];

    // Derive a Date for "last seen" (gossip-based)
    const gossipLastSeen =
      latestGossip?.lastSeenTimestamp != null
        ? new Date(Number(latestGossip.lastSeenTimestamp) * 1000)
        : latestGossip?.observedAt ?? null;

    // bytesPerSecond can be 0 (valid value), so check for null/undefined explicitly
    const bytesPerSecond =
      latestStats?.bytesPerSecond !== null &&
      latestStats?.bytesPerSecond !== undefined
        ? latestStats.bytesPerSecond
        : null;

    const totalBytesNumber =
      latestStats?.totalBytes != null
        ? bigIntToNumberSafe(latestStats.totalBytes)
        : null;

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
      seedBaseUrlsSeen,
      seedsSeenCount: seedBaseUrlsSeen.length,

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
            totalBytes: totalBytesNumber,
            activeStreams: latestStats.activeStreams,
            bytesPerSecond,
          }
        : null,

      // Credits fields
      latestCredits: p.latestCredits,
      creditsUpdatedAt: p.creditsUpdatedAt
        ? p.creditsUpdatedAt.toISOString()
        : null,
      creditDelta24h: p.pubkey
        ? creditDeltasByPubkey.get(p.pubkey) ?? null
        : null,
    };
  });

  return pnodesWithCredits;
}

export async function getPnodeViewForSeed(seedBaseUrl: string) {
  const pnodes = (await prisma.pnode.findMany({
    where: {
      gossipObservations: {
        some: {
          seedBaseUrl: seedBaseUrl,
        },
      },
    },
    include: {
      gossipObservations: {
        where: {
          seedBaseUrl: seedBaseUrl, // Only load observations from this seed
        },
        orderBy: { observedAt: "desc" },
        take: 1, // CRITICAL FIX: Only load latest observation per pnode
      },
      statsSamples: {
        orderBy: { timestamp: "desc" },
        take: 2, // Reduced from 5: only need latest + previous for throughput
      },
    },
  })) as PnodeWithRelations[];

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // OPTIMIZATION: Single query to get all seed mappings for all pnodes (prevents N+1 queries)
  const pnodeIds = pnodes.map((p) => p.id);
  const allSeedMappings = await prisma.pnodeGossipObservation.findMany({
    where: { pnodeId: { in: pnodeIds } },
    select: { pnodeId: true, seedBaseUrl: true },
    distinct: ["pnodeId", "seedBaseUrl"],
  });

  // Group seed mappings by pnodeId
  const seedMappingsByPnodeId = new Map<number, string[]>();
  for (const mapping of allSeedMappings) {
    const existing = seedMappingsByPnodeId.get(mapping.pnodeId) || [];
    if (!existing.includes(mapping.seedBaseUrl)) {
      existing.push(mapping.seedBaseUrl);
    }
    seedMappingsByPnodeId.set(mapping.pnodeId, existing);
  }

  // OPTIMIZATION: Batch compute all credit deltas in 2 queries instead of N*2 queries
  const pubkeys = pnodes
    .map((p) => p.pubkey)
    .filter((p): p is string => p != null);
  const creditDeltasByPubkey = await computeCreditDeltas24hBatch(
    pubkeys,
    twentyFourHoursAgo
  );

  // Process pnodes (no longer need Promise.all since credit deltas are pre-computed)
  const pnodesWithCredits = pnodes.map((p: PnodeWithRelations) => {
    // Get the latest gossip observation from this specific seed
    const latestGossipForSeed =
      p.gossipObservations.find(
        (obs) => (obs as PnodeGossipObservation).seedBaseUrl === seedBaseUrl
      ) ?? null;

    // Get the latest stats sample from this specific seed with throughput, fallback to any seed
    const latestStatsForSeedWithThroughput =
      p.statsSamples.find(
        (s) =>
          (s as PnodeStatsSample).seedBaseUrl === seedBaseUrl &&
          (s as PnodeStatsSample).bytesPerSecond !== null &&
          (s as PnodeStatsSample).bytesPerSecond !== undefined
      ) ?? null;
    const latestStatsForSeed =
      p.statsSamples.find(
        (s) => (s as PnodeStatsSample).seedBaseUrl === seedBaseUrl
      ) ?? null;
    // Prefer stats with throughput from this seed, then any stats from this seed, then any stats with throughput, then latest
    const latestStats =
      latestStatsForSeedWithThroughput ??
      latestStatsForSeed ??
      p.statsSamples.find(
        (s) =>
          (s as PnodeStatsSample).bytesPerSecond !== null &&
          (s as PnodeStatsSample).bytesPerSecond !== undefined
      ) ??
      p.statsSamples[0] ??
      null;

    // Get seed mappings from pre-loaded map (avoids N+1 queries)
    const seedBaseUrlsSeen: string[] = seedMappingsByPnodeId.get(p.id) || [];

    // Derive a Date for "last seen" (gossip-based) from this seed's observation
    const gossipLastSeen =
      latestGossipForSeed?.lastSeenTimestamp != null
        ? new Date(Number(latestGossipForSeed.lastSeenTimestamp) * 1000)
        : latestGossipForSeed?.observedAt ?? null;

    // bytesPerSecond can be 0 (valid value), so check for null/undefined explicitly
    const bytesPerSecond =
      latestStats?.bytesPerSecond !== null &&
      latestStats?.bytesPerSecond !== undefined
        ? latestStats.bytesPerSecond
        : null;

    const totalBytesNumber =
      latestStats?.totalBytes != null
        ? bigIntToNumberSafe(latestStats.totalBytes)
        : null;

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

      // Gossip-derived (from this seed's observations)
      latestAddress: latestGossipForSeed?.address ?? null,
      latestVersion: latestGossipForSeed?.version ?? null,
      gossipLastSeen: gossipLastSeen ? gossipLastSeen.toISOString() : null,

      // Per-seed observation metrics
      seedBaseUrlsSeen,
      seedsSeenCount: seedBaseUrlsSeen.length,

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
            totalBytes: totalBytesNumber,
            activeStreams: latestStats.activeStreams,
            bytesPerSecond,
          }
        : null,

      // Credits fields
      latestCredits: p.latestCredits,
      creditsUpdatedAt: p.creditsUpdatedAt
        ? p.creditsUpdatedAt.toISOString()
        : null,
      creditDelta24h: p.pubkey
        ? creditDeltasByPubkey.get(p.pubkey) ?? null
        : null,
    };
  });

  return pnodesWithCredits;
}

/**
 * Batch compute 24h credit deltas for multiple pods in 2 queries instead of N*2 queries
 * Returns a Map<pubkey, delta> for all pubkeys that have both snapshots
 */
async function computeCreditDeltas24hBatch(
  pubkeys: string[],
  twentyFourHoursAgo: Date
): Promise<Map<string, number>> {
  if (pubkeys.length === 0) {
    return new Map();
  }

  // Query 1: Get latest snapshot for each pubkey
  // Use DISTINCT ON to get the row with max observedAt per pubkey
  const latestSnapshots = await prisma.$queryRaw<
    Array<{
      podPubkey: string;
      credits: number;
      observedAt: Date;
    }>
  >(
    PrismaClient.sql`
      SELECT DISTINCT ON ("podPubkey") 
        "podPubkey",
        credits,
        "observedAt" as "observedAt"
      FROM "PodCreditsSnapshot"
      WHERE "podPubkey" = ANY(${pubkeys}::text[])
      ORDER BY "podPubkey", "observedAt" DESC
    `
  );

  // Query 2: Get snapshot closest to 24h ago for each pubkey (where observedAt <= twentyFourHoursAgo)
  const snapshots24hAgo = await prisma.$queryRaw<
    Array<{
      podPubkey: string;
      credits: number;
      observedAt: Date;
    }>
  >(
    PrismaClient.sql`
      SELECT DISTINCT ON ("podPubkey") 
        "podPubkey",
        credits,
        "observedAt" as "observedAt"
      FROM "PodCreditsSnapshot"
      WHERE "podPubkey" = ANY(${pubkeys}::text[])
        AND "observedAt" <= ${twentyFourHoursAgo}::timestamp
      ORDER BY "podPubkey", "observedAt" DESC
    `
  );

  // Build maps for O(1) lookup
  const latestByPubkey = new Map<string, { credits: number }>();
  for (const snap of latestSnapshots) {
    latestByPubkey.set(snap.podPubkey, { credits: snap.credits });
  }

  const snapshots24hAgoByPubkey = new Map<string, { credits: number }>();
  for (const snap of snapshots24hAgo) {
    snapshots24hAgoByPubkey.set(snap.podPubkey, { credits: snap.credits });
  }

  // Compute deltas for all pubkeys that have both snapshots
  const deltas = new Map<string, number>();
  for (const pubkey of pubkeys) {
    const latest = latestByPubkey.get(pubkey);
    const snapshot24hAgo = snapshots24hAgoByPubkey.get(pubkey);

    if (latest && snapshot24hAgo) {
      deltas.set(pubkey, latest.credits - snapshot24hAgo.credits);
    }
  }

  return deltas;
}
