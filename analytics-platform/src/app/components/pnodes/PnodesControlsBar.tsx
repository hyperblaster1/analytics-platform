"use client";

import { SortOption, ReachabilityFilter, Seed } from "../../types";
import { ReachabilityToggle } from "./ReachabilityToggle";
import { SortSelect } from "./SortSelect";
import { SearchInput } from "./SearchInput";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

type PnodesControlsBarProps = {
  selectedSeedId: string | "global";
  setSelectedSeedId: (id: string | "global") => void;
  seeds: Seed[];
  reachFilter: ReachabilityFilter;
  setReachFilter: (filter: ReachabilityFilter) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  totalCount?: number;
  loadedCount?: number;
  filteredCount?: number;
};

export function PnodesControlsBar({
  selectedSeedId,
  setSelectedSeedId,
  seeds,
  reachFilter,
  setReachFilter,
  sortOption,
  setSortOption,
  searchText,
  setSearchText,
  totalCount,
  loadedCount,
  filteredCount,
}: PnodesControlsBarProps) {
  return (
    <div className="my-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
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

        {totalCount !== undefined && loadedCount !== undefined && (
          <div className="text-xs text-muted-foreground">
            {filteredCount} shown out of {totalCount}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-64">
          <SearchInput
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by IP or pubkey..."
          />
        </div>
        <SortSelect sortOption={sortOption} setSortOption={setSortOption} />
        <ReachabilityToggle
          reachFilter={reachFilter}
          setReachFilter={setReachFilter}
        />
      </div>
    </div>
  );
}
