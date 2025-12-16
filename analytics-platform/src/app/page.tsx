// src/app/page.tsx
import { getGlobalPnodeView } from '@/lib/pnode-queries';
import { DEFAULT_SEEDS } from '@/config/seeds';
import PnodesClient from '@/app/pnodes/PnodesClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch global pnodes view (client can filter by seed if needed)
  const globalPnodes = await getGlobalPnodeView();

  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      <PnodesClient
        seeds={DEFAULT_SEEDS.map((s) => ({
          id: s.baseUrl,
          name: s.name ?? s.baseUrl,
          baseUrl: s.baseUrl,
        }))}
        globalPnodes={globalPnodes}
      />
    </main>
  );
}
