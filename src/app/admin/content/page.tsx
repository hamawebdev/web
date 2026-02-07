// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  School,
  Calendar,
  BookOpen,
  Layers,
  GraduationCap,
  ChevronRight,
  ArrowLeft,
  Upload,
  Plus,
  CheckCircle,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useQuestionImport } from '@/hooks/admin/use-question-import';
import { useQuestionManagement } from '@/hooks/admin/use-question-management';
import { useQuestionSources } from '@/hooks/admin/use-question-sources';
import { JsonQuestionInput } from '@/components/admin/content/json-question-input';
import { AddEntityDialog } from '@/components/admin/content/add-entity-dialog';
import { EntityCard } from '@/components/admin/content/entity-card';
import { EditEntityDialog } from '@/components/admin/content/edit-entity-dialog';
import { CourseSpecificQuestionDialog } from '@/components/admin/questions/course-specific-question-dialog';
import { BulkImportWizard } from '@/components/admin/content/bulk-import-wizard';
import { BulkQuestionImportResponse, SelectionState, ImportQuestion, ValidationResult, BulkImportResponse } from '@/types/question-import';

import { toast } from 'sonner';

type Step = 'university' | 'studyPack' | 'unit' | 'module' | 'course' | 'courseActions' | 'import' | 'bulkImport';

