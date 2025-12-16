export type LatestStats = {
  timestamp: string;
  cpuPercent: number | null;
  ramUsedBytes: number | null;
  ramTotalBytes: number | null;
  uptimeSeconds: number | null;
  packetsInPerSec: number | null;
  packetsOutPerSec: number | null;
  totalBytes: number | null;
  activeStreams: number | null;
  bytesPerSecond: number | null;
};

export type GlobalPnode = {
  id: number;
  pubkey: string;
  reachable: boolean;
  failureCount: number;
  lastStatsAttemptAt: string | null;
  lastStatsSuccessAt: string | null;
  latestAddress: string | null;
  latestVersion: string | null;
  gossipLastSeen: string | null;
  seedBaseUrlsSeen: string[];
  seedsSeenCount: number;
  latestStats: LatestStats | null;
  // Credits fields
  latestCredits: number | null;
  creditsUpdatedAt: string | null;
  creditDelta24h: number | null;
};

export type Seed = {
  id: string; // baseUrl used as id
  name: string;
  baseUrl: string;
};

export type PnodeListClientProps = {
  seeds: Seed[];
  globalPnodes: GlobalPnode[];
};

export type LayoutMode = 'grid' | 'list';

export type SortOption =
  | 'version-desc'
  | 'version-asc'
  | 'uptime-desc'
  | 'uptime-asc'
  | 'active-streams-desc'
  | 'active-streams-asc'
  | 'last-seen-desc'
  | 'last-seen-asc'
  | 'credits-desc'
  | 'credits-asc';

export type ReachabilityFilter = 'all' | 'reachable' | 'unreachable';

