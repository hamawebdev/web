'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  FileImage,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageFile extends File {
  altText?: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  showAltText?: boolean;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  maxFileSize = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  disabled = false,
  className,
  label = 'Images',
  description = 'Upload images to accompany your question',
  showAltText = true,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    return null;
  }, [acceptedTypes, maxFileSize]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    setError(null);
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (images.length + fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }
    
    const validFiles: ImageFile[] = [];
    const errors: string[] = [];
    
    fileArray.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        const imageFile = file as ImageFile;
        imageFile.altText = '';
        validFiles.push(imageFile);
      }
    });
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
    
    if (validFiles.length > 0) {
      onImagesChange([...images, ...validFiles]);
    }
  }, [images, maxImages, validateFile, onImagesChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    handleFileSelect(e.dataTransfer.files);
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setError(null);
  }, [images, onImagesChange]);

  const updateAltText = useCallback((index: number, altText: string) => {
    const newImages = [...images];
    newImages[index].altText = altText;
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div className="space-y-1">
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive && !disabled && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-primary/50 cursor-pointer'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="p-2 bg-muted rounded-full">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxFileSize}MB each
            </p>
            <p className="text-xs text-muted-foreground">
              {images.length}/{maxImages} images selected
            </p>
          </div>
        </div>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Selected Images</Label>
          <div className="grid gap-3">
            {images.map((image, index) => (
              <Card key={index} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {image.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(image)}
                            alt={image.altText || image.name}
                            className="w-full h-full object-cover"
                            onLoad={(e) => {
                              // Clean up object URL to prevent memory leaks
                              const img = e.target as HTMLImageElement;
                              setTimeout(() => URL.revokeObjectURL(img.src), 1000);
                            }}
                          />
                        ) : (
                          <FileImage className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium truncate">{image.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(image.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                          disabled={disabled}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {showAltText && (
                        <div className="space-y-1">
                          <Label htmlFor={`alt-text-${index}`} className="text-xs">
                            Alt Text (Optional)
                          </Label>
                          <Input
                            id={`alt-text-${index}`}
                            value={image.altText || ''}
                            onChange={(e) => updateAltText(index, e.target.value)}
                            placeholder="Describe this image..."
                            disabled={disabled}
                            className="text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
