// src/lib/ingest.ts
import { prisma } from './db';
import { getPods, getStats, type PodInfo } from './prpc-client';

const SEED_NODE = process.env.PRPC_SEED_NODE ?? 'http://192.190.136.36:6000';

export type IngestionResult = {
  ok: boolean;
  podsUpdated: number;
  statsAttempts: number;
  statsSuccess: number;
  statsFailure: number;
  error?: string;
};

/**
 * Calculate the delay in seconds for exponential backoff
 */
function calculateBackoffDelay(failureCount: number): number {
  const baseSeconds = 60;
  const cappedFailures = Math.min(failureCount, 5); // cap growth at 5
  const delaySeconds = baseSeconds * Math.pow(2, cappedFailures);
  return delaySeconds;
}

/**
 * Check if a pnode is eligible for stats collection based on backoff rules
 */
function isEligibleForStats(pnode: {
  nextStatsAllowedAt: Date | null;
}): boolean {
  const now = new Date();
  
  // If nextStatsAllowedAt is null, treat as eligible (first time or pre-backoff migration)
  if (pnode.nextStatsAllowedAt === null) {
    return true;
  }
  
  // If nextStatsAllowedAt is in the future, skip (respect backoff)
  if (pnode.nextStatsAllowedAt > now) {
    return false;
  }
  
  // Otherwise, eligible
  return true;
}

/**
 * Process a batch of pnodes in parallel to fetch stats
 */
async function processStatsBatch(
  pnodes: Array<{ id: number; address: string; failureCount: number }>,
  concurrency: number = 10
): Promise<{ success: number; failure: number }> {
  const results = { success: 0, failure: 0 };
  const now = new Date();

  // Process in batches with controlled concurrency
  for (let i = 0; i < pnodes.length; i += concurrency) {
    const batch = pnodes.slice(i, i + concurrency);
    
    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (pnode) => {
        // Extract IP address and construct pod URL (always use port 6000)
        const ipAddress = pnode.address.split(':')[0];
        const podUrl = `http://${ipAddress}:6000`;

        console.log(`→ Fetching stats for pod ${pnode.address} (${podUrl})`);

        try {
          const stats = await getStats(podUrl);

          // On success:
          // - Set failureCount = 0
          // - Set lastStatsAttemptAt = now
          // - Set lastStatsSuccessAt = now
          // - Set nextStatsAllowedAt = now + 60s
          const nextAllowedAt = new Date(now.getTime() + 60 * 1000);

          await prisma.pnode.update({
            where: { id: pnode.id },
            data: {
              reachable: true,
              failureCount: 0,
              lastError: null,
              lastStatsAttemptAt: now,
              lastStatsSuccessAt: now,
              nextStatsAllowedAt: nextAllowedAt,
            },
          });

          // Insert stats sample
          await prisma.pnodeStatSample.create({
            data: {
              pnodeId: pnode.id,
              cpuPercent: stats.cpu_percent ?? null,
              ramUsedBytes: stats.ram?.used ? BigInt(stats.ram.used) : null,
              ramTotalBytes: stats.ram?.total ? BigInt(stats.ram.total) : null,
              uptimeSeconds: stats.uptime_seconds ?? null,
              packetsInPerSec: stats.network?.packets_in_per_sec ?? null,
              packetsOutPerSec: stats.network?.packets_out_per_sec ?? null,
              activeStreams: stats.network?.active_streams ?? null,
              totalBytes: stats.storage?.total_bytes
                ? BigInt(stats.storage.total_bytes)
                : null,
              totalPages: stats.storage?.total_pages ?? null,
            },
          });

          return { success: true, pnodeId: pnode.id, address: pnode.address };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          const truncatedError = errorMessage.length > 500 
            ? errorMessage.substring(0, 500) + '...' 
            : errorMessage;

          console.error(`Failed to ingest stats for pod ${pnode.address}:`, errorMessage);

          // On failure:
          // - Increment failureCount
          // - Set lastStatsAttemptAt = now
          // - Set nextStatsAllowedAt = now + delaySeconds (using exponential backoff)
          const newFailureCount = pnode.failureCount + 1;
          const delaySeconds = calculateBackoffDelay(newFailureCount);
          const nextAllowedAt = new Date(now.getTime() + delaySeconds * 1000);

          await prisma.pnode.update({
            where: { id: pnode.id },
            data: {
              reachable: false,
              failureCount: newFailureCount,
              lastError: truncatedError,
              lastStatsAttemptAt: now,
              nextStatsAllowedAt: nextAllowedAt,
            },
          });

          return { success: false, pnodeId: pnode.id, address: pnode.address };
        }
      })
    );

    // Count successes and failures
    for (const batchResult of batchResults) {
      if (batchResult.status === 'fulfilled') {
        if (batchResult.value.success) {
          results.success++;
        } else {
          results.failure++;
        }
      } else {
        // Promise.allSettled should not reject, but handle it just in case
        results.failure++;
        console.error('Unexpected rejection in batch processing:', batchResult.reason);
      }
    }
  }

  return results;
}

