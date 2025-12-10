// src/app/page.tsx
import { getAllSeeds, getGlobalPnodeView } from '@/lib/pnode-queries';
import { ensureDefaultSeeds } from '@/lib/seed-service';
import { RefreshButton } from '@/components/pnodes/RefreshButton';
import PnodesClient from '@/app/pnodes/PnodesClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Ensure seeds exist before querying (fixes dropdown on fresh install)
  await ensureDefaultSeeds();
  
  const [seeds, globalPnodes] = await Promise.all([
    getAllSeeds(),
    getGlobalPnodeView(),
  ]);

  return (
    <main className="min-h-screen px-6 py-8 text-[var(--text-primary)]">
      <PnodesClient
        seeds={seeds.map((s: { id: number; name: string | null; baseUrl: string }) => ({
          id: s.id,
          name: s.name ?? s.baseUrl,
          baseUrl: s.baseUrl,
        }))}
        globalPnodes={globalPnodes}
      />
    </main>
  );
}
