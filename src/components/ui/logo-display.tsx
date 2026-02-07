'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { CorsSafeImage } from '@/components/ui/cors-safe-image';


interface LogoDisplayProps {
  logoUrl?: string;
  fallbackIcon: LucideIcon;
  alt: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'square' | 'rounded' | 'circle';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12'
};

const variantClasses = {
  square: 'rounded-none',
  rounded: 'rounded-lg',
  circle: 'rounded-full'
};

const sizesMap = {
  sm: '32px',
  md: '40px',
  lg: '48px'
};



export function LogoDisplay({
  logoUrl,
  fallbackIcon: FallbackIcon,
  alt,
  className,
  iconClassName,
  size = 'md',
  variant = 'rounded'
}: LogoDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!logoUrl);

  // Reset states when logoUrl changes
  useEffect(() => {
    if (logoUrl) {
      setImageError(false);
      setImageLoading(true);
    } else {
      setImageError(false);
      setImageLoading(false);
    }
  }, [logoUrl]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // If no logo URL or image failed to load, show fallback icon
  if (!logoUrl || imageError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-transparent",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}>
        <FallbackIcon className={cn(
          "text-primary",
          size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6',
          iconClassName
        )} />
      </div>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden bg-transparent",
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
          <FallbackIcon className={cn(
            "text-primary animate-pulse",
            size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6',
            iconClassName
          )} />
        </div>
      )}
      <CorsSafeImage
        src={logoUrl}
        alt={alt}
        fill
        className={cn(
          "object-contain transition-opacity duration-200",
          imageLoading ? 'opacity-0' : 'opacity-100'
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
}