export default function AdminContentPage() {
  const [currentStep, setCurrentStep] = useState<Step>('university');
  const [jsonInput, setJsonInput] = useState('');
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
    questionCount: 0
  });
  const [parsedQuestions, setParsedQuestions] = useState<ImportQuestion[]>([]);
  const [importing, setImporting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addEntityType, setAddEntityType] = useState<'university' | 'studyPack' | 'unit' | 'module' | 'course' | 'independentModule'>('university');
  const [selectedExamYear, setSelectedExamYear] = useState<number | undefined>(undefined);
  const [selectedSourceId, setSelectedSourceId] = useState<number | undefined>(undefined);
  const [selectedRotation, setSelectedRotation] = useState<string | undefined>(undefined);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editEntity, setEditEntity] = useState<any>(null);
  const [editEntityType, setEditEntityType] = useState<'university' | 'studyPack' | 'unit' | 'module' | 'course'>('university');
  const [customYearInput, setCustomYearInput] = useState<string>('');
  const [showCreateQuestionDialog, setShowCreateQuestionDialog] = useState(false);

  const {
    loading,
    selection,
    fetchFilters,
    updateSelection,
    getAvailableOptions,
    importQuestions,
    resetWizard
  } = useQuestionImport();

  // Question management hook
  const { createQuestion } = useQuestionManagement();

  // Use question sources hook
  const {
    questionSources,
    loading: sourcesLoading,
    error: sourcesError
  } = useQuestionSources();

  // Load filters on mount
  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // Get available options based on current selection
  const availableOptions = getAvailableOptions();

  // Handle card selection
  const handleCardSelection = (type: keyof SelectionState, value: any) => {
    updateSelection(type, value);

    // Move to next step
    switch (type) {
      case 'university':
        setCurrentStep('studyPack');
        break;
      case 'studyPack':
        setCurrentStep('unit');
        break;
      case 'unit':
        setCurrentStep('module');
        break;
      case 'module':
        setCurrentStep('course');
        break;
      case 'independentModule':
        setCurrentStep('course');
        break;
      case 'course':
        setCurrentStep('courseActions');
        break;
    }
  };

  // Handle going back
  const handleGoBack = () => {
    switch (currentStep) {
      case 'studyPack':
        updateSelection('university', undefined);
        setCurrentStep('university');
        break;
      case 'unit':
        updateSelection('studyPack', undefined);
        setCurrentStep('studyPack');
        break;
      case 'module':
        updateSelection('unit', undefined);
        setCurrentStep('unit');
        break;
      case 'course':
        if (selection.independentModule) {
          updateSelection('independentModule', undefined);
        } else {
          updateSelection('module', undefined);
        }
        setCurrentStep(selection.unit ? 'module' : 'unit');
        break;
      case 'import':
        setCurrentStep('courseActions');
        break;
      case 'bulkImport':
        setCurrentStep('courseActions');
        break;
    }
  };

  // Handle successful question import
  const handleImportComplete = (result: BulkQuestionImportResponse) => {
    // Show success message without redirecting
    toast.success("Questions imported successfully.");

    // Clear the JSON input and reset validation state to allow for new imports
    setJsonInput('');
    setParsedQuestions([]);
    setValidation({
      isValid: false,
      errors: [],
      warnings: [],
      questionCount: 0
    });

    // Keep the user on the current import step - do not reset wizard or change step
    // This allows them to import more questions with the same metadata selection
  };

  // Handle successful bulk import
  const handleBulkImportComplete = (results: BulkImportResponse[]) => {
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} file(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} file(s)`);
    }

    // Stay on the bulk import page to allow for more imports
  };

  // Handle validation results from JsonQuestionInput component
  const handleValidationResult = (validationResult: ValidationResult) => {
    setValidation(validationResult);
  };

  // Handle input change
  const handleInputChange = (newValue: string) => {
    setJsonInput(newValue);

    // Reset validation and questions if input is empty
    if (!newValue.trim()) {
      setValidation({
        isValid: false,
        errors: [],
        warnings: [],
        questionCount: 0
      });
      setParsedQuestions([]);
    }
  };

  // Handle JSON validation (for the component)
  const handleJsonValidation = (questions: ImportQuestion[]) => {
    setParsedQuestions(questions);
  };

  // Handle add entity
  const handleAddEntity = (entityType: 'university' | 'studyPack' | 'unit' | 'module' | 'course' | 'independentModule') => {
    setAddEntityType(entityType);
    setShowAddDialog(true);
  };

  // Handle add entity success
  const handleAddEntitySuccess = () => {
    // Refresh the filters to get the new entity
    fetchFilters();
  };

  // Handle edit entity
  const handleEditEntity = (entity: any, entityType: 'university' | 'studyPack' | 'unit' | 'module' | 'course') => {
    setEditEntity(entity);
    setEditEntityType(entityType);
    setShowEditDialog(true);
  };

  // Handle edit entity success
  const handleEditEntitySuccess = () => {
    // Refresh the filters to get the updated entity
    fetchFilters();
  };

  // Handle delete entity
  const handleDeleteEntity = (entityId: number) => {
    // Refresh the filters to remove the deleted entity
    fetchFilters();
  };

  // Handle add question dialog
  const handleAddQuestion = () => {
    if (selection.course) {
      setShowCreateQuestionDialog(true);
    }
  };

  // Handle question creation
  const handleCreateQuestion = async (questionData: any) => {
    try {
      await createQuestion(questionData);
      setShowCreateQuestionDialog(false);
      toast.success('Question created successfully!');
    } catch (error) {
      console.error('Failed to create question:', error);
      toast.error('Failed to create question');
    }
  };

  // Handle custom year confirmation
  const handleCustomYearConfirm = () => {
    const year = parseInt(customYearInput);
    const currentYear = new Date().getFullYear();

    // Validate 4-digit year between 1900 and current year
    if (year >= 1900 && year <= currentYear && customYearInput.length === 4) {
      setSelectedExamYear(year);
      setCustomYearInput('');
    } else {
      toast.error(`Please enter a valid 4-digit year between 1900 and ${currentYear}`);
    }
  };

  // Get parent ID for entity creation
  const getParentId = () => {
    switch (addEntityType) {
      case 'unit':
        return selection.studyPack?.id;
      case 'module':
        return selection.unit?.id;
      case 'independentModule':
        return selection.studyPack?.id;
      case 'course':
        // Handle both regular modules and independent modules
        return selection.module?.id || selection.independentModule?.id;
      default:
        return undefined;
    }
  };

  // Handle import
  const handleImport = async () => {
    // Import button is always enabled - proceed with import
    setImporting(true);
    try {
      // Import using hook API to avoid client-side class method issues
      const result = await importQuestions(parsedQuestions, {
        examYear: selectedExamYear,
        sourceId: selectedSourceId,
        rotation: selectedRotation
      });
      if (result) {
        handleImportComplete(result);
      } else {
        throw new Error('Failed to import questions');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import questions');
    } finally {
      setImporting(false);
    }
  };

  // Get step info
  const getStepInfo = () => {
    switch (currentStep) {
      case 'university':
        return {
          title: 'Select University',
          description: 'Choose the university for your questions',
          icon: School
        };
      case 'studyPack':
        return {
          title: 'Select Study Pack',
          description: `Choose the study pack for ${selection.university?.name}`,
          icon: BookOpen
        };
      case 'unit':
        return {
          title: 'Select Unit or Independent Module',
          description: `Choose a unit or independent module from ${selection.studyPack?.name}`,
          icon: Layers
        };
      case 'module':
        return {
          title: 'Select Module',
          description: `Choose the module from ${selection.unit?.name}`,
          icon: GraduationCap
        };
      case 'course':
        return {
          title: 'Select Course',
          description: `Choose the course from ${selection.module?.name || selection.independentModule?.name}`,
          icon: Database
        };
      case 'courseActions':
        return {
          title: 'Course Actions',
          description: `Choose an action for ${selection.course?.name}`,
          icon: BookOpen
        };
      case 'import':
        return {
          title: 'Import Questions',
          description: `Import questions for ${selection.course?.name}`,
          icon: Upload
        };
      case 'bulkImport':
        return {
          title: 'Bulk Import Questions',
          description: `Import multiple JSON files for ${selection.course?.name}`,
          icon: Upload
        };
    }
  };

  const stepInfo = getStepInfo();
  const StepIcon = stepInfo.icon;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header with Breadcrumbs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Question Import Center</h1>
            <p className="text-muted-foreground">
              Import questions using our progressive drill-down selection system
            </p>
          </div>
          {currentStep !== 'university' && (
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>



        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <button
            onClick={() => setCurrentStep('university')}
            className={`hover:text-foreground transition-colors ${currentStep === 'university' ? 'text-foreground font-medium' : ''}`}
          >
            University
          </button>
          {selection.university && (
            <>
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() => setCurrentStep('studyPack')}
                className={`hover:text-foreground transition-colors ${currentStep === 'studyPack' ? 'text-foreground font-medium' : ''}`}
              >
                Study Pack
              </button>
            </>
          )}
          {selection.studyPack && (
            <>
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() => setCurrentStep('unit')}
                className={`hover:text-foreground transition-colors ${currentStep === 'unit' ? 'text-foreground font-medium' : ''}`}
              >
                {selection.independentModule ? 'Independent Module' : 'Unit'}
              </button>
            </>
          )}
          {selection.unit && (
            <>
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() => setCurrentStep('module')}
                className={`hover:text-foreground transition-colors ${currentStep === 'module' ? 'text-foreground font-medium' : ''}`}
              >
                Module
              </button>
            </>
          )}
          {(selection.module || selection.independentModule) && (
            <>
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() => setCurrentStep('course')}
                className={`hover:text-foreground transition-colors ${currentStep === 'course' ? 'text-foreground font-medium' : ''}`}
              >
                Course
              </button>
            </>
          )}
          {selection.course && (currentStep === 'import' || currentStep === 'bulkImport') && (
            <>
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() => setCurrentStep(currentStep)}
                className="text-foreground font-medium"
              >
                {currentStep === 'import' ? 'Import' : 'Bulk Import'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Step Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <StepIcon className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">{stepInfo.title}</h2>
          </div>
          <p className="text-muted-foreground">{stepInfo.description}</p>

          {/* Add Entity Button */}
          {currentStep !== 'import' && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  switch (currentStep) {
                    case 'university':
                      handleAddEntity('university');
                      break;
                    case 'studyPack':
                      handleAddEntity('studyPack');
                      break;
                    case 'unit':
                      handleAddEntity('unit');
                      break;
                    case 'module':
                      handleAddEntity('module');
                      break;
                    case 'course':
                      handleAddEntity('course');
                      break;
                  }
                }}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add {currentStep === 'university' ? 'University' :
                     currentStep === 'studyPack' ? 'Study Pack' :
                     currentStep === 'unit' ? 'Unit' :
                     currentStep === 'module' ? 'Module' :
                     currentStep === 'course' ? 'Course' : ''}
              </Button>
            </div>
          )}
        </div>

        {/* Content based on current step */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {currentStep === 'university' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableOptions.universities.map((university) => (
                  <EntityCard
                    key={university.id}
                    entity={university}
                    entityType="university"
                    onSelect={() => handleCardSelection('university', university)}
                    onEdit={(entity) => handleEditEntity(entity, 'university')}
                    onDelete={handleDeleteEntity}
                  />
                ))}
              </div>
            )}

            {currentStep === 'studyPack' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableOptions.studyPacks?.map((studyPack) => (
                  <EntityCard
                    key={studyPack.id}
                    entity={studyPack}
                    entityType="studyPack"
                    onSelect={() => handleCardSelection('studyPack', studyPack)}
                    onEdit={(entity) => handleEditEntity(entity, 'studyPack')}
                    onDelete={handleDeleteEntity}
                  />
                )) || (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No study packs available for this university</p>
                  </div>
                )}
              </div>
            )}



            {currentStep === 'unit' && (
              <div className="space-y-6">
                {/* Units Section */}
                {availableOptions.units.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Units</h3>
                        <Badge variant="outline">{availableOptions.units.length}</Badge>
                      </div>
                      <Button
                        onClick={() => handleAddEntity('unit')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Unit
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableOptions.units.map((unit) => (
                        <EntityCard
                          key={unit.id}
                          entity={unit}
                          entityType="unit"
                          onSelect={() => handleCardSelection('unit', unit)}
                          onEdit={(entity) => handleEditEntity(entity, 'unit')}
                          onDelete={handleDeleteEntity}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Independent Modules Section */}
                {availableOptions.independentModules && availableOptions.independentModules.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Independent Modules</h3>
                        <Badge variant="outline">{availableOptions.independentModules.length}</Badge>
                      </div>
                      <Button
                        onClick={() => handleAddEntity('independentModule')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Independent Module
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableOptions.independentModules.map((module) => (
                        <EntityCard
                          key={`independent-${module.id}`}
                          entity={module}
                          entityType="module"
                          onSelect={() => handleCardSelection('independentModule', module)}
                          onEdit={(entity) => handleEditEntity(entity, 'module')}
                          onDelete={handleDeleteEntity}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {availableOptions.units.length === 0 && (!availableOptions.independentModules || availableOptions.independentModules.length === 0) && (
                  <div className="text-center py-12">
                    <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Content Available</h3>
                    <p className="text-muted-foreground mb-4">
                      No units or independent modules are available for the selected study pack.
                    </p>
                    <div className="flex gap-2 justify-center mb-4">
                      <Button
                        onClick={() => handleAddEntity('unit')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Unit
                      </Button>
                      <Button
                        onClick={() => handleAddEntity('independentModule')}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Independent Module
                      </Button>
                    </div>
                    <Alert>
                      <AlertDescription>
                        If you expected to see content here, please check if the API endpoint is returning the correct data structure or contact support.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'module' && (
              <div className="space-y-6">
                {/* Debug Information */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-gray-100 p-4 rounded-lg text-sm">
                    <h4 className="font-semibold mb-2">Debug Info:</h4>
                    <p>Selected Unit: {selection.unit?.name} (ID: {selection.unit?.id})</p>
                    <p>Available Modules Count: {availableOptions.modules.length}</p>
                    <p>All Modules in Hierarchy: {getAvailableOptions().modules.length}</p>
                    {availableOptions.modules.length > 0 && (
                      <p>Sample Module: {availableOptions.modules[0].name} (Unit ID: {availableOptions.modules[0].unite?.id})</p>
                    )}
                  </div>
                )}

                {availableOptions.modules.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">
                          Modules in {selection.unit?.name}
                        </h3>
                        <Badge variant="outline">{availableOptions.modules.length}</Badge>
                      </div>
                      <Button
                        onClick={() => handleAddEntity('module')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Module
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableOptions.modules.map((module) => (
                        <EntityCard
                          key={module.id}
                          entity={module}
                          entityType="module"
                          onSelect={() => handleCardSelection('module', module)}
                          onEdit={(entity) => handleEditEntity(entity, 'module')}
                          onDelete={handleDeleteEntity}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Modules Available</h3>
                    <p className="text-muted-foreground mb-4">
                      No modules are available for the selected unit &quot;{selection.unit?.name}&quot;.
                    </p>
                    <Button
                      onClick={() => handleAddEntity('module')}
                      className="flex items-center gap-2 mb-4"
                    >
                      <Plus className="h-4 w-4" />
                      Add Module
                    </Button>
                    <Alert>
                      <AlertDescription>
                        This could mean:
                        <ul className="list-disc list-inside mt-2 text-left">
                          <li>The unit has no modules assigned to it</li>
                          <li>There&apos;s an issue with the data structure</li>
                          <li>The filtering logic needs to be checked</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'course' && (
              <div className="space-y-6">
                {/* Debug Information */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-gray-100 p-4 rounded-lg text-sm">
                    <h4 className="font-semibold mb-2">Debug Info - Course Step:</h4>
                    <p>Selected Module: {selection.module?.name} (ID: {selection.module?.id})</p>
                    <p>Selected Independent Module: {selection.independentModule?.name} (ID: {selection.independentModule?.id})</p>
                    <p>Available Courses Count: {availableOptions.courses.length}</p>
                    {availableOptions.courses.length > 0 && (
                      <p>Sample Course: {availableOptions.courses[0].name} (ID: {availableOptions.courses[0].id})</p>
                    )}
                  </div>
                )}

                {availableOptions.courses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No courses available for the selected module.</p>
                    <Button
                      onClick={() => handleAddEntity('course')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Course
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">
                          Courses in {selection.module?.name || selection.independentModule?.name}
                        </h3>
                        <Badge variant="outline">{availableOptions.courses.length}</Badge>
                      </div>
                      <Button
                        onClick={() => handleAddEntity('course')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Course
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableOptions.courses.map((course) => (
                        <EntityCard
                          key={course.id}
                          entity={course}
                          entityType="course"
                          onSelect={() => handleCardSelection('course', course)}
                          onEdit={(entity) => handleEditEntity(entity, 'course')}
                          onDelete={handleDeleteEntity}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {currentStep === 'courseActions' && (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Course Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {selection.course?.name}
                    </CardTitle>
                    <CardDescription>
                      Choose an action for this course
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">University:</span>
                        <Badge variant="secondary">{selection.university?.name}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Study Pack:</span>
                        <Badge variant="secondary">{selection.studyPack?.name}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Unit:</span>
                        <Badge variant="secondary">{selection.unit?.name}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Module:</span>
                        <Badge variant="secondary">{selection.module?.name || selection.independentModule?.name}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={() => handleAddQuestion()}>
                    <CardHeader className="text-center">
                      <CardTitle className="flex items-center justify-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add Question
                      </CardTitle>
                      <CardDescription>
                        Create a new question for this course
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={() => setCurrentStep('import')}>
                    <CardHeader className="text-center">
                      <CardTitle className="flex items-center justify-center gap-2">
                        <Upload className="h-5 w-5" />
                        Single Import
                      </CardTitle>
                      <CardDescription>
                        Import questions from a single JSON file
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={() => setCurrentStep('bulkImport')}>
                    <CardHeader className="text-center">
                      <CardTitle className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5" />
                        Bulk Import
                      </CardTitle>
                      <CardDescription>
                        Import multiple JSON files with auto exam year detection
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            )}

            {currentStep === 'import' && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Selection Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Selection Summary</CardTitle>
                    <CardDescription>
                      Questions will be imported with the following metadata
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <School className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">University:</span>
                          <Badge variant="secondary">{selection.university?.name}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Study Pack:</span>
                          <Badge variant="secondary">{selection.studyPack?.name}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Unit:</span>
                          <Badge variant="secondary">{selection.unit?.name}</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Module:</span>
                          <Badge variant="secondary">{selection.module?.name}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Course:</span>
                          <Badge variant="secondary">{selection.course?.name}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>



                {/* Exam Year Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Exam Year</CardTitle>
                    <CardDescription>
                      Choose the exam year for your questions (required: 4-digit year between 1900 and {new Date().getFullYear()})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <select
                          value={selectedExamYear === -1 ? 'custom' : selectedExamYear || ''}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setSelectedExamYear(-1); // Use -1 to indicate custom input mode
                            } else {
                              setSelectedExamYear(e.target.value ? parseInt(e.target.value) : undefined);
                            }
                          }}
                          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select exam year...</option>
                          {availableOptions.examYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                          {/* Allow custom year input */}
                          <option value="custom">Enter custom year...</option>
                        </select>
                        {selectedExamYear && selectedExamYear !== -1 && (
                          <Badge variant="secondary" className="text-green-600 border-green-600">
                            Year {selectedExamYear} selected
                          </Badge>
                        )}
                      </div>

                      {/* Custom year input */}
                      {selectedExamYear === -1 && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1900"
                            max={new Date().getFullYear()}
                            placeholder="Enter year (e.g., 2024)"
                            value={customYearInput}
                            onChange={(e) => setCustomYearInput(e.target.value)}
                            className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                          <Button
                            size="sm"
                            onClick={handleCustomYearConfirm}
                            disabled={!customYearInput || customYearInput.length !== 4 || parseInt(customYearInput) < 1900 || parseInt(customYearInput) > new Date().getFullYear()}
                          >
                            Confirm
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Rotation Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Rotation (Optional)</CardTitle>
                    <CardDescription>
                      Choose the rotation for your questions (optional: R1, R2, R3, or R4)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        <select
                          value={selectedRotation || ''}
                          onChange={(e) => setSelectedRotation(e.target.value || undefined)}
                          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select rotation...</option>
                          <option value="R1">R1</option>
                          <option value="R2">R2</option>
                          <option value="R3">R3</option>
                          <option value="R4">R4</option>
                        </select>
                        {selectedRotation && (
                          <Badge variant="secondary" className="text-green-600 border-green-600">
                            {selectedRotation} selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Question Source Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Question Source</CardTitle>
                    <CardDescription>
                      Choose the source of your questions (required: select from available sources)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <select
                          value={selectedSourceId || ''}
                          onChange={(e) => setSelectedSourceId(e.target.value ? parseInt(e.target.value) : undefined)}
                          disabled={sourcesLoading}
                          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select question source...</option>
                          {questionSources.map((source) => (
                            <option key={source.id} value={source.id}>
                              {source.name}
                            </option>
                          ))}
                        </select>
                        {selectedSourceId && (
                          <Badge variant="secondary" className="text-green-600 border-green-600">
                            {questionSources.find(s => s.id === selectedSourceId)?.name} selected
                          </Badge>
                        )}
                      </div>
                      {sourcesLoading && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Loading question sources...</span>
                        </div>
                      )}
                      {sourcesError && (
                        <div className="flex items-center space-x-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Error loading sources: {sourcesError}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* JSON Input */}
                <Card>
                  <CardHeader>
                    <CardTitle>Import Questions</CardTitle>
                    <CardDescription>
                      Paste your questions JSON array below
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <JsonQuestionInput
                      value={jsonInput}
                      onChange={handleInputChange}
                      validation={validation}
                      onValidate={handleJsonValidation}
                      onValidationResult={handleValidationResult}
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {validation.questionCount > 0 && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {validation.questionCount} questions ready
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={handleImport}
                        disabled={importing}
                        className="min-w-[120px]"
                      >
                        {importing ? (
                          <>
                            <Database className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Import Questions
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}

            {currentStep === 'bulkImport' && (
              <BulkImportWizard
                selection={selection}
                onImportComplete={handleBulkImportComplete}
                onCancel={() => setCurrentStep('courseActions')}
              />
            )}
          </>
        )}
      </div>

      {/* Add Entity Dialog */}
      <AddEntityDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        entityType={addEntityType}
        parentId={getParentId()}
        onSuccess={handleAddEntitySuccess}
      />

      <EditEntityDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        entityType={editEntityType}
        entity={editEntity}
        onSuccess={handleEditEntitySuccess}
      />

      {/* Course-Specific Question Creation Dialog */}
      {selection.course && (
        <CourseSpecificQuestionDialog
          open={showCreateQuestionDialog}
          onOpenChange={setShowCreateQuestionDialog}
          onCreateQuestion={handleCreateQuestion}
          courseId={selection.course.id}
          courseName={selection.course.name}
          universityId={selection.university?.id}
          universityName={selection.university?.name}
        />
      )}
    </div>
  );
}
