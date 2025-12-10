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
};

export type GlobalPnode = {
  id: number;
  pubkey: string | null;
  reachable: boolean;
  failureCount: number;
  lastStatsAttemptAt: string | null;
  lastStatsSuccessAt: string | null;
  latestAddress: string | null;
  latestVersion: string | null;
  gossipLastSeen: string | null;
  seedIdsSeen: number[];
  seedsSeenCount: number;
  latestStats: LatestStats | null;
};

export type Seed = {
  id: number;
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
  | 'last-seen-asc';

export type ReachabilityFilter = 'all' | 'reachable' | 'unreachable';

