'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminQuestionFilters } from '@/types/api';
import { AdminService } from '@/lib/api-services';
import { toast } from 'sonner';

interface QuestionFiltersProps {
  filters: AdminQuestionFilters;
  onFiltersChange: (filters: Partial<AdminQuestionFilters>) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
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

interface Unit {
  id: number;
  name: string;
  studyPack: {
    id: number;
    name: string;
    yearNumber: string;
    type: string;
  };
  modules: Module[];
}

interface Module {
  id: number;
  name: string;
  unitId?: number;
  studyPack?: {
    id: number;
    name: string;
    yearNumber: string;
    type: string;
  };
  courses: Course[];
}

interface Course {
  id: number;
  name: string;
  description: string;
  moduleId?: number;
}

interface Source {
  id: number;
  name: string;
}

export default function QuestionFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  hasFilters,
}: QuestionFiltersProps) {
  // State for filter options
  const [universities, setUniversities] = useState<University[]>([]);
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [independentModules, setIndependentModules] = useState<Module[]>([]);
  const [sources, setSources] = useState<Source[]>([]);

  // State for cascading selections
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  // Loading and error states
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load filter data on mount
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        setLoadingData(true);
        setError(null);

        // Load all filter data in parallel
        const [
          universitiesResponse,
          studyPacksResponse,
          contentResponse,
          filtersResponse,
          sourcesResponse
        ] = await Promise.all([
          AdminService.getUniversitiesForQuestions(),
          AdminService.getStudyPacksForQuestions(),
          AdminService.getQuestionContentFilters(),
          AdminService.getQuestionFilters(),
          AdminService.getQuestionSources({ page: 1, limit: 100 })
        ]);

        // Set universities
        if (universitiesResponse.success && universitiesResponse.data?.universities) {
          setUniversities(universitiesResponse.data.universities);
        }

        // Set study packs
        if (studyPacksResponse.success && studyPacksResponse.data?.studyPacks) {
          setStudyPacks(studyPacksResponse.data.studyPacks);
        }

        // Set hierarchical content (units and independent modules)
        if (contentResponse.success && contentResponse.data) {
          const unitsData = contentResponse.data.unites || [];
          const independentModulesData = contentResponse.data.independentModules || [];

          setUnits(unitsData);
          setIndependentModules(independentModulesData);
        } else {
          throw new Error('Impossible de charger les filtres.');
        }


        // Set sources (if available)
        if (sourcesResponse.success && sourcesResponse.data?.questionSources) {
          setSources(sourcesResponse.data.questionSources);
        }

      } catch (error) {
        console.error('Failed to load filter data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Impossible de charger les filtres.';
        setError(errorMessage);
        toast.error('Erreur', {
          description: errorMessage,
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadFilterData();
  }, []);

  // Map Year Level to Study Pack ID
  const getStudyPackIdFromYearLevel = (yearLevel: string | undefined): number | undefined => {
    if (!yearLevel) return undefined;
    const yearMap: Record<string, number> = {
      'ONE': 1,
      'TWO': 2,
      'THREE': 3,
      'FOUR': 4,
      'FIVE': 5,
      'SIX': 6,
      'SEVEN': 7
    };
    return yearMap[yearLevel];
  };

  // Update available units and independent modules when year level changes
  useEffect(() => {
    if (filters.yearLevel) {
      const studyPackId = getStudyPackIdFromYearLevel(filters.yearLevel);

      if (studyPackId) {
        // Filter units for this year
        const filteredUnits = units.filter(u => u.studyPack.id === studyPackId);
        setAvailableUnits(filteredUnits);

        // Filter independent modules for this year
        const filteredIndependentModules = independentModules.filter(m => m.studyPackId === studyPackId);
        setAvailableModules(filteredIndependentModules);
      } else {
        setAvailableUnits([]);
        setAvailableModules([]);
      }

      setAvailableCourses([]);
    } else {
      setAvailableUnits([]);
      setAvailableModules([]);
      setAvailableCourses([]);
    }
  }, [filters.yearLevel, units, independentModules]);

  // Update available modules when unit changes (modules within a unit)
  useEffect(() => {
    if (filters.unitId) {
      const selectedUnit = units.find(u => u.id === filters.unitId);
      if (selectedUnit) {
        // Show modules from the selected unit
        setAvailableModules(selectedUnit.modules);
      } else {
        setAvailableModules([]);
      }
      setAvailableCourses([]);
    } else if (filters.yearLevel && !filters.unitId) {
      // If year is selected but no unit, show independent modules for that year
      const studyPackId = getStudyPackIdFromYearLevel(filters.yearLevel);
      if (studyPackId) {
        const filteredIndependentModules = independentModules.filter(m => m.studyPackId === studyPackId);
        setAvailableModules(filteredIndependentModules);
      }
    }
  }, [filters.unitId, filters.yearLevel, units, independentModules]);

  // Update available courses when module changes
  useEffect(() => {
    if (filters.moduleId) {
      let selectedModule: Module | undefined;

      // Find module in units
      for (const unit of units) {
        const module = unit.modules.find(m => m.id === filters.moduleId);
        if (module) {
          selectedModule = module;
          break;
        }
      }

      // If not found in units, check independent modules
      if (!selectedModule) {
        selectedModule = independentModules.find(m => m.id === filters.moduleId);
      }

      setAvailableCourses(selectedModule?.courses || []);
    } else {
      setAvailableCourses([]);
    }
  }, [filters.moduleId, units, independentModules]);

  // Filter change handlers
  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value });
  };

  const handleYearLevelChange = (value: string) => {
    // When year changes, reset all hierarchy filters
    onFiltersChange({
      yearLevel: value === 'all' ? undefined : (value as AdminQuestionFilters['yearLevel']),
      unitId: undefined,
      moduleId: undefined,
      courseId: undefined
    });
  };

  const handleUnitChange = (value: string) => {
    // When unit changes, reset module and course
    onFiltersChange({
      unitId: value === 'all' ? undefined : parseInt(value),
      moduleId: undefined,
      courseId: undefined
    });
  };

  const handleModuleChange = (value: string) => {
    // When module changes, reset course
    onFiltersChange({
      moduleId: value === 'all' ? undefined : parseInt(value),
      courseId: undefined
    });
  };

  const handleCourseChange = (value: string) => {
    onFiltersChange({
      courseId: value === 'all' ? undefined : parseInt(value)
    });
  };

  const handleUniversityChange = (value: string) => {
    onFiltersChange({
      universityId: value === 'all' ? undefined : parseInt(value)
    });
  };

  const handleQuestionTypeChange = (value: string) => {
    onFiltersChange({
      questionType: value === 'all'
        ? undefined
        : (value as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE')
    });
  };

  const handleExamYearChange = (value: string) => {
    onFiltersChange({
      examYear: value === '' ? undefined : parseInt(value)
    });
  };

  const handleRotationChange = (value: string) => {
    onFiltersChange({
      rotation: value === 'all' ? undefined : (value as 'R1' | 'R2' | 'R3' | 'R4')
    });
  };

  const handleSourceChange = (value: string) => {
    onFiltersChange({
      sourceId: value === 'all' ? undefined : parseInt(value)
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      isActive: value === 'all' ? undefined : value === 'active'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.unitId) count++;
    if (filters.moduleId) count++;
    if (filters.courseId) count++;
    if (filters.universityId) count++;
    if (filters.questionType) count++;
    if (filters.yearLevel) count++;
    if (filters.examYear) count++;
    if (filters.rotation) count++;
    if (filters.sourceId) count++;
    if (filters.isActive !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Rechercher</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Rechercher dans le texte de la question ou l'explication..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            disabled={loadingData}
          />
        </div>
      </div>

      {/* Content Hierarchy Filters: Year → Unit/Independent Module → Module → Course */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Hiérarchie de Contenu</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

          {/* Year Level Filter - First in hierarchy */}
          <div className="space-y-2">
            <Label>Année</Label>
            <Select
              value={filters.yearLevel || 'all'}
              onValueChange={handleYearLevelChange}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Chargement..." : "Toutes les années"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les Années</SelectItem>
                <SelectItem value="ONE">Première Année</SelectItem>
                <SelectItem value="TWO">Deuxième Année</SelectItem>
                <SelectItem value="THREE">Troisième Année</SelectItem>
                <SelectItem value="FOUR">Quatrième Année</SelectItem>
                <SelectItem value="FIVE">Cinquième Année</SelectItem>
                <SelectItem value="SIX">Sixième Année</SelectItem>
                <SelectItem value="SEVEN">Septième Année</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unit Filter - Shows units for selected year */}
          <div className="space-y-2">
            <Label>Unité</Label>
            <Select
              value={filters.unitId?.toString() || 'all'}
              onValueChange={handleUnitChange}
              disabled={loadingData || !filters.yearLevel || availableUnits.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingData ? "Chargement..." :
                  !filters.yearLevel ? "Sélectionner une année d'abord" :
                  availableUnits.length === 0 ? "Aucune unité disponible" :
                  "Toutes les unités"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les Unités</SelectItem>
                {availableUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Module Filter - Shows modules from unit OR independent modules */}
          <div className="space-y-2">
            <Label>Module {filters.unitId ? '(de l\'unité)' : '(indépendant)'}</Label>
            <Select
              value={filters.moduleId?.toString() || 'all'}
              onValueChange={handleModuleChange}
              disabled={loadingData || !filters.yearLevel || availableModules.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingData ? "Chargement..." :
                  !filters.yearLevel ? "Sélectionner une année d'abord" :
                  availableModules.length === 0 ? "Aucun module disponible" :
                  "Tous les modules"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Modules</SelectItem>
                {availableModules.map((module) => (
                  <SelectItem key={module.id} value={module.id.toString()}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Filter - Shows courses from selected module */}
          <div className="space-y-2">
            <Label>Cours</Label>
            <Select
              value={filters.courseId?.toString() || 'all'}
              onValueChange={handleCourseChange}
              disabled={loadingData || !filters.moduleId || availableCourses.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingData ? "Chargement..." :
                  !filters.moduleId ? "Sélectionner un module d'abord" :
                  availableCourses.length === 0 ? "Aucun cours disponible" :
                  "Tous les cours"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Cours</SelectItem>
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

      {/* Other Filters */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Autres Filtres</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Exam Year Filter */}
          <div className="space-y-2">
            <Label htmlFor="examYear">Année d'Examen</Label>
            <Input
              id="examYear"
              type="number"
              placeholder="Ex: 2024"
              value={filters.examYear?.toString() || ''}
              onChange={(e) => handleExamYearChange(e.target.value)}
              disabled={loadingData}
              min="1900"
              max="2100"
            />
          </div>

          {/* University Filter */}
          <div className="space-y-2">
            <Label>Université</Label>
            <Select
              value={filters.universityId?.toString() || 'all'}
              onValueChange={handleUniversityChange}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Chargement..." : "Toutes les universités"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les Universités</SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={university.id.toString()}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question Type Filter */}
          <div className="space-y-2">
            <Label>Type de Question</Label>
            <Select
              value={filters.questionType || 'all'}
              onValueChange={handleQuestionTypeChange}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Chargement..." : "Tous les types"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Types</SelectItem>
                <SelectItem value="SINGLE_CHOICE">Choix Unique</SelectItem>
                <SelectItem value="MULTIPLE_CHOICE">Choix Multiple</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rotation Filter */}
          <div className="space-y-2">
            <Label>Rotation</Label>
            <Select
              value={filters.rotation || 'all'}
              onValueChange={handleRotationChange}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Chargement..." : "Toutes les rotations"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les Rotations</SelectItem>
                <SelectItem value="R1">R1</SelectItem>
                <SelectItem value="R2">R2</SelectItem>
                <SelectItem value="R3">R3</SelectItem>
                <SelectItem value="R4">R4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={filters.sourceId?.toString() || 'all'}
              onValueChange={handleSourceChange}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Chargement..." : "Toutes les sources"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les Sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id.toString()}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={
                filters.isActive === undefined
                  ? 'all'
                  : filters.isActive
                    ? 'active'
                    : 'inactive'
              }
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>


      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Filtres actifs:</span>

          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Recherche: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ search: '' })}
              />
            </Badge>
          )}

          {filters.unitId && (
            <Badge variant="secondary" className="gap-1">
              Unité: {units.find(u => u.id === filters.unitId)?.name || 'Inconnu'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ unitId: undefined })}
              />
            </Badge>
          )}

          {filters.moduleId && (
            <Badge variant="secondary" className="gap-1">
              Module: {
                (() => {
                  // Find module in units or independent modules
                  for (const unit of units) {
                    const module = unit.modules.find(m => m.id === filters.moduleId);
                    if (module) return module.name;
                  }
                  const independentModule = independentModules.find(m => m.id === filters.moduleId);
                  return independentModule?.name || 'Inconnu';
                })()
              }
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ moduleId: undefined })}
              />
            </Badge>
          )}

          {filters.courseId && (
            <Badge variant="secondary" className="gap-1">
              Cours: {availableCourses.find(c => c.id === filters.courseId)?.name || 'Inconnu'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ courseId: undefined })}
              />
            </Badge>
          )}

          {filters.universityId && (
            <Badge variant="secondary" className="gap-1">
              Université: {universities.find(u => u.id === filters.universityId)?.name || 'Inconnu'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ universityId: undefined })}
              />
            </Badge>
          )}

          {filters.questionType && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.questionType === 'SINGLE_CHOICE' ? 'Choix Unique' : 'Choix Multiple'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ questionType: undefined })}
              />
            </Badge>
          )}

          {filters.yearLevel && (
            <Badge variant="secondary" className="gap-1">
              Année: {filters.yearLevel}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ yearLevel: undefined })}
              />
            </Badge>
          )}

          {filters.examYear && (
            <Badge variant="secondary" className="gap-1">
              Année d'Examen: {filters.examYear}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ examYear: undefined })}
              />
            </Badge>
          )}

          {filters.rotation && (
            <Badge variant="secondary" className="gap-1">
              Rotation: {filters.rotation}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ rotation: undefined })}
              />
            </Badge>
          )}

          {filters.sourceId && (
            <Badge variant="secondary" className="gap-1">
              Source: {sources.find(s => s.id === filters.sourceId)?.name || `ID ${filters.sourceId}`}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ sourceId: undefined })}
              />
            </Badge>
          )}

          {filters.isActive !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Statut: {filters.isActive ? 'Actif' : 'Inactif'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ isActive: undefined })}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Clear Filters Button */}
      {hasFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Effacer Tous les Filtres ({activeFiltersCount})
          </Button>
        </div>
      )}
    </div>
  );
}

export type { QuestionFiltersProps };

export { QuestionFilters };
