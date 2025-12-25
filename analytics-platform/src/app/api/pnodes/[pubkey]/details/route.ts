// src/app/api/pnodes/[pubkey]/details/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma as PrismaClient } from "@prisma/client";
import { bigIntToNumberSafe } from "@/lib/storage-analytics";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  try {
    const { pubkey: pubkeyParam } = await params;
    const pubkey = decodeURIComponent(pubkeyParam);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    // Get pnode by pubkey
    const pnode = await prisma.pnode.findUnique({
      where: { pubkey },
      include: {
        gossipObservations: {
          orderBy: { observedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!pnode) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    const latestGossip = pnode.gossipObservations[0] ?? null;

    // Node metadata
    // Use isPublic from gossip observation if available, otherwise use pnode.isPublic
    const isPublic = latestGossip?.isPublic ?? pnode.isPublic ?? false;

    const nodeMeta = {
      pubkey: pnode.pubkey,
      version: latestGossip?.version ?? null,
      isPublic,
      latestAddress: latestGossip?.address ?? null,
    };

    // Credits data - aggressively limit to prevent memory issues
    // Use simple LIMIT queries - much more efficient than loading all then sampling
    const credits20d = await prisma.podCreditsSnapshot.findMany({
      where: {
        podPubkey: pubkey,
        observedAt: { gte: twentyDaysAgo },
      },
      orderBy: { observedAt: "asc" },
      select: { credits: true, observedAt: true },
      take: 200, // Direct limit - no need to load more
    });

    // Get snapshot closest to 24h ago (where observedAt <= twentyFourHoursAgo)
    const snapshot24hAgo = await prisma.podCreditsSnapshot.findFirst({
      where: {
        podPubkey: pubkey,
        observedAt: { lte: twentyFourHoursAgo },
      },
      orderBy: { observedAt: "desc" },
      select: { credits: true, observedAt: true },
    });

    const credits7d = await prisma.podCreditsSnapshot.findMany({
      where: {
        podPubkey: pubkey,
        observedAt: { gte: sevenDaysAgo },
      },
      orderBy: { observedAt: "asc" },
      select: { credits: true, observedAt: true },
      take: 150, // Direct limit - no need to load more
    });

    // Get the absolute latest snapshot (not limited to 24h window)
    const latestSnapshotQuery = await prisma.podCreditsSnapshot.findFirst({
      where: {
        podPubkey: pubkey,
      },
      orderBy: { observedAt: "desc" },
      select: { credits: true, observedAt: true },
    });

    // For "current" credits, prefer pnode.latestCredits (updated more frequently)
    // but fall back to latest snapshot if pnode.latestCredits is null
    const currentCredits =
      pnode.latestCredits ?? latestSnapshotQuery?.credits ?? null;

    // For 24h delta calculation:
    // 1. Use currentCredits (pnode.latestCredits or latest snapshot) as the "now" value
    // 2. Find a snapshot that's actually older than 24 hours for comparison
    // If snapshot24hAgo is the same as latestSnapshotQuery, we need to go back further
    let credits24hAgo: number | null = null;
    if (snapshot24hAgo) {
      // If snapshot24hAgo is the same as latestSnapshotQuery, find the next older one
      if (
        snapshot24hAgo.observedAt.getTime() ===
        latestSnapshotQuery?.observedAt.getTime()
      ) {
        const olderSnapshot = await prisma.podCreditsSnapshot.findFirst({
          where: {
            podPubkey: pubkey,
            observedAt: { lt: snapshot24hAgo.observedAt },
          },
          orderBy: { observedAt: "desc" },
          select: { credits: true, observedAt: true },
        });
        credits24hAgo = olderSnapshot?.credits ?? null;
      } else {
        credits24hAgo = snapshot24hAgo.credits;
      }
    }

    const delta24h =
      currentCredits != null &&
      credits24hAgo != null &&
      currentCredits !== credits24hAgo
        ? currentCredits - credits24hAgo
        : null;

    const credits = {
      current: currentCredits,
      delta24h,
      series20d: credits20d.map((s) => ({
        timestamp: s.observedAt.toISOString(),
        credits: s.credits,
      })),
      series7d: credits7d.map((s) => ({
        timestamp: s.observedAt.toISOString(),
        credits: s.credits,
      })),
    };

    // Uptime continuity - calculate from stats samples (limit queries)
    // Only need count and first/last timestamps for continuity calculation
    const [stats1hCount, stats1hFirst, stats1hLast] = await Promise.all([
      prisma.pnodeStatsSample.count({
        where: {
          pnodeId: pnode.id,
          timestamp: { gte: oneHourAgo },
        },
      }),
      prisma.pnodeStatsSample.findFirst({
        where: {
          pnodeId: pnode.id,
          timestamp: { gte: oneHourAgo },
        },
        orderBy: { timestamp: "asc" },
        select: { timestamp: true },
      }),
      prisma.pnodeStatsSample.findFirst({
        where: {
          pnodeId: pnode.id,
          timestamp: { gte: oneHourAgo },
        },
        orderBy: { timestamp: "desc" },
        select: { timestamp: true },
      }),
    ]);

    const [stats6hCount, stats6hFirst, stats6hLast] = await Promise.all([
      prisma.pnodeStatsSample.count({
        where: {
          pnodeId: pnode.id,
          timestamp: { gte: sixHoursAgo },
        },
      }),
      prisma.pnodeStatsSample.findFirst({
        where: {
          pnodeId: pnode.id,
          timestamp: { gte: sixHoursAgo },
        },
        orderBy: { timestamp: "asc" },
        select: { timestamp: true },
      }),
      prisma.pnodeStatsSample.findFirst({
        where: {
          pnodeId: pnode.id,
          timestamp: { gte: sixHoursAgo },
        },
        orderBy: { timestamp: "desc" },
        select: { timestamp: true },
      }),
    ]);

    const [stats24hCount, stats24hFirst, stats24hLast] = await Promise.all([
      prisma.pnodeStatsSample.count({
        where: {
          pnodeId: pnode.id,
          timestamp: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.pnodeStatsSample.findFirst({
        where: {
          pnodeId: pnode.id,
          timestamp: { gte: twentyFourHoursAgo },
        },
        orderBy: { timestamp: "asc" },
        select: { timestamp: true },
      }),
      prisma.pnodeStatsSample.findFirst({
        where: {
          pnodeId: pnode.id,
          timestamp: { gte: twentyFourHoursAgo },
        },
        orderBy: { timestamp: "desc" },
        select: { timestamp: true },
      }),
    ]);

    // Get limited timeline data for visualization (max 50 points)
    const stats24hTimeline = await prisma.pnodeStatsSample.findMany({
      where: {
        pnodeId: pnode.id,
        timestamp: { gte: twentyFourHoursAgo },
      },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true },
      take: 50, // Direct limit - no need to load more
    });

    // Calculate continuity as percentage of time with samples
    const calculateContinuity = (
      first: { timestamp: Date } | null,
      last: { timestamp: Date } | null,
      periodMs: number
    ) => {
      if (!first || !last) return 0;
      const actualSpan = last.timestamp.getTime() - first.timestamp.getTime();
      return Math.min(100, (actualSpan / periodMs) * 100);
    };

    const uptime = {
      continuity: {
        h1: calculateContinuity(stats1hFirst, stats1hLast, 60 * 60 * 1000),
        h6: calculateContinuity(stats6hFirst, stats6hLast, 6 * 60 * 60 * 1000),
        h24: calculateContinuity(
          stats24hFirst,
          stats24hLast,
          24 * 60 * 60 * 1000
        ),
      },
      timeline: stats24hTimeline.map((s) => ({
        timestamp: s.timestamp.toISOString(),
        hasStats: true, // If we have a sample, stats were successfully collected
      })),
    };

    // Success rate - from stats attempts vs successes
    const statsAttempts24h = await prisma.pnodeStatsSample.count({
      where: {
        pnodeId: pnode.id,
        timestamp: { gte: twentyFourHoursAgo },
      },
    });

    // Estimate success rate from isPublic status
    // If node is public and has recent stats, consider it successful
    const successRate =
      pnode.isPublic && statsAttempts24h > 0
        ? Math.min(
            100,
            (statsAttempts24h /
              Math.max(1, statsAttempts24h + pnode.failureCount)) *
              100
          )
        : 0;

    const failures =
      pnode.failureCount > 0
        ? [
            {
              timestamp:
                pnode.lastStatsAttemptAt?.toISOString() ?? now.toISOString(),
            },
          ]
        : [];

    const successRateData = {
      rate24h: successRate,
      failures,
    };

    // Storage data - from latest stats sample
    const latestStats = await prisma.pnodeStatsSample.findFirst({
      where: { pnodeId: pnode.id },
      orderBy: { timestamp: "desc" },
    });

    // Storage history - limit to reasonable number of points (max 50)
    const storage7d = await prisma.pnodeStatsSample.findMany({
      where: {
        pnodeId: pnode.id,
        timestamp: { gte: sevenDaysAgo },
      },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true, totalBytes: true },
      take: 50, // Direct limit - no need to load more
    });

    const totalBytes = latestStats?.totalBytes
      ? bigIntToNumberSafe(latestStats.totalBytes)
      : null;

    // For storage, we'll use totalBytes as committed (if available)
    // Used would need to come from ramUsedBytes which we removed
    // For now, we'll estimate or use totalBytes for both
    const storage = {
      committed: totalBytes,
      used: totalBytes, // Placeholder - would need ramUsedBytes
      usedPercent: totalBytes ? 100 : null, // Placeholder
      history: storage7d.map((s) => ({
        timestamp: s.timestamp.toISOString(),
        used: s.totalBytes ? bigIntToNumberSafe(s.totalBytes) : null,
      })),
    };

    // Network participation - from gossip observations
    const allSeeds = await prisma.$queryRaw<Array<{ seedBaseUrl: string }>>(
      PrismaClient.sql`
        SELECT DISTINCT "seedBaseUrl"
        FROM "PnodeGossipObservation"
      `
    );

    const seedsSeen = await prisma.$queryRaw<Array<{ seedBaseUrl: string }>>(
      PrismaClient.sql`
        SELECT DISTINCT "seedBaseUrl"
        FROM "PnodeGossipObservation"
        WHERE "pnodeId" = ${pnode.id}
      `
    );

    // Calculate gossip gaps - only check recent observations (last 7 days) to limit data
    // Limit to 500 records max
    const gossipObservations = await prisma.pnodeGossipObservation.findMany({
      where: {
        pnodeId: pnode.id,
        observedAt: { gte: sevenDaysAgo },
      },
      orderBy: { observedAt: "asc" },
      select: { observedAt: true },
      take: 500, // Reduced from 1000 to prevent memory issues
    });

    const gaps: Array<{ start: string; end: string }> = [];
    for (let i = 1; i < gossipObservations.length; i++) {
      const prev = gossipObservations[i - 1].observedAt;
      const curr = gossipObservations[i].observedAt;
      const gapMs = curr.getTime() - prev.getTime();
      // Consider gaps > 1 hour as significant
      if (gapMs > 60 * 60 * 1000) {
        gaps.push({
          start: prev.toISOString(),
          end: curr.toISOString(),
        });
      }
      // Limit gaps to prevent huge arrays
      if (gaps.length >= 50) break;
    }

    const gossip = {
      seedsSeen: seedsSeen.length,
      seedTotal: allSeeds.length,
      gaps,
    };

    return NextResponse.json({
      nodeMeta,
      credits,
      uptime,
      successRate: successRateData,
      storage,
      gossip,
    });
  } catch (err) {
    console.error("Failed to fetch node details", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
