"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="!h-7 !w-7 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm hover:bg-[var(--input-hover-bg)]"
    >
      {isDark ? (
        <Sun className="h-3 w-3" strokeWidth={1.5} />
      ) : (
        <Moon className="h-3 w-3" strokeWidth={1.5} />
      )}
    </Button>
  );
}
