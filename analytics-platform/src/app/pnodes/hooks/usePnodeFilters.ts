"use client";

import { useState, useMemo } from "react";
import { GlobalPnode, SortOption, ReachabilityFilter } from "../types";

type UsePnodeFiltersProps = {
  globalPnodes: GlobalPnode[];
  selectedSeedId: string | "global";
};

export function usePnodeFilters({
  globalPnodes,
  selectedSeedId,
}: UsePnodeFiltersProps) {
  const [sortOption, setSortOption] = useState<SortOption>("version-desc");
  const [reachFilter, setReachFilter] = useState<ReachabilityFilter>("all");

  // Process and filter/sort nodes
  const processedPnodes = useMemo(() => {
    let items = [...globalPnodes];

    // Filter by seed (if not global view)
    if (selectedSeedId !== "global") {
      items = items.filter((n) => n.seedBaseUrlsSeen.includes(selectedSeedId));
    }

    // Filter by reachability
    if (reachFilter === "reachable") {
      items = items.filter((n) => n.reachable);
    } else if (reachFilter === "unreachable") {
      items = items.filter((n) => !n.reachable);
    }

    // Sorting
    const parseSemver = (
      v: string | null | undefined
    ): [number, number, number] => {
      if (!v) return [0, 0, 0];
      const parts = v.replace(/^v/, "").split(".");
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

      // Treat null/undefined uptime OR unreachable nodes as -Infinity for sorting (N/A nodes sort last)
      // This matches the UI behavior where unreachable nodes show N/A
      // This distinguishes N/A from actual 0 uptime (which is a valid value)
      const uptimeA =
        a.reachable && latestA?.uptimeSeconds != null
          ? latestA.uptimeSeconds
          : -Infinity;
      const uptimeB =
        b.reachable && latestB?.uptimeSeconds != null
          ? latestB.uptimeSeconds
          : -Infinity;

      const streamsA = latestA?.activeStreams ?? 0;
      const streamsB = latestB?.activeStreams ?? 0;

      const lastSeenA = a.gossipLastSeen
        ? new Date(a.gossipLastSeen).getTime()
        : 0;
      const lastSeenB = b.gossipLastSeen
        ? new Date(b.gossipLastSeen).getTime()
        : 0;

      const creditsA = a.latestCredits ?? -Infinity; // null credits sort last
      const creditsB = b.latestCredits ?? -Infinity;

      switch (sortOption) {
        case "version-desc":
          return compareSemver(b.latestVersion, a.latestVersion);
        case "version-asc":
          return compareSemver(a.latestVersion, b.latestVersion);
        case "uptime-desc":
          // For descending: N/A (-Infinity) automatically sorts last
          return uptimeB - uptimeA;
        case "uptime-asc":
          // For ascending: N/A (-Infinity) automatically sorts first
          return uptimeA - uptimeB;
        case "active-streams-desc":
          return streamsB - streamsA;
        case "active-streams-asc":
          return streamsA - streamsB;
        case "last-seen-desc":
          return lastSeenB - lastSeenA;
        case "last-seen-asc":
          return lastSeenA - lastSeenB;
        case "credits-desc":
          return creditsB - creditsA;
        case "credits-asc":
          return creditsA - creditsB;
        default:
          return 0;
      }
    });

    return items;
  }, [globalPnodes, reachFilter, sortOption, selectedSeedId]);

  return {
    sortOption,
    setSortOption,
    reachFilter,
    setReachFilter,
    processedPnodes,
  };
}
