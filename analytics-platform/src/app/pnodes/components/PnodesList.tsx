"use client";

import React from "react";
import { GlobalPnode } from "../types";
import { PnodeCard } from "./PnodeCard";
import { PnodeSkeletonCard } from "./PnodeSkeletonCard";

type PnodesListProps = {
  processedPnodes: GlobalPnode[];
  isIngesting: boolean;
};

export function PnodesList({ processedPnodes, isIngesting }: PnodesListProps) {
  if (processedPnodes.length === 0) {
    if (isIngesting) {
      // Skeleton state while ingesting and no data yet
      return (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <PnodeSkeletonCard key={idx} />
          ))}
        </div>
      );
    } else {
      // Real empty state (no nodes and not ingesting)
      return (
        <div className="text-center py-12 text-muted-foreground">
          No pNodes match the current filters.
        </div>
      );
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {processedPnodes.map((node) => (
        <PnodeCard key={node.id} node={node} />
      ))}
    </div>
  );
}
