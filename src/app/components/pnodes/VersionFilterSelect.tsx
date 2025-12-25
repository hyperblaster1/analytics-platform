"use client";

import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

type VersionFilterSelectProps = {
  versionFilter: string;
  setVersionFilter: (version: string) => void;
  uniqueVersions: string[];
};

export function VersionFilterSelect({
  versionFilter,
  setVersionFilter,
  uniqueVersions,
}: VersionFilterSelectProps) {
  return (
    <Select value={versionFilter} onValueChange={setVersionFilter}>
      <SelectTrigger className="text-xs">
        <SelectValue placeholder="All Versions" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Versions</SelectItem>
        {uniqueVersions.map((version) => (
          <SelectItem key={version} value={version}>
            {version}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
