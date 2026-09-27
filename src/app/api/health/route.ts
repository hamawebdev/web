import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// Always evaluated per request so the timestamp is live (never prerendered).
export const dynamic = 'force-dynamic';

/**
 * Container liveness probe: GET /api/health
 * It deliberately does not call the backend and exposes only public values.
 */
export function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      commit: process.env.GIT_SHA || 'unknown',
      api: { baseUrl: API_BASE_URL },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
