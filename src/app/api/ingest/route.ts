// src/app/api/ingest/route.ts
import { NextResponse } from 'next/server';
import { runIngestion } from '@/lib/ingest';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await runIngestion();
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        podsUpdated: 0,
        statsAttempts: 0,
        statsSuccess: 0,
        statsFailure: 0,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await runIngestion();
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        podsUpdated: 0,
        statsAttempts: 0,
        statsSuccess: 0,
        statsFailure: 0,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

