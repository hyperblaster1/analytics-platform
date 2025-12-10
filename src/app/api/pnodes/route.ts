// src/app/api/pnodes/route.ts
import { NextResponse } from 'next/server';
import { getAllSeeds, getGlobalPnodeView } from '@/lib/pnode-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [seeds, globalPnodes] = await Promise.all([
      getAllSeeds(),
      getGlobalPnodeView(),
    ]);

    return NextResponse.json({
      seeds: seeds.map((s) => ({
        id: s.id,
        name: s.name ?? s.baseUrl,
        baseUrl: s.baseUrl,
      })),
      globalPnodes,
    });
  } catch (err) {
    console.error('Failed to fetch pnodes', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

