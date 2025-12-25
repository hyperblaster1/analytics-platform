"use client";

import React from "react";

type BadgeVariant = "default" | "destructive";

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const baseClasses =
    "h-4 w-4 flex items-center justify-center rounded border text-xs";
  const variantClasses: Record<BadgeVariant, string> = {
    default: "border-primary text-primary bg-transparent",
    destructive: "border-danger text-danger bg-transparent",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
