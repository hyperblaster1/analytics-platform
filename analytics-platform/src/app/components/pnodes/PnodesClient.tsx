"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PnodeListClientProps, Seed, GlobalPnode } from "../../types";
import { PnodesControlsBar } from "./PnodesControlsBar";
import { PnodesList } from "./PnodesList";
import { useIngestionStatus } from "../../hooks/useIngestionStatus";
import { usePnodeFilters } from "../../hooks/usePnodeFilters";
import { StatusStrip } from "@/app/components/layout/StatusStrip";
import { NodeDrawer } from "@/app/components/node-drawer/NodeDrawer";
import {
  PAGE_SIZE,
  DRAWER_SPINNER_TIMEOUT,
  DRAWER_STATE_POLL_INTERVAL,
  DRAWER_STATE_TIMEOUT,
  PNODES_REFRESH_INTERVAL,
} from "@/constants";

// Type for drawer opening state
interface DrawerOpeningState {
  show: boolean;
  timer: NodeJS.Timeout | null;
}

// Extend Window interface
declare global {
  interface Window {
    __drawerOpeningState?: DrawerOpeningState;
  }
}

// Shared state to track drawer opening immediately on card click (exposed on window for cross-component access)
if (typeof window !== "undefined" && !window.__drawerOpeningState) {
  window.__drawerOpeningState = { show: false, timer: null };
}
const drawerOpeningState: DrawerOpeningState =
  typeof window !== "undefined" && window.__drawerOpeningState
    ? window.__drawerOpeningState
    : { show: false, timer: null };

// Component to track drawer opening state (needs to be in Suspense for useSearchParams)
function DrawerOpeningTracker() {
  const searchParams = useSearchParams();
  const nodePubkey = searchParams.get("node");
  const [showSpinner, setShowSpinner] = useState(false);
  const previousNodePubkeyRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Poll shared state for immediate spinner trigger (set on card click, before URL changes)
    const checkAndShowSpinner = () => {
      if (drawerOpeningState.show) {
        setShowSpinner(true);
        // Clear any existing timer before setting a new one
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowSpinner(false);
          drawerOpeningState.show = false;
          if (drawerOpeningState.timer) {
            clearTimeout(drawerOpeningState.timer);
            drawerOpeningState.timer = null;
          }
          timerRef.current = null;
        }, DRAWER_SPINNER_TIMEOUT);
      }
    };

    // Check immediately
    checkAndShowSpinner();

    // Poll at high frequency for immediate response when card is clicked
    const interval = setInterval(
      checkAndShowSpinner,
      DRAWER_STATE_POLL_INTERVAL
    );

    // Also handle URL param changes (fallback)
    if (nodePubkey) {
      const isNewNode = previousNodePubkeyRef.current !== nodePubkey;

      if (isNewNode) {
        setShowSpinner(true);
        // Clear any existing timer before setting a new one
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowSpinner(false);
          drawerOpeningState.show = false;
          if (drawerOpeningState.timer) {
            clearTimeout(drawerOpeningState.timer);
            drawerOpeningState.timer = null;
          }
          timerRef.current = null;
        }, DRAWER_SPINNER_TIMEOUT);
      }

      previousNodePubkeyRef.current = nodePubkey;
    } else {
      // Drawer is closing - hide spinner immediately
      setShowSpinner(false);
      previousNodePubkeyRef.current = null;
      drawerOpeningState.show = false;
      if (drawerOpeningState.timer) {
        clearTimeout(drawerOpeningState.timer);
        drawerOpeningState.timer = null;
      }
    }

    return () => {
      clearInterval(interval);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [nodePubkey]);

  if (!showSpinner) return null;

  return (
    <div className="fixed inset-0 bg-muted/80 dark:bg-muted/60 z-[60] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <div className="text-sm text-muted-foreground">Opening drawer...</div>
      </div>
    </div>
  );
}

