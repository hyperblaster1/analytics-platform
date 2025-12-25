"use client";

import { ReachabilityFilter } from "../../types";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Globe, Lock } from "lucide-react";

type ReachabilityToggleProps = {
  reachFilter: ReachabilityFilter;
  setReachFilter: (filter: ReachabilityFilter) => void;
};

export function ReachabilityToggle({
  reachFilter,
  setReachFilter,
}: ReachabilityToggleProps) {
  return (
    <Tabs
      value={reachFilter}
      onValueChange={(v) => setReachFilter(v as ReachabilityFilter)}
    >
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="reachable">
          <Globe className="w-3 h-3" strokeWidth={1.5} />
        </TabsTrigger>
        <TabsTrigger value="unreachable">
          <Lock className="w-3 h-3" strokeWidth={1.5} />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
