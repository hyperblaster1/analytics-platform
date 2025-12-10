'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  LatestStats,
  GlobalPnode,
  Seed,
  PnodeListClientProps,
  LayoutMode,
  SortOption,
  ReachabilityFilter,
} from '../types';
import { shortPubkey, formatLastSeen, toHumanBytes } from '../utils';
import { Progress } from './components/Progress';
import { Badge } from './components/Badge';
import { Card, CardHeader, CardContent } from './components/Card';

// PnodeCard Component
function PnodeCard({
  node,
  layout,
}: {
  node: GlobalPnode;
  layout: 'grid' | 'list';
}) {
  const latest = node.latestStats;
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
            <div className="font-mono text-xs break-all">{node.latestAddress ?? 'N/A'}</div>
            {node.pubkey && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {shortPubkey(node.pubkey)}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant="outline">{node.latestVersion ?? 'Unknown'}</Badge>
            <Badge variant={node.reachable ? 'default' : 'destructive'}>
              {node.reachable ? 'Reachable' : 'Unreachable'}
            </Badge>
          </div>
        </div>
        {/* Show gossip last seen */}
        <div className="mt-2 space-y-1">
          {node.gossipLastSeen && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last seen: {formatLastSeen(node.gossipLastSeen)}
            </div>
          )}
          {node.lastStatsSuccessAt ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              pRPC: {formatLastSeen(node.lastStatsSuccessAt)}
            </div>
          ) : (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              pRPC: never
            </div>
          )}
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
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Stats unavailable (pRPC not reachable).
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PnodesClient({ seeds, globalPnodes }: PnodeListClientProps) {
  const router = useRouter();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('version-desc');
  const [reachFilter, setReachFilter] = useState<ReachabilityFilter>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [selectedSeedId, setSelectedSeedId] = useState<number | null>(null);
  const [ingestMode, setIngestMode] = useState<'auto' | 'manual'>('auto');

  // Auto-ingestion effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    async function runIngestAndRefresh() {
      try {
        await fetch('/api/ingest', { method: 'POST' });
        router.refresh();
      } catch (e) {
        console.error('Auto ingest failed', e);
      }
    }

    if (ingestMode === 'auto') {
      // Run immediately on mount (fixes 1-minute delay on fresh install)
      void runIngestAndRefresh();
      
      // Then set up interval for subsequent runs
      interval = setInterval(() => {
        void runIngestAndRefresh();
      }, 60_000); // 60 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ingestMode, router]);

  // Get unique versions for filter
  const uniqueVersions = useMemo(() => {
    const versions = new Set<string>();
    globalPnodes.forEach((node) => {
      if (node.latestVersion) versions.add(node.latestVersion);
    });
    return Array.from(versions).sort();
  }, [globalPnodes]);

  // Process and filter/sort nodes
  const processedPnodes = useMemo(() => {
    let items = [...globalPnodes];

    // Filter by seed
    if (selectedSeedId !== null) {
      items = items.filter((n) => n.seedIdsSeen.includes(selectedSeedId));
    }

    // Filter by reachability
    if (reachFilter === 'reachable') {
      items = items.filter((n) => n.reachable);
    } else if (reachFilter === 'unreachable') {
      items = items.filter((n) => !n.reachable);
    }

    // Filter by version
    if (versionFilter !== 'all') {
      items = items.filter((n) => (n.latestVersion ?? '') === versionFilter);
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
      const latestA = a.latestStats;
      const latestB = b.latestStats;

      const uptimeA = latestA?.uptimeSeconds ?? 0;
      const uptimeB = latestB?.uptimeSeconds ?? 0;

      const streamsA = latestA?.activeStreams ?? 0;
      const streamsB = latestB?.activeStreams ?? 0;

      const lastSeenA = a.gossipLastSeen ? new Date(a.gossipLastSeen).getTime() : 0;
      const lastSeenB = b.gossipLastSeen ? new Date(b.gossipLastSeen).getTime() : 0;

      switch (sortOption) {
        case 'version-desc':
          return compareSemver(b.latestVersion, a.latestVersion);
        case 'version-asc':
          return compareSemver(a.latestVersion, b.latestVersion);
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
  }, [globalPnodes, reachFilter, versionFilter, sortOption, selectedSeedId]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Bar - Full Width */}
      <header 
        className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 shadow-sm bg-[var(--card-bg)] border border-[var(--card-border)]"
      >
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Xandeum</span>
        </div>

        {/* Center: seed selector */}
        <div className="flex flex-1 justify-center">
          <select
            value={selectedSeedId ?? 'all'}
            onChange={(e) => setSelectedSeedId(e.target.value === 'all' ? null : Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-[var(--input-border)] rounded-md bg-[var(--input-bg)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">View from all seeds</option>
            {seeds.map((seed) => (
              <option key={seed.id} value={seed.id}>
                {seed.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Manual/Auto + theme toggle */}
        <div className="flex items-center gap-4">
          {/* Manual/Auto button */}
          <button
            onClick={() => setIngestMode(ingestMode === 'auto' ? 'manual' : 'auto')}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] hover:bg-[var(--input-hover-bg)] transition-colors"
          >
            {ingestMode === 'auto' ? 'Auto' : 'Manual'}
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Content Area - Max Width 1400px */}
      <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4">
        {/* Controls Bar */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left section: layout + reach filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout toggle */}
          <div className="flex border border-[var(--input-border)] rounded-md overflow-hidden">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                layoutMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--input-bg)] text-[var(--input-text)] hover:bg-[var(--input-hover-bg)]'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                layoutMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--input-bg)] text-[var(--input-text)] hover:bg-[var(--input-hover-bg)]'
              }`}
            >
              List
            </button>
          </div>

          {/* Reachability toggle */}
          <div className="flex border border-[var(--input-border)] rounded-md overflow-hidden">
            <button
              onClick={() => setReachFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                reachFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--input-bg)] text-[var(--input-text)] hover:bg-[var(--input-hover-bg)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setReachFilter('reachable')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                reachFilter === 'reachable'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--input-bg)] text-[var(--input-text)] hover:bg-[var(--input-hover-bg)]'
              }`}
            >
              Reachable
            </button>
            <button
              onClick={() => setReachFilter('unreachable')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                reachFilter === 'unreachable'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--input-bg)] text-[var(--input-text)] hover:bg-[var(--input-hover-bg)]'
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
            className="px-3 py-1.5 text-sm border border-[var(--input-border)] rounded-md bg-[var(--input-bg)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="px-3 py-1.5 text-sm border border-[var(--input-border)] rounded-md bg-[var(--input-bg)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
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
    </div>
  );
}

