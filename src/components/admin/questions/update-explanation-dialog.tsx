'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, FileText, Upload, X } from 'lucide-react';
import { AdminQuestion } from '@/types/api';

interface UpdateExplanationDialogProps {
  question: AdminQuestion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateExplanation: (explanation: string, explanationImages?: File[]) => Promise<void>;
  loading: boolean;
}

export function UpdateExplanationDialog({
  question,
  open,
  onOpenChange,
  onUpdateExplanation,
  loading,
}: UpdateExplanationDialogProps) {
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [explanationImages, setExplanationImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Only image files under 10MB are allowed.');
    } else {
      setError(null);
    }

    setExplanationImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setExplanationImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!explanation.trim()) {
      setError('Please enter an explanation');
      return;
    }

    try {
      await onUpdateExplanation(explanation, explanationImages.length > 0 ? explanationImages : undefined);
      // Reset form on success
      setExplanation(question.explanation || '');
      setExplanationImages([]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update explanation');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setExplanation(question.explanation || '');
        setExplanationImages([]);
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Update Question Explanation
          </DialogTitle>
          <DialogDescription>
            Update the explanation for this question. You can also add explanatory images.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Question Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <Label className="text-sm font-medium">Question</Label>
            <p className="text-sm mt-1 leading-relaxed">
              {question.questionText.length > 200 
                ? `${question.questionText.substring(0, 200)}...` 
                : question.questionText
              }
            </p>
          </div>

          {/* Current Explanation */}
          {question.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-blue-800">Current Explanation</Label>
              <p className="text-sm mt-1 text-blue-700 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

          {/* New Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">
              {question.explanation ? 'New Explanation *' : 'Explanation *'}
            </Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Enter detailed explanation for this question..."
              disabled={loading}
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              Provide a clear and comprehensive explanation that helps students understand the concept.
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="images">Explanatory Images (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-muted file:text-muted-foreground"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('images')?.click()}
                  disabled={loading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Upload images to help illustrate the explanation. Max 10MB per file.
              </div>
            </div>

            {/* Selected Images Preview */}
            {explanationImages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Images ({explanationImages.length})</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {explanationImages.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !explanation.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Explanation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
