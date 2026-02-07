import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  QuestionFiltersResponse,
  BulkQuestionImportPayload,
  BulkQuestionImportResponse,
  HierarchyData,
  SelectionState,
  University,
  Unit,
  Module,
  IndependentModule,
  Course,
  ImportProgress,
  ImportWizardStep,
  StudyPack
} from '@/types/question-import';
import { apiClient } from '@/lib/api-client';
import { UniversityService } from '@/lib/api-services';

// Extended StudyPack type with unites
type ExtendedStudyPack = StudyPack & {
  unites?: Array<{
    id: number;
    name: string;
    description: string;
    logoUrl?: string;
    modules?: Array<{
      id: number;
      name: string;
      description: string;
      courses?: Array<{
        id: number;
        name: string;
        description: string;
      }>;
    }>;
  }>;
};

export function useQuestionImport() {
  const [loading, setLoading] = useState(false);
  const [filtersData, setFiltersData] = useState<QuestionFiltersResponse | null>(null);
  const [studyPacksData, setStudyPacksData] = useState<ExtendedStudyPack[]>([]);
  const [selection, setSelection] = useState<SelectionState>({});
  const [progress, setProgress] = useState<ImportProgress>({
    step: 'selecting',
    message: 'Select hierarchy to begin import',
    progress: 0
  });

  // Fetch hierarchy filters data
  const fetchFilters = useCallback(async () => {
    setLoading(true);
    setProgress({
      step: 'selecting',
      message: 'Loading hierarchy data...',
      progress: 5
    });

    try {
      // Fetch content filters, study packs, and universities separately for better data freshness
      const [filtersResponse, studyPacksResponse, universitiesResponse] = await Promise.all([
        apiClient.get<QuestionFiltersResponse['data']>('/admin/content/filters'),
        apiClient.get<{ studyPacks: StudyPack[] }>('/admin/study-packs'),
        UniversityService.getUniversities()
      ]);

      // Check validity of both responses
      // Cast to any to access potential data properties for validation
      const filtResp = filtersResponse as any;
      const isFiltersValid = filtResp?.success || filtResp?.filters || filtResp?.unites || filtResp?.data?.filters || filtResp?.data?.unites;
      // Cast to any to access 'items' which isn't in the strict ApiResponse type
      const univResp = universitiesResponse as any;
      // Universities response is valid if it has success=true OR if it has items array (canonical paginated)
      const isUniversitiesValid = univResp?.success || (univResp?.items && Array.isArray(univResp.items));

      if (isFiltersValid && isUniversitiesValid) {
        // Extract universities from various possible structures
        let universitiesData: any[] = [];

        if (Array.isArray(univResp?.items)) {
          // Canonical paginated response: { items: [...], total: ... }
          universitiesData = univResp.items;
        } else if (Array.isArray(univResp?.data?.universities)) {
          // Nested response: { success: true, data: { universities: [...] } }
          universitiesData = univResp.data.universities;
        } else if (Array.isArray(univResp?.data)) {
          // Direct array in data: { success: true, data: [...] }
          universitiesData = univResp.data;
        }

        // Log the university data for debugging
        console.log('🏫 [useQuestionImport] Fresh university data:', {
          count: universitiesData.length,
          universities: universitiesData.map(u => ({ id: u.id, name: u.name, country: u.country }))
        });

        // Handle potential flat structure of filtersResponse
        const filtersSrc = (filtersResponse?.data && typeof filtersResponse.data === 'object' && 'filters' in (filtersResponse.data as any))
          ? filtersResponse.data
          : filtersResponse;

        const filtersObj = (filtersSrc as any)?.filters || {};

        // Merge the fresh university data with the filters data
        const filtersData: QuestionFiltersResponse = {
          success: true,
          data: {
            ...filtersSrc,
            filters: {
              ...filtersObj,
              // Use fresh university data from the dedicated endpoint
              universities: universitiesData
            } as any
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substring(7)
          }
        };

        // Validate the data structure - handle both single and double-nested responses
        const hasValidStructure = filtersData.data && (
          (filtersData.data as any).data || // Double-nested structure
          (filtersData.data as any).filters || // Single-nested with filters
          (filtersData.data as any).unites !== undefined || // Direct structure
          (filtersData.data as any).independentModules !== undefined
        );

        if (!hasValidStructure) {
          console.error('🚨 [useQuestionImport] Invalid API response structure:', filtersData);
          toast.error('Invalid API response structure. Please contact support.');
          setProgress({
            step: 'error',
            message: 'Invalid API response structure',
            progress: 0,
            error: 'API returned unexpected data format'
          });
          return;
        }

        // Debug: Log the data structure to understand what we're getting
        console.log('🔍 [useQuestionImport] API Response Structure:', {
          hasData: !!filtersData.data,
          hasNestedData: !!(filtersData.data && (filtersData.data as any).data),
          hasFilters: !!(filtersData.data && (filtersData.data as any).filters),
          hasUnites: !!(filtersData.data && (filtersData.data as any).unites),
          hasIndependentModules: !!(filtersData.data && (filtersData.data as any).independentModules),
          nestedUnites: !!(filtersData.data && (filtersData.data as any).data && (filtersData.data as any).data.unites),
          nestedIndependentModules: !!(filtersData.data && (filtersData.data as any).data && (filtersData.data as any).data.independentModules),
          unitesCount: (filtersData.data as any)?.unites?.length || (filtersData.data as any)?.data?.unites?.length || 0,
          independentModulesCount: (filtersData.data as any)?.independentModules?.length || (filtersData.data as any)?.data?.independentModules?.length || 0
        });

        setFiltersData(filtersData);
      } else {
        console.error('🚨 [useQuestionImport] Failed to fetch data:', {
          filtersSuccess: filtersResponse?.success,
          universitiesValid: isUniversitiesValid,
          filtersError: filtersResponse?.error,
          universitiesError: (universitiesResponse as any)?.error
        });

        // If universities failed but filters succeeded, still set filters data with empty universities
        if (filtersResponse?.success) {
          const filtersData: QuestionFiltersResponse = {
            success: true,
            data: filtersResponse.data,
            meta: {
              timestamp: new Date().toISOString(),
              requestId: Math.random().toString(36).substring(7)
            }
          };
          setFiltersData(filtersData);
          toast.error('Failed to load universities. Please refresh the page.');
        }
      }

      // Handle study packs response (support both standard API response and canonical paginated response)
      const spResp = studyPacksResponse as any;
      if (spResp?.success && spResp?.data?.studyPacks) {
        setStudyPacksData(spResp.data.studyPacks);
      } else if (spResp?.items && Array.isArray(spResp.items)) {
        setStudyPacksData(spResp.items);
      }

      setProgress({
        step: 'selecting',
        message: 'Ready to select hierarchy',
        progress: 10
      });
    } catch (error) {
      let errorMessage = 'Failed to fetch hierarchy data';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error('Filter fetch error:', error);
      toast.error(`Unable to load hierarchy data: ${errorMessage}`);
      setProgress({
        step: 'error',
        message: 'Failed to load hierarchy data',
        progress: 0,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Process hierarchy data for progressive selection
  const hierarchyData = useMemo<HierarchyData>(() => {
    if (!filtersData) {
      return {
        universities: [],
        studyPacks: [],
        examYears: [],
        units: [],
        modules: [],
        independentModules: [],
        courses: []
      };
    }

    // Handle the double-nested response structure: data.data.{unites, independentModules}
    const innerData = (filtersData.data as any).data || filtersData.data || {};
    const { unites = [], independentModules = [] } = innerData;

    // For backward compatibility, try to get filters from various possible locations
    const filtersData_inner = filtersData.data.filters || innerData.filters || {};
    const { courses = [], universities = [], examYears = [] } = filtersData_inner;

    // Debug: Log what data we extracted
    console.log('🔍 [useQuestionImport] Extracted Data:', {
      unitesCount: unites.length,
      independentModulesCount: independentModules.length,
      coursesCount: courses.length,
      universitiesCount: universities.length,
      examYearsCount: examYears.length,
      sampleIndependentModule: independentModules[0] ? {
        id: independentModules[0].id,
        name: independentModules[0].name,
        studyPackId: independentModules[0].studyPackId
      } : null
    });

    // Extract unique units from study packs (not from courses)
    const unitsMap = new Map<number, Unit>();
    const modulesMap = new Map<number, Module>();

    // First, process units directly from the API response (unites array)
    if (unites && Array.isArray(unites)) {
      console.log('🔍 [useQuestionImport] Processing unites array:', unites.length);
      unites.forEach(unit => {
        if (!unitsMap.has(unit.id)) {
          // Add unit to map with proper structure
          unitsMap.set(unit.id, {
            id: unit.id,
            studyPackId: unit.studyPackId || unit.studyPack?.id,
            name: unit.name,
            description: unit.description,
            logoUrl: unit.logoUrl,
            createdAt: unit.createdAt || new Date().toISOString(),
            updatedAt: unit.updatedAt || new Date().toISOString(),
            modules: unit.modules // Keep the nested modules structure
          });
        }

        // Also extract modules from units
        if (unit.modules && Array.isArray(unit.modules)) {
          console.log(`🔍 [useQuestionImport] Processing ${unit.modules.length} modules for unit ${unit.name}`);
          unit.modules.forEach(module => {
            if (!modulesMap.has(module.id)) {
              modulesMap.set(module.id, {
                id: module.id,
                uniteId: unit.id,
                name: module.name,
                description: module.description,
                createdAt: module.createdAt || new Date().toISOString(),
                updatedAt: module.updatedAt || new Date().toISOString(),
                unite: {
                  id: unit.id,
                  studyPackId: unit.studyPackId || unit.studyPack?.id,
                  name: unit.name,
                  description: unit.description,
                  logoUrl: unit.logoUrl,
                  createdAt: unit.createdAt || new Date().toISOString(),
                  updatedAt: unit.updatedAt || new Date().toISOString()
                }
              });
            }
          });
        }
      });
    }

    // Get units from study packs data (for backward compatibility and linkage)
    if (studyPacksData && Array.isArray(studyPacksData)) {
      studyPacksData.forEach(studyPack => {
        if (studyPack.unites && Array.isArray(studyPack.unites)) {
          studyPack.unites.forEach(unit => {
            const existingUnit = unitsMap.get(unit.id);

            if (existingUnit) {
              // If unit exists (from filters), but lacks studyPackId, update it
              if (!existingUnit.studyPackId) {
                console.log(`🔍 [useQuestionImport] Linking orphaned unit ${unit.id} to study pack ${studyPack.id}`);
                unitsMap.set(unit.id, {
                  ...existingUnit,
                  studyPackId: studyPack.id
                });

                // Also update the nested modules in modulesMap to link to this unit
                if (existingUnit.modules) {
                  existingUnit.modules.forEach(m => {
                    const mod = modulesMap.get(m.id);
                    if (mod && mod.unite) {
                      mod.unite.studyPackId = studyPack.id;
                    }
                  });
                }
              }
            } else {
              // Convert StudyPackUnit to Unit format
              unitsMap.set(unit.id, {
                id: unit.id,
                studyPackId: studyPack.id,
                name: unit.name,
                description: unit.description,
                logoUrl: unit.logoUrl,
                createdAt: new Date().toISOString(), // Fallback
                updatedAt: new Date().toISOString()  // Fallback
              });
            }

            // Also extract modules from units
            if (unit.modules && Array.isArray(unit.modules)) {
              unit.modules.forEach(module => {
                if (!modulesMap.has(module.id)) {
                  modulesMap.set(module.id, {
                    id: module.id,
                    uniteId: unit.id,
                    name: module.name,
                    description: module.description,
                    createdAt: new Date().toISOString(), // Fallback
                    updatedAt: new Date().toISOString(), // Fallback
                    unite: {
                      id: unit.id,
                      studyPackId: studyPack.id,
                      name: unit.name,
                      description: unit.description,
                      logoUrl: unit.logoUrl,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    // Also extract modules from courses (for backward compatibility)
    if (courses && Array.isArray(courses)) {
      courses.forEach(course => {
        if (course && course.module && course.module.unite) {
          const module = course.module;
          const unit = module.unite;

          if (!unitsMap.has(unit.id)) {
            unitsMap.set(unit.id, unit);
          }

          if (!modulesMap.has(module.id)) {
            modulesMap.set(module.id, module);
          }
        }
      });
    }

    const result = {
      universities,
      studyPacks: studyPacksData,
      examYears,
      units: Array.from(unitsMap.values()),
      modules: Array.from(modulesMap.values()),
      independentModules: independentModules.map(im => ({
        ...im,
        studyPackId: im.studyPackId || im.studyPack?.id
      })),
      courses
    };

    console.log('🔍 [useQuestionImport] Final hierarchyData:', {
      unitsCount: result.units.length,
      modulesCount: result.modules.length,
      independentModulesCount: result.independentModules.length,
      coursesCount: result.courses.length,
      sampleUnit: result.units[0] ? {
        id: result.units[0].id,
        name: result.units[0].name,
        modulesCount: result.units[0].modules?.length || 0
      } : null,
      sampleModule: result.modules[0] ? {
        id: result.modules[0].id,
        name: result.modules[0].name,
        uniteId: result.modules[0].uniteId
      } : null
    });

    return result;
  }, [filtersData, studyPacksData]);

  // Get filtered options based on current selection
  const getAvailableOptions = useCallback(() => {
    if (!filtersData) return { universities: [], studyPacks: [], examYears: [], units: [], modules: [], independentModules: [], courses: [] };

    const { courses } = filtersData.data.filters;

    // Filter based on current selection
    let filteredCourses = courses || [];
    let filteredStudyPacks = hierarchyData.studyPacks || [];
    let filteredUnits = hierarchyData.units || [];
    let filteredIndependentModules = hierarchyData.independentModules || [];

    // Filter study packs by university (if there's a relationship)
    if (selection.university) {
      // For now, show all study packs since there's no direct university-studypack relationship in the API
      filteredStudyPacks = hierarchyData.studyPacks;
    }

    // Filter units and independent modules by study pack
    if (selection.studyPack) {
      filteredUnits = hierarchyData.units.filter(unit =>
        unit.studyPackId === selection.studyPack!.id ||
        unit.studyPackId === undefined ||
        unit.studyPackId === null
      );
      filteredIndependentModules = hierarchyData.independentModules.filter(module =>
        module.studyPackId === selection.studyPack!.id ||
        module.studyPackId === undefined ||
        module.studyPackId === null
      );
    }

    if (selection.unit) {
      filteredCourses = filteredCourses.filter(course =>
        course.module.unite.id === selection.unit!.id
      );
    }

    if (selection.module) {
      console.log('🔍 [getAvailableOptions] Module selected:', {
        moduleId: selection.module.id,
        moduleName: selection.module.name,
        totalModulesInHierarchy: hierarchyData.modules.length,
        totalUnitsInHierarchy: hierarchyData.units.length
      });

      // Get courses directly from the selected module
      // First, try to find the module in the hierarchyData
      const selectedModule = hierarchyData.modules.find(module => module.id === selection.module!.id);

      console.log('🔍 [getAvailableOptions] Found selected module in hierarchy:', {
        found: !!selectedModule,
        selectedModule: selectedModule ? {
          id: selectedModule.id,
          name: selectedModule.name,
          uniteId: selectedModule.unite?.id
        } : null
      });

      if (selectedModule && selectedModule.unite) {
        // Find the unit that contains this module
        const parentUnit = hierarchyData.units.find(unit => unit.id === selectedModule.unite.id);

        console.log('🔍 [getAvailableOptions] Found parent unit:', {
          found: !!parentUnit,
          parentUnit: parentUnit ? {
            id: parentUnit.id,
            name: parentUnit.name,
            modulesCount: parentUnit.modules?.length || 0
          } : null
        });

        if (parentUnit && parentUnit.modules) {
          // Find the module within the unit's modules array (which contains courses)
          const moduleWithCourses = parentUnit.modules.find(module => module.id === selection.module!.id);

          console.log('🔍 [getAvailableOptions] Found module with courses:', {
            found: !!moduleWithCourses,
            moduleWithCourses: moduleWithCourses ? {
              id: moduleWithCourses.id,
              name: moduleWithCourses.name,
              coursesCount: moduleWithCourses.courses?.length || 0,
              sampleCourse: moduleWithCourses.courses?.[0]
            } : null
          });

          if (moduleWithCourses && moduleWithCourses.courses) {
            // Convert the nested course structure to match the expected Course interface
            filteredCourses = moduleWithCourses.courses.map(course => ({
              id: course.id,
              moduleId: selection.module!.id,
              name: course.name,
              description: course.description,
              createdAt: new Date().toISOString(), // Fallback
              updatedAt: new Date().toISOString(), // Fallback
              module: selectedModule
            }));

            console.log('🔍 [getAvailableOptions] Mapped courses from module:', {
              coursesCount: filteredCourses.length,
              sampleMappedCourse: filteredCourses[0]
            });
          } else {
            console.log('🔍 [getAvailableOptions] No courses in module, using fallback filter');
            // Fallback: filter from the original courses array
            filteredCourses = filteredCourses.filter(course =>
              course.module && course.module.id === selection.module!.id
            );
          }
        }
      } else {
        console.log('🔍 [getAvailableOptions] Module not found in hierarchy, using fallback filter');
        // Fallback: filter from the original courses array
        filteredCourses = filteredCourses.filter(course =>
          course.module && course.module.id === selection.module!.id
        );
      }
    }

    // Handle independent module selection for courses
    if (selection.independentModule) {
      // For independent modules, we need to get courses directly from the module
      // Since the courses array from filters might not include independent module courses
      filteredCourses = selection.independentModule.courses.map(course => ({
        ...course,
        moduleId: selection.independentModule!.id,
        createdAt: selection.independentModule!.createdAt,
        updatedAt: selection.independentModule!.updatedAt,
        module: {
          id: selection.independentModule!.id,
          uniteId: null, // Independent modules don't have a unit
          name: selection.independentModule!.name,
          description: selection.independentModule!.description,
          createdAt: selection.independentModule!.createdAt,
          updatedAt: selection.independentModule!.updatedAt,
          unite: null as any // Independent modules don't have a unit
        }
      }));
    }

    // Extract available modules from filtered courses
    let availableModules = hierarchyData.modules;

    if (selection.unit) {
      // Filter modules that belong to the selected unit
      availableModules = hierarchyData.modules.filter(module =>
        module.unite && module.unite.id === selection.unit!.id
      );

      // If no modules found in hierarchyData, try to get them from the unit's modules directly
      if (availableModules.length === 0 && selection.unit.modules) {
        availableModules = selection.unit.modules.map(module => ({
          id: module.id,
          uniteId: selection.unit!.id,
          name: module.name,
          description: module.description,
          createdAt: module.createdAt || new Date().toISOString(),
          updatedAt: module.updatedAt || new Date().toISOString(),
          unite: {
            id: selection.unit!.id,
            studyPackId: selection.unit!.studyPackId,
            name: selection.unit!.name,
            description: selection.unit!.description,
            logoUrl: selection.unit!.logoUrl,
            createdAt: selection.unit!.createdAt,
            updatedAt: selection.unit!.updatedAt
          }
        }));
      }
    }

    const result = {
      universities: hierarchyData.universities,
      studyPacks: filteredStudyPacks,
      examYears: hierarchyData.examYears,
      units: filteredUnits,
      modules: availableModules,
      independentModules: filteredIndependentModules,
      courses: filteredCourses
    };

    // Debug: Log available options
    console.log('🔍 [useQuestionImport] Available Options:', {
      currentStep: selection.studyPack ? 'after-studypack' : 'before-studypack',
      selectedStudyPackId: selection.studyPack?.id,
      selectedUnitId: selection.unit?.id,
      selectedUnitName: selection.unit?.name,
      unitesCount: result.units.length,
      modulesCount: result.modules.length,
      totalHierarchyModules: hierarchyData.modules.length,
      independentModulesCount: result.independentModules.length,
      totalHierarchyIndependentModules: hierarchyData.independentModules.length,
      sampleModule: result.modules[0] ? {
        id: result.modules[0].id,
        name: result.modules[0].name,
        uniteId: result.modules[0].unite?.id,
        uniteName: result.modules[0].unite?.name
      } : null,
      sampleIndependentModule: result.independentModules[0] ? {
        id: result.independentModules[0].id,
        name: result.independentModules[0].name,
        studyPackId: result.independentModules[0].studyPackId
      } : null,
      allModulesInHierarchy: hierarchyData.modules.map(m => ({
        id: m.id,
        name: m.name,
        uniteId: m.unite?.id,
        uniteName: m.unite?.name
      }))
    });

    return result;
  }, [filtersData, selection, hierarchyData]);

  // Update selection and progress
  const updateSelection = useCallback((key: keyof SelectionState, value: any) => {
    setSelection(prev => {
      const newSelection = { ...prev, [key]: value };

      // Clear dependent selections
      if (key === 'university') {
        delete newSelection.studyPack;
        delete newSelection.unit;
        delete newSelection.module;
        delete newSelection.independentModule;
        delete newSelection.course;
      } else if (key === 'studyPack') {
        delete newSelection.unit;
        delete newSelection.module;
        delete newSelection.independentModule;
        delete newSelection.course;
      } else if (key === 'unit') {
        delete newSelection.module;
        delete newSelection.independentModule;
        delete newSelection.course;
      } else if (key === 'module') {
        delete newSelection.independentModule;
        delete newSelection.course;
      } else if (key === 'independentModule') {
        delete newSelection.unit;
        delete newSelection.module;
        delete newSelection.course;
      }

      return newSelection;
    });

    // Update progress based on selection completeness
    const progressValue = calculateSelectionProgress({ ...selection, [key]: value });
    setProgress(prev => ({
      ...prev,
      progress: progressValue,
      message: getProgressMessage(progressValue)
    }));
  }, [selection]);

  // Calculate selection progress
  const calculateSelectionProgress = useCallback((currentSelection: SelectionState): number => {
    let progress = 10; // Base progress for loading filters

    if (currentSelection.university) progress += 15;
    if (currentSelection.studyPack) progress += 15;

    // Either unit+module OR independent module path
    if (currentSelection.unit) progress += 15;
    if (currentSelection.module) progress += 15;
    if (currentSelection.independentModule) progress += 30; // Independent module replaces unit+module

    if (currentSelection.course) progress += 30; // Course selection is most important

    return progress;
  }, []);

  // Get progress message
  const getProgressMessage = useCallback((progressValue: number): string => {
    if (progressValue <= 10) return 'Select hierarchy to begin import';
    if (progressValue <= 25) return 'Continue selecting hierarchy...';
    if (progressValue <= 55) return 'Almost there, select remaining options...';
    if (progressValue <= 85) return 'Ready to import questions';
    return 'All selections complete, ready for JSON input';
  }, []);

  // Generate wizard steps
  const wizardSteps = useMemo<ImportWizardStep[]>(() => {
    const progressValue = calculateSelectionProgress(selection);

    return [
      {
        id: 'university',
        title: 'University',
        description: 'Select target university',
        completed: !!selection.university,
        active: !selection.university && progressValue >= 10
      },
      {
        id: 'examYear',
        title: 'Exam Year',
        description: 'Choose exam year',
        completed: !!selection.examYear,
        active: !!selection.university && !selection.examYear
      },
      {
        id: 'unit',
        title: 'Unit',
        description: 'Select study unit',
        completed: !!selection.unit,
        active: !!selection.examYear && !selection.unit
      },
      {
        id: 'module',
        title: 'Module',
        description: 'Choose module',
        completed: !!selection.module,
        active: !!selection.unit && !selection.module
      },
      {
        id: 'course',
        title: 'Course',
        description: 'Select target course',
        completed: !!selection.course,
        active: !!selection.module && !selection.course
      },
      {
        id: 'import',
        title: 'Import',
        description: 'Add questions JSON',
        completed: progress.step === 'completed',
        active: !!selection.course && progress.step !== 'completed'
      }
    ];
  }, [selection, progress.step, calculateSelectionProgress]);

  // Bulk import questions
  const importQuestions = useCallback(async (
    questions: any[],
    additionalMetadata?: { examYear?: number; sourceId?: number; rotation?: string }
  ): Promise<BulkQuestionImportResponse | null> => {
    // Import is always allowed - proceed with whatever data is provided

    const questionCount = questions?.length || 0;
    setProgress({
      step: 'importing',
      message: `Importing ${questionCount} questions...`,
      progress: 85
    });

    try {
      const payload: BulkQuestionImportPayload = {
        metadata: {
          courseId: selection.course?.id || 1, // Default to course ID 1 if not selected
          universityId: selection.university?.id,
          examYear: additionalMetadata?.examYear || selection.examYear,
          sourceId: additionalMetadata?.sourceId,
          rotation: additionalMetadata?.rotation
        },
        questions: questions || []
      };

      // Add a small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress({
        step: 'importing',
        message: 'Processing questions...',
        progress: 95
      });

      const response = await apiClient.post<BulkQuestionImportResponse['data']>('/admin/questions/bulk', payload);

      if (response.success) {
        const result: BulkQuestionImportResponse = {
          success: true,
          data: response.data
        };

        setProgress({
          step: 'completed',
          message: `Successfully imported ${response.data.totalCreated} questions`,
          progress: 100
        });

        toast.success("Questions imported successfully.");
        return result;
      } else {
        throw new Error(response.error || 'Failed to import questions');
      }
    } catch (error) {
      let errorMessage = 'Failed to import questions';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error('Import error:', error);

      setProgress({
        step: 'error',
        message: 'Import failed',
        progress: 85,
        error: errorMessage
      });

      toast.error(`Import failed: ${errorMessage}`);
      return null;
    }
  }, [selection]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setSelection({});
    setProgress({
      step: 'selecting',
      message: 'Select hierarchy to begin import',
      progress: 10
    });
  }, []);

  // Check if ready for import
  const isReadyForImport = useMemo(() => {
    return !!(selection.university && selection.examYear && selection.unit && selection.module && selection.course);
  }, [selection]);

  return {
    loading,
    filtersData,
    hierarchyData,
    selection,
    progress,
    wizardSteps,
    isReadyForImport,
    fetchFilters,
    updateSelection,
    getAvailableOptions,
    importQuestions,
    resetWizard
  };
}
