// src/lib/ingest.ts
import { prisma } from '@/lib/db';
import { ensureDefaultSeeds } from './seed-service';
import { getPods, getStats, type PodInfo } from './prpc-client';

function computeNextBackoff(failureCount: number, baseSeconds = 60): number {
  const cappedFailures = Math.min(failureCount, 5);
  return baseSeconds * Math.pow(2, cappedFailures);
}

export async function runIngestionCycle() {
  const seeds = await ensureDefaultSeeds();

  let totalPods = 0;
  let gossipObs = 0;
  let statsAttempts = 0;
  let statsSuccess = 0;
  let statsFailure = 0;

  const now = new Date();

  for (const seed of seeds) {
    if (!seed.enabled) continue;

    const baseUrl = seed.baseUrl;
    let podsResult: { pods: PodInfo[] } | PodInfo[];

    try {
      podsResult = await getPods(baseUrl);
    } catch (err) {
      console.error(`Failed get-pods from seed ${baseUrl}`, err);
      continue;
    }

    // Handle different response structures
    const pods: PodInfo[] = Array.isArray(podsResult) 
      ? podsResult 
      : (podsResult as any).pods || [];

    totalPods += pods.length;

    for (const pod of pods) {
      const { address, version, last_seen_timestamp, pubkey } = pod;

      // 1) Upsert Pnode by pubkey
      let pnode;
      if (pubkey) {
        pnode = await prisma.pnode.upsert({
          where: { pubkey },
          update: {},
          create: { pubkey },
        });
      } else {
        // fallback: create an anonymous pnode if none exists
        // (you may later improve this to avoid duplicates)
        pnode = await prisma.pnode.create({
          data: { pubkey: null },
        });
      }

      // 2) Insert gossip observation
      await prisma.pnodeGossipObservation.create({
        data: {
          seedId: seed.id,
          pnodeId: pnode.id,
          address,
          version: version ?? null,
          lastSeenTimestamp:
            last_seen_timestamp != null ? BigInt(last_seen_timestamp) : null,
          observedAt: now,
        },
      });
      gossipObs++;

      // 3) Decide if we should call get-stats for this pnode (global backoff)
      // Re-read current backoff state, in case it changed
      const freshPnode = await prisma.pnode.findUnique({
        where: { id: pnode.id },
      });
      if (!freshPnode) continue;

      const { nextStatsAllowedAt, failureCount } = freshPnode;

      if (nextStatsAllowedAt && nextStatsAllowedAt > now) {
        // respect backoff
        continue;
      }

      statsAttempts++;

      // Extract IP address and construct pod URL (always use port 6000)
      const ipAddress = address.split(':')[0];
      const statsBaseUrl = `http://${ipAddress}:6000`;

      try {
        const stats = await getStats(statsBaseUrl);

        // Record stats
        await prisma.pnodeStatsSample.create({
          data: {
            pnodeId: pnode.id,
            seedId: seed.id,
            timestamp: new Date(),
            cpuPercent: stats.cpu_percent ?? null,
            ramUsedBytes: stats.ram?.used
              ? BigInt(stats.ram.used)
              : null,
            ramTotalBytes: stats.ram?.total
              ? BigInt(stats.ram.total)
              : null,
            uptimeSeconds: stats.uptime_seconds ?? null,
            packetsInPerSec: stats.network?.packets_in_per_sec ?? null,
            packetsOutPerSec: stats.network?.packets_out_per_sec ?? null,
            totalBytes: stats.storage?.total_bytes != null 
              ? BigInt(stats.storage.total_bytes) 
              : null,
            activeStreams: stats.network?.active_streams ?? null,
          },
        });

        // Update backoff state on success
        await prisma.pnode.update({
          where: { id: pnode.id },
          data: {
            reachable: true,
            failureCount: 0,
            lastStatsAttemptAt: now,
            lastStatsSuccessAt: now,
            nextStatsAllowedAt: new Date(now.getTime() + 60 * 1000),
          },
        });

        statsSuccess++;
      } catch (err) {
        console.error(
          `get-stats failed for ${address} from seed ${baseUrl}`,
          err,
        );

        const newFailureCount = (failureCount ?? 0) + 1;
        const delaySeconds = computeNextBackoff(newFailureCount, 60);

        await prisma.pnode.update({
          where: { id: pnode.id },
          data: {
            reachable: false,
            failureCount: newFailureCount,
            lastStatsAttemptAt: now,
            nextStatsAllowedAt: new Date(now.getTime() + delaySeconds * 1000),
          },
        });

        statsFailure++;
      }
    }
  }

  return {
    seedsCount: seeds.length,
    totalPods,
    gossipObs,
    statsAttempts,
    statsSuccess,
    statsFailure,
  };
}
