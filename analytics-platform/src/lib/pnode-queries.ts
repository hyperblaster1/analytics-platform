// src/lib/pnode-queries.ts
import { prisma } from "@/lib/db";
import { bigIntToNumberSafe } from "@/lib/storage-analytics";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaClient } from "@prisma/client";

// Pagination interfaces
export interface PnodeQueryOptions {
  limit?: number;
  offset?: number;
  seedBaseUrl?: string;
}

export interface PnodeQueryResult {
  pnodes: GlobalPnodeData[];
  total: number;
  limit: number;
  offset: number;
}

// Type for the processed pnode data
export type GlobalPnodeData = {
  id: number;
  pubkey: string | null;
  isPublic: boolean;
  failureCount: number;
  lastStatsAttemptAt: string | null;
  lastStatsSuccessAt: string | null;
  latestAddress: string | null;
  latestVersion: string | null;
  gossipLastSeen: string | null;
  seedBaseUrlsSeen: string[];
  seedsSeenCount: number;
  latestStats: {
    timestamp: string;
    uptimeSeconds: number | null;
    packetsInPerSec: number | null;
    packetsOutPerSec: number | null;
    totalBytes: number | null;
    activeStreams: number | null;
  } | null;
  storageUsagePercent: number | null; // Percentage (0-100)
  storageCommitted: number | null; // Storage committed in bytes
  latestCredits: number | null;
  creditsUpdatedAt: string | null;
  creditDelta24h: number | null;
};

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

export async function getGlobalPnodeView(
  options: PnodeQueryOptions = {}
): Promise<PnodeQueryResult> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  // Get total count BEFORE the main query for pagination metadata
  const total = await prisma.pnode.count();

  // Only select fields we actually need to reduce memory usage
  const pnodes = (await prisma.pnode.findMany({
    skip: offset,
    take: limit,
    orderBy: { id: "asc" }, // Consistent ordering for pagination
    select: {
      id: true,
      pubkey: true,
      isPublic: true,
      failureCount: true,
      lastStatsAttemptAt: true,
      lastStatsSuccessAt: true,
      latestCredits: true,
      creditsUpdatedAt: true,
      gossipObservations: {
        orderBy: { observedAt: "desc" },
        take: 1,
        select: {
          address: true,
          version: true,
          observedAt: true,
          lastSeenTimestamp: true,
          seedBaseUrl: true,
          storageCommitted: true,
          storageUsed: true,
          storageUsagePercent: true,
          isPublic: true,
        },
      },
      statsSamples: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: {
          timestamp: true,
          uptimeSeconds: true,
          packetsInPerSec: true,
          packetsOutPerSec: true,
          totalBytes: true,
          activeStreams: true,
          seedBaseUrl: true,
        },
      },
    },
  })) as PnodeWithRelations[];

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // OPTIMIZATION: Single query to get all seed mappings for paginated pnodes
  // CRITICAL FIX: Use raw SQL with DISTINCT ON to get unique (pnodeId, seedBaseUrl) pairs
  const pnodeIds = pnodes.map((p) => p.id);
  const allSeedMappings =
    pnodeIds.length > 0
      ? await prisma.$queryRaw<Array<{ pnodeId: number; seedBaseUrl: string }>>(
          PrismaClient.sql`
          SELECT DISTINCT ON ("pnodeId", "seedBaseUrl")
            "pnodeId",
            "seedBaseUrl"
          FROM "PnodeGossipObservation"
          WHERE "pnodeId" = ANY(${pnodeIds}::int[])
          ORDER BY "pnodeId", "seedBaseUrl", "observedAt" DESC
        `
        )
      : [];

  // Group seed mappings by pnodeId
  const seedMappingsByPnodeId = new Map<number, string[]>();
  for (const mapping of allSeedMappings) {
    const existing = seedMappingsByPnodeId.get(mapping.pnodeId) || [];
    if (!existing.includes(mapping.seedBaseUrl)) {
      existing.push(mapping.seedBaseUrl);
    }
    seedMappingsByPnodeId.set(mapping.pnodeId, existing);
  }

  // OPTIMIZATION: Batch compute all credit deltas for paginated pnodes only
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
    // Get the latest stats sample
    const latestStats = (p.statsSamples[0] ?? null) as PnodeStatsSample | null;

    // Get seed mappings from pre-loaded map (avoids N+1 queries)
    const seedBaseUrlsSeen: string[] = seedMappingsByPnodeId.get(p.id) || [];

    // Derive a Date for "last seen" (gossip-based)
    const gossipLastSeen =
      latestGossip?.lastSeenTimestamp != null
        ? new Date(Number(latestGossip.lastSeenTimestamp) * 1000)
        : latestGossip?.observedAt ?? null;

    const totalBytesNumber =
      latestStats?.totalBytes != null
        ? bigIntToNumberSafe(latestStats.totalBytes)
        : null;

    // Extract storage data from latest gossip observation
    // storage_usage_percent from API is a decimal (0-1) - convert to percentage (0-100)
    // Handle both decimal format (0-1) and percentage format (0-100)
    let storageUsagePercent: number | null = null;
    if (latestGossip?.storageUsagePercent != null) {
      const value = latestGossip.storageUsagePercent;
      // If value is > 1, it's already a percentage (0-100), otherwise it's decimal (0-1)
      storageUsagePercent = value > 1 ? value : value * 100;
    }

    // Extract storage committed (in bytes, convert to number for frontend)
    const storageCommittedBytes =
      latestGossip?.storageCommitted != null
        ? bigIntToNumberSafe(latestGossip.storageCommitted)
        : null;

    return {
      id: p.id,
      pubkey: p.pubkey,
      isPublic: p.isPublic,
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
            uptimeSeconds: latestStats.uptimeSeconds,
            packetsInPerSec: latestStats.packetsInPerSec,
            packetsOutPerSec: latestStats.packetsOutPerSec,
            totalBytes: totalBytesNumber,
            activeStreams: latestStats.activeStreams,
          }
        : null,

      // Storage data from gossip
      storageUsagePercent,
      storageCommitted: storageCommittedBytes,

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

  return {
    pnodes: pnodesWithCredits,
    total,
    limit,
    offset,
  };
}

