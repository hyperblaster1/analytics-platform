"use client";

import React from "react";
import { ThemeToggle } from "@/app/components/theme-toggle";

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
};

export function Header({ nextApiCallInSeconds }: HeaderProps) {
  return (
    <header className="flex flex-col gap-2 px-4 py-3 shadow-sm bg-[var(--card-bg)] border-b border-[var(--card-border)]">
      {/* Single row: brand, timer, theme toggle */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <span className="text-md font-semibold tracking-tight text-[var(--text-primary)]">
            Xandeum
          </span>
        </div>

        {/* Right: timer, theme toggle */}
        <div className="flex items-center gap-4">
          {/* Timer - shows countdown to next API call */}
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
