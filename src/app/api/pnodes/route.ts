// src/app/api/pnodes/route.ts
import { NextResponse } from "next/server";
import { getGlobalPnodeView } from "@/lib/pnode-queries";
import { DEFAULT_SEEDS } from "@/config/seeds";
import { DEFAULT_LIMIT, MIN_LIMIT, MAX_LIMIT } from "@/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Parse query parameters for pagination
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    // Parse and validate limits
    const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Cap limits to prevent abuse
    const validLimit = Math.min(Math.max(MIN_LIMIT, limit), MAX_LIMIT);
    const validOffset = Math.max(0, offset);

    // Get paginated pnodes
    const result = await getGlobalPnodeView({
      limit: validLimit,
      offset: validOffset,
    });

    return NextResponse.json({
      seeds: DEFAULT_SEEDS.map((s) => ({
        id: s.baseUrl,
        name: s.name ?? s.baseUrl,
        baseUrl: s.baseUrl,
      })),
      pnodes: result.pnodes,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total,
      },
    });
  } catch (err) {
    console.error("Failed to fetch pnodes", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
