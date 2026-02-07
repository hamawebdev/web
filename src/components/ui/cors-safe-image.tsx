'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { isApiMediaUrl } from '@/lib/image-loader';

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
 * CORS-safe image component that handles API images by using same-origin requests
 * This bypasses CORS issues by ensuring all requests are made from the same domain
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
  const [imageSrc, setImageSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  // Generate multiple fallback URLs to try
  const generateFallbackUrls = (originalSrc: string): string[] => {
    const urls: string[] = [];
    
    if (isApiMediaUrl(originalSrc)) {
      // For API media files, use proxy as the primary method
      // This bypasses CORS issues by fetching server-side
      urls.push(`/api/proxy-image?url=${encodeURIComponent(originalSrc)}`);
      
      // Try original URL as fallback (might work in some cases)
      urls.push(originalSrc);
      
      // If it's already a relative path, try it (though unlikely to work)
      if (originalSrc.startsWith('/')) {
        urls.push(originalSrc);
      }
    } else {
      // For non-API images, use original URL
      urls.push(originalSrc);
    }
    
    // Remove duplicates
    return [...new Set(urls)];
  };

  useEffect(() => {
    const urls = generateFallbackUrls(src);
    console.log(`[CorsSafeImage] Generated fallback URLs for ${src}:`, urls);
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
      console.log(`[CorsSafeImage] Trying fallback URL ${nextIndex + 1}/${urls.length}:`, urls[nextIndex]);
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

  const handleLoad = (event: any) => {
    const img = event.target;
    console.log(`[CorsSafeImage] Image loaded successfully:`, {
      originalSrc: src,
      loadedSrc: imageSrc,
      attempt: currentSrcIndex + 1,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth: img.width,
      displayHeight: img.height
    });
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
