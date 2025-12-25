"use client";

import { ThemeToggle } from "@/app/components/layout/ThemeToggle";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Server, Network } from "lucide-react";

export type IngestStats = {
  seedsCount: number;
  totalPods: number;
  gossipObs: number;
  statsAttempts: number;
  statsSuccess: number;
  statsFailure: number;
  backoffCount: number;
};

type HeaderProps = {
  nextApiCallInSeconds: number;
  activeTab: "nodes" | "network";
  onTabChange: (tab: "nodes" | "network") => void;
};

export function Header({
  nextApiCallInSeconds,
  activeTab,
  onTabChange,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-2 px-9 py-2 shadow-sm bg-[var(--card-bg)]">
      {/* Single row: brand, tabs, timer, theme toggle */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7  rounded-md bg-[var(--primary)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-md font-semibold tracking-tight text-[var(--text-primary)]">
            Xandeum
          </span>
        </div>

        {/* Center: tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange(v as "nodes" | "network")}
        >
          <TabsList>
            <TabsTrigger value="nodes" className="text-xs">
              {activeTab === "nodes" ? (
                "Nodes"
              ) : (
                <Server className="w-3 h-3" strokeWidth={1.5} />
              )}
            </TabsTrigger>
            <TabsTrigger value="network" className="text-xs">
              {activeTab === "network" ? (
                "Network"
              ) : (
                <Network className="w-3 h-3" strokeWidth={1.5} />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right: timer, theme toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-mono font-semibold text-primary">
              {nextApiCallInSeconds}s
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
