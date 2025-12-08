'use client';

import React, { useState, useMemo } from 'react';

type PnodeSample = {
  cpuPercent: number | null;
  ramUsedBytes: number | null;
  ramTotalBytes: number | null;
  uptimeSeconds: number | null;
  packetsInPerSec: number | null;
  packetsOutPerSec: number | null;
  totalBytes: number | null;
  activeStreams: number | null;
  timestamp: string;
};

type PnodeWithLatestSample = {
  id: number;
  address: string;
  version: string | null;
  pubkey?: string | null;
  reachable: boolean;
  gossipLastSeen: string | null;
  lastStatsSuccessAt: string | null;
  lastStatsAttemptAt: string | null;
  failureCount: number;
  samples: PnodeSample[];
};

type PnodeListClientProps = {
  pnodes: PnodeWithLatestSample[];
};

type LayoutMode = 'grid' | 'list';
type SortOption =
  | 'version-desc'
  | 'version-asc'
  | 'uptime-desc'
  | 'uptime-asc'
  | 'active-streams-desc'
  | 'active-streams-asc'
  | 'last-seen-desc'
  | 'last-seen-asc';
type ReachabilityFilter = 'all' | 'reachable' | 'unreachable';

// Simple UI Components
function Progress({ value, className = '' }: { value: number; className?: string }) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive';
  className?: string;
}) {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded';
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 border border-blue-200',
    outline: 'bg-transparent text-gray-700 border border-gray-300',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
  };
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 pt-0 ${className}`}>{children}</div>;
}

// Helper functions
function shortPubkey(pubkey: string): string {
  if (pubkey.length <= 12) return pubkey;
  return `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;
}

