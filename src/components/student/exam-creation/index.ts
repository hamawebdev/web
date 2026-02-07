// Exam Creation Components Export
export { ExamCreationForm } from './exam-creation-form';

// Re-export types from API service
export type {
  ExamModule,
  ExamResponse,
  ExamsByYearResponse,
  MultiModuleSessionRequest,
  MultiModuleSessionResponse,
  DetailedExamResponse,
  ModuleAvailabilityCheck,
  ValidationResult
} from '@/lib/api/exam-service';
