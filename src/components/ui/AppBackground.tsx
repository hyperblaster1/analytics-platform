'use client';

import React from 'react';

export default function AppBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-base-layer" />
      <div className="absolute inset-0 bg-gradient-layer" />
      <div className="absolute inset-0 bg-noise-layer opacity-[0.03] dark:opacity-[0.02] mix-blend-soft-light pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
}
