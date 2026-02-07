// @ts-nocheck
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ZoomIn,
  ZoomOut,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CorsSafeImage } from '@/components/ui/cors-safe-image';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ImageData {
  id: number;
  imagePath: string;
  altText?: string;
}

interface FullScreenImageViewerProps {
  image: ImageData;
  images: ImageData[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const ZOOM_LEVELS = [
  { value: 'fit', label: 'Fit to Screen' },
  { value: '0.25', label: '25%' },
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100%' },
  { value: '1.25', label: '125%' },
  { value: '1.5', label: '150%' },
  { value: '2', label: '200%' },
  { value: '3', label: '300%' },
  { value: '4', label: '400%' },
];

export function FullScreenImageViewer({
  image,
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious
}: FullScreenImageViewerProps) {
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mount check for portal
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Reset state when image changes
  useEffect(() => {
    setZoom('fit');
    setImagePosition({ x: 0, y: 0 });
    setImageError(false);
    setIsImageLoading(true);
  }, [image.id, image.imagePath]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) onPrevious();
          break;
        case 'ArrowRight':
          if (currentIndex < images.length - 1) onNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          setZoom('fit');
          setImagePosition({ x: 0, y: 0 });
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNext, onPrevious]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original styles
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;

      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      return () => {
        // Restore original styles
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [isOpen]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      if (prev === 'fit') return 1.25;
      if (typeof prev === 'number') return Math.min(prev + 0.25, 4);
      return prev;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      if (prev === 'fit') return 0.75;
      if (typeof prev === 'number') return Math.max(prev - 0.25, 0.25);
      return prev;
    });
  }, []);

  const handleZoomChange = useCallback((value: string) => {
    if (value === 'fit') {
      setZoom('fit');
      setImagePosition({ x: 0, y: 0 });
    } else {
      setZoom(parseFloat(value));
    }
  }, []);

  const resetView = useCallback(() => {
    setZoom('fit');
    setImagePosition({ x: 0, y: 0 });
  }, []);

  // Touch/Swipe handling for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setTouchEnd(null);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart) {
      setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = Math.abs(touchStart.y - touchEnd.y);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentIndex < images.length - 1) {
        onNext();
      } else if (deltaX < 0 && currentIndex > 0) {
        onPrevious();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, currentIndex, images.length, onNext, onPrevious]);

  // Mouse drag handling for panning when zoomed
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom !== 'fit' && typeof zoom === 'number' && zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  }, [zoom, imagePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsImageLoading(false);
  }, []);

  if (!isOpen || !isMounted) return null;

  const zoomValue = zoom === 'fit' ? 'fit' : zoom.toString();
  const isZoomed = zoom !== 'fit' && typeof zoom === 'number' && zoom > 1;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm full-screen-image-viewer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer: ${image.altText || `Image ${currentIndex + 1} of ${images.length}`}`}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999
      }}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between p-3 md:p-4">
          
          <div className="flex items-center gap-1 md:gap-2">
            {/* Zoom Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom === 0.25}
              className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9 p-0"
              aria-label="Zoom out"
              title="Zoom out (-)"
            >
              <ZoomOut className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            <Select value={zoomValue} onValueChange={handleZoomChange}>
              <SelectTrigger
                className="w-[80px] md:w-[100px] h-8 md:h-9 text-xs md:text-sm bg-white/20 text-white border-white/30"
                aria-label="Zoom level"
                title="Select zoom level"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZOOM_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom === 4}
              className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9 p-0"
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              <ZoomIn className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9 p-0"
              aria-label="Reset view"
              title="Reset view (0)"
            >
              <RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9 p-0"
              aria-label="Close viewer"
              title="Close viewer (Escape)"
            >
              <X className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 pt-14 md:pt-16 overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <div className="w-full h-full flex items-center justify-center">
          {imageError ? (
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-white/60 mx-auto" />
              <p className="text-white/80">Failed to load image</p>
            </div>
          ) : (
            <div
              ref={imageRef}
              className="transition-transform duration-200 ease-out relative"
              style={{
                transform: zoom === 'fit'
                  ? 'scale(1)'
                  : `scale(${zoom}) translate(${imagePosition.x / (zoom as number)}px, ${imagePosition.y / (zoom as number)}px)`,
                transformOrigin: 'center center'
              }}
            >
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white"></div>
                </div>
              )}
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={image.imagePath}
                  alt={image.altText || `Image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="lg"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 md:h-16 md:w-16 p-0"
            onClick={onPrevious}
            disabled={currentIndex === 0}
            aria-label="Previous image"
            title="Previous image (←)"
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 md:h-16 md:w-16 p-0"
            onClick={onNext}
            disabled={currentIndex === images.length - 1}
            aria-label="Next image"
            title="Next image (→)"
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
          </Button>
        </>
      )}

      {/* Mobile swipe indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden">
        <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1">
          <p className="text-white/80 text-xs">Swipe to navigate</p>
        </div>
      </div>
    </div>
  );

  // Render the modal content in a portal to ensure it's at the document body level
  // Use fallback for SSR
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}
