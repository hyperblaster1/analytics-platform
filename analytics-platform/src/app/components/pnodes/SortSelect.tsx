"use client";

import { SortOption } from "../../types";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

type SortSelectProps = {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
};

export function SortSelect({ sortOption, setSortOption }: SortSelectProps) {
  return (
    <Select
      value={sortOption}
      onValueChange={(v) => setSortOption(v as SortOption)}
    >
      <SelectTrigger className="text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="version-desc">Version (High → Low)</SelectItem>
        <SelectItem value="version-asc">Version (Low → High)</SelectItem>
        <SelectItem value="uptime-desc">Uptime (High → Low)</SelectItem>
        <SelectItem value="uptime-asc">Uptime (Low → High)</SelectItem>
        <SelectItem value="active-streams-desc">
          Active Streams (High → Low)
        </SelectItem>
        <SelectItem value="active-streams-asc">
          Active Streams (Low → High)
        </SelectItem>
        <SelectItem value="last-seen-desc">Last Seen (Newest)</SelectItem>
        <SelectItem value="last-seen-asc">Last Seen (Oldest)</SelectItem>
        <SelectItem value="credits-desc">Credits (High → Low)</SelectItem>
        <SelectItem value="credits-asc">Credits (Low → High)</SelectItem>
      </SelectContent>
    </Select>
  );
}
