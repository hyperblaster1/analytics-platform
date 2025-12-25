// src/app/api/network/route.ts
import { NextResponse } from "next/server";
import { getLatestNetworkSnapshot } from "@/lib/network-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLatestNetworkSnapshot();

    if (!data) {
      return NextResponse.json(
        { error: "No network snapshot available" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch network snapshot", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

