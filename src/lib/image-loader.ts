/**
 * Helpers for images served by the backend API.
 *
 * The backend serves uploaded files only through GET {API_ORIGIN}/api/v1/media/:fileType/:filename.
 * Stored paths come in several historical shapes, all normalised here to an absolute API URL:
 *   /uploads/<type>/<file>                -> {API_ORIGIN}/api/v1/media/<type>/<file>
 *   /api/media/<type>/<file>              -> {API_ORIGIN}/api/v1/media/<type>/<file>
 *   /api/v1/<anything>                    -> {API_ORIGIN}/api/v1/<anything>
 *   https://<any-host>/api/(v1/)media/... -> {API_ORIGIN}/api/v1/media/... (records saved under a previous API host)
 *   https://<backend-host>/uploads/<type>/<file> -> {API_ORIGIN}/api/v1/media/<type>/<file>
 *     (backend-host: the current API or app host, or a legacy med-adn.com host that used to serve the API)
 *   <type>_<name>.<ext> (a bare upload file name)   -> {API_ORIGIN}/api/v1/media/<type>/<type>_<name>.<ext>
 * Anything else (external URLs, data:/blob: URLs, local /public assets) is returned unchanged.
 */

import { API_ORIGIN, APP_URL } from './config';

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

const MEDIA_PATH = /^\/api\/(?:v1\/)?media\//;
const UPLOADS_PATH = /^\/uploads\/([^/]+)\/(.+)$/;
/**
 * Some backend routes store only the file name (they strip directories from imagePath, e.g.
 * question explanation images). Uploads are named `<fileType>_<timestamp>-<random>.<ext>`, so
 * the prefix gives the media folder that serves the file.
 */
const BARE_UPLOAD_FILENAME = /^(images|pdfs|logos|explanations|study-packs)_[^/\\?#\s]+$/;

/** Domain the API used to share with the web app (API base was https://med-adn.com/api/v1). */
const LEGACY_API_DOMAIN = 'med-adn.com';

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

const BACKEND_HOSTNAMES = new Set(
  [hostnameOf(API_ORIGIN), hostnameOf(APP_URL)].filter((h): h is string => Boolean(h)),
);

/**
 * Hosts whose /uploads/... URLs refer to backend uploads: the configured API/app hosts and
 * med-adn.com (or a subdomain), which served the API before it moved to its own origin.
 * Other hosts are left alone so external /uploads/ URLs are never rewritten.
 */
function isBackendHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return BACKEND_HOSTNAMES.has(host) || host === LEGACY_API_DOMAIN || host.endsWith(`.${LEGACY_API_DOMAIN}`);
}

function uploadsPathToMediaUrl(pathname: string, search: string = ''): string | null {
  const uploadsMatch = pathname.match(UPLOADS_PATH);
  if (!uploadsMatch) return null;
  return `${API_ORIGIN}/api/v1/media/${uploadsMatch[1]}/${uploadsMatch[2]}${search}`;
}

/**
 * Custom loader that returns the original image URL without optimization
 * Used for API-served images that don't need Next.js optimization
 */
export function customImageLoader({ src }: ImageLoaderProps): string {
  return src;
}

/**
 * Check if a URL is an API-served media file
 */
export function isApiMediaUrl(src: string): boolean {
  if (!src) return false;
  return src.includes('/api/v1/media/') ||
    src.includes('/api/media/') ||
    src.includes('/uploads/') ||
    src.includes('explanations/') ||
    src.includes('questions/') ||
    src.includes('images/') ||
    src.includes('logos/');
}

/** Rewrite a media pathname to the canonical /api/v1/media/... route. */
function toCanonicalMediaPath(pathname: string): string {
  return pathname.replace(MEDIA_PATH, '/api/v1/media/');
}

/**
 * Resolve the stored path shapes we know about. Returns null for other relative paths.
 */
function resolveKnownPath(value: string): string | null {
  if (/^(data|blob):/i.test(value)) return value;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (MEDIA_PATH.test(url.pathname)) {
        return `${API_ORIGIN}${toCanonicalMediaPath(url.pathname)}${url.search}`;
      }
      if (isBackendHost(url.hostname)) {
        const mapped = uploadsPathToMediaUrl(url.pathname, url.search);
        if (mapped) return mapped;
      }
    } catch {
      // Not a parseable URL; leave it untouched.
    }
    return value;
  }

  const uploadsUrl = uploadsPathToMediaUrl(value);
  if (uploadsUrl) {
    return uploadsUrl;
  }

  if (MEDIA_PATH.test(value)) {
    return `${API_ORIGIN}${toCanonicalMediaPath(value)}`;
  }

  if (value.startsWith('/api/v1/')) {
    return `${API_ORIGIN}${value}`;
  }

  const bareUpload = value.match(BARE_UPLOAD_FILENAME);
  if (bareUpload) {
    return `${API_ORIGIN}/api/v1/media/${bareUpload[1]}/${value}`;
  }

  return null;
}

/**
 * Resolve an image path from the database to an absolute URL on the API origin.
 * Unknown relative paths (e.g. local /public assets) are returned unchanged.
 */
export function resolveImagePath(imagePath: string): string {
  if (!imagePath) return imagePath;
  const value = imagePath.trim();
  return resolveKnownPath(value) ?? value;
}

/** Same resolution for any uploaded media (PDFs, audio, ...), not just images. */
export const resolveMediaUrl = resolveImagePath;

/**
 * Resolve a path that is known to live on the backend (e.g. a book cover): known shapes are
 * handled like resolveImagePath, any other relative path is joined onto `base`.
 */
export function resolveApiAssetUrl(path: string, base: string = API_ORIGIN): string {
  if (!path) return path;
  const value = path.trim();
  const known = resolveKnownPath(value);
  if (known) return known;
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return value;
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`;
}

/**
 * Get the full URL for API media files.
 * Kept as an alias of resolveImagePath for existing callers.
 */
export function getFullMediaUrl(src: string): string {
  return resolveImagePath(src);
}
