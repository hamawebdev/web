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
  X
} from 'lucide-react';
import { NewApiService } from '@/lib/api/new-api-services';
import { UnitModuleSelection, CardCreateRequest } from '@/types/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { suiviCoursStorage } from '@/lib/suivi-cours-storage';

interface Course {
  id: number;
  name: string;
  description?: string;
  module?: {
    id: number;
    name: string;
  };
}

interface TrackerCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitSelection?: UnitModuleSelection;
  onSuccess?: (trackerId?: number) => void;
}

export function TrackerCreateDialog({
  open,
  onOpenChange,
  unitSelection,
  onSuccess
}: TrackerCreateDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Fetch available courses when dialog opens
  useEffect(() => {
    if (open && unitSelection) {
      fetchAvailableCourses();
    }
  }, [open, unitSelection]);

  const fetchAvailableCourses = async () => {
    if (!unitSelection) return;

    try {
      setCoursesLoading(true);
      
      const params = unitSelection.type === 'unite' 
        ? { uniteId: unitSelection.id }
        : { moduleId: unitSelection.id };

      const response = await NewApiService.getStudentCourses(params);

      if (response.success && response.data?.courses) {
        setAvailableCourses(response.data.courses);
      } else {
        console.warn('No courses found or invalid response structure');
        setAvailableCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      toast.error('Erreur lors du chargement des cours');
      setAvailableCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleCourseToggle = (courseId: number) => {
    // Check if course is already being tracked in another suivi
    const isTrackedElsewhere = suiviCoursStorage.isCourseTracked(courseId);
    if (isTrackedElsewhere) {
      const trackerInfo = suiviCoursStorage.getTrackerForCourse(courseId);
      toast.error(`Ce cours est déjà suivi dans le tracker "${trackerInfo?.trackerTitle || 'un autre tracker'}"`);
      return;
    }

    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const handleSelectAll = () => {
    const filteredCourses = getFilteredCourses();
    const allSelected = filteredCourses.every(course => selectedCourses.has(course.id));
    
    const newSelected = new Set(selectedCourses);
    filteredCourses.forEach(course => {
      if (allSelected) {
        newSelected.delete(course.id);
      } else {
        newSelected.add(course.id);
      }
    });
    setSelectedCourses(newSelected);
  };

  const getFilteredCourses = () => {
    if (!searchTerm) return availableCourses;
    
    return availableCourses.filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.module?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    try {
      setLoading(true);

      const createRequest: CardCreateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        courseIds: Array.from(selectedCourses)
      };

      const response = await NewApiService.createCard(createRequest);

      console.log('📋 [TrackerCreateDialog] Create card response:', {
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
          console.log('✅ [TrackerCreateDialog] Redirecting to tracker:', trackerId);

          // Save tracked courses to localStorage
          try {
            suiviCoursStorage.addTrackedCourses(
              trackerId,
              title.trim(),
              Array.from(selectedCourses)
            );
          } catch (error) {
            console.error('Failed to save tracked courses to localStorage:', error);
            // Don't block the success flow for localStorage errors
          }

          toast.success('Suivi de cours créé avec succès');

          // Reset form
          setTitle('');
          setDescription('');
          setSelectedCourses(new Set());
          setSearchTerm('');

          onOpenChange(false);

          // Redirect to the tracker page
          router.push(`/student/suivi-cours/tracker/${trackerId}`);

          // Call onSuccess with the tracker ID for any additional handling
          onSuccess?.(trackerId);
        } else {
          // Handle case where creation was successful but no ID was returned
          console.error('❌ [TrackerCreateDialog] Tracker created but no ID returned:', {
            response,
            dataExists: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : 'no data',
            nestedDataExists: !!response.data?.data,
            nestedDataKeys: response.data?.data ? Object.keys(response.data.data) : 'no nested data',
            actualData,
            actualDataKeys: actualData ? Object.keys(actualData) : 'no actual data'
          });
          toast.error('Suivi créé mais impossible de rediriger. Veuillez vérifier la liste des suivis.');
          onOpenChange(false);
          onSuccess?.();
        }
      } else {
        console.error('❌ [TrackerCreateDialog] Create card failed:', response);
        throw new Error(response.error || 'Failed to create tracker');
      }
    } catch (err) {
      console.error('Error creating tracker:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du suivi';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = getFilteredCourses();
  const selectedCount = selectedCourses.size;
  const allFilteredSelected = filteredCourses.length > 0 && 
    filteredCourses.every(course => selectedCourses.has(course.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Créer un nouveau suivi de cours</span>
          </DialogTitle>
          <DialogDescription>
            {unitSelection && (
              <span>
                Pour {unitSelection.type === 'unite' ? 'l\'unité' : 'le module'}: {unitSelection.name}
                {unitSelection.uniteName && unitSelection.type === 'module' && (
                  <span className="text-muted-foreground"> ({unitSelection.uniteName})</span>
                )}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
          {/* Basic Information */}
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
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Course Selection */}
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Sélection des cours</h3>
                {selectedCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {selectedCount} sélectionné{selectedCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              {filteredCourses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {allFilteredSelected ? 'Désélectionner tout' : 'Sélectionner tout'}
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher des cours..."
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Course List */}
            <div className="flex-1 overflow-auto border border-border rounded-lg">
              {coursesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <LoadingSpinner size="md" />
                  <span className="ml-3 text-muted-foreground">Chargement des cours...</span>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Aucun cours trouvé pour cette recherche' : 'Aucun cours disponible'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredCourses.map((course) => {
                    const isTrackedElsewhere = suiviCoursStorage.isCourseTracked(course.id);
                    const trackerInfo = isTrackedElsewhere ? suiviCoursStorage.getTrackerForCourse(course.id) : null;
                    const isDisabled = isTrackedElsewhere;

                    return (
                      <TooltipProvider key={course.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                                isDisabled
                                  ? "opacity-60 cursor-not-allowed bg-muted/20 border-muted"
                                  : "cursor-pointer",
                                !isDisabled && selectedCourses.has(course.id)
                                  ? "bg-primary/10 border-primary/30"
                                  : !isDisabled && "bg-background border-border hover:bg-muted/50"
                              )}
                              onClick={() => !isDisabled && handleCourseToggle(course.id)}
                            >
                        <Checkbox
                          checked={selectedCourses.has(course.id)}
                          onChange={() => !isDisabled && handleCourseToggle(course.id)}
                          disabled={isDisabled}
                          className="size-5 border-2 transition-all duration-200 shadow-sm hover:shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "font-medium truncate",
                              isDisabled ? "text-muted-foreground" : "text-foreground"
                            )}>
                              {course.name}
                            </h4>
                            {isDisabled && (
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                Déjà suivi
                              </span>
                            )}
                          </div>
                          {course.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {course.description}
                            </p>
                          )}
                          {course.module && (
                            <p className="text-xs text-muted-foreground">
                              Module: {course.module.name}
                            </p>
                          )}
                          {isDisabled && trackerInfo && (
                            <p className="text-xs text-muted-foreground italic">
                              Dans: {trackerInfo.trackerTitle}
                            </p>
                          )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      {isDisabled && (
                        <TooltipContent>
                          <p>Ce cours est déjà suivi dans le tracker "{trackerInfo?.trackerTitle}"</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
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
                Créer le suivi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
