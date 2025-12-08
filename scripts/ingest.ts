// scripts/ingest.ts
import { prisma } from '../src/lib/db';
import { ensureDefaultSeeds } from '../src/lib/seed-service';
import { getPods, getStats, type PodInfo } from '../src/lib/prpc-client';

const SEED_NODE = process.env.PRPC_SEED_NODE ?? 'http://192.190.136.36:6000';

function computeNextBackoff(failureCount: number, baseSeconds = 60): number {
  const cappedFailures = Math.min(failureCount, 5);
  return baseSeconds * Math.pow(2, cappedFailures);
}

async function main() {
  console.log('Using seed node:', SEED_NODE);

  // Ensure default seeds exist
  const seeds = await ensureDefaultSeeds();
  const seed = seeds.find(s => s.baseUrl === SEED_NODE) || seeds[0];
  
  if (!seed) {
    console.error('No seed found');
    return;
  }

  // 1. Discover pods
  const podsResult = await getPods(SEED_NODE);
  
  // Handle different response structures
  const pods: PodInfo[] = Array.isArray(podsResult) 
    ? podsResult 
    : (podsResult as any).pods || [];
  const count = Array.isArray(podsResult) 
    ? podsResult.length 
    : (podsResult as any).count ?? pods.length;
  
  console.log(`Found ${count} pods`);

  const now = new Date();

  for (const pod of pods) {
    const { address, version, last_seen_timestamp, pubkey } = pod;
    // Extract IP address and always use port 6000 for RPC calls
    const ipAddress = address.split(':')[0];
    const podUrl = `http://${ipAddress}:6000`;

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

    // 3) Check backoff state
    const freshPnode = await prisma.pnode.findUnique({
      where: { id: pnode.id },
    });
    if (!freshPnode) continue;

    const { nextStatsAllowedAt, failureCount } = freshPnode;

    if (nextStatsAllowedAt && nextStatsAllowedAt > now) {
      console.log(`→ Skipping pod ${address} (backoff until ${nextStatsAllowedAt})`);
      continue;
    }

    console.log(`→ Fetching stats for pod ${address} (${podUrl})`);

    try {
      const stats = await getStats(podUrl);

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Failed to ingest stats for pod ${address}:`, errorMessage);

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
    }
  }

  console.log('Ingestion run completed.');
}

main()
  .catch((e) => {
    console.error('Fatal error in ingest:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
