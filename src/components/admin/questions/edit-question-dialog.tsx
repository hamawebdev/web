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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Edit, Plus, Trash2, Check } from 'lucide-react';
import { AdminQuestion, UpdateQuestionRequest } from '@/types/api';
import { AdminService } from '@/lib/api-services';

interface EditQuestionDialogProps {
  question: AdminQuestion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateQuestion: (questionData: UpdateQuestionRequest) => Promise<void>;
  loading: boolean;
}

interface University {
  id: number;
  name: string;
  country: string;
}

interface Course {
  id: number;
  name: string;
  module: {
    id: number;
    name: string;
    unite: {
      id: number;
      name: string;
      studyPack: {
        id: number;
        name: string;
      };
    };
  };
}

interface Answer {
  id?: number;
  answerText: string;
  isCorrect: boolean;
  explanation?: string;
}

export function EditQuestionDialog({
  question,
  open,
  onOpenChange,
  onUpdateQuestion,
  loading,
}: EditQuestionDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [examYears, setExamYears] = useState<number[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    questionText: question.questionText,
    explanation: question.explanation || '',
    questionType: question.questionType,
    courseId: question.courseId,
    universityId: question.universityId,
    yearLevel: question.yearLevel || '',
    examYear: question.examYear,
    isActive: question.isActive,
  });

  const [answers, setAnswers] = useState<Answer[]>(
    question.answers.map(answer => ({
      id: answer.id,
      answerText: answer.answerText,
      isCorrect: answer.isCorrect,
      explanation: answer.explanation || '',
    }))
  );

  // Load form data
  useEffect(() => {
    if (open) {
      loadFormData();
      // Reset form data when question changes
      setFormData({
        questionText: question.questionText,
        explanation: question.explanation || '',
        questionType: question.questionType,
        courseId: question.courseId,
        universityId: question.universityId,
        yearLevel: question.yearLevel || '',
        examYear: question.examYear,
        isActive: question.isActive,
      });
      setAnswers(
        question.answers.map(answer => ({
          id: answer.id,
          answerText: answer.answerText,
          isCorrect: answer.isCorrect,
          explanation: answer.explanation || '',
        }))
      );
    }
  }, [open, question]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const response = await AdminService.getQuestionFilters();
      
      if (response.success && response.data?.filters) {
        setUniversities(response.data.filters.universities || []);
        setCourses(response.data.filters.courses || []);
        setExamYears(response.data.filters.examYears || []);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setLoadingData(false);
    }
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
    
    // For single choice questions, ensure only one answer is correct
    if (field === 'isCorrect' && value === true && formData.questionType === 'SINGLE_CHOICE') {
      newAnswers.forEach((answer, i) => {
        if (i !== index) {
          answer.isCorrect = false;
        }
      });
    }
    
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.questionText || !formData.questionType || !formData.courseId) {
      setError('Please fill in all required fields');
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
      const updateData: UpdateQuestionRequest = {
        questionText: formData.questionText,
        explanation: formData.explanation || undefined,
        questionType: formData.questionType,
        courseId: formData.courseId,
        universityId: formData.universityId,
        yearLevel: formData.yearLevel || undefined,
        examYear: formData.examYear,
        isActive: formData.isActive,
        answers: validAnswers.map(answer => ({
          id: answer.id,
          answerText: answer.answerText,
          isCorrect: answer.isCorrect,
          explanation: answer.explanation || undefined,
        })),
      };

      await onUpdateQuestion(updateData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update question');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Question
          </DialogTitle>
          <DialogDescription>
            Update question information, answers, and metadata.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading form data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Question Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="questionText">Question Text *</Label>
                <Textarea
                  id="questionText"
                  value={formData.questionText}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
                  placeholder="Enter the question text..."
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Enter explanation for the question..."
                  disabled={loading}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Question Type *</Label>
                  <Select
                    value={formData.questionType}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      questionType: value as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' 
                    }))}
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

                <div className="space-y-2">
                  <Label>Course *</Label>
                  <Select
                    value={formData.courseId?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      courseId: value ? parseInt(value) : undefined 
                    }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select
                    value={formData.universityId?.toString() || 'none'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      universityId: value === 'none' ? undefined : parseInt(value)
                    }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No University</SelectItem>
                      {universities.map((university) => (
                        <SelectItem key={university.id} value={university.id.toString()}>
                          {university.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Year Level</Label>
                  <Select
                    value={formData.yearLevel || 'none'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, yearLevel: value === 'none' ? '' : value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Year</SelectItem>
                      <SelectItem value="ONE">Year 1</SelectItem>
                      <SelectItem value="TWO">Year 2</SelectItem>
                      <SelectItem value="THREE">Year 3</SelectItem>
                      <SelectItem value="FOUR">Year 4</SelectItem>
                      <SelectItem value="FIVE">Year 5</SelectItem>
                      <SelectItem value="SIX">Year 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exam Year</Label>
                  <Select
                    value={formData.examYear?.toString() || 'none'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      examYear: value === 'none' ? undefined : parseInt(value)
                    }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Exam Year</SelectItem>
                      {examYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  disabled={loading}
                />
                <Label htmlFor="isActive">Active Question</Label>
              </div>
            </div>

            {/* Answers Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Answers *</Label>
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

              <div className="text-sm text-muted-foreground">
                {formData.questionType === 'SINGLE_CHOICE' 
                  ? 'Select exactly one correct answer' 
                  : 'Select one or more correct answers'
                }
              </div>

              <div className="space-y-3">
                {answers.map((answer, index) => (
                  <div key={answer.id || index} className="border rounded-lg p-4 space-y-3">
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
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        value={answer.answerText}
                        onChange={(e) => updateAnswer(index, 'answerText', e.target.value)}
                        placeholder="Enter answer text..."
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`correct-${index}`}
                        checked={answer.isCorrect}
                        onCheckedChange={(checked) => updateAnswer(index, 'isCorrect', checked)}
                        disabled={loading}
                      />
                      <Label htmlFor={`correct-${index}`} className="text-sm">
                        Correct Answer
                      </Label>
                      {answer.isCorrect && <Check className="h-4 w-4 text-green-500" />}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Answer Explanation</Label>
                      <Input
                        value={answer.explanation || ''}
                        onChange={(e) => updateAnswer(index, 'explanation', e.target.value)}
                        placeholder="Explain why this answer is correct/incorrect..."
                        disabled={loading}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Question
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
