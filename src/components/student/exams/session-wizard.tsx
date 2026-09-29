"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useContentFilters, useQuizSessionFilters } from '@/hooks/use-content-filters';
import { useUserSubscriptions, selectEffectiveActiveSubscription } from '@/hooks/use-subscription';
import { analyzeSessionCreationError, getUserErrorMessage } from '@/utils/session-error-handler';
import { NewApiService } from '@/lib/api/new-api-services';
import { primeQuizSession } from '@/hooks/use-quiz-api';
import { useYearLevel } from '@/hooks/use-year-level';
import { YearLevelSelector } from '@/components/student/shared/year-level-selector';
import { LoadingOverlay } from '@/components/loading-states/api-loading-states';
import { ApiErrorBoundary } from '@/components/error-handling/api-error-boundary';
import { toast } from 'sonner';
import { EmptyState } from "@/components/ui/empty-state";

// Imports for UI
import { Check, ChevronRight, Search, ChevronsUpDown, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import useMeasure from "react-use-measure";

export type ExamSessionPayload = {
  title: string;
  module?: string;
};

// Reusable Sheet Selector Component
interface SelectionOption {
  id: string | number;
  name: string;
  description?: string;
}

function SheetSelector({
  title,
  triggerLabel,
  value,
  options,
  onSelect,
  disabled,
  renderOption,
  headerSlot,
  loading = false,
  testId
}: {
  title: string;
  triggerLabel: string;
  value?: string | number;
  options: SelectionOption[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  renderOption?: (option: SelectionOption) => React.ReactNode;
  /** Shown under the title, above the search (e.g. the year choice) */
  headerSlot?: React.ReactNode;
  /** The options are being loaded */
  loading?: boolean;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOption = options.find((o) => String(o.id) === String(value));

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect("");
  };

  // Focus search input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearch("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={disabled ? undefined : setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          data-testid={testId}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto px-4 hover:bg-slate-50 transition-colors",
            !selectedOption && "text-muted-foreground"
          )}
        >
          <div className="flex flex-col items-start truncate relative top-[2px]">
            <span className={cn("text-sm", !selectedOption && "text-muted-foreground font-normal")}>
              {selectedOption ? selectedOption.name : triggerLabel}
            </span>
            {selectedOption && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold relative bottom-[2px]">
                Selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={0}
                className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center flex-shrink-0 cursor-pointer"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] flex flex-col px-0">
        <SheetHeader className="px-6 pb-2 pt-6 flex-shrink-0">
          <SheetTitle>{title}</SheetTitle>
          {headerSlot && <div className="mt-2">{headerSlot}</div>}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="relative flex-1 min-h-0 my-2">
          <ScrollArea className="h-full pr-3 ml-3">
            <div className="space-y-1 py-2 pr-1">
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading...
                </div>
              ) : filteredOptions.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={search ? "No results found" : "No options available"}
                  description={
                    search
                      ? "Try adjusting your search terms"
                      : "There are no items to select at this time."
                  }
                />
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = String(option.id) === String(value);
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleSelect(String(option.id))}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border flex-shrink-0",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </span>

                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-medium">
                          {option.name}
                        </span>
                        {(option.description || renderOption) && (
                          <span className="text-xs text-muted-foreground line-clamp-1 block">
                            {renderOption ? renderOption(option) : option.description}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </ScrollArea>
          {/* Top fade gradient */}
          <div className="pointer-events-none absolute top-0 left-0 right-3 h-4 bg-gradient-to-b from-background to-transparent z-10" />
          {/* Bottom fade gradient */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-3 h-4 bg-gradient-to-t from-background to-transparent z-10" />
        </div>

        <div className="flex-shrink-0 p-4 border-t">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ExamSessionWizard({
  onCancel,
}: {
  onCancel: () => void;
}) {
  const router = useRouter();

  // Step Management State
  const [direction, setDirection] = useState<number>(0);
  const [ref, bounds] = useMeasure();

  // Auto-generated title state
  const [generatedTitle, setGeneratedTitle] = useState<string>("");

  const [selectedModule, setSelectedModule] = useState<{
    id: number;
    name: string;
  } | undefined>(undefined);

  const [moduleOptions, setModuleOptions] = useState<Array<{
    id: number;
    name: string;
  }>>([]);

  // Exam session filters state
  const [examFilters, setExamFilters] = useState<any>(null);
  const [questionSources, setQuestionSources] = useState<Array<{ id: number; name: string; questionCount: number; examYears?: Array<{ year: number; questionCount: number }> }>>([]);
  const [examYears, setExamYears] = useState<Array<{ year: number; questionCount: number }>>([]);


  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);


  // Selection handlers
  const handleModuleSelection = (moduleId: string) => {
    // If empty string passed (cleared), clear selection
    if (!moduleId) {
      handleModuleDeselection();
      return;
    }
    const module = moduleOptions.find(m => String(m.id) === moduleId);
    if (module) {
      setSelectedModule(module);
      resetFilters();
    }
  };

  const handleModuleDeselection = () => {
    setSelectedModule(undefined);
    resetFilters();
  };

  const resetFilters = () => {
    setSelectedSource(undefined);
    setSelectedYear(undefined);
  };

  // Step 1 Logic: Get Content Structure
  const {
    yearLevel: detectedYearLevel,
    effectiveYearLevel,
    shouldApplyFilter,
    loading: yearLevelLoading
  } = useYearLevel();

  const [selectedYearLevel, setSelectedYearLevel] = React.useState<string | null>(null);
  const activeYearLevel = selectedYearLevel || effectiveYearLevel;
  // Wait for the student's year before loading modules, so only one tree is fetched
  const { filters: contentFilters, loading: contentLoading } = useContentFilters({
    yearLevel: activeYearLevel,
    enabled: !yearLevelLoading
  });

  // The page's year dropdown and the one in the module sheet share this state
  const handleYearLevelChange = (yearLevel: string | null) => {
    if (!yearLevel || yearLevel === activeYearLevel) return;
    setSelectedYearLevel(yearLevel);
    handleModuleDeselection();
  };

  // Sources and years of the chosen module (nothing to load before one is chosen)
  const { filters: sessionFilters, loading: sessionFiltersLoading } = useQuizSessionFilters({
    moduleId: selectedModule?.id,
    enabled: !!selectedModule
  });
  const { subscriptions } = useUserSubscriptions();

  // Build module options from all available modules
  React.useEffect(() => {
    if (!contentFilters) return;

    const modules: Array<{ id: number; name: string; description?: string }> = [];

    // Several unites (the Résidanat pack has one per study year): list them in year
    // order and show each module's unite, since names repeat across years
    const unites = [...(contentFilters.unites || [])];
    const severalUnites = unites.length > 1;
    if (severalUnites) {
      const rank = (name: string) => {
        const match = /^(\d+)/.exec(String(name || '').trim());
        return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
      };
      unites.sort((a: any, b: any) => rank(a.name) - rank(b.name));
    }

    // Add modules from unites
    unites.forEach((u: any) => {
      (u.modules || []).forEach((m: any) => {
        modules.push({ id: m.id, name: m.name, ...(severalUnites ? { description: u.name } : {}) });
      });
    });

    // Add independent modules
    (contentFilters.independentModules || []).forEach((m: any) => {
      modules.push({ id: m.id, name: m.name });
    });

    setModuleOptions(modules);
  }, [contentFilters]);

  // Load exam session filters
  React.useEffect(() => {
    if (sessionFilters) {
      setExamFilters(sessionFilters);
      setQuestionSources(sessionFilters.questionSources || []);

      const years = (sessionFilters.examYears || []).map((item: any) => {
        if (typeof item === 'object' && item !== null && 'year' in item) {
          return { year: item.year, questionCount: item.questionCount || 0 };
        }
        return { year: item as number, questionCount: 0 };
      });
      setExamYears(years);


    } else {
      setQuestionSources([]);
      setExamYears([]);
    }
  }, [sessionFilters]);

  // Years of the chosen source (each with its question count); before a source is
  // chosen, or from an API without per-source years, the module's years
  const selectedSourceFilters = questionSources.find(s => String(s.id) === selectedSource);
  const sourceYears: Array<{ year: number; questionCount: number }> = selectedSourceFilters?.examYears ?? examYears;

  // A year the newly chosen source does not have is cleared
  useEffect(() => {
    if (selectedYear && selectedYear !== 'ALL' && selectedSourceFilters?.examYears &&
      !selectedSourceFilters.examYears.some(y => String(y.year) === selectedYear)) {
      setSelectedYear(undefined);
    }
  }, [selectedSource, selectedSourceFilters, selectedYear]);

  // Questions in the exam: every question of the module, source and year
  const examQuestionCount: number | null = selectedSourceFilters
    ? (selectedYear && selectedYear !== 'ALL'
      ? (sourceYears.find(y => String(y.year) === selectedYear)?.questionCount ?? null)
      : selectedSourceFilters.questionCount)
    : null;

  // Auto-generate title
  const autoGenerateTitle = useCallback(() => {
    const parts: string[] = [];

    if (selectedModule) parts.push(selectedModule.name);

    const selectedSourceObj = questionSources.find(s => String(s.id) === selectedSource);
    if (selectedSourceObj) parts.push(selectedSourceObj.name);

    if (selectedYear && selectedYear !== 'ALL') parts.push(selectedYear);

    const title = parts.length > 0 ? parts.join(' - ') : '';
    setGeneratedTitle(title);
    return title;
  }, [selectedModule, questionSources, selectedSource, selectedYear]);

  useEffect(() => {
    autoGenerateTitle();
  }, [selectedModule, selectedSource, selectedYear, autoGenerateTitle]);

  // Extraction Logic
  const extractCourseIdsFromContentFilters = useCallback((): number[] => {
    if (!contentFilters || !selectedModule) return [];
    const courseIds: number[] = [];

    // Check modules within unites
    (contentFilters.unites || []).forEach((u: any) => {
      (u.modules || []).forEach((m: any) => {
        if (m.id === selectedModule.id) {
          m.courses?.forEach((course: any) => courseIds.push(course.id));
        }
      });
    });

    // Check independent modules
    (contentFilters.independentModules || []).forEach((m: any) => {
      if (m.id === selectedModule.id) {
        m.courses?.forEach((course: any) => courseIds.push(course.id));
      }
    });

    return [...new Set(courseIds)];
  }, [contentFilters, selectedModule]);

  // Actions
  const handleCreate = async () => {
    if (!selectedModule) {
      toast.error("Please select a Module.");
      return;
    }
    if (!selectedSource || selectedSource === 'ALL') {
      toast.error("Please select a Question Source.");
      return;
    }

    try {
      setLoading(true);
      const finalCourseIds = extractCourseIdsFromContentFilters();
      if (finalCourseIds.length === 0) {
        toast.error('No courses found for the selected module.');
        return;
      }

      const sessionTitle = (generatedTitle.trim() || `${selectedModule?.name || 'Custom'} Exam Session`).slice(0, 100);

      const sessionData = {
        title: sessionTitle,
        courseIds: finalCourseIds,
        sessionType: 'EXAM' as const,
        questionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'QROC'] as Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'>,
        years: (selectedYear && selectedYear !== 'ALL') ? [Number(selectedYear)] : undefined,
        questionSourceIds: [Number(selectedSource)]
      };

      const created = await NewApiService.createQuizSession(sessionData);

      if (!created || !created.success) {
        const errorDetails = analyzeSessionCreationError(created, 'EXAM');
        toast.error(getUserErrorMessage(errorDetails));
        return;
      }

      const sessionId = created?.data?.sessionId;
      if (sessionId) {
        // The new exam came back with the creation: the session page opens it at once
        primeQuizSession(sessionId, created?.data?.session);
        toast.success('Exam session created successfully');
        router.push(`/session/${sessionId}`);
      } else {
        toast.error('Session created but no sessionId returned');
      }
    } catch (e: any) {
      const errorDetails = analyzeSessionCreationError(e, 'EXAM');
      toast.error(getUserErrorMessage(errorDetails));
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: (direction: number) => {
      return { x: `${110 * direction}%`, opacity: 0 };
    },
    animate: { x: "0%", opacity: 1 },
    exit: (direction: number) => {
      return { x: `${-110 * direction}%`, opacity: 0 };
    },
  };

  const hasSelection = !!selectedModule;

  return (
    <ApiErrorBoundary>
      <LoadingOverlay loading={loading} message="Creating exam session...">

        <MotionConfig
          transition={{
            duration: 0.5,
            type: "spring",
            bounce: 0,
          }}
        >
          <div className="flex w-full items-center justify-center p-4">
            <Card className="w-full max-w-xl shadow-none border overflow-hidden bg-background">
              <motion.div layout>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-xl">
                      Create Exam Session
                    </CardTitle>
                    <CardDescription>
                      Configure your exam session details below.
                    </CardDescription>
                  </div>
                </CardHeader>

                <motion.div
                  animate={{ height: bounds.height > 0 ? bounds.height : "auto" }}
                  className="relative overflow-hidden"
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                >
                  <div ref={ref}>
                    <CardContent className="px-6 py-2 relative">
                      <AnimatePresence
                        mode="popLayout"
                        initial={false}
                        custom={direction}
                      >
                        <motion.div
                          key="step-0"
                          variants={variants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="w-full"
                          custom={direction}
                        >
                          <div className="space-y-6 py-4">
                            {/* Content Selection */}
                            {shouldApplyFilter && (
                              <div className="space-y-2">
                                <Label>Year Level</Label>
                                <YearLevelSelector
                                  value={(activeYearLevel ?? null) as any}
                                  onChange={handleYearLevelChange}
                                  loading={yearLevelLoading}
                                  showAllOption={false}
                                  placeholder={yearLevelLoading ? "Loading..." : "Select year"}
                                  testId="year-select-page"
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Module</Label>
                              <SheetSelector
                                title="Select Module"
                                triggerLabel={contentLoading ? "Loading modules..." : "Select Module"}
                                value={selectedModule?.id}
                                options={moduleOptions}
                                onSelect={handleModuleSelection}
                                disabled={yearLevelLoading}
                                loading={contentLoading}
                                testId="module-select"
                                headerSlot={shouldApplyFilter ? (
                                  <YearLevelSelector
                                    value={(activeYearLevel ?? null) as any}
                                    onChange={handleYearLevelChange}
                                    showAllOption={false}
                                    placeholder="Select year"
                                    testId="year-select-sheet"
                                  />
                                ) : undefined}
                              />
                            </div>

                            <Separator />

                            {/* Exam Filters - Only show if unit/module selected */}
                            {hasSelection && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                {sessionFiltersLoading ? (
                                  <div className="py-4 text-center text-sm text-muted-foreground">
                                    Loading filters...
                                  </div>
                                ) : (
                                  <>

                                    <div className="space-y-2">
                                      <Label>Question Source <span className="text-red-500">*</span></Label>
                                      <SheetSelector
                                        title="Select Question Source"
                                        triggerLabel="Select Source"
                                        value={selectedSource || ""}
                                        options={questionSources.map(s => ({ ...s, id: String(s.id) }))}
                                        onSelect={setSelectedSource}
                                        renderOption={(option: any) => `${option.questionCount} question${option.questionCount === 1 ? '' : 's'}`}
                                        testId="source-select"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Exam Year <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></Label>
                                      <SheetSelector
                                        title="Select Exam Year"
                                        triggerLabel={selectedSource ? "All years" : "Select a source first"}
                                        value={selectedYear || ""}
                                        options={[
                                          ...(selectedSourceFilters ? [{ id: 'ALL', name: 'All years', questionCount: selectedSourceFilters.questionCount }] : []),
                                          ...sourceYears.map(y => ({ id: String(y.year), name: String(y.year), questionCount: y.questionCount }))
                                        ]}
                                        onSelect={setSelectedYear}
                                        disabled={!selectedSource}
                                        renderOption={(option: any) => `${option.questionCount} question${option.questionCount === 1 ? '' : 's'}`}
                                        testId="year-exam-select"
                                      />
                                    </div>


                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    {examQuestionCount !== null && (
                      <p className="pb-2 text-sm text-muted-foreground" data-testid="exam-question-count">
                        This exam has {examQuestionCount} question{examQuestionCount === 1 ? '' : 's'}.
                      </p>
                    )}
                    </CardContent>
                  </div>
                </motion.div>

                <CardFooter className="flex justify-between items-center border-t py-4 px-6">
                  <Button
                    variant={"ghost"}
                    type="button"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>

                  <Button type="button" onClick={handleCreate} disabled={loading || !hasSelection || !selectedSource || examQuestionCount === 0}>
                    Create Session <Check className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </motion.div>
            </Card>
          </div>
        </MotionConfig>

      </LoadingOverlay>
    </ApiErrorBoundary>
  );
}
