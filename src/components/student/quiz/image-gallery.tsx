// @ts-nocheck
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ZoomIn,
  ZoomOut,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CorsSafeImage } from '@/components/ui/cors-safe-image';

import { FullScreenImageViewer } from '@/components/ui/full-screen-image-viewer';

interface ImageData {
  id: number;
  imagePath: string;
  altText?: string;
}

interface ImageGalleryProps {
  images: ImageData[];
  title?: string;
  className?: string;
  maxHeight?: string; // Default: max-h-96 (384px)
  gridCols?: 'auto' | 1 | 2 | 3;
  showZoom?: boolean;
  compact?: boolean;
}

// Legacy ImageModal interface kept for backward compatibility
interface ImageModalProps {
  image: ImageData;
  images: ImageData[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Legacy ImageModal component - now just a wrapper around FullScreenImageViewer
function ImageModal(props: ImageModalProps) {
  return <FullScreenImageViewer {...props} />;
}

export function ImageGallery({
  images,
  title,
  className,
  maxHeight = "max-h-96",
  gridCols = 'auto',
  showZoom = true,
  compact = false
}: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = useCallback((imageId: number, imagePath: string, error: any) => {
    console.error(`[ImageGallery] Image failed to load - ID: ${imageId}, Path: ${imagePath}`, error);
    console.error(`[ImageGallery] Error details:`, {
      imageId,
      imagePath,
      errorType: error?.type || 'unknown',
      errorMessage: error?.message || 'No error message',
      timestamp: new Date().toISOString()
    });
    setImageErrors(prev => new Set(prev).add(imageId));
  }, []);



  const handleImageLoad = useCallback((imageId: number) => {
    console.log(`[ImageGallery] Image ${imageId} loaded successfully`);
  }, []);

  const handleImageLoadStart = useCallback((imageId: number) => {
    console.log(`[ImageGallery] Image ${imageId} started loading`);
  }, []);

  const openModal = useCallback((index: number) => {
    if (showZoom) {
      setSelectedImageIndex(index);
    }
  }, [showZoom]);

  const closeModal = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  const nextImage = useCallback(() => {
    setSelectedImageIndex(prev => 
      prev !== null && prev < images.length - 1 ? prev + 1 : prev
    );
  }, [images.length]);

  const previousImage = useCallback(() => {
    setSelectedImageIndex(prev => 
      prev !== null && prev > 0 ? prev - 1 : prev
    );
  }, []);

  if (!images || images.length === 0) {
    return null;
  }

  // Debug logging for image data
  console.log(`[ImageGallery] Rendering ${images.length} images:`, images.map(img => ({
    id: img.id,
    imagePath: img.imagePath,
    altText: img.altText,
    hasValidPath: !!img.imagePath && img.imagePath.length > 0
  })));

  // Determine grid columns - memoized for performance
  const gridClassName = useMemo(() => {
    if (gridCols !== 'auto') return `grid-cols-${gridCols}`;

    if (images.length === 1) return 'grid-cols-1';
    if (images.length === 2) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }, [gridCols, images.length]);

  // Determine if we should center single images
  const shouldCenterSingleImage = images.length === 1 && gridCols === 'auto';

  return (
    <>
      <div className={cn("space-y-3", className)}>

        <div className={cn(
          "grid gap-3",
          gridClassName,
          shouldCenterSingleImage && "justify-center"
        )}>
          {images.filter(image => image.imagePath && image.imagePath.trim().length > 0).map((image, index) => {
            const hasError = imageErrors.has(image.id);
            
            console.log(`[ImageGallery] Rendering image ${image.id}:`, {
              hasError,
              imagePath: image.imagePath
            });

            return (
              <Card
                key={image.id}
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  showZoom && !hasError && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
                  compact && "border-border/50",
                  shouldCenterSingleImage && "max-w-2xl mx-auto"
                )}
                onClick={() => !hasError && openModal(index)}
              >
                <CardContent className="p-0">
                  <div className={cn(
                    "relative w-full flex items-center justify-center p-4",
                    maxHeight,
                    compact ? "min-h-[200px]" : "min-h-[240px]"
                  )}>
                    {hasError ? (
                      <div className="text-center space-y-2">
                        <p className="text-xs text-muted-foreground">Image unavailable</p>
                      </div>
                    ) : (
                      <>
                        <img
                          src={image.imagePath}
                          alt={image.altText || `Image ${index + 1}`}
                          className="max-w-full max-h-full object-contain rounded"
                          onError={(e) => handleImageError(image.id, image.imagePath, e)}
                          onLoad={() => handleImageLoad(image.id)}
                          onLoadStart={() => handleImageLoadStart(image.id)}
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        {showZoom && (
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                            <ZoomIn className="h-6 w-6 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {image.altText && !compact && (
                    <div className="p-2 border-t bg-muted/20">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {image.altText}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedImageIndex !== null && (
        <ImageModal
          image={images[selectedImageIndex]}
          images={images}
          currentIndex={selectedImageIndex}
          isOpen={selectedImageIndex !== null}
          onClose={closeModal}
          onNext={nextImage}
          onPrevious={previousImage}
        />
      )}
    </>
  );
}
