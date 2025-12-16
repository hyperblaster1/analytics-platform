'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from './Card';

export function PnodeSkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-3 w-40 rounded bg-muted animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-muted animate-pulse" />
          <div className="h-2 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-2 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

