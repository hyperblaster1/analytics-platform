'use client';

import React from 'react';

export default function AppBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Layer 1: Base gradient blend */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 25%, #DFF3ED 0%, transparent 60%), radial-gradient(circle at 80% 20%, #E8EEFF 0%, transparent 65%), radial-gradient(circle at 30% 80%, #EAE7F7 0%, transparent 70%), radial-gradient(circle at 70% 75%, #F7F5EF 0%, transparent 70%)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundBlendMode: 'soft-light',
        }}
      />

      {/* Layer 2: Shimmer overlays */}
      {/* Shimmer 1: Top-left */}
      <div
        className="absolute w-[300px] h-[200px] md:w-[500px] md:h-[350px] blur-[80px] md:blur-[120px]"
        style={{
          top: '-10%',
          left: '-5%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%)',
          animation: 'shimmer 12s ease-in-out infinite alternate',
        }}
      />

      {/* Shimmer 2: Center-right */}
      <div
        className="absolute w-[300px] h-[200px] md:w-[500px] md:h-[350px] blur-[80px] md:blur-[120px]"
        style={{
          top: '20%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%)',
          animation: 'shimmer 15s ease-in-out infinite alternate',
          animationDelay: '2s',
        }}
      />

      {/* Shimmer 3: Bottom-center */}
      <div
        className="absolute w-[300px] h-[200px] md:w-[500px] md:h-[350px] blur-[80px] md:blur-[120px]"
        style={{
          bottom: '-10%',
          left: '40%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%)',
          animation: 'shimmer 18s ease-in-out infinite alternate',
          animationDelay: '4s',
        }}
      />

      {/* Layer 3: Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
}
