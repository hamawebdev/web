// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-states';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  BookOpen,
  Target,
  Search,
  X,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { NewApiService } from '@/lib/api/new-api-services';
import { ContentFilters, CardCreateRequest } from '@/types/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { suiviCoursStorage } from '@/lib/suivi-cours-storage';
import { useYearLevel } from '@/hooks/use-year-level';
import { YearLevelSelector } from '@/components/student/shared/year-level-selector';

interface Course {
  id: number;
  name: string;
  description?: string;
}

interface Module {
  id: number;
  name: string;
  description?: string;
  courses?: Course[];
}

interface Unit {
  id: number;
  name: string;
  logoUrl?: string;
  modules?: Module[];
}

interface EnhancedTrackerCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (trackerId?: number) => void;
}

interface SelectedCourse {
  id: number;
  name: string;
  description?: string;
  moduleName: string;
  uniteName?: string;
}

export function EnhancedTrackerCreateDialog({
  open,
  onOpenChange,
  onSuccess
}: EnhancedTrackerCreateDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<'units' | 'modules' | 'courses' | 'details'>('units');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentFilters, setContentFilters] = useState<ContentFilters | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);

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

  // Fetch content filters when dialog opens or year level changes
  useEffect(() => {
    if (open && !yearLevelLoading) {
      fetchContentFilters();
    }
  }, [open, activeYearLevel, yearLevelLoading]);

  const fetchContentFilters = async () => {
    try {
      setFiltersLoading(true);

      // Pass year level only for SEVEN (Résidanat) students
      const response = await NewApiService.getContentFilters(activeYearLevel);

      if (response.success && response.data) {
        setContentFilters(response.data);
        console.log('📚 [TrackerCreate] Content filters loaded:', {
          unites: response.data.unites?.length || 0,
          independentModules: response.data.independentModules?.length || 0
        });
      } else {
        throw new Error(response.error || 'Failed to fetch content filters');
      }
    } catch (err) {
      console.error('Error fetching content filters:', err);
      toast.error('Erreur lors du chargement des données');
      setContentFilters(null);
    } finally {
      setFiltersLoading(false);
    }
  };

  // Navigation handlers following Reading Todo pattern
  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit);
    setSelectedModule(null);
    setStep('modules');
  };

  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setStep('courses');
  };

  const handleCourseSelect = (course: Course) => {
    // Check if course is already being tracked in another suivi
    const isTrackedElsewhere = suiviCoursStorage.isCourseTracked(course.id);
    if (isTrackedElsewhere) {
      const trackerInfo = suiviCoursStorage.getTrackerForCourse(course.id);
      toast.error(`Ce cours est déjà suivi dans le tracker "${trackerInfo?.trackerTitle || 'un autre tracker'}"`);
      return;
    }

    const newCourse: SelectedCourse = {
      id: course.id,
      name: course.name,
      description: course.description,
      moduleName: selectedModule?.name || 'Independent Module',
      uniteName: selectedUnit?.name
    };

    // Check if course is already selected in current session
    const isAlreadySelected = selectedCourses.some(c => c.id === course.id);
    if (isAlreadySelected) {
      toast.error('Ce cours est déjà sélectionné');
      return;
    }

    setSelectedCourses(prev => [...prev, newCourse]);
    setStep('details');
  };

  const handleRemoveCourse = (courseId: number) => {
    setSelectedCourses(prev => prev.filter(c => c.id !== courseId));
    if (selectedCourses.length === 1) {
      // If removing the last course, go back to course selection
      setStep('courses');
    }
  };

  const handleAddAnotherCourse = () => {
    setStep('courses');
  };

  const handleBackToUnits = () => {
    setSelectedUnit(null);
    setSelectedModule(null);
    setStep('units');
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
    setStep('modules');
  };

  const handleBackToCourses = () => {
    setStep('courses');
  };

  // Auto-generate title when courses are selected
  useEffect(() => {
    if (selectedCourses.length > 0 && step === 'details') {
      const courseNames = selectedCourses.map(c => c.name);
      const generatedTitle = selectedCourses.length === 1
        ? `Suivi ${courseNames[0]}`
        : `Suivi ${courseNames.length} cours: ${courseNames.slice(0, 2).join(', ')}${courseNames.length > 2 ? '...' : ''}`;

      setTitle(generatedTitle);
    }
  }, [selectedCourses, step]);

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Veuillez sélectionner au moins un cours');
      return;
    }

    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    try {
      setLoading(true);

      const createRequest: CardCreateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        courseIds: selectedCourses.map(c => c.id)
      };

      const response = await NewApiService.createCard(createRequest);

      console.log('📋 [EnhancedTrackerCreateDialog] Create card response:', {
        success: response.success,
        hasData: !!response.data,
        dataId: response.data?.id,
        nestedDataId: response.data?.data?.id,
        dataType: typeof response.data?.id,
        nestedDataType: typeof response.data?.data?.id,
        fullResponse: response
      });

      if (response.success) {
        // Check for ID in both possible locations: response.data.id or response.data.data.id
        const actualData = response.data?.data || response.data;
        const trackerId = actualData?.id;

        if (trackerId !== undefined && trackerId !== null) {
          console.log('✅ [EnhancedTrackerCreateDialog] Redirecting to tracker:', trackerId);

          // Save tracked courses to localStorage
          try {
            suiviCoursStorage.addTrackedCourses(
              trackerId,
              title.trim(),
              selectedCourses.map(c => c.id)
            );
          } catch (error) {
            console.error('Failed to save tracked courses to localStorage:', error);
            // Don't block the success flow for localStorage errors
          }

          toast.success('Suivi de cours créé avec succès');

          // Reset form
          handleClose();

          // Redirect to the tracker page
          router.push(`/student/suivi-cours/tracker/${trackerId}`);

          // Call onSuccess with the tracker ID for any additional handling
          onSuccess?.(trackerId);
        } else {
          // Handle case where creation was successful but no ID was returned
          console.error('❌ [EnhancedTrackerCreateDialog] Tracker created but no ID returned:', {
            response,
            dataExists: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : 'no data',
            nestedDataExists: !!response.data?.data,
            nestedDataKeys: response.data?.data ? Object.keys(response.data.data) : 'no nested data',
            actualData,
            actualDataKeys: actualData ? Object.keys(actualData) : 'no actual data'
          });
          toast.error('Suivi créé mais impossible de rediriger. Veuillez vérifier la liste des suivis.');
          handleClose();
          onSuccess?.();
        }
      } else {
        console.error('❌ [EnhancedTrackerCreateDialog] Create card failed:', response);
        throw new Error(response.error || 'Failed to create tracker');
      }
    } catch (err) {
      console.error('Error creating tracker:', err);
      toast.error('Erreur lors de la création du suivi');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedCourses([]);
    setSelectedUnit(null);
    setSelectedModule(null);
    setSearchTerm('');
    setStep('units');
    onOpenChange(false);
  };

  const selectedCount = selectedCourses.length;

  // Render functions for each step
  const renderUnitsSelection = () => (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
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

        {/* Study Units */}
        {contentFilters.unites && contentFilters.unites.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Unités d'étude
            </h3>
            <div className="grid gap-3">
              {contentFilters.unites.map((unit) => (
                <Card
                  key={unit.id}
                  className="cursor-pointer hover:shadow-md transition-all border-l-[4px] border-l-primary/30 hover:border-l-primary/50"
                  onClick={() => handleUnitSelect(unit)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{unit.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {unit.modules?.length || 0} module{(unit.modules?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Independent Modules */}
        {contentFilters.independentModules && contentFilters.independentModules.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Modules indépendants
            </h3>
            <div className="grid gap-3">
              {contentFilters.independentModules.map((module) => (
                <Card
                  key={module.id}
                  className="cursor-pointer hover:shadow-md transition-all border-l-[4px] border-l-primary/30 hover:border-l-primary/50"
                  onClick={() => handleModuleSelect(module)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{module.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.courses?.length || 0} cours
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No content available */}
        {(!contentFilters.unites || contentFilters.unites.length === 0) &&
         (!contentFilters.independentModules || contentFilters.independentModules.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="text-center py-12 space-y-4">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium text-lg">Aucun contenu disponible</h3>
                <p className="text-muted-foreground mt-2">
                  Aucune unité d'étude ou module trouvé dans votre abonnement actuel.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );

  const renderModulesSelection = () => {
    if (!selectedUnit) return null;

    return (
      <ScrollArea className="h-full">
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToUnits}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Retour aux unités
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-medium">{selectedUnit.name}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Modules
            </h3>
            <div className="grid gap-3">
              {selectedUnit.modules && selectedUnit.modules.length > 0 ? (
                selectedUnit.modules.map((module) => (
                  <Card
                    key={module.id}
                    className="cursor-pointer hover:shadow-md transition-all border-l-[4px] border-l-primary/30 hover:border-l-primary/50"
                    onClick={() => handleModuleSelect(module)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{module.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {module.courses?.length || 0} cours
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
                  <CardContent className="text-center py-8 space-y-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Aucun module dans cette unité</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  const renderCoursesSelection = () => {
    if (!selectedModule) return null;

    const coursesToShow = selectedModule.courses || [];

    return (
      <ScrollArea className="h-full">
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectedUnit ? handleBackToModules : handleBackToUnits}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              {selectedUnit ? 'Retour aux modules' : 'Retour aux unités'}
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-medium">{selectedModule.name}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Cours
            </h3>
            <div className="grid gap-3">
              {coursesToShow.length > 0 ? (
                coursesToShow.map((course) => {
                  const isSelected = selectedCourses.some(c => c.id === course.id);
                  const isTrackedElsewhere = suiviCoursStorage.isCourseTracked(course.id);
                  const trackerInfo = isTrackedElsewhere ? suiviCoursStorage.getTrackerForCourse(course.id) : null;
                  const isDisabled = isTrackedElsewhere;

                  return (
                    <TooltipProvider key={course.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Card
                            className={cn(
                              "transition-all border-l-[4px]",
                              isDisabled
                                ? "opacity-60 cursor-not-allowed border-l-muted bg-muted/20"
                                : "cursor-pointer hover:shadow-md",
                              !isDisabled && isSelected
                                ? "border-l-primary bg-primary/5 shadow-md"
                                : !isDisabled && "border-l-primary/30 hover:border-l-primary/50"
                            )}
                            onClick={() => !isDisabled && handleCourseSelect(course)}
                          >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-lg",
                              isDisabled
                                ? "bg-muted/30"
                                : isSelected
                                  ? "bg-primary/20"
                                  : "bg-primary/10"
                            )}>
                              <BookOpen className={cn(
                                "h-6 w-6",
                                isDisabled ? "text-muted-foreground" : "text-primary"
                              )} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={cn(
                                  "font-semibold text-lg",
                                  isDisabled ? "text-muted-foreground" : ""
                                )}>{course.name}</h4>
                                {isSelected && !isDisabled && (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                )}
                                {isDisabled && (
                                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                    Déjà suivi
                                  </span>
                                )}
                              </div>
                              {course.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {course.description}
                                </p>
                              )}
                              {isDisabled && trackerInfo && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  Dans: {trackerInfo.trackerTitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className={cn(
                            "h-5 w-5",
                            isDisabled ? "text-muted-foreground/50" : "text-muted-foreground"
                          )} />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    {isDisabled && (
                      <TooltipContent>
                        <p>Ce cours est déjà suivi dans le tracker "{trackerInfo?.trackerTitle}"</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
                })
              ) : (
                <Card className="border-dashed">
                  <CardContent className="text-center py-8 space-y-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Aucun cours dans ce module</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  const renderDetailsForm = () => (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        {/* Selected courses info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Cours sélectionnés ({selectedCount})
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAnotherCourse}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un cours
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedCourses.map((course) => (
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
                    <div className="text-xs text-muted-foreground mt-1">
                      {course.description}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCourse(course.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du suivi *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Anatomie et Physiologie - Semestre 1"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée du suivi de cours..."
              className="w-full"
              rows={4}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Créer un nouveau suivi de cours</span>
          </DialogTitle>
          <DialogDescription>
            {step === 'units' && 'Sélectionnez une unité d\'étude ou un module indépendant'}
            {step === 'modules' && selectedUnit && `Sélectionnez un module dans ${selectedUnit.name}`}
            {step === 'courses' && selectedModule && `Sélectionnez un cours dans ${selectedModule.name}`}
            {step === 'details' && `Finalisez votre suivi de cours (${selectedCount} cours sélectionné${selectedCount !== 1 ? 's' : ''})`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {filtersLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="md" />
              <span className="ml-3 text-muted-foreground">Chargement des données...</span>
            </div>
          ) : !contentFilters ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Erreur lors du chargement des données</p>
              </div>
            </div>
          ) : (
            <>
              {step === 'units' && renderUnitsSelection()}
              {step === 'modules' && renderModulesSelection()}
              {step === 'courses' && renderCoursesSelection()}
              {step === 'details' && renderDetailsForm()}
            </>
          )}

	        </div>




        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>

          {step === 'details' && (
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedCount === 0 || !title.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le suivi ({selectedCount})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
