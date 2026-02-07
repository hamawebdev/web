import { QuizFilters, QuizCourse, QuizUnit } from '@/types/api';

// Quiz Creation Configuration
export interface QuizCreationConfig {
  type: 'PRACTICE' | 'EXAM' | 'REMEDIAL';
  title: string;
  description?: string;
  settings: {
    questionCount: number;
    timeLimit?: number;
    shuffleQuestions?: boolean;
    showExplanations?: 'after_each' | 'at_end' | 'never';
  };
  filters: {
    yearLevels: string[];
    courseIds: number[];
    // Legacy optional fields kept for backward compatibility
    quizSourceIds?: number[];
    quizYears?: number[];
    // New API contract fields
    questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'>;
    examYears?: number[];
    moduleIds?: number[];
    uniteIds?: number[];
  };
}

// Quiz Creation Steps
export interface QuizCreationStep {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  optional?: boolean;
  validation?: (config: QuizCreationConfig) => string[];
}

// Question Count Ranges
export interface QuestionRange {
  min: number;
  max: number;
  color: 'green' | 'yellow' | 'red';
  label: string;
  description: string;
  timeRange: string;
}

// Course Selection Props
export interface CourseSelectionProps {
  subjects: QuizUnit[];
  selectedCourses: number[];
  onSelectionChange: (courseIds: number[]) => void;
  userYearLevel?: string; // deprecated in favor of allowedYearLevels
  allowedYearLevels?: string[];
}

// Question Count Slider Props
export interface QuestionCountSliderProps {
  selectedCourses: number[];
  questionCount: number;
  availableQuestions: number;
  onQuestionCountChange: (count: number) => void;
  advancedFilters?: AdvancedFiltersConfig;
  config: QuizCreationConfig;
  onConfigChange: (updates: Partial<QuizCreationConfig>) => void;
  onCreateQuiz?: () => void;
  isCreating?: boolean;
}

// Advanced Filters Configuration
export interface AdvancedFiltersConfig {
  quizSourceIds?: number[]; // legacy optional
  quizYears?: number[]; // legacy optional
  questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'>;
  examYears?: number[];
}

// Quiz Source
export interface QuizSource {
  id: number;
  name: string;
  description?: string;
  year?: number;
}

// Validation Error
export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

// Quiz Creation State
export interface QuizCreationState {
  currentStep: number;
  config: QuizCreationConfig;
  availableQuestions: number;
  validationErrors: ValidationError[];
  isCreating: boolean;
  canProceed: boolean;
}

// Quiz Creation Actions
export interface QuizCreationActions {
  updateConfig: (updates: Partial<QuizCreationConfig>) => void;
  nextStep: () => void;
  previousStep: () => void;
  setCurrentStep: (step: number) => void;
  createQuiz: () => Promise<any>;
  resetWizard: () => void;
}

// Quiz Creation Hook Return Type
export interface UseQuizCreationReturn extends QuizCreationState, QuizCreationActions {
  filterData: QuizFilters | null;
  filtersLoading: boolean;
  steps: QuizCreationStep[];
}

// Component Props Types
export interface QuizCreationWizardProps {
  onQuizCreated?: (quizSession: any) => void;
  onCancel?: () => void;
  initialConfig?: Partial<QuizCreationConfig>;
  userProfile: {
    yearLevel: string;
    subscription?: any;
  };
}

export interface AdvancedFiltersProps {
  filters: AdvancedFiltersConfig;
  onFiltersChange: (filters: AdvancedFiltersConfig) => void;
  baseQuestionCount: number;
  availableSources: QuizSource[];
  availableYears: number[];
}



// Utility Types
export type QuizType = QuizCreationConfig['type'];
export type ShowExplanationsOption = QuizCreationConfig['settings']['showExplanations'];

// Filter Impact Analysis
export interface FilterImpact {
  originalCount: number;
  filteredCount: number;
  reductions: FilterReduction[];
}

export interface FilterReduction {
  type: 'sources' | 'years';
  description: string;
  reduction: number;
}

// Time Estimation
export interface TimeEstimate {
  min: number;
  max: number;
  formatted: string;
}

// Course Tree Node Types
export interface CourseTreeNode {
  id: number;
  name: string;
  type: 'unit' | 'module' | 'course';
  questionCount?: number;
  available?: boolean;
  children?: CourseTreeNode[];
  expanded?: boolean;
  selected?: boolean;
}
