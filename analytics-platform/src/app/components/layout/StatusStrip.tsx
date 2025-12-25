"use client";

type IngestStats = {
  seedsCount: number;
  totalPods: number;
  statsAttempts: number;
  statsSuccess: number;
  statsFailure: number;
  backoffCount: number;
  gossipObs?: number; // Unique pnodes observed across all seeds
};

type StatusStripProps = {
  ingestStats: IngestStats | null;
};

export function StatusStrip({ ingestStats }: StatusStripProps) {
  // Always show stats strip when stats are available (from last ingestion run)
  if (!ingestStats) {
    return null;
  }

  // Hide stats strip if all values are 0 (no meaningful data)
  const hasData =
    ingestStats.statsAttempts > 0 ||
    ingestStats.backoffCount > 0 ||
    ingestStats.statsFailure > 0;
  if (!hasData) {
    return null;
  }

  return (
    <div className="w-full py-2 px-9 bg-muted/50 border-b border-t border-[var(--card-border)]">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-md">Last ingestion:</span>
        <span className="font-mono text-md font-semibold text-primary">
          {ingestStats.statsSuccess} succeeded
        </span>
        <span>·</span>
        {ingestStats.statsFailure > 0 ? (
          <span className="font-mono text-md font-semibold text-danger">
            {ingestStats.statsFailure} failed
          </span>
        ) : (
          <span className="font-mono text-md font-semibold text-muted-foreground">
            0 failed
          </span>
        )}
        <span>·</span>
        <span className="font-mono text-md font-semibold text-muted-foreground">
          {ingestStats.backoffCount} skipped
        </span>
      </div>
    </div>
  );
}
