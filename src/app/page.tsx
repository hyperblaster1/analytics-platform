// src/app/page.tsx
import { getAllSeeds, getGlobalPnodeView } from '@/lib/pnode-queries';
import { RefreshButton } from '@/components/pnodes/RefreshButton';
import PnodeListClient from '@/components/pnodes/PnodeListClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [seeds, globalPnodes] = await Promise.all([
    getAllSeeds(),
    getGlobalPnodeView(),
  ]);

  return (
    <main className="min-h-screen px-6 py-8 text-gray-900">
      <PnodeListClient
        seeds={seeds.map((s) => ({
          id: s.id,
          name: s.name ?? s.baseUrl,
          baseUrl: s.baseUrl,
        }))}
        globalPnodes={globalPnodes}
      />
    </main>
  );
}
