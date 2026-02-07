'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Users,
  Clock,
  Target,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react';
import ExamService, { ExamModule, ValidationResult, ModuleAvailabilityCheck } from '@/lib/api/exam-service';
import { analyzeSessionCreationError, logErrorDetails, getUserErrorMessage, getSuggestedActions } from '@/utils/session-error-handler';

interface ExamCreationFormProps {
  onExamCreated: (examSession: any) => void;
  onCancel: () => void;
  userProfile: {
    yearLevel: string;
    subscription?: any;
  };
}

interface ExamConfig {
  selectedModules: number[];
  selectedYear: number;
  sessionType: 'single' | 'multi';
}

export function ExamCreationForm({ onExamCreated, onCancel, userProfile }: ExamCreationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [availableModules, setAvailableModules] = useState<ExamModule[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [moduleAvailability, setModuleAvailability] = useState<Map<number, ModuleAvailabilityCheck>>(new Map());
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [config, setConfig] = useState<ExamConfig>({
    selectedModules: [],
    selectedYear: new Date().getFullYear(),
    sessionType: 'single'
  });

  // Load available modules and years
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [modules, years] = await Promise.all([
          ExamService.getAvailableModules(),
          ExamService.getAvailableYears()
        ]);

        setAvailableModules(modules);
        setAvailableYears(years);

        // Set default year if available and load its module availability
        if (years.length > 0) {
          const defaultYear = years[0];
          setConfig(prev => ({ ...prev, selectedYear: defaultYear }));
          await loadModuleAvailability(defaultYear);
        }
      } catch (error) {
        console.error('Failed to load exam data:', error);
        toast.error('Failed to load exam options. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle module selection
  const handleModuleToggle = (moduleId: number) => {
    setConfig(prev => {
      const isSelected = prev.selectedModules.includes(moduleId);
      const newModules = isSelected
        ? prev.selectedModules.filter(id => id !== moduleId)
        : [...prev.selectedModules, moduleId];

      // Update session type based on selection
      const sessionType = newModules.length > 1 ? 'multi' : 'single';

      return {
        ...prev,
        selectedModules: newModules,
        sessionType
      };
    });

    // Clear previous validation when selection changes
    setValidationResult(null);
  };

  // Handle year selection
  const handleYearChange = async (year: string) => {
    const newYear = parseInt(year);
    setConfig(prev => ({ ...prev, selectedYear: newYear }));

    // Clear previous validation results
    setValidationResult(null);

    // Load module availability for the new year
    await loadModuleAvailability(newYear);
  };

  // Load module availability for a specific year
  const loadModuleAvailability = async (year: number) => {
    try {
      const availability = await ExamService.getModuleAvailabilityForYear(year);
      setModuleAvailability(availability);
    } catch (error) {
      console.error('Failed to load module availability:', error);
      // Don't show error toast here as it's background loading
    }
  };

  // Validate selected modules before creating exam (simplified validation)
  const validateSelection = () => {
    if (config.selectedModules.length === 0) {
      toast.error('Please select at least one module');
      return false;
    }

    if (config.selectedModules.length > 50) {
      toast.error('Cannot select more than 50 modules');
      return false;
    }

    return true;
  };

  // Create exam session
  const handleCreateExam = async () => {
    // First validate the selection
    const isValid = validateSelection();
    if (!isValid) return;

    try {
      setCreating(true);

      // Build request body per contract
      const request = {
        moduleIds: config.selectedModules,
        year: config.selectedYear,
      } as any;

      // Use single or multi-module endpoint based on selection
      // Use the modules-based endpoint even for a single module (spec allows array)
      const result = await ExamService.createMultiModuleSession(request);

      toast.success('Exam session created successfully!');

      // Call the success handler with the session data
      onExamCreated({
        sessionId: result.sessionId,
        type: 'EXAM',
        examCount: result.examCount,
        questionCount: result.questionCount,
        message: result.message
      });

    } catch (error) {
      console.error('💥 [ExamCreationForm] Exception during session creation:', error);

      // Use comprehensive error analysis
      const errorDetails = analyzeSessionCreationError(error, 'EXAM');
      logErrorDetails(errorDetails, 'Multi-Module Exam Session Creation');

      const userMessage = getUserErrorMessage(errorDetails);
      const suggestedActions = getSuggestedActions(errorDetails);

      // Show user-friendly error message
      toast.error(userMessage);

      // Log suggested actions for debugging
      console.log('💡 [ExamCreationForm] Suggested actions for user:', suggestedActions);
    } finally {
      setCreating(false);
    }
  };

  // Validation
  const canCreate = config.selectedModules.length > 0 && !creating && !validating;
  const selectedModuleNames = availableModules
    .filter(module => config.selectedModules.includes(module.id))
    .map(module => module.name);

  // Get availability status for a module
  const getModuleAvailability = (moduleId: number): ModuleAvailabilityCheck | null => {
    return moduleAvailability.get(moduleId) || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading exam options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-chart-3" />
            Create Exam Session
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a comprehensive exam session with questions from selected modules
          </p>
        </div>
      </div>

      {/* Exam Mode Info */}
      <Alert className="border-chart-3/30 bg-chart-3/10">
        <GraduationCap className="h-4 w-4" />
        <AlertDescription>
          <strong>Exam Mode:</strong> This creates a formal assessment session with questions from your selected modules.
          Perfect for testing your knowledge and preparing for real exams.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Year Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Year
              </CardTitle>
              <CardDescription>
                Choose the academic year for your exam questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={config.selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Module Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Select Modules
              </CardTitle>
              <CardDescription>
                Choose one or more modules to include in your exam session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Validation Result Alert */}
              {validationResult && !validationResult.isValid && (
                <Alert className="border-destructive/30 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-destructive">
                    <strong>No Questions Available:</strong> {validationResult.message}
                    <br />
                    <span className="text-sm mt-1 block">
                      Try selecting different modules or changing the year to find available questions.
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Partial Availability Warning */}
              {validationResult && validationResult.isValid && validationResult.unavailableModules.length > 0 && (
                <Alert className="border-chart-4/30 bg-chart-4/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-chart-4">
                    <strong>Limited Availability:</strong> {validationResult.message}
                    <br />
                    <span className="text-sm mt-1 block">
                      {validationResult.availableModules.length} modules have questions available
                      ({validationResult.totalQuestions} total questions).
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {availableModules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No modules available for the selected year</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {availableModules.map(module => {
                    const availability = getModuleAvailability(module.id);
                    const hasQuestions = availability?.hasQuestions ?? true; // Default to true if not loaded yet
                    const isSelected = config.selectedModules.includes(module.id);

                    return (
                      <div
                        key={module.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-chart-3/30 bg-chart-3/10'
                            : hasQuestions
                            ? 'border-border hover:bg-muted/50'
                            : 'border-destructive/30 bg-destructive/10 opacity-75'
                        }`}
                        onClick={() => hasQuestions && handleModuleToggle(module.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => hasQuestions && handleModuleToggle(module.id)}
                          disabled={!hasQuestions}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{module.name}</span>
                            {availability && (
                              <div className="flex items-center gap-1">
                                {hasQuestions ? (
                                  <Badge variant="secondary" className="text-xs bg-chart-5/20 text-chart-5">
                                    {availability.examCount} exams
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">
                                    No questions
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          {module.unite && (
                            <div className="text-sm text-muted-foreground">
                              {module.unite.name}
                              {module.unite.studyPack && ` • ${module.unite.studyPack.name}`}
                            </div>
                          )}
                          {availability && hasQuestions && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ~{availability.questionCount} questions available
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        <div className="space-y-6">
          {/* Session Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Year:</span>
                  <span className="font-medium">{config.selectedYear}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Modules:</span>
                  <span className="font-medium">{config.selectedModules.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Session Type:</span>
                  <Badge variant={config.sessionType === 'multi' ? 'default' : 'secondary'}>
                    {config.sessionType === 'multi' ? 'Multi-Module' : 'Single Module'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Selected Modules */}
              {config.selectedModules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Selected Modules:</h4>
                  <div className="space-y-1">
                    {selectedModuleNames.map(name => (
                      <div key={name} className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-chart-5" />
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Validation Status */}
              {config.selectedModules.length > 0 && validationResult && (
                <div className="text-sm space-y-1">
                  {validationResult.isValid ? (
                    <div className="text-chart-5 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Ready to create exam ({validationResult.totalQuestions} questions available)
                    </div>
                  ) : (
                    <div className="text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Cannot create exam - no questions available
                    </div>
                  )}
                </div>
              )}

              {/* Create Button */}
              <Button
                onClick={handleCreateExam}
                disabled={!canCreate}
                className="w-full bg-chart-3 hover:bg-chart-3/90"
                size="lg"
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Exam...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Create Exam Session
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">💡 Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Select multiple modules for comprehensive assessment</p>
              <p>• Multi-module sessions provide broader question coverage</p>
              <p>• Questions are automatically selected from your chosen modules</p>
              <p>• Green badges indicate modules with available questions</p>
              <p>• Red badges indicate modules without questions for the selected year</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
