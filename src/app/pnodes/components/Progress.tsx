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
      className={`h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

