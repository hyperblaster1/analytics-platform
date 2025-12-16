"use client";

import React, { useState, useEffect } from "react";
import { GlobalPnode } from "../types";
import { shortPubkey, formatLastSeen } from "../utils";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { CardStatCounter } from "./CardStatCounter";
import { Globe, Lock, Copy, Eye } from "lucide-react";

type PnodeCardProps = {
  node: GlobalPnode;
};

// Client-only component to avoid hydration mismatch with time-based formatting
function LastSeenTime({ lastSeen }: { lastSeen: string }) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    // Only calculate on client after hydration
    setFormatted(formatLastSeen(lastSeen));

    // Update every minute to keep it fresh
    const interval = setInterval(() => {
      setFormatted(formatLastSeen(lastSeen));
    }, 60000);

    return () => clearInterval(interval);
  }, [lastSeen]);

  // Render empty on server, will be populated on client
  return <span className="text-muted-foreground">{formatted || "—"}</span>;
}

export function PnodeCard({ node }: PnodeCardProps) {
  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optional: You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Grid layout uses CSS Grid with tile-based vertical stacking
  return (
    <Card className="grid grid-flow-row auto-rows-min gap-4 p-4">
      {/* Tile 1: Header */}
      <div className="flex justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-mono flex justify-between text-xs break-all">
            {node.latestAddress ?? "N/A"}
            <Badge variant={node.reachable ? "default" : "destructive"}>
              {node.reachable ? (
                <Globe className="w-2 h-2" strokeWidth={1.5} />
              ) : (
                <Lock className="w-2 h-2" strokeWidth={1.5} />
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground my-1">
            <span>{shortPubkey(node.pubkey)}</span>
            <button
              onClick={() => copyToClipboard(node.pubkey)}
              className="inline-flex items-center justify-center p-1.5 bg-transparent rounded transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              title="Copy publisher key"
              type="button"
            >
              <Copy className="w-3 h-3" strokeWidth={1.5} />
            </button>
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
                onClick={() => copyToClipboard(node.latestVersion!)}
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
  );
}