/**
 * Run one complete ingestion cycle:
 * 1. Call getPods on seed node and upsert all pods
 * 2. For each pnode in DB, check eligibility and call getStats if eligible (in parallel)
 */
export async function runIngestion(): Promise<IngestionResult> {
  const result: IngestionResult = {
    ok: true,
    podsUpdated: 0,
    statsAttempts: 0,
    statsSuccess: 0,
    statsFailure: 0,
  };

  try {
    // Step 1: Discover pods from seed node
    console.log('Using seed node:', SEED_NODE);
    const podsResult = await getPods(SEED_NODE);
    
    // Handle different response structures
    const pods: PodInfo[] = Array.isArray(podsResult) 
      ? podsResult 
      : podsResult.pods || [];
    const count = Array.isArray(podsResult) 
      ? podsResult.length 
      : podsResult.count ?? pods.length;
    
    console.log(`Found ${count} pods`);

    // Step 2: Upsert all pods (update address, version, pubkey, gossipLastSeen, gossipLastSeenTimestamp)
    // Don't touch failureCount, lastStatsAttemptAt, nextStatsAllowedAt, or reachable here
    for (const pod of pods) {
      const address = pod.address;
      const gossipLastSeen = pod.last_seen_timestamp !== undefined
        ? new Date(pod.last_seen_timestamp * 1000)
        : undefined;

      await prisma.pnode.upsert({
        where: { address },
        update: {
          version: pod.version,
          gossipLastSeenTimestamp: pod.last_seen_timestamp
            ? BigInt(pod.last_seen_timestamp)
            : null,
          gossipLastSeen: gossipLastSeen ?? null,
          // Don't update failureCount, lastStatsAttemptAt, nextStatsAllowedAt, or reachable here
        },
        create: {
          address,
          version: pod.version,
          gossipLastSeenTimestamp: pod.last_seen_timestamp
            ? BigInt(pod.last_seen_timestamp)
            : null,
          gossipLastSeen: gossipLastSeen ?? null,
          reachable: false,
          failureCount: 0,
        },
      });
    }

    result.podsUpdated = pods.length;

    // Step 3: For each pnode in DB, check eligibility and call getStats if eligible (in parallel)
    const allPnodes = await prisma.pnode.findMany();

    // Filter eligible pnodes
    const eligiblePnodes = allPnodes.filter((pnode) => {
      if (!isEligibleForStats(pnode)) {
        console.log(`→ Skipping pod ${pnode.address} (backoff until ${pnode.nextStatsAllowedAt})`);
        return false;
      }
      return true;
    });

    result.statsAttempts = eligiblePnodes.length;

    if (eligiblePnodes.length > 0) {
      // Process eligible pnodes in parallel batches
      const batchResults = await processStatsBatch(eligiblePnodes, 10);
      result.statsSuccess = batchResults.success;
      result.statsFailure = batchResults.failure;
    }

    console.log('Ingestion run completed.');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Fatal error in ingestion:', errorMessage);
    result.ok = false;
    result.error = errorMessage;
  }

  return result;
}