export async function getPnodeViewForSeed(
  seedBaseUrl: string,
  options: PnodeQueryOptions = {}
): Promise<PnodeQueryResult> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const total = await prisma.pnode.count({
    where: {
      gossipObservations: {
        some: {
          seedBaseUrl: seedBaseUrl,
        },
      },
    },
  });

  const pnodes = (await prisma.pnode.findMany({
    skip: offset,
    take: limit,
    orderBy: { id: "asc" },
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
        take: 1,
        select: {
          address: true,
          version: true,
          observedAt: true,
          lastSeenTimestamp: true,
          seedBaseUrl: true,
          storageCommitted: true,
          storageUsed: true,
          storageUsagePercent: true,
          isPublic: true,
        },
      },
      statsSamples: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: {
          timestamp: true,
          uptimeSeconds: true,
          packetsInPerSec: true,
          packetsOutPerSec: true,
          totalBytes: true,
          activeStreams: true,
          seedBaseUrl: true,
        },
      },
    },
  })) as PnodeWithRelations[];

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const pnodeIds = pnodes.map((p) => p.id);
  const allSeedMappings =
    pnodeIds.length > 0
      ? await prisma.$queryRaw<Array<{ pnodeId: number; seedBaseUrl: string }>>(
          PrismaClient.sql`
          SELECT DISTINCT ON ("pnodeId", "seedBaseUrl")
            "pnodeId",
            "seedBaseUrl"
          FROM "PnodeGossipObservation"
          WHERE "pnodeId" = ANY(${pnodeIds}::int[])
          ORDER BY "pnodeId", "seedBaseUrl", "observedAt" DESC
        `
        )
      : [];

  // Group seed mappings by pnodeId
  const seedMappingsByPnodeId = new Map<number, string[]>();
  for (const mapping of allSeedMappings) {
    const existing = seedMappingsByPnodeId.get(mapping.pnodeId) || [];
    if (!existing.includes(mapping.seedBaseUrl)) {
      existing.push(mapping.seedBaseUrl);
    }
    seedMappingsByPnodeId.set(mapping.pnodeId, existing);
  }

  // OPTIMIZATION: Batch compute all credit deltas for paginated pnodes only
  const pubkeys = pnodes
    .map((p) => p.pubkey)
    .filter((p): p is string => p != null);
  const creditDeltasByPubkey = await computeCreditDeltas24hBatch(
    pubkeys,
    twentyFourHoursAgo
  );

  // Process pnodes
  const pnodesWithCredits = pnodes.map((p: PnodeWithRelations) => {
    // Get the latest gossip observation from this specific seed
    const latestGossipForSeed =
      p.gossipObservations.find(
        (obs) => (obs as PnodeGossipObservation).seedBaseUrl === seedBaseUrl
      ) ?? null;

    // Get the latest stats sample from this specific seed, fallback to any seed
    const latestStatsForSeed =
      p.statsSamples.find(
        (s) => (s as PnodeStatsSample).seedBaseUrl === seedBaseUrl
      ) ?? null;
    // Prefer stats from this seed, then latest
    const latestStats = latestStatsForSeed ?? p.statsSamples[0] ?? null;

    // Get seed mappings from pre-loaded map (avoids N+1 queries)
    const seedBaseUrlsSeen: string[] = seedMappingsByPnodeId.get(p.id) || [];

    // Derive a Date for "last seen" (gossip-based) from this seed's observation
    const gossipLastSeen =
      latestGossipForSeed?.lastSeenTimestamp != null
        ? new Date(Number(latestGossipForSeed.lastSeenTimestamp) * 1000)
        : latestGossipForSeed?.observedAt ?? null;

    const totalBytesNumber =
      latestStats?.totalBytes != null
        ? bigIntToNumberSafe(latestStats.totalBytes)
        : null;

    // Extract storage data from latest gossip observation
    // storage_usage_percent from API is a decimal (0-1) - convert to percentage (0-100)
    // Handle both decimal format (0-1) and percentage format (0-100)
    let storageUsagePercent: number | null = null;
    if (latestGossipForSeed?.storageUsagePercent != null) {
      const value = latestGossipForSeed.storageUsagePercent;
      // If value is > 1, it's already a percentage (0-100), otherwise it's decimal (0-1)
      storageUsagePercent = value > 1 ? value : value * 100;
    }

    // Extract storage committed (in bytes, convert to number for frontend)
    const storageCommittedBytes =
      latestGossipForSeed?.storageCommitted != null
        ? bigIntToNumberSafe(latestGossipForSeed.storageCommitted)
        : null;

    return {
      id: p.id,
      pubkey: p.pubkey,
      isPublic: p.isPublic,
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
            uptimeSeconds: latestStats.uptimeSeconds,
            packetsInPerSec: latestStats.packetsInPerSec,
            packetsOutPerSec: latestStats.packetsOutPerSec,
            totalBytes: totalBytesNumber,
            activeStreams: latestStats.activeStreams,
          }
        : null,

      // Storage data from gossip
      storageUsagePercent,
      storageCommitted: storageCommittedBytes,

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

  return {
    pnodes: pnodesWithCredits,
    total,
    limit,
    offset,
  };
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

  // Limit to prevent huge queries - if there are too many pubkeys, skip credit deltas
  // With pagination, this should rarely be hit (max 500 per page)
  if (pubkeys.length > 500) {
    console.warn(
      `Skipping credit deltas for ${pubkeys.length} pubkeys (too many)`
    );
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
