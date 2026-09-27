import { NextRequest, NextResponse } from 'next/server';
import { API_ORIGIN } from '@/lib/config';

/**
 * Same-origin image proxy used as a fallback when an API image cannot be loaded directly.
 * GET /api/proxy-image?url=<absolute API URL | path on the API origin>
 *
 * SSRF guard: only http(s) URLs whose host (hostname + port) equals the API host are fetched,
 * redirects are refused, and only image responses are passed through.
 */

const API_HOST = new URL(API_ORIGIN).host;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * Reads a response body chunk by chunk and stops (cancelling the upstream
 * stream) as soon as it exceeds `maxBytes`, so an oversized or lying upstream
 * never gets fully buffered in memory. Returns null when the cap is exceeded.
 */
async function readBodyWithLimit(body: ReadableStream<Uint8Array>, maxBytes: number): Promise<Uint8Array | null> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('Image exceeds size limit').catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function resolveTarget(raw: string): URL | null {
  let target: URL;
  try {
    // Relative paths ("/api/v1/media/...") resolve against the API origin;
    // absolute URLs keep their own origin and are checked below.
    target = new URL(raw, `${API_ORIGIN}/`);
  } catch {
    return null;
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') return null;
  if (target.host !== API_HOST) return null;
  if (target.username || target.password) return null;
  return target;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) {
    return new NextResponse('Missing image URL parameter', { status: 400 });
  }

  const target = resolveTarget(raw);
  if (!target) {
    return new NextResponse('Invalid image URL', { status: 403 });
  }

  try {
    const upstream = await fetch(target, {
      redirect: 'error',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'image/*' },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      await upstream.body?.cancel().catch(() => {});
      return new NextResponse('Failed to fetch image', { status: upstream.status === 404 ? 404 : 502 });
    }

    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      await upstream.body?.cancel().catch(() => {});
      return new NextResponse('Upstream response is not an image', { status: 502 });
    }

    const declaredLength = Number(upstream.headers.get('content-length') || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      await upstream.body?.cancel().catch(() => {});
      return new NextResponse('Image too large', { status: 413 });
    }

    if (!upstream.body) {
      return new NextResponse('Empty upstream response', { status: 502 });
    }

    // Enforce the cap while streaming: Content-Length can be absent or wrong.
    const body = await readBodyWithLimit(upstream.body, MAX_IMAGE_BYTES);
    if (!body) {
      return new NextResponse('Image too large', { status: 413 });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    console.error('[ImageProxy] Error proxying image:', {
      url: target.toString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return new NextResponse(isTimeout ? 'Upstream timeout' : 'Bad gateway', { status: isTimeout ? 504 : 502 });
  }
}