function formatLastSeen(lastSeen: string): string {
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function toHumanBytes(value: number): string {
  if (value >= 1_099_511_627_776) return `${(value / 1_099_511_627_776).toFixed(2)} TB`;
  if (value >= 1_073_741_824) return `${(value / 1_073_741_824).toFixed(2)} GB`;
  if (value >= 1_048_576) return `${(value / 1_048_576).toFixed(2)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(2)} KB`;
  return `${value} B`;
}

// PnodeCard Component
function PnodeCard({
  node,
  layout,
}: {
  node: PnodeWithLatestSample;
  layout: 'grid' | 'list';
}) {
  const latest = node.samples[0];
  const isList = layout === 'list';

  const ramUsed = latest?.ramUsedBytes ?? 0;
  const ramTotal = latest?.ramTotalBytes ?? 0;
  const ramRatio = ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0;
  const toGb = (bytes: number) => bytes / 1_073_741_824;

  const uptimeHours =
    latest?.uptimeSeconds != null ? latest.uptimeSeconds / 3600 : null;

  const totalBytes = latest?.totalBytes ?? 0;

  return (
    <Card className={isList ? 'flex flex-col md:flex-row md:items-center gap-4' : ''}>
      <CardHeader className={isList ? 'flex-1' : ''}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs break-all">{node.address}</div>
            {node.pubkey && (
              <div className="text-xs text-gray-500 mt-1">
                {shortPubkey(node.pubkey)}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant="outline">{node.version ?? 'Unknown'}</Badge>
            <Badge variant={node.reachable ? 'default' : 'destructive'}>
              {node.reachable ? 'Reachable' : 'Unreachable'}
            </Badge>
          </div>
        </div>
        {/* Show both gossip and stats timestamps for clarity */}
        <div className="mt-2 space-y-1">
          {node.gossipLastSeen && (
            <div className="text-xs text-gray-500">
              Gossip: {formatLastSeen(node.gossipLastSeen)}
            </div>
          )}
          {node.lastStatsSuccessAt ? (
            <div className="text-xs text-gray-500">
              pRPC: {formatLastSeen(node.lastStatsSuccessAt)}
            </div>
          ) : (
            <div className="text-xs text-gray-400">
              pRPC: never
            </div>
          )}
        </div>
        {/* Debug output - temporary */}
        <div className="mt-2 text-[10px] text-gray-400 space-y-1 border-t border-gray-200 pt-2">
          <div>reachable: {String(node.reachable)}</div>
          <div>gossipLastSeen: {node.gossipLastSeen || 'null'}</div>
          <div>lastStatsSuccessAt: {node.lastStatsSuccessAt || 'null'}</div>
          <div>lastStatsAttemptAt: {node.lastStatsAttemptAt || 'null'}</div>
          <div>failureCount: {node.failureCount}</div>
        </div>
      </CardHeader>
      <CardContent className={isList ? 'flex-1' : ''}>
        {node.reachable && latest ? (
          <div className="space-y-3">
            {/* CPU */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>CPU</span>
                <span>{latest.cpuPercent?.toFixed(1) ?? '0.0'}%</span>
              </div>
              <Progress value={latest.cpuPercent ?? 0} />
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>RAM</span>
                <span>
                  {ramTotal > 0
                    ? `${toGb(ramUsed).toFixed(2)} GB / ${toGb(ramTotal).toFixed(2)} GB`
                    : 'N/A'}
                </span>
              </div>
              <Progress value={ramTotal > 0 ? ramRatio : 0} />
            </div>

            {/* Uptime */}
            <div className="text-xs">
              Uptime:{' '}
              {uptimeHours != null ? `${uptimeHours.toFixed(1)} hours` : 'N/A'}
            </div>

            {/* Packets */}
            <div className="text-xs">
              Packets:{' '}
              {latest.packetsInPerSec != null || latest.packetsOutPerSec != null ? (
                <>
                  ↓ {latest.packetsInPerSec?.toFixed(0) ?? 0} / ↑{' '}
                  {latest.packetsOutPerSec?.toFixed(0) ?? 0}
                </>
              ) : (
                'N/A'
              )}
            </div>

            {/* Total Bytes */}
            <div className="text-xs">
              Total bytes: {totalBytes > 0 ? toHumanBytes(totalBytes) : 'N/A'}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            Stats unavailable (pRPC not reachable).
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PnodeListClient({ pnodes }: PnodeListClientProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('version-desc');
  const [reachFilter, setReachFilter] = useState<ReachabilityFilter>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');

  // Get unique versions for filter
  const uniqueVersions = useMemo(() => {
    const versions = new Set<string>();
    pnodes.forEach((node) => {
      if (node.version) versions.add(node.version);
    });
    return Array.from(versions).sort();
  }, [pnodes]);

  // Process and filter/sort nodes
  const processedPnodes = useMemo(() => {
    let items = [...pnodes];

    // Filter by reachability
    if (reachFilter === 'reachable') {
      items = items.filter((n) => n.reachable);
    } else if (reachFilter === 'unreachable') {
      items = items.filter((n) => !n.reachable);
    }

    // Filter by version
    if (versionFilter !== 'all') {
      items = items.filter((n) => (n.version ?? '') === versionFilter);
    }

    // Sorting
    const parseSemver = (v: string | null | undefined): [number, number, number] => {
      if (!v) return [0, 0, 0];
      const parts = v.replace(/^v/, '').split('.');
      return [
        Number(parts[0] ?? 0),
        Number(parts[1] ?? 0),
        Number(parts[2] ?? 0),
      ];
    };

    const compareSemver = (va: string | null, vb: string | null) => {
      const [ma, miA, pa] = parseSemver(va);
      const [mb, miB, pb] = parseSemver(vb);
      if (ma !== mb) return ma - mb;
      if (miA !== miB) return miA - miB;
      return pa - pb;
    };

    items.sort((a, b) => {
      const latestA = a.samples[0];
      const latestB = b.samples[0];

      const uptimeA = latestA?.uptimeSeconds ?? 0;
      const uptimeB = latestB?.uptimeSeconds ?? 0;

      const streamsA = latestA?.activeStreams ?? 0;
      const streamsB = latestB?.activeStreams ?? 0;

      const lastSeenA = a.gossipLastSeen ? new Date(a.gossipLastSeen).getTime() : 0;
      const lastSeenB = b.gossipLastSeen ? new Date(b.gossipLastSeen).getTime() : 0;

      switch (sortOption) {
        case 'version-desc':
          return compareSemver(b.version, a.version);
        case 'version-asc':
          return compareSemver(a.version, b.version);
        case 'uptime-desc':
          return uptimeB - uptimeA;
        case 'uptime-asc':
          return uptimeA - uptimeB;
        case 'active-streams-desc':
          return streamsB - streamsA;
        case 'active-streams-asc':
          return streamsA - streamsB;
        case 'last-seen-desc':
          return lastSeenB - lastSeenA;
        case 'last-seen-asc':
          return lastSeenA - lastSeenB;
        default:
          return 0;
      }
    });

    return items;
  }, [pnodes, reachFilter, versionFilter, sortOption]);

  return (
    <div>
      {/* Controls Bar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left section: layout + reach filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                layoutMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                layoutMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>

          {/* Reachability toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setReachFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                reachFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setReachFilter('reachable')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                reachFilter === 'reachable'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Reachable
            </button>
            <button
              onClick={() => setReachFilter('unreachable')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                reachFilter === 'unreachable'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Unreachable
            </button>
          </div>
        </div>

        {/* Right section: sort + version filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort select */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="version-desc">Version (High → Low)</option>
            <option value="version-asc">Version (Low → High)</option>
            <option value="uptime-desc">Uptime (High → Low)</option>
            <option value="uptime-asc">Uptime (Low → High)</option>
            <option value="active-streams-desc">Active Streams (High → Low)</option>
            <option value="active-streams-asc">Active Streams (Low → High)</option>
            <option value="last-seen-desc">Last Seen (Newest)</option>
            <option value="last-seen-asc">Last Seen (Oldest)</option>
          </select>

          {/* Version filter */}
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Versions</option>
            {uniqueVersions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      {processedPnodes.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No pNodes match the current filters.
        </div>
      ) : layoutMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processedPnodes.map((node) => (
            <PnodeCard key={node.id} node={node} layout="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {processedPnodes.map((node) => (
            <PnodeCard key={node.id} node={node} layout="list" />
          ))}
        </div>
      )}
    </div>
  );
}

