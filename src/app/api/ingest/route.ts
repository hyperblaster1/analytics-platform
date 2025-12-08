// src/app/api/ingest/route.ts
import { NextResponse } from 'next/server';
import { runIngestionCycle } from '@/lib/ingest';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await runIngestionCycle();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('Ingestion fatal error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

