"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Copy } from "lucide-react";
import { HealthSummary } from "./HealthSummary";
import { CreditsChart } from "./CreditsChart";
import { UptimeContinuity } from "./UptimeContinuity";
import { SuccessRateChart } from "./SuccessRateChart";
import { StoragePanel } from "./StoragePanel";
import { NetworkParticipation } from "./NetworkParticipation";
import {
  DRAWER_CACHE_TTL,
  MAX_DRAWER_CACHE_SIZE,
  DRAWER_CLOSE_TRANSITION_TIMEOUT,
} from "@/constants";

type NodeDetails = {
  nodeMeta: {
    pubkey: string;
    version: string | null;
    isPublic: boolean;
    latestAddress: string | null;
  };
  credits: {
    current: number | null;
    delta24h: number | null;
    series20d: Array<{ timestamp: string; credits: number }>;
    series7d: Array<{ timestamp: string; credits: number }>;
  };
  uptime: {
    continuity: { h1: number; h6: number; h24: number };
    timeline: Array<{ timestamp: string; hasStats: boolean }>;
  };
  successRate: {
    rate24h: number;
    failures: Array<{ timestamp: string }>;
  };
  storage: {
    committed: number | null;
    used: number | null;
    usedPercent: number | null;
    history: Array<{ timestamp: string; used: number | null }>;
  };
  gossip: {
    seedsSeen: number;
    seedTotal: number;
    gaps: Array<{ start: string; end: string }>;
  };
};

// Simple in-memory cache
const cache = new Map<string, { data: NodeDetails; timestamp: number }>();

function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > DRAWER_CACHE_TTL) {
      cache.delete(key);
    }
  }
  if (cache.size > MAX_DRAWER_CACHE_SIZE) {
    const entries = Array.from(cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );
    const toRemove = entries.slice(0, cache.size - MAX_DRAWER_CACHE_SIZE);
    for (const [key] of toRemove) {
      cache.delete(key);
    }
  }
}

export function NodeDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nodePubkey = searchParams.get("node");

  // Use transition for non-blocking router updates
  const [isPending, startTransition] = useTransition();

  // Local open state for instant UI response
  const [isOpen, setIsOpen] = useState(false);
  const [localPubkey, setLocalPubkey] = useState<string | null>(null);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [data, setData] = useState<NodeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state with URL (instant open, deferred close)
  useEffect(() => {
    // Clear any pending close timer when URL changes
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (nodePubkey) {
      setIsOpen(true);
      setLocalPubkey(nodePubkey);
    } else {
      setIsOpen(false);
      // Delay clearing pubkey to allow close animation
      closeTimerRef.current = setTimeout(() => {
        setLocalPubkey(null);
        closeTimerRef.current = null;
      }, DRAWER_CLOSE_TRANSITION_TIMEOUT);
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [nodePubkey]);

  const closeDrawer = useCallback(() => {
    // Remove URL parameter immediately and synchronously
    const params = new URLSearchParams(window.location.search);
    params.delete("node");
    const newPath = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    // Update URL immediately using history API (more reliable than router.replace)
    window.history.replaceState(null, "", newPath);

    // Also use router.replace as backup (triggers Next.js navigation)
    router.replace(newPath, { scroll: false });

    // Instant visual close
    setIsOpen(false);
  }, [router]);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Disable body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeDrawer]);

  // Fetch data when drawer opens
  useEffect(() => {
    if (!localPubkey) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    cleanupCache();

    // Check cache first
    const cached = cache.get(localPubkey);
    if (cached && Date.now() - cached.timestamp < DRAWER_CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    // Fetch new data
    setLoading(true);
    setError(null);
    const abortController = new AbortController();

    fetch(`/api/pnodes/${encodeURIComponent(localPubkey)}/details`, {
      signal: abortController.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
        return res.json();
      })
      .then((data: NodeDetails) => {
        if (!abortController.signal.aborted) {
          setData(data);
          cleanupCache();
          cache.set(localPubkey, { data, timestamp: Date.now() });
          setError(null);
        }
      })
      .catch((err) => {
        if (!abortController.signal.aborted) {
          console.error("Failed to fetch node details:", err);
          setError(
            err instanceof Error ? err.message : "Failed to load node details."
          );
          setData(null);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [localPubkey]);

  // Don't render anything if no pubkey
  if (!localPubkey && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay - instant fade */}
      <div
        className={`fixed inset-0 bg-black/50 dark:bg-black/70 z-40 transition-opacity duration-150 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div
        className={`fixed right-0 top-0 h-full w-[500px] bg-background border-l border-border z-50 shadow-xl overflow-y-auto transition-transform duration-150 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">
                  PUBLISHER KEY
                </div>
                <div className="font-mono text-sm truncate flex items-center gap-2">
                  <span className="flex-1 min-w-0 truncate text-[var(--text-primary)]">
                    {localPubkey}
                  </span>
                  {localPubkey && (
                    <button
                      onClick={(e) => copyToClipboard(localPubkey, e)}
                      className="inline-flex items-center justify-center p-1.5 bg-transparent rounded transition-colors cursor-pointer text-muted-foreground hover:text-foreground flex-shrink-0"
                      title="Copy pubkey"
                      type="button"
                    >
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
              {data?.nodeMeta.version && (
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-1">
                    VERSION
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted dark:bg-muted/50 text-muted-foreground dark:text-muted-foreground">
                      {data.nodeMeta.version}
                    </span>
                  </div>
                </div>
              )}
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    data?.nodeMeta.isPublic
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-red-500/20 text-red-700 dark:text-red-400"
                  }`}
                >
                  {data?.nodeMeta.isPublic ? "Public" : "Private"}
                </span>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              className="ml-4 p-2 rounded hover:bg-muted text-[var(--text-primary)] transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Loading state placeholder - only show if we have data to avoid flicker */}
          {loading && !data && (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-muted dark:bg-muted/50 animate-pulse rounded"
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Content */}
          {data && !loading && (
            <>
              <HealthSummary data={data} />
              <CreditsChart data={data.credits} />
              <UptimeContinuity data={data.uptime} />
              <SuccessRateChart data={data.successRate} />
              <StoragePanel data={data.storage} />
              <NetworkParticipation data={data.gossip} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
