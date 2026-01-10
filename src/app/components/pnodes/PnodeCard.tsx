"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalPnode } from "../../types";
import { toHumanBytes, formatLastSeen } from "../../utils";
import { Badge } from "../shared/Badge";
import { Card } from "../shared/Card";
import { CardStatCounter } from "../shared/CardStatCounter";
import { Globe, Lock, Copy, Eye } from "lucide-react";
import { LAST_SEEN_UPDATE_INTERVAL, DRAWER_STATE_TIMEOUT } from "@/constants";

type PnodeCardProps = {
  node: GlobalPnode;
};

// Client-only component to avoid hydration mismatch with time-based formatting
function LastSeenTime({ lastSeen }: { lastSeen: string }) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    setFormatted(formatLastSeen(lastSeen));
    const interval = setInterval(() => {
      setFormatted(formatLastSeen(lastSeen));
    }, LAST_SEEN_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [lastSeen]);

  return <span className="text-muted-foreground">{formatted || "—"}</span>;
}

export function PnodeCard({ node }: PnodeCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Copy to clipboard function
  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Open drawer on card click - use transition for non-blocking update
  const handleCardClick = () => {
    if (!node.pubkey) return;

    // Trigger spinner immediately (before URL changes) - use module-level state
    // Import the state from the parent component's module scope
    const drawerState = window.__drawerOpeningState;
    if (drawerState) {
      if (drawerState.timer) clearTimeout(drawerState.timer);
      drawerState.show = true;
      drawerState.timer = setTimeout(() => {
        drawerState.show = false;
        drawerState.timer = null;
      }, DRAWER_STATE_TIMEOUT);
    }

    startTransition(() => {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("node", node.pubkey!);
      router.push(`?${currentParams.toString()}`, { scroll: false });
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className={`cursor-pointer ${isPending ? "opacity-70" : ""}`}
    >
      <Card className="grid grid-flow-row auto-rows-min gap-0.5 p-4 hover:bg-muted/50 transition-colors">
        {/* Tile 1: Header */}
        <div className="flex justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-mono flex justify-between text-sm font-bold break-all">
              {node.latestAddress ?? "N/A"}
              <Badge variant={node.isPublic ? "default" : "destructive"}>
                {node.isPublic ? (
                  <Globe className="w-2 h-2" strokeWidth={1.5} />
                ) : (
                  <Lock className="w-2 h-2" strokeWidth={1.5} />
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground my-1">
              <span>
                {node.storageCommitted !== null
                  ? toHumanBytes(node.storageCommitted)
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground my-1">
              <span title={node.latestVersion || undefined}>
                {node.latestVersion
                  ? node.latestVersion.length > 12
                    ? `${node.latestVersion.slice(0, 12)}...`
                    : node.latestVersion
                  : "N/A"}
              </span>
              {node.latestVersion && (
                <button
                  onClick={(e) => copyToClipboard(node.latestVersion!, e)}
                  className="inline-flex items-center justify-center p-1.5 bg-transparent rounded transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  title="Copy version"
                  type="button"
                >
                  <Copy className="w-3 h-3" strokeWidth={1.5} />
                </button>
              )}

              <div className="flex items-center gap-1.5 text-xs ml-auto">
                <div className="flex items-center justify-center w-4 h-4 rounded">
                  <Eye
                    className="w-3 h-3 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                </div>
                {node.gossipLastSeen ? (
                  <LastSeenTime lastSeen={node.gossipLastSeen} />
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <CardStatCounter node={node} />
      </Card>
    </div>
  );
}
