import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the last ingestion run to know the time window
    const lastRun = await prisma.ingestionRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    if (!lastRun) {
      return NextResponse.json({
        lastRunStartedAt: null,
        lastRunFinishedAt: null,
        attempted: 0,
        success: 0,
        backoff: 0,
        failed: 0,
        observed: 0,
        isRunning: false,
      });
    }

    // Parse seedBaseUrl from query params
    const url = new URL(request.url);
    const seedBaseUrlParam = url.searchParams.get('seedBaseUrl');

    // If global view or no seedBaseUrl specified, return global stats
    if (!seedBaseUrlParam || seedBaseUrlParam === 'global') {
      // For global view, use the observed count from IngestionRun (unique across all seeds)
      // This is more accurate than summing per-seed counts which would double-count pnodes
      // that appear in multiple seeds' gossip
      const totalObserved = lastRun.observed ?? 0;
      
      return NextResponse.json({
        lastRunStartedAt: lastRun.startedAt.toISOString(),
        lastRunFinishedAt: lastRun.finishedAt?.toISOString() ?? null,
        attempted: lastRun.attempted,
        success: lastRun.success,
        backoff: Math.max(0, lastRun.backoff), // Ensure non-negative (defensive)
        failed: lastRun.failed,
        observed: totalObserved,
        isRunning: lastRun.finishedAt === null,
      });
    }

    // For specific seed, get tracked stats from IngestionRunSeedStats
    const seedBaseUrl = seedBaseUrlParam;

    // Query per-seed stats for this seed from the last run
    const seedStats = await prisma.ingestionRunSeedStats.findFirst({
      where: {
        ingestionRunId: lastRun.id,
        seedBaseUrl: seedBaseUrl,
      },
    });

    // If per-seed stats exist, use them (accurate tracked data)
    if (seedStats) {
      return NextResponse.json({
        lastRunStartedAt: lastRun.startedAt.toISOString(),
        lastRunFinishedAt: lastRun.finishedAt?.toISOString() ?? null,
        attempted: seedStats.attempted,
        success: seedStats.success,
        backoff: seedStats.backoff,
        failed: seedStats.failed,
        observed: seedStats.observed,
        isRunning: lastRun.finishedAt === null,
      });
    }

    // Fallback: if per-seed stats don't exist (e.g., old runs), return zeros
    // This should not happen for new runs, but handle gracefully
    return NextResponse.json({
      lastRunStartedAt: lastRun.startedAt.toISOString(),
      lastRunFinishedAt: lastRun.finishedAt?.toISOString() ?? null,
      attempted: 0,
      success: 0,
      backoff: 0,
      failed: 0,
      observed: 0,
      isRunning: lastRun.finishedAt === null,
    });
  } catch (e) {
    console.error('[ingestion-status] Error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch ingestion status' },
      { status: 500 }
    );
  }
}

