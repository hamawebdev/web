/**
 * Custom image loader for Next.js Image component
 * This bypasses Next.js image optimization for API-served images
 */

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom loader that returns the original image URL without optimization
 * Used for API-served images that don't need Next.js optimization
 */
export function customImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Always return the original URL without any transformation
  // This ensures no _next/image optimization is attempted
  return src;
}

/**
 * Check if a URL is an API-served media file
 */
export function isApiMediaUrl(src: string): boolean {
  if (!src) return false;
  return src.includes('/api/v1/media/') || 
         src.includes('/api/media/') || 
         src.includes('explanations/') ||
         src.includes('questions/') ||
         src.includes('images/') ||
         src.includes('logos/');
}

/**
 * Get the full URL for API media files
 * Ensures proper domain resolution in production
 */
export function getFullMediaUrl(src: string): string {
  if (!src) return src;
  
  // If already a full URL, return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // If it's a relative API path, make it absolute
  if (src.startsWith('/api/')) {
    // In production, use the current domain
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${src}`;
    }
    // On server side, return relative path
    return src;
  }
  
  return src;
}

