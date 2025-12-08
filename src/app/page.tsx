// src/app/page.tsx
import { prisma } from '@/lib/db';
import { RefreshButton } from '@/components/pnodes/RefreshButton';
import PnodeListClient from '@/components/pnodes/PnodeListClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const pnodesRaw = await prisma.pnode.findMany({
    orderBy: { address: 'asc' },
    include: {
      samples: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  const pnodes = pnodesRaw.map((node) => ({
    id: node.id,
    address: node.address,
    version: node.version,
    pubkey: ('pubkey' in node ? (node.pubkey as string | null) : null) ?? null,
    reachable: node.reachable,
    gossipLastSeen: (node as any).gossipLastSeen ? (node as any).gossipLastSeen.toISOString() : null,
    lastStatsSuccessAt: node.lastStatsSuccessAt ? node.lastStatsSuccessAt.toISOString() : null,
    lastStatsAttemptAt: node.lastStatsAttemptAt ? node.lastStatsAttemptAt.toISOString() : null,
    failureCount: node.failureCount,
    samples: node.samples.map((s) => ({
      cpuPercent: s.cpuPercent,
      ramUsedBytes: s.ramUsedBytes ? Number(s.ramUsedBytes) : null,
      ramTotalBytes: s.ramTotalBytes ? Number(s.ramTotalBytes) : null,
      uptimeSeconds: s.uptimeSeconds,
      packetsInPerSec: s.packetsInPerSec,
      packetsOutPerSec: s.packetsOutPerSec,
      totalBytes: s.totalBytes ? Number(s.totalBytes) : null,
      activeStreams: s.activeStreams,
      timestamp: s.timestamp.toISOString(),
    })),
  }));

  return (
    <main className="min-h-screen px-6 py-8 text-gray-900">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900">pNodes</h1>
      <RefreshButton />
      <PnodeListClient pnodes={pnodes} />
    </main>
  );
}
