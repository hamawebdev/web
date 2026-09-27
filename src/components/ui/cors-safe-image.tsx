'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { isApiMediaUrl, resolveImagePath } from '@/lib/image-loader';

interface CorsSafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  fallback?: React.ReactNode;
  priority?: boolean;
}

/**
 * Image component for API-served media: resolves stored paths to the API origin and
 * falls back to the same-origin image proxy if the direct request fails.
 */
export function CorsSafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  onLoad,
  onError,
  onLoadStart,
  fallback,
  priority = false
}: CorsSafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(() => resolveImagePath(src));
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  // Candidate URLs, tried in order. API media loads directly from the API origin
  // (it sends Cross-Origin-Resource-Policy: cross-origin); the same-origin proxy is a fallback.
  const generateFallbackUrls = (originalSrc: string): string[] => {
    const resolved = resolveImagePath(originalSrc);
    if (!isApiMediaUrl(resolved)) {
      return [resolved];
    }
    return [resolved, `/api/proxy-image?url=${encodeURIComponent(resolved)}`];
  };

  useEffect(() => {
    const urls = generateFallbackUrls(src);
    setImageSrc(urls[0] || src);
    setCurrentSrcIndex(0);
    setRetryCount(0);
    setImageError(false);
  }, [src]);

  const handleError = (error: any) => {
    const urls = generateFallbackUrls(src);
    console.warn(`[CorsSafeImage] Image failed to load (attempt ${currentSrcIndex + 1}/${urls.length}):`, { 
      originalSrc: src, 
      currentSrc: imageSrc, 
      error,
      fallbackUrls: urls
    });
    
    // Try next fallback URL if available
    const nextIndex = currentSrcIndex + 1;
    if (nextIndex < urls.length) {
      setCurrentSrcIndex(nextIndex);
      setImageSrc(urls[nextIndex]);
      setRetryCount(prev => prev + 1);
      // Reset error state to allow retry
      setImageError(false);
    } else {
      // All fallbacks failed
      console.error(`[CorsSafeImage] All ${urls.length} fallback URLs failed for:`, src);
      setImageError(true);
      onError?.(error);
    }
  };

  const handleLoad = () => {
    setImageError(false);
    onLoad?.();
  };

  const handleLoadStart = () => {
    onLoadStart?.();
  };

  // Show fallback if image failed to load
  if (imageError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <img
      key={`${src}-${currentSrcIndex}-${retryCount}`}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        "object-contain",
        fill && "absolute inset-0 w-full h-full",
        className
      )}
      onLoad={handleLoad}
      onError={handleError}
      onLoadStart={handleLoadStart}
      loading={priority ? "eager" : "lazy"}
      style={fill ? { objectFit: 'contain' } : undefined}
    />
  );
}
