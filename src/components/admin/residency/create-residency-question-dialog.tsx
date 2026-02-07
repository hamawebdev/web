'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUpload, ImageFile } from '@/components/ui/image-upload';
import { Loader2, AlertCircle, Plus, Trash2, Check } from 'lucide-react';
import { CreateResidencyQuestionRequest } from '@/types/api';
import { AuthService } from '@/lib/api-services';

interface CreateResidencyQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (questionData: CreateResidencyQuestionRequest) => Promise<any>;
}

interface Answer {
  answerText: string;
  isCorrect: boolean;
}

export function CreateResidencyQuestionDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateResidencyQuestionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    questionText: '',
    explanation: '',
    part: '' as 'Sciences fondamentales' | 'Pathologie medico-chirurgical' | 'Dossier clinique' | '',
    examYear: undefined as number | undefined,
    universityId: undefined as number | undefined,
    metadata: '',
  });

  // Answers state
  const [answers, setAnswers] = useState<Answer[]>([
    { answerText: '', isCorrect: false },
    { answerText: '', isCorrect: false },
  ]);

  // Image upload state
  const [questionImages, setQuestionImages] = useState<ImageFile[]>([]);
  const [explanationImages, setExplanationImages] = useState<ImageFile[]>([]);

  // Load universities
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setLoadingData(true);
        const response = await AuthService.getUniversities();
        if (response.success && response.data) {
          setUniversities(response.data.universities || []);
        }
      } catch (error) {
        console.error('Error loading universities:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      loadUniversities();
    }
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        questionText: '',
        explanation: '',
        part: '',
        examYear: undefined,
        universityId: undefined,
        metadata: '',
      });
      setAnswers([
        { answerText: '', isCorrect: false },
        { answerText: '', isCorrect: false },
      ]);
      setQuestionImages([]);
      setExplanationImages([]);
      setError(null);
    }
  }, [open]);

  const handleAddAnswer = () => {
    setAnswers([...answers, { answerText: '', isCorrect: false }]);
  };

  const handleRemoveAnswer = (index: number) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((_, i) => i !== index));
    }
  };

  const handleAnswerChange = (index: number, field: keyof Answer, value: string | boolean) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.questionText || !formData.part) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.questionText.length < 5) {
      setError('Question text must be at least 5 characters');
      return;
    }

    const validAnswers = answers.filter(a => a.answerText.trim() !== '');
    if (validAnswers.length < 2) {
      setError('Please provide at least 2 answers');
      return;
    }

    const correctAnswers = validAnswers.filter(a => a.isCorrect);
    if (correctAnswers.length === 0) {
      setError('Please mark at least one answer as correct');
      return;
    }

    // Validate image count
    if (questionImages.length > 5) {
      setError('Maximum 5 question images allowed');
      return;
    }

    if (explanationImages.length > 5) {
      setError('Maximum 5 explanation images allowed');
      return;
    }

    try {
      setLoading(true);

      const questionData: CreateResidencyQuestionRequest = {
        questionText: formData.questionText,
        explanation: formData.explanation || undefined,
        part: formData.part,
        examYear: formData.examYear,
        universityId: formData.universityId,
        metadata: formData.metadata || undefined,
        questionAnswers: validAnswers.map(answer => ({
          answerText: answer.answerText,
          isCorrect: answer.isCorrect,
        })),
        questionImages: questionImages.length > 0 ? questionImages : undefined,
        questionExplanationImages: explanationImages.length > 0 ? explanationImages : undefined,
      };

      await onSubmit(questionData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating residency question:', error);
      setError(error instanceof Error ? error.message : 'Failed to create residency question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Residency Question</DialogTitle>
          <DialogDescription>
            Add a new residency question with answers and optional images.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="questionText">
              Question Text <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="questionText"
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              placeholder="Enter the question text (min 5 characters)"
              rows={4}
              disabled={loading}
              required
            />
          </div>

          {/* Part */}
          <div className="space-y-2">
            <Label htmlFor="part">
              Part <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.part}
              onValueChange={(value: any) => setFormData({ ...formData, part: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select part" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sciences fondamentales">Sciences fondamentales</SelectItem>
                <SelectItem value="Pathologie medico-chirurgical">Pathologie medico-chirurgical</SelectItem>
                <SelectItem value="Dossier clinique">Dossier clinique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* University */}
          <div className="space-y-2">
            <Label htmlFor="university">University (Optional)</Label>
            <Select
              value={formData.universityId?.toString() || 'none'}
              onValueChange={(value) => setFormData({ ...formData, universityId: value === 'none' ? undefined : parseInt(value) })}
              disabled={loading || loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={university.id.toString()}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Year */}
          <div className="space-y-2">
            <Label htmlFor="examYear">Exam Year (Optional)</Label>
            <Input
              id="examYear"
              type="number"
              value={formData.examYear || ''}
              onChange={(e) => setFormData({ ...formData, examYear: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g., 2023"
              disabled={loading}
              min="2000"
              max="2100"
            />
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Enter explanation for the question"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (Optional)</Label>
            <Textarea
              id="metadata"
              value={formData.metadata}
              onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
              placeholder="Additional metadata (JSON or text)"
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Answers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Answers <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAnswer}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Answer
              </Button>
            </div>

            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={answer.answerText}
                      onChange={(e) => handleAnswerChange(index, 'answerText', e.target.value)}
                      placeholder={`Answer ${index + 1}`}
                      disabled={loading}
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`correct-${index}`}
                        checked={answer.isCorrect}
                        onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                        disabled={loading}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`correct-${index}`} className="text-sm font-normal cursor-pointer">
                        Correct Answer
                      </Label>
                      {answer.isCorrect && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  {answers.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAnswer(index)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Question Images Section */}
          <div className="space-y-4">
            <ImageUpload
              images={questionImages}
              onImagesChange={setQuestionImages}
              maxImages={5}
              maxFileSize={10}
              disabled={loading}
              label="Question Images (Optional)"
              description="Upload images to accompany your question. Maximum 5 images, 10MB each."
              showAltText={false}
            />
          </div>

          {/* Explanation Images Section */}
          <div className="space-y-4">
            <ImageUpload
              images={explanationImages}
              onImagesChange={setExplanationImages}
              maxImages={5}
              maxFileSize={10}
              disabled={loading}
              label="Explanation Images (Optional)"
              description="Upload images for the explanation. Maximum 5 images, 10MB each."
              showAltText={false}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Question'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

