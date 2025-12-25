// src/app/page.tsx
import { getGlobalPnodeView } from '@/lib/pnode-queries';
import { DEFAULT_SEEDS } from '@/config/seeds';
import { MainClient } from '@/app/components/layout/MainClient';

export const dynamic = 'force-dynamic';

// Initial load: 50 pnodes (fast TTFB, cards render instantly)
const INITIAL_LIMIT = 50;

export default async function Home() {
  // Fetch paginated pnodes view (only first 50)
  const result = await getGlobalPnodeView({ limit: INITIAL_LIMIT, offset: 0 });

  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      <MainClient
        seeds={DEFAULT_SEEDS.map((s) => ({
          id: s.baseUrl,
          name: s.name ?? s.baseUrl,
          baseUrl: s.baseUrl,
        }))}
        initialPnodes={result.pnodes}
        initialPagination={{
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.limit < result.total,
        }}
      />
    </main>
  );
}
