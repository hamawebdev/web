'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Building2,
  FolderOpen,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  X
} from 'lucide-react';
import { StudentService } from '@/lib/api-services';
import { NewApiService } from '@/lib/api/new-api-services';
import type { ContentFilters } from '@/lib/api/new-api-services';
import { UnitModuleGrid } from '@/components/student/shared/unit-module-grid';
import { UnitModuleItem } from '@/components/student/shared/unit-module-compact-card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useYearLevel } from '@/hooks/use-year-level';
import { YearLevelSelector } from '@/components/student/shared/year-level-selector';

interface ReadingTodoFormProps {
  onBack: () => void;
  onTodoCreated: () => void;
}

interface ReadingTodoData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  courseIds: number[]; // Multiple course IDs
  courses: SelectedCourse[]; // Course details
  estimatedTime?: number;
  tags: string[];
}

interface SelectedCourse {
  id: number;
  name: string;
  description?: string;
  moduleName: string;
  uniteName?: string;
}

export function ReadingTodoForm({ onBack, onTodoCreated }: ReadingTodoFormProps) {
  const [step, setStep] = useState<'units' | 'modules' | 'courses' | 'details'>('units');
  const [contentFilters, setContentFilters] = useState<ContentFilters | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [showAllCourses, setShowAllCourses] = useState(false); // New state for cross-unit/module selection
  const [todoData, setTodoData] = useState<ReadingTodoData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: undefined,
    courseIds: [],
    courses: [],
    estimatedTime: undefined,
    tags: []
  });

  // Detect year level from subscription - Only apply filtering for SEVEN (Résidanat) students
  const {
    yearLevel: detectedYearLevel,
    effectiveYearLevel,
    shouldApplyFilter,
    loading: yearLevelLoading
  } = useYearLevel();

  const [selectedYearLevel, setSelectedYearLevel] = useState<string | null>(null);

  // Use selected year level if set, otherwise use effective year level (only SEVEN)
  const activeYearLevel = selectedYearLevel || effectiveYearLevel;

  // Load content filters when component mounts or year level changes
  useEffect(() => {
    if (!yearLevelLoading) {
      loadContentFilters();
    }
  }, [activeYearLevel, yearLevelLoading]);

  const loadContentFilters = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading content filters...');
      // Pass year level only for SEVEN (Résidanat) students
      const response = await NewApiService.getContentFilters(activeYearLevel);
      console.log('📡 Content filters API response:', response);
      
      if (response.success) {
        console.log('✅ Content filters data:', response.data);

        // NewApiService returns data directly without nested structure
        const actualData = response.data;
        console.log('🔍 Actual data structure:', actualData);
        console.log('🔍 Actual data keys:', Object.keys(actualData || {}));
        console.log('📚 Unites:', actualData?.unites);
        console.log('📚 Unites count:', actualData?.unites?.length || 0);
        console.log('🎓 Independent modules:', actualData?.independentModules);
        console.log('🎓 Independent modules count:', actualData?.independentModules?.length || 0);

        // Log detailed structure
        if (actualData?.unites) {
          (actualData.unites || []).forEach((unite, index) => {
            console.log(`📖 Unite ${index + 1}: ${unite.name} (${unite.modules?.length || 0} modules)`);
            (unite.modules || []).forEach((module, moduleIndex) => {
              console.log(`  📝 Module ${moduleIndex + 1}: ${module.name} (${module.courses?.length || 0} courses)`);
            });
          });
        }

        if (actualData?.independentModules) {
          (actualData.independentModules || []).forEach((module, index) => {
            console.log(`🔗 Independent Module ${index + 1}: ${module.name} (${module.courses?.length || 0} courses)`);
          });
        }

        setContentFilters(actualData);
      } else {
        console.error('❌ Content filters API failed:', response.error);
        toast.error('Failed to load course content');
      }
    } catch (error) {
      console.error('💥 Error loading content filters:', error);
      toast.error('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate title when courses are selected
  useEffect(() => {
    if (selectedCourses.length > 0 && step === 'details') {
      const courseNames = selectedCourses.map(c => c.name);
      const title = selectedCourses.length === 1
        ? `Read ${courseNames[0]}`
        : `Read ${courseNames.length} courses: ${courseNames.slice(0, 2).join(', ')}${courseNames.length > 2 ? '...' : ''}`;

      setTodoData(prev => ({
        ...prev,
        title,
        courseIds: selectedCourses.map(c => c.id),
        courses: selectedCourses
      }));
    }
  }, [selectedCourses, step]);

  // Handle unit/module selection using UnitModuleGrid
  const handleUnitModuleSelection = (item: UnitModuleItem) => {
    if (item.type === 'unite') {
      // Find the full unit data from contentFilters
      const unit = contentFilters?.unites?.find(u => u.id === item.id);
      if (unit) {
        handleUnitSelect(unit);
      }
    } else if (item.type === 'module' && item.isIndependent) {
      // Find the full module data from contentFilters
      const module = contentFilters?.independentModules?.find(m => m.id === item.id);
      if (module) {
        handleIndependentModuleSelect(module);
      }
    }
  };

  const handleUnitSelect = (unit: any) => {
    setSelectedUnit(unit);
    setSelectedModule(null);
    setSelectedCourse(null);
    // Don't clear selectedCourses to preserve cross-unit selections
    setStep('modules');
  };

  const handleIndependentModuleSelect = (module: any) => {
    setSelectedUnit(null);
    setSelectedModule(module);
    setSelectedCourse(null);
    // Don't clear selectedCourses to preserve cross-module selections
    setStep('courses');
  };

  const handleModuleSelect = (module: any) => {
    setSelectedModule(module);
    setSelectedCourse(null);
    // Don't clear selectedCourses to preserve cross-module selections
    setStep('courses');
  };

  const handleCourseSelect = (course: any) => {
    const newCourse: SelectedCourse = {
      id: course.id,
      name: course.name,
      description: course.description,
      moduleName: selectedModule.name,
      uniteName: selectedUnit?.name
    };

    // Check if course is already selected
    const isAlreadySelected = selectedCourses.some(c => c.id === course.id);
    if (isAlreadySelected) {
      toast.error('This course is already selected');
      return;
    }

    setSelectedCourse(newCourse);
    // A todo is linked to a single course on the backend (courseId), so a new pick
    // replaces the current one instead of being added to a list that would be dropped
    setSelectedCourses([newCourse]);
    setStep('details');
  };

  const handleAddAnotherCourse = () => {
    setStep('courses');
  };

  const handleRemoveCourse = (courseId: number) => {
    setSelectedCourses(prev => prev.filter(c => c.id !== courseId));
    if (selectedCourses.length === 1) {
      // If removing the last course, go back to course selection
      setStep('courses');
    }
  };

  const handleBackToUnits = () => {
    setSelectedUnit(null);
    setSelectedModule(null);
    setSelectedCourse(null);
    // Preserve selectedCourses for cross-unit selection
    setStep('units');
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
    setSelectedCourse(null);
    // Preserve selectedCourses for cross-module selection
    setStep('modules');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    // Don't clear selectedCourses here as user might want to add more
    setStep('courses');
  };

  const handleShowAllCourses = () => {
    setShowAllCourses(true);
    setStep('courses');
  };

  const handleShowFilteredCourses = () => {
    setShowAllCourses(false);
    setStep('courses');
  };

  const handleCreateTodo = async () => {
    if (selectedCourses.length === 0 || !todoData.title.trim()) {
      toast.error('Please select at least one course and fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await StudentService.createTodo({
        title: todoData.title,
        description: todoData.description,
        type: 'READING',
        priority: todoData.priority,
        dueDate: todoData.dueDate,
        courseId: selectedCourses[0]?.id,
        estimatedTime: todoData.estimatedTime,
        tags: todoData.tags
      });

      if (response.success) {
        toast.success('Reading todo created successfully');
        onTodoCreated();
      } else {
        toast.error('Failed to create reading todo');
      }
    } catch (error) {
      toast.error('Failed to create reading todo');
      console.error('Error creating reading todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUnitsSelection = () => {
    if (!contentFilters) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-[2px] border-primary mx-auto"></div>
            <p className="text-lg font-medium">Loading courses...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your available courses</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Year Level Selection - Only show for SEVEN (Résidanat) students */}
        {shouldApplyFilter && (
          <YearLevelSelector
            value={selectedYearLevel as any}
            onChange={(yearLevel) => setSelectedYearLevel(yearLevel)}
            loading={yearLevelLoading}
            showAllOption={false}
            placeholder={
              yearLevelLoading
                ? "Chargement..."
                : "Select year"
            }
          />
        )}

        <div className="text-center space-y-3">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-full w-fit mx-auto">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Select Study Unit</h2>
            <p className="text-muted-foreground mt-1">
              Choose a study unit or independent module to start with
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Use UnitModuleGrid for consistent layout */}
          <UnitModuleGrid
            units={contentFilters.unites}
            independentModules={contentFilters.independentModules}
            onItemClick={handleUnitModuleSelection}
            variant="practice"
            layout="compact"
            loading={false}
            error={null}
            showSessionCounts={false}
            selectedItem={null}
          />
        </div>
      </div>
    );
  };

  const renderModulesSelection = () => {
    if (!selectedUnit) return null;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-full w-fit mx-auto">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Select Module</h2>
            <p className="text-muted-foreground mt-1">
              Choose a module from <span className="font-medium">{selectedUnit.name}</span>
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={handleBackToUnits}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Units
            </Button>

            {/* Modules */}
            <div className="grid gap-3">
              {selectedUnit.modules && selectedUnit.modules.length > 0 ? (
                selectedUnit.modules.map((module: any) => (
                  <Card
                    key={module.id}
                    className="cursor-pointer hover:shadow-md transition-all border-l-[4px] border-l-primary/30 hover:border-l-primary/50"
                    onClick={() => handleModuleSelect(module)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <FolderOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{module.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {module.courses?.length || 0} courses available
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12 space-y-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-medium text-lg">No Modules Available</h3>
                      <p className="text-muted-foreground mt-2">
                        No modules found in this unit. Please try selecting a different unit.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCoursesSelection = () => {
    // Get all courses from all modules if showAllCourses is true
    const getAllCourses = () => {
      if (!contentFilters) return [];

      const allCourses: any[] = [];

      // Add courses from units
      contentFilters.unites?.forEach(unit => {
        unit.modules?.forEach(module => {
          module.courses?.forEach(course => {
            allCourses.push({
              ...course,
              moduleName: module.name,
              uniteName: unit.name
            });
          });
        });
      });

      // Add courses from independent modules
      contentFilters.modules?.forEach(module => {
        module.courses?.forEach(course => {
          allCourses.push({
            ...course,
            moduleName: module.name,
            uniteName: undefined
          });
        });
      });

      return allCourses;
    };

    const coursesToShow = showAllCourses ? getAllCourses() : selectedModule?.courses || [];
    const hasSelectedCourses = selectedCourses.length > 0;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-full w-fit mx-auto">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Select Course</h2>
            <p className="text-muted-foreground mt-1">
              {showAllCourses ? (
                'Choose courses from any unit or module'
              ) : (
                <>
                  Choose a course from <span className="font-medium">{selectedModule?.name}</span>
                  {selectedUnit && (
                    <span className="text-muted-foreground"> in {selectedUnit.name}</span>
                  )}
                </>
              )}
            </p>
            {hasSelectedCourses && (
              <p className="text-sm text-primary font-medium">
                {selectedCourses.length} course{selectedCourses.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {/* Navigation and toggle buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={selectedUnit ? handleBackToModules : handleBackToUnits}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {selectedUnit ? 'Back to Modules' : 'Back to Units'}
              </Button>

              <div className="flex gap-2">
                {!showAllCourses && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowAllCourses}
                    className="gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Browse All Courses
                  </Button>
                )}
                {showAllCourses && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowFilteredCourses}
                    className="gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Back to {selectedModule?.name || 'Module'}
                  </Button>
                )}
                {hasSelectedCourses && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setStep('details')}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Continue ({selectedCourses.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Courses */}
            <div className="grid gap-3">
              {coursesToShow && coursesToShow.length > 0 ? (
                coursesToShow.map((course: any) => {
                  const isSelected = selectedCourses.some(c => c.id === course.id);
                  return (
                    <Card
                      key={course.id}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-all border-l-[4px]",
                        isSelected
                          ? "border-l-primary bg-primary/5 shadow-md"
                          : "border-l-primary/30 hover:border-l-primary/50"
                      )}
                      onClick={() => handleCourseSelect(course)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-lg",
                              isSelected ? "bg-primary/20" : "bg-primary/10"
                            )}>
                              <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-lg">{course.name}</h4>
                                {isSelected && (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              {course.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {course.description}
                                </p>
                              )}
                              {showAllCourses && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  {course.uniteName && (
                                    <>
                                      <Building2 className="h-3 w-3" />
                                      <span>{course.uniteName}</span>
                                      <span>•</span>
                                    </>
                                  )}
                                  <FolderOpen className="h-3 w-3" />
                                  <span>{course.moduleName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {!isSelected && (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12 space-y-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-medium text-lg">No Courses Available</h3>
                      <p className="text-muted-foreground mt-2">
                        {showAllCourses
                          ? 'No courses found in any module. Please check your content setup.'
                          : 'No courses found in this module. Please try selecting a different module.'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Create Reading Todo</h1>
            <p className="text-muted-foreground">
              {step === 'units' && 'Select a study unit or independent module to start with'}
              {step === 'modules' && 'Choose a module from the selected unit'}
              {step === 'courses' && 'Select a course to create a reading todo for'}
              {step === 'details' && 'Fill in the details for your reading todo'}
            </p>

            {/* Breadcrumb */}
            {(selectedUnit || selectedModule || selectedCourse) && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>Path:</span>
                {selectedUnit && (
                  <>
                    <span className="font-medium">{selectedUnit.name}</span>
                    {selectedModule && <ChevronRight className="h-3 w-3" />}
                  </>
                )}
                {selectedModule && (
                  <>
                    <span className="font-medium">{selectedModule.name}</span>
                    {selectedCourse && <ChevronRight className="h-3 w-3" />}
                  </>
                )}
                {selectedCourse && (
                  <span className="font-medium text-primary">{selectedCourse.name}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Back button positioned below the header div */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Todos
        </Button>
      </div>

      <Separator />

      {/* Content */}
      {loading && step === 'details' ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-[2px] border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Creating todo...</p>
          </div>
        </div>
      ) : (
        <>
          {step === 'units' && renderUnitsSelection()}
          {step === 'modules' && renderModulesSelection()}
          {step === 'courses' && renderCoursesSelection()}
          {step === 'details' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Selected courses info */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Selected Courses ({selectedCourses.length})
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddAnotherCourse}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Change Course
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedCourses.map((course, index) => (
                    <div key={course.id} className="flex items-start gap-4 p-3 bg-background rounded-lg border">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{course.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {course.uniteName && `${course.uniteName} • `}
                          {course.moduleName}
                        </div>
                        {course.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {course.description}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCourse(course.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Todo form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Todo Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter reading todo title"
                      value={todoData.title}
                      onChange={(e) => setTodoData({ ...todoData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add notes about what to focus on while reading..."
                      value={todoData.description}
                      onChange={(e) => setTodoData({ ...todoData, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={todoData.priority} 
                        onValueChange={(value: any) => setTodoData({ ...todoData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low Priority</SelectItem>
                          <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                          <SelectItem value="HIGH">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Estimated Time (minutes)
                      </Label>
                      <Input
                        id="estimatedTime"
                        type="number"
                        placeholder="e.g., 60"
                        value={todoData.estimatedTime || ''}
                        onChange={(e) => setTodoData({ 
                          ...todoData, 
                          estimatedTime: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date (Optional)</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={todoData.dueDate || ''}
                      onChange={(e) => setTodoData({ ...todoData, dueDate: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleBackToCourses}
                      className="flex-1"
                    >
                      Back to Course Selection
                    </Button>
                    <Button
                      onClick={handleCreateTodo}
                      disabled={loading || !todoData.title.trim() || selectedCourses.length === 0}
                      className="flex-1 gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-[2px] border-current"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4" />
                          Create Reading Todo
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
