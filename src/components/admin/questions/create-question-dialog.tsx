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
import { CreateQuestionRequest, QuestionCreationUnit, QuestionCreationModule, QuestionCreationCourse } from '@/types/api';
import { AdminService } from '@/lib/api-services';
import { Switch } from '@/components/ui/switch';

interface CreateQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateQuestion: (questionData: CreateQuestionRequest) => Promise<void>;
}

interface University {
  id: number;
  name: string;
  country: string;
}

interface StudyPack {
  id: number;
  name: string;
  yearNumber: string;
  type: 'YEAR' | 'RESIDENCY';
}

interface Answer {
  answerText: string;
  isCorrect: boolean;
  explanation?: string;
}

export function CreateQuestionDialog({
  open,
  onOpenChange,
  onCreateQuestion,
}: CreateQuestionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [units, setUnits] = useState<QuestionCreationUnit[]>([]);
  const [independentModules, setIndependentModules] = useState<QuestionCreationModule[]>([]);
  const [availableModules, setAvailableModules] = useState<QuestionCreationModule[]>([]);
  const [availableCourses, setAvailableCourses] = useState<QuestionCreationCourse[]>([]);
  const [examYears, setExamYears] = useState<number[]>([]);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    questionText: '',
    explanation: '',
    questionType: '' as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC' | '',
    unitId: undefined as number | undefined,
    moduleId: undefined as number | undefined,
    courseId: undefined as number | undefined,
    universityId: undefined as number | undefined,
    yearLevel: '',
    examYear: undefined as number | undefined,
  });

  const [questionImages, setQuestionImages] = useState<ImageFile[]>([]);

  const [answers, setAnswers] = useState<Answer[]>([
    { answerText: '', isCorrect: false, explanation: '' },
    { answerText: '', isCorrect: false, explanation: '' },
  ]);

  // Load form data
  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  // Handle cascading updates when unit selection changes
  useEffect(() => {
    if (formData.unitId) {
      const selectedUnit = units.find(u => u.id === formData.unitId);
      setAvailableModules(selectedUnit?.modules || []);
      setAvailableCourses([]);
    } else {
      setAvailableModules([]);
      setAvailableCourses([]);
    }
  }, [formData.unitId, units]);

  // Handle cascading updates when module selection changes
  useEffect(() => {
    if (formData.moduleId) {
      let selectedModule: QuestionCreationModule | undefined;

      // Find module in units or independent modules
      for (const unit of units) {
        const module = unit.modules.find(m => m.id === formData.moduleId);
        if (module) {
          selectedModule = module;
          break;
        }
      }

      if (!selectedModule) {
        selectedModule = independentModules.find(m => m.id === formData.moduleId);
      }

      setAvailableCourses(selectedModule?.courses || []);
    } else {
      setAvailableCourses([]);
    }
  }, [formData.moduleId, units, independentModules]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);

      // Load universities
      const universitiesResponse = await AdminService.getUniversitiesForQuestions();
      if (universitiesResponse.success && universitiesResponse.data?.universities) {
        setUniversities(universitiesResponse.data.universities);
      }

      // Load study packs for years
      const studyPacksResponse = await AdminService.getStudyPacksForQuestions();
      if (studyPacksResponse.success && studyPacksResponse.data?.studyPacks) {
        setStudyPacks(studyPacksResponse.data.studyPacks);
      }

      // Load hierarchical content filters
      const contentResponse = await AdminService.getQuestionContentFilters();
      if (contentResponse.success && contentResponse.data) {
        setUnits(contentResponse.data.unites || []);
        setIndependentModules(contentResponse.data.independentModules || []);
      }

      // Load exam years and question types
      const filtersResponse = await AdminService.getQuestionFilters();
      if (filtersResponse.success && filtersResponse.data?.filters) {
        setExamYears(filtersResponse.data.filters.examYears || []);
        setQuestionTypes(filtersResponse.data.filters.questionTypes || []);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      questionText: '',
      explanation: '',
      questionType: '',
      unitId: undefined,
      moduleId: undefined,
      courseId: undefined,
      universityId: undefined,
      yearLevel: '',
      examYear: undefined,
    });
    setAnswers([
      { answerText: '', isCorrect: false, explanation: '' },
      { answerText: '', isCorrect: false, explanation: '' },
    ]);
    setQuestionImages([]);
    setAvailableModules([]);
    setAvailableCourses([]);
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

  // Hierarchical selection handlers
  const handleUnitChange = (unitId: string) => {
    const selectedUnitId = unitId === 'all' ? undefined : parseInt(unitId);
    const selectedUnit = units.find(u => u.id === selectedUnitId);

    setFormData(prev => ({
      ...prev,
      unitId: selectedUnitId,
      moduleId: undefined,
      courseId: undefined
    }));

    setAvailableModules(selectedUnit?.modules || []);
    setAvailableCourses([]);
  };

  const handleModuleChange = (moduleId: string) => {
    const selectedModuleId = moduleId === 'all' ? undefined : parseInt(moduleId);
    let selectedModule: QuestionCreationModule | undefined;

    // Find module in units or independent modules
    for (const unit of units) {
      const module = unit.modules.find(m => m.id === selectedModuleId);
      if (module) {
        selectedModule = module;
        break;
      }
    }

    if (!selectedModule) {
      selectedModule = independentModules.find(m => m.id === selectedModuleId);
    }

    setFormData(prev => ({
      ...prev,
      moduleId: selectedModuleId,
      courseId: undefined
    }));

    setAvailableCourses(selectedModule?.courses || []);
  };

  const handleCourseChange = (courseId: string) => {
    const selectedCourseId = courseId ? parseInt(courseId) : undefined;

    setFormData(prev => ({
      ...prev,
      courseId: selectedCourseId
    }));
  };

  // Handle direct module dropdown click (show independent modules)
  const handleModuleDropdownClick = () => {
    if (!formData.unitId) {
      setLoadingModules(true);
      setAvailableModules(independentModules);
      setLoadingModules(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.questionText || !formData.questionType || !formData.courseId) {
      setError('Please fill in all required fields');
      return;
    }

    const isQROC = formData.questionType === 'QROC';
    const validAnswers = answers.filter(a => a.answerText.trim() !== '');

    if (!isQROC && validAnswers.length < 2) {
      setError('Please provide at least 2 answers');
      return;
    }

    const correctAnswers = validAnswers.filter(a => a.isCorrect);
    if (!isQROC && correctAnswers.length === 0) {
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
        courseId: formData.courseId,
        moduleId: formData.moduleId,
        unitId: formData.unitId,
        universityId: formData.universityId,
        yearLevel: formData.yearLevel || undefined,
        examYear: formData.examYear,
        questionImages: questionImages.length > 0 ? questionImages : undefined,
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
            Create a new question with answers and explanations. All fields marked with * are required.
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
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Enter explanation for the question..."
                  disabled={loading}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Question Type *</Label>
                <Select
                  value={formData.questionType}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    questionType: value as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'
                  }))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_CHOICE">Single Choice</SelectItem>
                    <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                    <SelectItem value="QROC">QROC (Open Answer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hierarchical Content Selection */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Unit Selection */}
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={formData.unitId?.toString() || 'all'}
                      onValueChange={handleUnitChange}
                      disabled={loading || loadingData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading..." : "Select unit"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Units</SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.studyPack.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Module Selection */}
                  <div className="space-y-2">
                    <Label>Module</Label>
                    <Select
                      value={formData.moduleId?.toString() || 'all'}
                      onValueChange={handleModuleChange}
                      disabled={loading || loadingData || loadingModules}
                      onOpenChange={(open) => {
                        if (open && !formData.unitId) {
                          handleModuleDropdownClick();
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingData || loadingModules ? "Loading..." :
                            availableModules.length === 0 ? "No modules available" :
                              "Select module"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        {availableModules.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.name}
                            {module.studyPack && ` (${module.studyPack.name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Course Selection */}
                  <div className="space-y-2">
                    <Label>Course *</Label>
                    <Select
                      value={formData.courseId?.toString() || ''}
                      onValueChange={handleCourseChange}
                      disabled={loading || loadingData || loadingCourses || availableCourses.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingData || loadingCourses ? "Loading..." :
                            availableCourses.length === 0 ? "Select module first" :
                              "Select course"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select
                    value={formData.universityId?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      universityId: value ? parseInt(value) : undefined
                    }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
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
                    value={formData.yearLevel || 'all'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, yearLevel: value === 'all' ? undefined : value }))}
                    disabled={loading || loadingData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Loading..." : "Select year"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {studyPacks.map((pack) => (
                        <SelectItem key={pack.id} value={pack.yearNumber}>
                          {pack.name} ({pack.yearNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exam Year</Label>
                  <Select
                    value={formData.examYear?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      examYear: value ? parseInt(value) : undefined
                    }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam year" />
                    </SelectTrigger>
                    <SelectContent>
                      {examYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                description="Upload images to accompany your question. These will be displayed with the question text."
                showAltText={true}
              />
            </div>

            {/* Answers Section - Hidden for QROC */}
            {formData.questionType !== 'QROC' && (
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

                {formData.questionType && (
                  <div className="text-sm text-muted-foreground">
                    {formData.questionType === 'SINGLE_CHOICE'
                      ? 'Select exactly one correct answer'
                      : 'Select one or more correct answers'
                    }
                  </div>
                )}

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
                        <Label className="text-sm">Answer Explanation (Optional)</Label>
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
            )}

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
                Create Question
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