export default function PnodesClient({
  seeds: initialSeeds,
  initialPagination,
  initialPnodes,
}: {
  seeds: Seed[];
  initialPagination: {
    offset: number;
    limit: number;
    hasMore: boolean;
    total: number;
  };
  initialPnodes: GlobalPnode[];
}) {
  const [selectedSeedId, setSelectedSeedId] = useState<string | "global">(
    initialSeeds.length > 0 ? initialSeeds[0].baseUrl : "global"
  );

  // Store seeds in state
  const [seeds, setSeeds] = useState<Seed[]>(initialSeeds);

  // Pagination state
  const [pnodes, setPnodes] = useState<GlobalPnode[]>(initialPnodes);
  const [offset, setOffset] = useState(
    initialPagination.offset + initialPagination.limit
  );
  const [hasMore, setHasMore] = useState(initialPagination.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [total, setTotal] = useState(initialPagination.total);

  // Ref for infinite scroll sentinel
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use read-only ingestion status hook
  const { nextApiCallInSeconds, isRunning, ingestStats } = useIngestionStatus({
    selectedSeedId,
  });

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const res = await fetch(
        `/api/pnodes?limit=${PAGE_SIZE}&offset=${offset}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();

      if (data.seeds && Array.isArray(data.seeds)) {
        setSeeds(data.seeds);
      }

      if (data.pnodes && Array.isArray(data.pnodes)) {
        setPnodes((prev) => [...prev, ...data.pnodes]);
      }

      if (data.pagination) {
        setOffset((prev) => prev + data.pagination.limit);
        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
      }
    } catch (e) {
      console.error("Failed to load more pnodes", e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, offset]);

  // Reset pagination when seed changes
  const resetAndFetch = useCallback(async () => {
    setPnodes([]);
    setOffset(0);
    setHasMore(true);
    setIsLoadingMore(true);

    try {
      const res = await fetch(`/api/pnodes?limit=${PAGE_SIZE}&offset=0`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();

      if (data.seeds && Array.isArray(data.seeds)) {
        setSeeds(data.seeds);
      }

      if (data.pnodes && Array.isArray(data.pnodes)) {
        setPnodes(data.pnodes);
      }

      if (data.pagination) {
        setOffset(data.pagination.limit);
        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
      }
    } catch (e) {
      console.error("Failed to fetch pnodes", e);
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  // Refresh data periodically (every 30 seconds) - only refresh current page
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Only refresh the first page to update existing data
        const res = await fetch(`/api/pnodes?limit=${PAGE_SIZE}&offset=0`, {
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.pnodes && Array.isArray(data.pnodes)) {
            // Update only the first PAGE_SIZE items to refresh data
            setPnodes((prev) => {
              const updated = [...prev];
              data.pnodes.forEach((newNode: GlobalPnode, idx: number) => {
                if (idx < updated.length) {
                  // Update existing node if id matches
                  const existingIdx = updated.findIndex(
                    (n) => n.id === newNode.id
                  );
                  if (existingIdx !== -1) {
                    updated[existingIdx] = newNode;
                  }
                }
              });
              return updated;
            });
          }
          if (data.pagination) {
            const newTotal = data.pagination.total;
            // If new nodes were added to the database, enable loading more
            if (newTotal > total) {
              setHasMore(true);
            }
            setTotal(newTotal);
          }
        }
      } catch (e) {
        console.error("Failed to refresh pnodes", e);
      }
    }, PNODES_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [total]);

  // Use filters hook
  const {
    sortOption,
    setSortOption,
    reachFilter,
    setReachFilter,
    searchText,
    setSearchText,
    processedPnodes,
  } = usePnodeFilters({
    globalPnodes: pnodes,
    selectedSeedId,
  });

  // Intersection Observer for infinite scroll
  // Only observe when there are processed nodes to prevent triggering on empty lists
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    // Don't observe if the filtered list is empty - prevents false triggers
    if (processedPnodes.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        // Only trigger if there are processed nodes, has more data, and not already loading
        if (
          first.isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          processedPnodes.length > 0
        ) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMore, processedPnodes.length]);

  return (
    <>
      <Suspense fallback={null}>
        <DrawerOpeningTracker />
      </Suspense>

      <StatusStrip ingestStats={ingestStats} />

      {/* Content Area - Max Width 1400px */}
      <div className="w-full  px-9 mx-auto flex flex-col gap-4">
        <PnodesControlsBar
          selectedSeedId={selectedSeedId}
          setSelectedSeedId={setSelectedSeedId}
          seeds={seeds}
          reachFilter={reachFilter}
          setReachFilter={setReachFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          searchText={searchText}
          setSearchText={setSearchText}
          totalCount={total}
          loadedCount={pnodes.length}
          filteredCount={processedPnodes.length}
        />

        <PnodesList
          processedPnodes={processedPnodes}
          isIngesting={isRunning}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
        />

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="h-4" aria-hidden="true" />
      </div>

      <Suspense fallback={null}>
        <NodeDrawer />
      </Suspense>
    </>
  );
}
