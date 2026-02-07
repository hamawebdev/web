'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { isApiMediaUrl, getFullMediaUrl, customImageLoader } from '@/lib/image-loader';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  fallback?: React.ReactNode;
}

/**
 * OptimizedImage component that handles both regular images and API-served media files
 * Automatically falls back to native img tag for API images to avoid Next.js optimization issues
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  sizes,
  priority = false,
  onLoad,
  onError,
  onLoadStart,
  fallback
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [useNativeImg, setUseNativeImg] = useState(false);

  // Always use native img tag for API media files to avoid CORS and optimization issues
  useEffect(() => {
    // Use native img for ALL API media files to avoid Next.js optimization and CORS issues
    setUseNativeImg(isApiMediaUrl(src));
  }, [src]);

  const handleError = (error: any) => {
    console.error('[OptimizedImage] Image failed to load:', { src, error });
    setImageError(true);
    onError?.(error);
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

  const fullSrc = getFullMediaUrl(src);

  // Use native img tag for API images to avoid Next.js optimization and CORS issues
  if (useNativeImg || isApiMediaUrl(src)) {
    return (
      <img
        src={fullSrc}
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
        // Remove CORS attributes that might be causing issues
        loading={priority ? "eager" : "lazy"}
        style={fill ? { objectFit: 'contain' } : undefined}
      />
    );
  }

  // Use Next.js Image for other images
  return (
    <Image
      src={fullSrc}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      onLoad={handleLoad}
      onError={handleError}
      onLoadStart={handleLoadStart}
      loader={customImageLoader}
      unoptimized={isApiMediaUrl(src)}
    />
  );
}
