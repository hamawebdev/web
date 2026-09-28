import { readFileSync } from 'node:fs';
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// Always evaluated per request so the timestamp is live (never prerendered).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Written by the Dockerfile "version" stage (source builds get no GIT_SHA build arg). */
const GIT_SHA_FILE = '/app/.git-sha';

let fileCommit: string | undefined;

/** GIT_SHA from the environment when set, else the commit baked into the image, else 'unknown'. */
function currentCommit(): string {
  const fromEnv = process.env.GIT_SHA?.trim();
  if (fromEnv && fromEnv !== 'unknown') return fromEnv;

  if (fileCommit === undefined) {
    try {
      fileCommit = readFileSync(GIT_SHA_FILE, 'utf8').trim() || 'unknown';
    } catch {
      fileCommit = 'unknown';
    }
  }
  return fileCommit;
}

/**
 * Container liveness probe: GET /api/health
 * It deliberately does not call the backend and exposes only public values.
 */
export function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      commit: currentCommit(),
      api: { baseUrl: API_BASE_URL },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
