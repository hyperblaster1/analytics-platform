export type LatestStats = {
  timestamp: string;
  uptimeSeconds: number | null;
  packetsInPerSec: number | null;
  packetsOutPerSec: number | null;
  totalBytes: number | null;
  activeStreams: number | null;
};

export type GlobalPnode = {
  id: number;
  pubkey: string | null;
  isPublic: boolean;
  failureCount: number;
  lastStatsAttemptAt: string | null;
  lastStatsSuccessAt: string | null;
  latestAddress: string | null;
  latestVersion: string | null;
  gossipLastSeen: string | null;
  seedBaseUrlsSeen: string[];
  seedsSeenCount: number;
  latestStats: LatestStats | null;
  storageUsagePercent: number | null; // Percentage (0-100)
  storageCommitted: number | null; // Storage committed in bytes
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

export type PaginationMeta = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type PnodeListClientProps = {
  seeds: Seed[];
  initialPnodes: GlobalPnode[];
  initialPagination: PaginationMeta;
};

export type LayoutMode = "grid" | "list";

export type SortOption =
  | "version-desc"
  | "version-asc"
  | "uptime-desc"
  | "uptime-asc"
  | "active-streams-desc"
  | "active-streams-asc"
  | "last-seen-desc"
  | "last-seen-asc"
  | "credits-desc"
  | "credits-asc";

export type ReachabilityFilter = "all" | "reachable" | "unreachable";
