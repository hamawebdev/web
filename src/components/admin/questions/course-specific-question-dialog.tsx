'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, X, Upload, AlertCircle, BookOpen, Calendar, GraduationCap, RefreshCw } from 'lucide-react';
import { CreateQuestionRequest } from '@/types/api';
import { useQuestionSources } from '@/hooks/admin/use-question-sources';

interface CourseSpecificQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateQuestion: (questionData: CreateQuestionRequest) => Promise<void>;
  courseId: number;
  courseName: string;
  universityId?: number;
  universityName?: string;
}

interface Answer {
  answerText: string;
  isCorrect: boolean;
  explanation?: string;
}

export function CourseSpecificQuestionDialog({
  open,
  onOpenChange,
  onCreateQuestion,
  courseId,
  courseName,
  universityId,
  universityName,
}: CourseSpecificQuestionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use question sources hook
  const {
    questionSources,
    loading: sourcesLoading,
    error: sourcesError
  } = useQuestionSources();

  // Form state - simplified without course/module/university selectors
  const [formData, setFormData] = useState({
    questionText: '',
    explanation: '',
    questionType: '' as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | '',
    yearLevel: '' as 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN' | '',
    rotation: '' as 'R1' | 'R2' | 'R3' | 'R4' | '',
    examYear: undefined as number | undefined,
    sourceId: undefined as number | undefined,
    universityId: undefined as number | undefined,
    additionalInfo: '',
  });

  const [answers, setAnswers] = useState<Answer[]>([
    { answerText: '', isCorrect: false, explanation: '' },
    { answerText: '', isCorrect: false, explanation: '' },
  ]);


  const resetForm = () => {
    setFormData({
      questionText: '',
      explanation: '',
      questionType: '',
      yearLevel: '',
      rotation: '',
      examYear: undefined,
      sourceId: undefined,
      universityId: undefined,
      additionalInfo: '',
    });
    setAnswers([
      { answerText: '', isCorrect: false, explanation: '' },
      { answerText: '', isCorrect: false, explanation: '' },
    ]);
    setError(null);
  };

  const addAnswer = () => {
    setAnswers([...answers, { answerText: '', isCorrect: false, explanation: '' }]);
  };

  const removeAnswer = (index: number) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((_, i) => i !== index));
    }
  };

  const updateAnswer = (index: number, field: keyof Answer, value: string | boolean) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setAnswers(newAnswers);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.questionText || !formData.questionType) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate required fields according to documentation
    if (!formData.yearLevel) {
      setError('Please select a year level');
      return;
    }

    // Rotation is now optional - no validation needed

    if (!formData.examYear) {
      setError('Please enter an exam year');
      return;
    }

    if (formData.examYear <= 1900 || formData.examYear > new Date().getFullYear()) {
      setError(`Exam year must be between 1900 and ${new Date().getFullYear()}`);
      return;
    }

    if (!formData.sourceId) {
      setError('Please select a question source');
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

    if (formData.questionType === 'SINGLE_CHOICE' && correctAnswers.length > 1) {
      setError('Single choice questions can only have one correct answer');
      return;
    }

    try {
      setLoading(true);
      
      const questionData: CreateQuestionRequest = {
        questionText: formData.questionText,
        explanation: formData.explanation || undefined,
        questionType: formData.questionType,
        courseId: courseId, // Auto-populated from props
        universityId: universityId || formData.universityId || 1, // Use passed universityId, fallback to form or default
        yearLevel: formData.yearLevel as 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN',
        rotation: formData.rotation || undefined,
        examYear: formData.examYear,
        sourceId: formData.sourceId,
        additionalInfo: formData.additionalInfo || undefined,
        answers: validAnswers.map(answer => ({
          answerText: answer.answerText,
          isCorrect: answer.isCorrect,
          explanation: answer.explanation || undefined,
        })),
      };

      await onCreateQuestion(questionData);
      resetForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Question
          </DialogTitle>
          <DialogDescription>
            Create a new question for <strong>{courseName}</strong>. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        {/* Course Info Badge */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Course:</span>
          <Badge variant="secondary">{courseName}</Badge>
          {universityName && (
            <>
              <span className="text-sm font-medium ml-4">University:</span>
              <Badge variant="outline">{universityName}</Badge>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="questionText">Question Text *</Label>
            <Textarea
              id="questionText"
              placeholder="Enter your question here..."
              value={formData.questionText}
              onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Question Type */}
          <div className="space-y-2">
            <Label>Question Type *</Label>
            <Select
              value={formData.questionType}
              onValueChange={(value: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE') => 
                setFormData(prev => ({ ...prev, questionType: value }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE_CHOICE">Single Choice</SelectItem>
                <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Required Metadata Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Year Level */}
            <div className="space-y-2">
              <Label>Year Level *</Label>
              <Select
                value={formData.yearLevel}
                onValueChange={(value: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN') =>
                  setFormData(prev => ({ ...prev, yearLevel: value }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE">Year ONE</SelectItem>
                  <SelectItem value="TWO">Year TWO</SelectItem>
                  <SelectItem value="THREE">Year THREE</SelectItem>
                  <SelectItem value="FOUR">Year FOUR</SelectItem>
                  <SelectItem value="FIVE">Year FIVE</SelectItem>
                  <SelectItem value="SIX">Year SIX</SelectItem>
                  <SelectItem value="SEVEN">Year SEVEN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label>Rotation</Label>
              <Select
                value={formData.rotation}
                onValueChange={(value: 'R1' | 'R2' | 'R3' | 'R4' | '') =>
                  setFormData(prev => ({ ...prev, rotation: value }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rotation (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="R1">R1</SelectItem>
                  <SelectItem value="R2">R2</SelectItem>
                  <SelectItem value="R3">R3</SelectItem>
                  <SelectItem value="R4">R4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Exam Year */}
            <div className="space-y-2">
              <Label>Exam Year *</Label>
              <Input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                placeholder="e.g., 2024"
                value={formData.examYear || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  examYear: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                disabled={loading}
              />
            </div>

            {/* Question Source */}
            <div className="space-y-2">
              <Label>Question Source *</Label>
              <Select
                value={formData.sourceId?.toString() || ''}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, sourceId: value ? parseInt(value) : undefined }))
                }
                disabled={loading || sourcesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sourcesLoading ? "Loading sources..." : "Select question source"} />
                </SelectTrigger>
                <SelectContent>
                  {questionSources.map((source) => (
                    <SelectItem key={source.id} value={source.id.toString()}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourcesError && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error loading sources: {sourcesError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation</Label>
            <Textarea
              id="explanation"
              placeholder="Provide an explanation for the correct answer..."
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              disabled={loading}
              rows={2}
            />
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Any additional information about the question..."
                value={formData.additionalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                disabled={loading}
                rows={2}
              />
            </div>

          </div>


          {/* Answers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Answers *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAnswer}
                disabled={loading || answers.length >= 6}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Answer
              </Button>
            </div>

            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Answer {index + 1}</Label>
                    {answers.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAnswer(index)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Enter answer text..."
                      value={answer.answerText}
                      onChange={(e) => updateAnswer(index, 'answerText', e.target.value)}
                      disabled={loading}
                    />

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={answer.isCorrect}
                        onCheckedChange={(checked) => updateAnswer(index, 'isCorrect', checked)}
                        disabled={loading}
                      />
                      <Label className="text-sm">Correct Answer</Label>
                    </div>

                    <Input
                      placeholder="Optional: Explanation for this answer..."
                      value={answer.explanation || ''}
                      onChange={(e) => updateAnswer(index, 'explanation', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Question
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
