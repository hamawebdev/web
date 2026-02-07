// TypeScript interfaces for the Progressive Drill-Down Question Import system

export interface University {
  id: number;
  name: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPack {
  id: number;
  name: string;
  description: string;
  type: 'YEAR' | 'RESIDENCY';
  yearNumber: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN' | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: number;
  studyPackId: number;
  name: string;
  description: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  modules?: Array<{
    id: number;
    name: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
    courses?: Array<{
      id: number;
      name: string;
      description: string;
    }>;
  }>;
}

export interface Module {
  id: number;
  uniteId: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  unite: Unit;
}

export interface Course {
  id: number;
  moduleId: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  module: Module;
}

export interface IndependentModule {
  id: number;
  uniteId: null;
  studyPackId: number;
  name: string;
  description: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  studyPack: {
    id: number;
    name: string;
    yearNumber: string;
    type: string;
  };
  courses: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

export interface QuestionFiltersResponse {
  success: true;
  data: {
    filters: {
      courses: Course[];
      universities: University[];
      examYears: number[];
      questionTypes: string[];
    };
    unites: Array<{
      id: number;
      name: string;
      studyPack: {
        id: number;
        name: string;
        yearNumber: string;
        type: string;
      };
      modules: Array<{
        id: number;
        name: string;
        courses: Array<{
          id: number;
          name: string;
          description: string;
        }>;
      }>;
    }>;
    independentModules: IndependentModule[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Question import related interfaces
export interface QuestionAnswer {
  answerText: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ImportQuestion {
  questionText: string;
  explanation?: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  answers: QuestionAnswer[];
}

export interface QuestionImportMetadata {
  courseId: number;
  universityId?: number;
  examYear?: number;
  sourceId?: number;
  rotation?: string;
  yearLevel?: string;
}

export interface BulkQuestionImportPayload {
  metadata: QuestionImportMetadata;
  questions: ImportQuestion[];
}

export interface BulkQuestionImportResponse {
  success: true;
  data: {
    questions: Array<{
      id: number;
      questionText: string;
      questionType: string;
    }>;
    totalCreated: number;
  };
}

// Progressive selection state interfaces
export interface SelectionState {
  university?: University;
  studyPack?: StudyPack;
  unit?: Unit;
  module?: Module;
  independentModule?: IndependentModule;
  course?: Course;
  examYear?: number;
  sourceId?: number;
  rotation?: string;
}

export interface HierarchyData {
  universities: University[];
  studyPacks: StudyPack[];
  examYears: number[];
  units: Unit[];
  modules: Module[];
  independentModules: IndependentModule[];
  courses: Course[];
}

export interface ImportWizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

export interface ImportProgress {
  step: 'selecting' | 'inputting' | 'validating' | 'importing' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
  error?: string;
}

// JSON validation interfaces
export interface ValidationError {
  field: string;
  message: string;
  questionIndex?: number;
  answerIndex?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  questionCount: number;
}

// Component props interfaces
export interface QuestionImportWizardProps {
  onImportComplete?: (result: BulkQuestionImportResponse) => void;
  onCancel?: () => void;
}

export interface JsonQuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  validation: ValidationResult;
  onValidate: (questions: ImportQuestion[]) => void;
  onValidationResult?: (validation: ValidationResult) => void;
  disabled?: boolean;
}

export interface HierarchyBreadcrumbsProps {
  selection: SelectionState;
  onStepClick: (step: keyof SelectionState) => void;
}

export interface ImportProgressTrackerProps {
  progress: ImportProgress;
  steps: ImportWizardStep[];
}

// Bulk import interfaces
export interface BulkImportFile {
  id: string; // Unique identifier for the file
  file: File;
  filename: string;
  examYear?: number; // Auto-detected or manually set
  rotation?: 'R1' | 'R2' | 'R3' | 'R4'; // Auto-detected or manually set
  sourceId?: number; // Auto-detected or manually set
  sourceName?: string; // Auto-detected source name for display
  isValid: boolean;
  validationResult?: ValidationResult;
  parsedQuestions?: ImportQuestion[];
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadProgress?: number; // 0-100
}

export interface BulkImportMetadata {
  // Shared metadata fields that apply to all files (if needed in future)
  // Currently, rotation and sourceId are per-file
}

export interface BulkImportState {
  files: BulkImportFile[];
  sharedMetadata: BulkImportMetadata;
  isImporting: boolean;
  completedFiles: number;
  totalFiles: number;
}

export interface BulkImportRequest {
  metadata: QuestionImportMetadata;
  questions: ImportQuestion[];
}

export interface BulkImportResponse {
  fileId: string;
  success: boolean;
  data?: {
    questions: Array<{
      id: number;
      questionText: string;
      questionType: string;
    }>;
    totalCreated: number;
  };
  error?: string;
}

export interface BulkImportComponentProps {
  selection: SelectionState;
  onImportComplete?: (results: BulkImportResponse[]) => void;
  onCancel?: () => void;
}
