'use client';

import React from 'react';

type BadgeVariant = 'default' | 'outline' | 'destructive';

export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded';
  const variantClasses: Record<BadgeVariant, string> = {
    default:
      'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    outline:
      'bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-zinc-700',
    destructive:
      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

