'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PnodeListClientProps, Seed, GlobalPnode } from './types';
import { Header } from './components/Header';
import { PnodesControlsBar } from './components/PnodesControlsBar';
import { PnodesList } from './components/PnodesList';
import { useIngestionStatus } from './hooks/useIngestionStatus';
import { usePnodeFilters } from './hooks/usePnodeFilters';
import { StatusStrip } from '@/app/components/StatusStrip';

export default function PnodesClient({
  seeds: initialSeeds,
  globalPnodes: initialGlobalPnodes,
}: PnodeListClientProps) {
  const [selectedSeedId, setSelectedSeedId] = useState<string | 'global'>(
    initialSeeds.length > 0 ? initialSeeds[0].baseUrl : 'global'
  );

  // Store seeds and pnodes in state so we can update them after ingestion
  const [seeds, setSeeds] = useState<Seed[]>(initialSeeds);
  const [globalPnodes, setGlobalPnodes] = useState<GlobalPnode[]>(
    initialGlobalPnodes
  );

  // Update state when props change on initial mount only
  useEffect(() => {
    setSeeds(initialSeeds);
    setGlobalPnodes(initialGlobalPnodes);
  }, [initialSeeds, initialGlobalPnodes]);

  // Function to fetch updated data from the API
  const fetchUpdatedData = useCallback(async () => {
    try {
      const response = await fetch('/api/pnodes', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch pnodes: ${response.status}`);
      }
      const data = await response.json();

      if (data.seeds && Array.isArray(data.seeds)) {
        setSeeds(data.seeds);
      }
      if (data.globalPnodes && Array.isArray(data.globalPnodes)) {
        setGlobalPnodes(data.globalPnodes);
      }
    } catch (e) {
      console.error('Failed to fetch updated pnodes', e);
    }
  }, []);

  // Use read-only ingestion status hook
  const {  nextApiCallInSeconds, isRunning, ingestStats } =
    useIngestionStatus({
      selectedSeedId,
    });

  // Poll for updated data periodically (every 10 seconds)
  useEffect(() => {
    fetchUpdatedData();
    const interval = setInterval(fetchUpdatedData, 30000);
    return () => clearInterval(interval);
  }, [fetchUpdatedData]);

  // Use filters hook
  const {
    sortOption,
    setSortOption,
    reachFilter,
    setReachFilter,
    processedPnodes,
  } = usePnodeFilters({
    globalPnodes,
    selectedSeedId,
  });

  return (
    <>
      <Header
        nextApiCallInSeconds={nextApiCallInSeconds}
      />

      <StatusStrip
        ingestStats={ingestStats}
      />

      {/* Content Area - Max Width 1400px */}
      <div className="w-full max-w-[1400px] px-4 mx-auto flex flex-col gap-4">
        <PnodesControlsBar
          selectedSeedId={selectedSeedId}
          setSelectedSeedId={setSelectedSeedId}
          seeds={seeds}
          reachFilter={reachFilter}
          setReachFilter={setReachFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />

        <PnodesList
          processedPnodes={processedPnodes}
          isIngesting={isRunning}
        />
      </div>
    </>
  );
}
