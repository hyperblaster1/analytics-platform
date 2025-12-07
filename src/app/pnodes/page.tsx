// src/app/pnodes/page.tsx
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PnodesPage() {
  const pnodes = await prisma.pnode.findMany({
    orderBy: { address: 'asc' },
    include: {
      samples: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  return (
    <main className="min-h-screen px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">pNodes</h1>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Address
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Version
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Last Seen
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                CPU %
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                RAM (Used / Total)
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Uptime (s)
              </th>
            </tr>
          </thead>
          <tbody>
            {pnodes.map((node) => {
              const latest = node.samples[0];

              const ramUsedGb =
                latest?.ramUsedBytes != null
                  ? Number(latest.ramUsedBytes) / 1_073_741_824
                  : null;
              const ramTotalGb =
                latest?.ramTotalBytes != null
                  ? Number(latest.ramTotalBytes) / 1_073_741_824
                  : null;

              return (
                <tr key={node.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-mono text-xs">
                    {node.address}
                  </td>
                  <td className="px-3 py-2">{node.version ?? '-'}</td>
                  <td className="px-3 py-2">
                    {node.lastSeen
                      ? node.lastSeen.toISOString()
                      : node.lastSeenTimestamp
                      ? String(node.lastSeenTimestamp)
                      : '-'}
                  </td>
                  <td className="px-3 py-2">
                    {latest?.cpuPercent != null
                      ? latest.cpuPercent.toFixed(2)
                      : '-'}
                  </td>
                  <td className="px-3 py-2">
                    {ramUsedGb != null && ramTotalGb != null
                      ? `${ramUsedGb.toFixed(2)} GB / ${ramTotalGb.toFixed(2)} GB`
                      : '-'}
                  </td>
                  <td className="px-3 py-2">
                    {latest?.uptimeSeconds ?? '-'}
                  </td>
                </tr>
              );
            })}

            {pnodes.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-gray-500"
                >
                  No pNodes ingested yet. Run <code>npm run ingest</code> first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

