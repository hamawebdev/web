'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  AlertCircle, 
  Upload, 
  X, 
  Image as ImageIcon,
  CheckCircle,
  FileImage
} from 'lucide-react';
import { AdminQuestion } from '@/types/api';

interface UpdateQuestionImagesDialogProps {
  question: AdminQuestion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateImages: (questionId: number, questionImages?: File[], explanationImages?: File[]) => Promise<void>;
  loading?: boolean;
}

interface ImageFile extends File {
  preview?: string;
}

interface UploadProgress {
  questionImages: number;
  explanationImages: number;
}

export function UpdateQuestionImagesDialog({
  question,
  open,
  onOpenChange,
  onUpdateImages,
  loading = false,
}: UpdateQuestionImagesDialogProps) {
  const [questionImages, setQuestionImages] = useState<ImageFile[]>([]);
  const [explanationImages, setExplanationImages] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ questionImages: 0, explanationImages: 0 });
  const [dragActive, setDragActive] = useState<{ question: boolean; explanation: boolean }>({
    question: false,
    explanation: false
  });

  // Utility function to format file sizes
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // File validation with enhanced error messages
  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type "${file.type}". Only JPG, PNG, GIF, WebP, BMP, TIFF, and SVG files are allowed.`;
    }

    // Check file extension as additional validation
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      return `Invalid file extension "${fileExtension}". Only ${allowedExtensions.join(', ')} files are allowed.`;
    }

    // Check file size
    if (file.size > maxSize) {
      return `File size (${formatFileSize(file.size)}) exceeds the maximum limit of 10MB.`;
    }

    // Check for empty files
    if (file.size === 0) {
      return 'File appears to be empty or corrupted.';
    }

    return null;
  }, []);

  // Handle file selection for question images
  const handleQuestionImageSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    setError(null);
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (questionImages.length + fileArray.length > 10) {
      setError('Maximum 10 question images allowed');
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
        imageFile.preview = URL.createObjectURL(file);
        validFiles.push(imageFile);
      }
    });
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
    
    if (validFiles.length > 0) {
      setQuestionImages(prev => [...prev, ...validFiles]);
    }
  }, [questionImages.length, validateFile]);

  // Handle file selection for explanation images
  const handleExplanationImageSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    setError(null);
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (explanationImages.length + fileArray.length > 10) {
      setError('Maximum 10 explanation images allowed');
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
        imageFile.preview = URL.createObjectURL(file);
        validFiles.push(imageFile);
      }
    });
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
    
    if (validFiles.length > 0) {
      setExplanationImages(prev => [...prev, ...validFiles]);
    }
  }, [explanationImages.length, validateFile]);

  // Remove question image
  const removeQuestionImage = useCallback((index: number) => {
    setQuestionImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Clean up object URL
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview!);
      }
      return newImages;
    });
  }, []);

  // Remove explanation image
  const removeExplanationImage = useCallback((index: number) => {
    setExplanationImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Clean up object URL
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview!);
      }
      return newImages;
    });
  }, []);

  // Drag and drop handlers for question images
  const handleQuestionDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, question: false }));
    
    if (loading) return;
    
    handleQuestionImageSelect(e.dataTransfer.files);
  }, [loading, handleQuestionImageSelect]);

  const handleQuestionDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) {
      setDragActive(prev => ({ ...prev, question: true }));
    }
  }, [loading]);

  const handleQuestionDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, question: false }));
  }, []);

  // Drag and drop handlers for explanation images
  const handleExplanationDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, explanation: false }));
    
    if (loading) return;
    
    handleExplanationImageSelect(e.dataTransfer.files);
  }, [loading, handleExplanationImageSelect]);

  const handleExplanationDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) {
      setDragActive(prev => ({ ...prev, explanation: true }));
    }
  }, [loading]);

  const handleExplanationDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, explanation: false }));
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (questionImages.length === 0 && explanationImages.length === 0) {
      setError('Please select at least one image to upload');
      return;
    }

    try {
      await onUpdateImages(
        question.id,
        questionImages.length > 0 ? questionImages : undefined,
        explanationImages.length > 0 ? explanationImages : undefined
      );
      
      // Reset form on success
      resetForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update images');
    }
  };

  // Reset form
  const resetForm = useCallback(() => {
    // Clean up object URLs
    questionImages.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    explanationImages.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    
    setQuestionImages([]);
    setExplanationImages([]);
    setError(null);
    setUploadProgress({ questionImages: 0, explanationImages: 0 });
  }, [questionImages, explanationImages]);

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Update Question Images
          </DialogTitle>
          <DialogDescription>
            Update images for question: "{question.questionText.substring(0, 100)}..."
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          {/* Question Images Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Question Images</Label>
              <p className="text-sm text-muted-foreground">
                Upload images to accompany the question text. Maximum 10 images, 10MB each.
              </p>
            </div>

            {/* Question Images Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragActive.question
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onDrop={handleQuestionDrop}
              onDragOver={handleQuestionDragOver}
              onDragLeave={handleQuestionDragLeave}
              onClick={!loading ? () => document.getElementById('question-images')?.click() : undefined}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-muted rounded-full">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {dragActive.question ? 'Drop question images here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, WebP, BMP, TIFF, SVG up to 10MB each
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {questionImages.length}/10 images selected
                  </p>
                </div>
              </div>
              <input
                id="question-images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleQuestionImageSelect(e.target.files)}
                disabled={loading}
                className="hidden"
              />
            </div>
          </div>

          {/* Question Images Preview */}
          {questionImages.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Selected Question Images ({questionImages.length})</Label>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {questionImages.map((image, index) => (
                  <Card key={index} className="p-3">
                    <CardContent className="p-0">
                      <div className="space-y-2">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          {image.preview && (
                            <img
                              src={image.preview}
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeQuestionImage(index)}
                            disabled={loading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium truncate">{image.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(image.size)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Explanation Images Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Explanation Images</Label>
              <p className="text-sm text-muted-foreground">
                Upload images to accompany the question explanation. Maximum 10 images, 10MB each.
              </p>
            </div>

            {/* Explanation Images Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragActive.explanation
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onDrop={handleExplanationDrop}
              onDragOver={handleExplanationDragOver}
              onDragLeave={handleExplanationDragLeave}
              onClick={!loading ? () => document.getElementById('explanation-images')?.click() : undefined}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-muted rounded-full">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {dragActive.explanation ? 'Drop explanation images here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, WebP, BMP, TIFF, SVG up to 10MB each
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {explanationImages.length}/10 images selected
                  </p>
                </div>
              </div>
              <input
                id="explanation-images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleExplanationImageSelect(e.target.files)}
                disabled={loading}
                className="hidden"
              />
            </div>
          </div>

          {/* Explanation Images Preview */}
          {explanationImages.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Selected Explanation Images ({explanationImages.length})</Label>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {explanationImages.map((image, index) => (
                  <Card key={index} className="p-3">
                    <CardContent className="p-0">
                      <div className="space-y-2">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          {image.preview && (
                            <img
                              src={image.preview}
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeExplanationImage(index)}
                            disabled={loading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium truncate">{image.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(image.size)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {loading && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Upload Progress</Label>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((uploadProgress.questionImages + uploadProgress.explanationImages) / 2)}%
                  </span>
                </div>
                <Progress
                  value={(uploadProgress.questionImages + uploadProgress.explanationImages) / 2}
                  className="w-full"
                />
              </div>
              {questionImages.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Question Images</span>
                    <span className="text-xs text-muted-foreground">{uploadProgress.questionImages}%</span>
                  </div>
                  <Progress value={uploadProgress.questionImages} className="w-full h-1" />
                </div>
              )}
              {explanationImages.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Explanation Images</span>
                    <span className="text-xs text-muted-foreground">{uploadProgress.explanationImages}%</span>
                  </div>
                  <Progress value={uploadProgress.explanationImages} className="w-full h-1" />
                </div>
              )}
            </div>
          )}

          {/* Current Images Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Current Images</Label>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Question Images:</span> {question.questionImages?.length || 0}
              </div>
              <div>
                <span className="font-medium">Explanation Images:</span> {question.questionExplanationImages?.length || 0}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Uploading new images will replace all existing images of that type.
            </p>
          </div>
        </form>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {(questionImages.length > 0 || explanationImages.length > 0) && !loading && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Ready to upload {questionImages.length + explanationImages.length} image(s)
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || (questionImages.length === 0 && explanationImages.length === 0)}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Update Images
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
