// scripts/ingest.ts
import { prisma } from '../src/lib/db';
import { getPods, getStats, type PodInfo } from '../src/lib/prpc-client';

const SEED_NODE = process.env.PRPC_SEED_NODE ?? 'http://192.190.136.36:6000';
// You can override this via env if needed.

async function main() {
  console.log('Using seed node:', SEED_NODE);

  // 1. Discover pods
  const podsResult = await getPods(SEED_NODE);
  
  // Handle different response structures
  const pods: PodInfo[] = Array.isArray(podsResult) 
    ? podsResult 
    : podsResult.pods || [];
  const count = Array.isArray(podsResult) 
    ? podsResult.length 
    : podsResult.count ?? pods.length;
  
  console.log(`Found ${count} pods`);

  for (const pod of pods) {
    const address = pod.address;           // "ip:port"
    // Extract IP address and always use port 6000 for RPC calls
    const ipAddress = address.split(':')[0];
    const podUrl = `http://${ipAddress}:6000`;    // base URL for that pNode (always port 6000)

    // Check if pod exists in DB and has failureCount >= 5 - skip if so
    const existingPnode = await prisma.pnode.findUnique({
      where: { address },
    });

    if (existingPnode && existingPnode.failureCount !== null && existingPnode.failureCount >= 5) {
      console.log(`→ Skipping pod ${address} (failureCount: ${existingPnode.failureCount})`);
      continue;
    }

    console.log(`→ Fetching stats for pod ${address} (${podUrl})`);

    const lastSeenTimestamp =
      pod.last_seen_timestamp !== undefined
        ? new Date(pod.last_seen_timestamp * 1000)
        : undefined;

    try {
      const stats = await getStats(podUrl);

      // 2. Upsert pnode - on success: set reachable=true, failureCount=0, lastError=null
      const pnode = await prisma.pnode.upsert({
        where: { address },
        update: {
          version: pod.version,
          lastSeenTimestamp: pod.last_seen_timestamp
            ? BigInt(pod.last_seen_timestamp)
            : null,
          lastSeen: lastSeenTimestamp ?? null,
          reachable: true,
          failureCount: 0,
          lastError: null,
        },
        create: {
          address,
          version: pod.version,
          lastSeenTimestamp: pod.last_seen_timestamp
            ? BigInt(pod.last_seen_timestamp)
            : null,
          lastSeen: lastSeenTimestamp ?? null,
          reachable: true,
          failureCount: 0,
          lastError: null,
        },
      });

      // 3. Insert stats sample
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Truncate error message if too long (e.g., limit to 500 chars)
      const truncatedError = errorMessage.length > 500 
        ? errorMessage.substring(0, 500) + '...' 
        : errorMessage;

      console.error(`Failed to ingest stats for pod ${address}:`, errorMessage);

      // On failure: set reachable=false, increment failureCount (capped at 5), set lastError
      const currentFailureCount = existingPnode?.failureCount ?? 0;
      const newFailureCount = Math.min(currentFailureCount + 1, 5);

      await prisma.pnode.upsert({
        where: { address },
        update: {
          version: pod.version,
          lastSeenTimestamp: pod.last_seen_timestamp
            ? BigInt(pod.last_seen_timestamp)
            : null,
          lastSeen: lastSeenTimestamp ?? null,
          reachable: false,
          failureCount: newFailureCount,
          lastError: truncatedError,
        },
        create: {
          address,
          version: pod.version,
          lastSeenTimestamp: pod.last_seen_timestamp
            ? BigInt(pod.last_seen_timestamp)
            : null,
          lastSeen: lastSeenTimestamp ?? null,
          reachable: false,
          failureCount: 1,
          lastError: truncatedError,
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

