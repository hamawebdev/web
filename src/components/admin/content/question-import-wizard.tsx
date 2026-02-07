'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ChevronRight, 
  ChevronLeft,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  School,
  Calendar,
  BookOpen,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useQuestionImport } from '@/hooks/admin/use-question-import';
import { JsonQuestionInput } from './json-question-input';
import { ImportWizardSkeleton } from './import-wizard-skeleton';
import {
  QuestionImportWizardProps,
  ImportQuestion,
  ValidationResult,
  SelectionState
} from '@/types/question-import';

export function QuestionImportWizard({ 
  onImportComplete, 
  onCancel 
}: QuestionImportWizardProps) {
  const {
    loading,
    selection,
    progress,
    wizardSteps,
    isReadyForImport,
    fetchFilters,
    updateSelection,
    getAvailableOptions,
    importQuestions,
    resetWizard
  } = useQuestionImport();

  const [jsonInput, setJsonInput] = useState('');
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
    questionCount: 0
  });
  const [parsedQuestions, setParsedQuestions] = useState<ImportQuestion[]>([]);
  const [importing, setImporting] = useState(false);

  // Load filters on mount
  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // Get available options based on current selection
  const availableOptions = getAvailableOptions();

  // Handle selection updates
  const handleSelectionUpdate = useCallback((key: keyof SelectionState, value: any) => {
    updateSelection(key, value);
  }, [updateSelection]);

  // Handle JSON validation
  const handleJsonValidation = useCallback((questions: ImportQuestion[]) => {
    setParsedQuestions(questions);
  }, []);

  // Handle import
  const handleImport = useCallback(async () => {
    // Import button is always enabled - proceed with import
    setImporting(true);
    try {
      const result = await importQuestions(parsedQuestions);
      if (result && onImportComplete) {
        onImportComplete(result);
      }
    } finally {
      setImporting(false);
    }
  }, [parsedQuestions, importQuestions, onImportComplete]);

  // Handle reset
  const handleReset = useCallback(() => {
    resetWizard();
    setJsonInput('');
    setValidation({
      isValid: false,
      errors: [],
      warnings: [],
      questionCount: 0
    });
    setParsedQuestions([]);
  }, [resetWizard]);

  if (loading) {
    return <ImportWizardSkeleton />;
  }

  if (progress.step === 'error') {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">{progress.message}</div>
                {progress.error && <div className="text-sm">{progress.error}</div>}
                <Button variant="outline" size="sm" onClick={fetchFilters}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import Questions</h2>
          <p className="text-muted-foreground">
            Progressive drill-down selection for bulk question import
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Selection Phase */}
      {!isReadyForImport && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Import Target</CardTitle>
            <CardDescription>
              Choose the hierarchy path where questions will be imported
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Header */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Import Hierarchy</h3>
                <Badge variant="outline">
                  Step {wizardSteps.findIndex(step => step.active) + 1} of {wizardSteps.length}
                </Badge>
              </div>
              <Progress value={progress.progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{progress.message}</p>
            </div>

            {/* Selection Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* University Selection */}
              <Card className={`transition-all ${selection.university ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <School className="mr-2 h-4 w-4" />
                    University
                    {selection.university && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selection.university?.id.toString() || ''}
                    onValueChange={(value) => {
                      const university = availableOptions.universities.find(u => u.id.toString() === value);
                      if (university) handleSelectionUpdate('university', university);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.universities.map((university) => (
                        <SelectItem key={university.id} value={university.id.toString()}>
                          <div className="flex flex-col">
                            <span>{university.name}</span>
                            <span className="text-xs text-muted-foreground">{university.country}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Exam Year Selection */}
              <Card className={`transition-all ${selection.examYear ? 'ring-2 ring-primary' : ''} ${!selection.university ? 'opacity-50' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Exam Year
                    {selection.examYear && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selection.examYear?.toString() || ''}
                    onValueChange={(value) => handleSelectionUpdate('examYear', parseInt(value))}
                    disabled={!selection.university}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.examYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Unit Selection */}
              <Card className={`transition-all ${selection.unit ? 'ring-2 ring-primary' : ''} ${!selection.examYear ? 'opacity-50' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Unit
                    {selection.unit && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selection.unit?.id.toString() || ''}
                    onValueChange={(value) => {
                      const unit = availableOptions.units.find(u => u.id.toString() === value);
                      if (unit) handleSelectionUpdate('unit', unit);
                    }}
                    disabled={!selection.examYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          <div className="flex flex-col">
                            <span>{unit.name}</span>
                            <span className="text-xs text-muted-foreground">{unit.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Module Selection */}
              <Card className={`transition-all ${selection.module ? 'ring-2 ring-primary' : ''} ${!selection.unit ? 'opacity-50' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Layers className="mr-2 h-4 w-4" />
                    Module
                    {selection.module && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selection.module?.id.toString() || ''}
                    onValueChange={(value) => {
                      const module = availableOptions.modules.find(m => m.id.toString() === value);
                      if (module) handleSelectionUpdate('module', module);
                    }}
                    disabled={!selection.unit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.modules.map((module) => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          <div className="flex flex-col">
                            <span>{module.name}</span>
                            <span className="text-xs text-muted-foreground">{module.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Course Selection - Full Width */}
            {selection.module && (
              <Card className={`mt-4 transition-all ${selection.course ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Course
                    {selection.course && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selection.course?.id.toString() || ''}
                    onValueChange={(value) => {
                      const course = availableOptions.courses.find(c => c.id.toString() === value);
                      if (course) handleSelectionUpdate('course', course);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target course" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          <div className="flex flex-col">
                            <span>{course.name}</span>
                            <span className="text-xs text-muted-foreground">{course.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Phase */}
      {isReadyForImport && (
        <div className="space-y-6">
          {/* Selection Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                Import Target Selected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div><strong>University:</strong> {selection.university?.name}</div>
                <div><strong>Exam Year:</strong> {selection.examYear}</div>
                <div><strong>Unit:</strong> {selection.unit?.name}</div>
                <div><strong>Module:</strong> {selection.module?.name}</div>
                <div><strong>Course:</strong> {selection.course?.name}</div>
              </div>
            </CardContent>
          </Card>

          {/* JSON Input */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Import Questions</CardTitle>
              <CardDescription>
                Paste your questions JSON array. Metadata will be automatically populated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JsonQuestionInput
                value={jsonInput}
                onChange={setJsonInput}
                validation={validation}
                onValidate={handleJsonValidation}
                disabled={importing}
              />
            </CardContent>
          </Card>

          {/* Import Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleReset}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Selection
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={importing}
              size="lg"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {validation.questionCount > 0 ? `${validation.questionCount} Questions` : 'Questions'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Success State */}
      {progress.step === 'completed' && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Import Successful!</h3>
                <p className="text-muted-foreground">{progress.message}</p>
              </div>
              <Button onClick={handleReset}>
                Import More Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
