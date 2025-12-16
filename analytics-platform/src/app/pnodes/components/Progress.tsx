'use client';

import React from 'react';

export function Progress({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className={`h-2 bg-muted rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

