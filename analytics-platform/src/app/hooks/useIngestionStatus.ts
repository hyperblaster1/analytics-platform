// src/app/pnodes/hooks/useIngestionStatus.ts
// Read-only hook that observes ingestion status from DB
'use client';

import { useState, useEffect, useRef } from 'react';
import { INGESTION_STATUS_POLL_INTERVAL, COUNTDOWN_UPDATE_INTERVAL } from '@/constants';

export type IngestionStatus = {
  lastRunStartedAt: string | null;
  lastRunFinishedAt: string | null;
  attempted: number;
  success: number;
  backoff: number;
  failed: number;
  observed: number;
  isRunning: boolean;
};

type UseIngestionStatusProps = {
  selectedSeedId: string | 'global';
};

const API_POLL_INTERVAL_MS = INGESTION_STATUS_POLL_INTERVAL;
const API_POLL_INTERVAL_SECONDS = INGESTION_STATUS_POLL_INTERVAL / 1000;

export function useIngestionStatus({ selectedSeedId }: UseIngestionStatusProps) {
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [nextApiCallInSeconds, setNextApiCallInSeconds] = useState<number>(API_POLL_INTERVAL_SECONDS);
  const lastApiCallTimeRef = useRef<number>(Date.now());

  const fetchStatus = async () => {
    try {
      const seedBaseUrlParam =
        selectedSeedId === 'global' ? 'global' : selectedSeedId;
      const res = await fetch(`/api/ingestion-status?seedBaseUrl=${seedBaseUrlParam}`);
      if (!res.ok) {
        console.error('Failed to fetch ingestion status');
        return;
      }
      const data = await res.json();
      setStatus({
        lastRunStartedAt: data.lastRunStartedAt,
        lastRunFinishedAt: data.lastRunFinishedAt,
        attempted: data.attempted,
        success: data.success,
        backoff: data.backoff,
        failed: data.failed,
        observed: data.observed ?? 0,
        isRunning: data.isRunning,
      });
      lastApiCallTimeRef.current = Date.now();
      setNextApiCallInSeconds(API_POLL_INTERVAL_SECONDS);
    } catch (e) {
      console.error('Error fetching ingestion status:', e);
    }
  };

  // Fetch status periodically
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, API_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeedId]);

  // Update countdown based on last API call time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSinceLastCall = (now - lastApiCallTimeRef.current) / 1000;
      const secondsUntilNext = Math.max(
        0,
        Math.floor(API_POLL_INTERVAL_SECONDS - elapsedSinceLastCall)
      );
      setNextApiCallInSeconds(secondsUntilNext);
    }, COUNTDOWN_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    nextApiCallInSeconds,
    isRunning: status?.isRunning ?? false,
    ingestStats: status
      ? {
          seedsCount: 1, // Per-seed view shows stats for one seed
          totalPods: status.attempted,
          gossipObs: status.observed, // Use tracked observed count from IngestionRunSeedStats
          statsAttempts: status.attempted,
          statsSuccess: status.success,
          statsFailure: status.failed,
          backoffCount: status.backoff,
        }
      : null,
  };
}
