"use client";

import React from "react";

type NetworkParticipationProps = {
  data: {
    seedsSeen: number;
    seedTotal: number;
    gaps: Array<{ start: string; end: string }>;
  };
};

export const NetworkParticipation = React.memo(function NetworkParticipation({
  data,
}: NetworkParticipationProps) {
  const visibilityPercent =
    data.seedTotal > 0 ? (data.seedsSeen / data.seedTotal) * 100 : 0;

  let visibilityLabel = "Intermittent";
  if (visibilityPercent >= 80) {
    visibilityLabel = "Globally visible";
  } else if (visibilityPercent >= 50) {
    visibilityLabel = "Regionally visible";
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Network Participation
      </h2>

      <div className="p-4 bg-muted/50 dark:bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {data.seedsSeen} / {data.seedTotal}
          </div>
          <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            seeds
          </div>
        </div>
      </div>

      {/* Visibility label */}
      <div className="text-center">
        <span
          className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
            visibilityPercent >= 80
              ? "bg-green-500/20 text-green-700 dark:text-green-400"
              : visibilityPercent >= 50
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
              : "bg-red-500/20 text-red-700 dark:text-red-400"
          }`}
        >
          {visibilityLabel}
        </span>
      </div>

      {/* Gossip gaps */}
      {data.gaps.length > 0 && (
        <div className="space-y-2">
          <div className="text-lg font-semibold text-[var(--text-primary)]">
            Gossip Gaps ({data.gaps.length})
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.gaps.slice(0, 5).map((gap, i) => {
              const start = new Date(gap.start);
              const end = new Date(gap.end);
              const durationMs = end.getTime() - start.getTime();
              const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(1);

              return (
                <div
                  key={i}
                  className="text-xs text-muted-foreground dark:text-muted-foreground p-2 bg-muted/50 rounded"
                >
                  <div>
                    {start.toLocaleString()} → {end.toLocaleString()}
                  </div>
                  <div className="text-xs opacity-75">
                    Duration: {durationHours}h
                  </div>
                </div>
              );
            })}
            {data.gaps.length > 5 && (
              <div className="text-xs text-muted-foreground">
                +{data.gaps.length - 5} more gaps
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
