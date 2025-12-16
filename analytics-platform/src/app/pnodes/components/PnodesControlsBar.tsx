"use client";

import React from "react";
import { SortOption, ReachabilityFilter, Seed } from "../types";
import { ReachabilityToggle } from "./ReachabilityToggle";
import { SortSelect } from "./SortSelect";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/select";

type PnodesControlsBarProps = {
  selectedSeedId: string | "global";
  setSelectedSeedId: (id: string | "global") => void;
  seeds: Seed[];
  reachFilter: ReachabilityFilter;
  setReachFilter: (filter: ReachabilityFilter) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
};

export function PnodesControlsBar({
  selectedSeedId,
  setSelectedSeedId,
  seeds,
  reachFilter,
  setReachFilter,
  sortOption,
  setSortOption,
}: PnodesControlsBarProps) {
  return (
    <div className="my-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Left section: seed selector */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedSeedId === "global" ? "global" : selectedSeedId}
          onValueChange={(v) => {
            setSelectedSeedId(v === "global" ? "global" : v);
          }}
        >
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Select seed" />
          </SelectTrigger>
          <SelectContent>
            {seeds.map((seed) => (
              <SelectItem key={seed.baseUrl} value={seed.baseUrl}>
                {seed.name}
              </SelectItem>
            ))}
            <SelectItem value="global">Global view (all seeds)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Right section: reachability, sort */}
      <div className="flex items-center gap-2">
        <SortSelect sortOption={sortOption} setSortOption={setSortOption} />
        <ReachabilityToggle
          reachFilter={reachFilter}
          setReachFilter={setReachFilter}
        />
      </div>
    </div>
  );
}
