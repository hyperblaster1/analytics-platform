"use client";

import { GlobalPnode } from "../../types";
import { PnodeCard } from "./PnodeCard";
import { PnodeSkeletonCard } from "./PnodeSkeletonCard";

type PnodesListProps = {
  processedPnodes: GlobalPnode[];
  isIngesting: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
};

export function PnodesList({ 
  processedPnodes, 
  isIngesting,
  isLoadingMore = false,
  hasMore = false,
}: PnodesListProps) {
  // Initial skeleton state (no data yet, ingesting)
  if (processedPnodes.length === 0 && isIngesting) {
    return (
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, idx) => (
          <PnodeSkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  // Empty state (no nodes match filters)
  if (processedPnodes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No pNodes match the current filters.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {/* Render loaded pnode cards */}
      {processedPnodes.map((node) => (
        <PnodeCard key={node.id} node={node} />
      ))}

      {/* Loading more skeletons (show 3 at bottom while fetching next page) */}
      {isLoadingMore && hasMore && (
        <>
          <PnodeSkeletonCard />
          <PnodeSkeletonCard />
          <PnodeSkeletonCard />
        </>
      )}
    </div>
  );
}
