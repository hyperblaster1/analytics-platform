// src/app/api/pnodes/route.ts
import { NextResponse } from "next/server";
import { getGlobalPnodeView } from "@/lib/pnode-queries";
import { DEFAULT_SEEDS } from "@/config/seeds";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const globalPnodes = await getGlobalPnodeView();

    return NextResponse.json({
      seeds: DEFAULT_SEEDS.map((s) => ({
        id: s.baseUrl,
        name: s.name ?? s.baseUrl,
        baseUrl: s.baseUrl,
      })),
      globalPnodes,
    });
  } catch (err) {
    console.error("Failed to fetch pnodes", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
