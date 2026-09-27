// @ts-nocheck
/**
 * API Types
 * Based on actual API responses from the Medical Education Platform
 */

import { User, AuthTokens, ApiError, CurrentYear } from './auth';

// Generic API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | ApiError;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Login request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  tokens: AuthTokens;
}

// Refresh token types
export interface RefreshTokenRequest {
  refreshToken: string;
}

// API User type (same as User from auth.ts)
export type ApiUser = User;

// Settings-specific types based on actual API responses
export interface University {
  id: number;
  name: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    quizzes: number;
    questions: number;
    exams: number;
  };
}

export interface Specialty {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface UserSubscription {
  id: number;
  userId: number;
  studyPackId: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  startDate: string;
  endDate: string;
  amountPaid: number;
  paymentMethod: string;
  paymentReference: string;
  createdAt: string;
  updatedAt: string;
  studyPack: {
    id: number;
    name: string;
    description: string;
    type: 'YEAR' | 'COURSE' | 'SPECIALTY';
    yearNumber: string;
    price: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

// Enhanced User Profile type based on actual API response
export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'ADMIN' | 'EMPLOYEE';
  universityId: number;
  specialtyId: number;
  currentYear: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  university: University;
  specialty: Specialty;
  subscriptions: UserSubscription[];
}

// Profile update request type
export interface ProfileUpdateRequest {
  fullName?: string;
  universityId?: number;
  specialtyId?: number;
  currentYear?: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';
}

// Universities response type
export interface UniversitiesResponse {
  universities: University[];
}

// Specialties response type
export interface SpecialtiesResponse {
  specialties: Specialty[];
}

// Student Dashboard Performance - Updated to match actual API response
export interface StudentDashboardPerformance {
  improvementTrend: number;
  studyStreak: number;
  weeklyStats: WeeklyStats[];
  recentActivity: RecentActivity[];
  subjectPerformance: SubjectPerformance[];
  timeDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
  };
}

// New Dashboard Stats API Response - /api/v1/students/dashboard/stats
// New Dashboard Stats API Response - /api/v1/students/dashboard/stats
export interface StudentDashboardStats {
  // Fields from canonical endpoint
  activeSessions: number;
  completedSessions: number;
  totalStudyTime: number;
  currentStreak: number;
  todosCompleted: number;
  todosPending: number;

  // Legacy/Frontend-expected fields (now optional)
  todosToday?: TodoItem[];
  lastSessionByCreated?: SessionInfo | null;
  lastSessionByAnswer?: SessionInfo | null;
  questionCount?: number;
  unitsCount?: number;
  independentModulesCount?: number;
  staticExamsCount?: number;
  userStudyPacks?: UserStudyPack[];
  userSubscriptions?: UserSubscription[];
  userProfile?: UserProfile;
  answersLast7Days?: DailyAnswerStats[];
}

// Todo item from dashboard stats
export interface TodoItem {
  id: number;
  title: string;
  description: string;
  type: 'EXAM' | 'PRACTICE' | 'READING' | string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'COMPLETED' | 'IN_PROGRESS';
  dueDate: string; // ISO date string
  courses?: TodoCourse[];
}

// Course info in todo items
export interface TodoCourse {
  id: number;
  name: string;
  module: {
    id: number;
    name: string;
    studyPack: any | null;
  };
}

// Session info from dashboard stats
export interface SessionInfo {
  id: number;
  title: string;
  type: 'PRACTICE' | 'EXAM';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';
  score: number;
  percentage: number;
  createdAt?: string; // For lastSessionByCreated
  updatedAt?: string; // For lastSessionByAnswer
  quiz: any | null;
  exam: any | null;
}

// Daily answer statistics for weekly performance
export interface DailyAnswerStats {
  date: string; // YYYY-MM-DD format
  correct: number;
  incorrect: number;
  total: number;
}

// User study pack from dashboard stats
export interface UserStudyPack {
  id: number;
  name: string;
  description: string;
  type: string;
  yearNumber: string;
  pricePerMonth: string;
  pricePerYear: string;
  subscription: {
    id: number;
    status: string;
    startDate: string;
    endDate: string;
    amountPaid: number;
  };
}

// Weekly stats from actual API response
export interface WeeklyStats {
  week: string;
  sessionsCompleted: number;
  averageScore: number;
}

// Weekly performance data
export interface WeeklyPerformanceData {
  week: string;
  questionsAnswered: number;
  accuracy: number;
  timeSpent: number;
}

// Consolidated Recent Activity interface (supports both dashboard and analytics)
export interface RecentActivity {
  id?: number; // Optional for analytics compatibility
  date: string;
  activity?: string; // Dashboard format
  title?: string; // Analytics format
  score?: number;
  accuracy?: number; // Analytics format
  type: string;
  subject?: string;
  completedAt?: string; // Analytics format
  duration?: number; // Analytics format (in minutes)
  questionsCount?: number; // Analytics format
}

// Legacy RecentSession interface for backward compatibility
export interface RecentSession {
  id: number;
  date: string;
  questionsAnswered: number;
  accuracy: number;
  timeSpent: number;
  studyPackName: string;
}

// Consolidated Subject Performance interface (supports both dashboard and analytics)
export interface SubjectPerformance {
  subjectId?: number; // Analytics format
  subject?: string; // Dashboard format
  subjectName?: string; // Analytics format
  averageScore: number;
  totalSessions: number;
  bestScore?: number; // Dashboard format
  worstScore?: number; // Dashboard format
  accuracy?: number; // Analytics format
  timeSpent?: number; // Analytics format (in minutes)
  questionsAnswered?: number; // Analytics format
  correctAnswers?: number; // Analytics format
  improvement?: number; // Analytics format (percentage change)
  lastActivity?: string; // Analytics format
  progressPercentage?: number; // Analytics format
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'; // Analytics format
  averageTime?: number; // Analytics format (in seconds)
  completedQuestions?: number; // Analytics format
  totalQuestions?: number; // Analytics format
  strengths?: string[]; // Analytics format
  weaknesses?: string[]; // Analytics format
  recommendations?: string[]; // Analytics format
}

// Study Pack types
export interface StudyPack {
  id: number;
  name: string;
  description: string;
  type: 'YEAR' | 'RESIDENCY';
  yearNumber: CurrentYear | null;
  price: number; // Legacy field for backward compatibility
  pricePerMonth: number;
  pricePerYear: number;
  isActive: boolean;
  totalQuestions: number;
  subjects: string[];
  createdAt: string;
  updatedAt: string;
  statistics?: {
    totalQuestions: number;
    totalQuizzes: number;
    totalCourses: number;
    totalModules: number;
    totalUnits: number; // Fixed typo from totalUnites
    subscribersCount: number;
  };
}

export interface StudyPackDetails extends StudyPack {
  unites?: StudyPackUnit[];
  questions?: QuizQuestion[];
  userProgress?: {
    completedQuestions: number;
    accuracy: number;
    timeSpent: number;
  };
}

export interface StudyPackUnit {
  id: number;
  name: string;
  description: string;
  logoUrl?: string;
  modules: StudyPackModule[];
}

export interface StudyPackModule {
  id: number;
  name: string;
  description: string;
  courses: StudyPackCourse[];
  statistics?: {
    questionsCount: number;
    quizzesCount: number;
    coursesCount: number;
  };
}

export interface StudyPackCourse {
  id: number;
  name: string;
  description: string;
  statistics?: {
    questionsCount: number;
    quizzesCount: number;
  };
}

// Quiz and Question types - Based on actual API response
export interface QuizQuestion {
  id: number;
  questionText: string;
  explanation: string;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: number;
  answerText: string;
  isCorrect: boolean;
  explanation: string;
  explanationImages: ExplanationImage[];
}

export interface ExplanationImage {
  id: number;
  imagePath: string;
  altText: string;
}

// Quiz Session - Based on actual API response
export interface QuizSession {
  id: number;
  title: string;
  type: 'PRACTICE' | 'EXAM' | 'RESIDENCY';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt?: string; // New field for when session was started
  score: number;
  percentage: number;
  questions: QuizQuestion[];
  answers: any[]; // User answers
  createdAt: string;
  updatedAt: string;
}

// Quiz Filters - Based on actual API response
export interface QuizFilters {
  availableYears: string[]; // Year levels: ['ONE'..'SEVEN']
  unites: QuizUnit[];
  // Optional list of question sources (e.g., University, Mock Exam, Practice Test)
  // New API: each source can expose its available exam years
  quizSources?: Array<{ id: number; name: string; description?: string; availableYears?: number[] }>;
  // New API: top-level list of available exam years
  availableQuizYears?: number[];
}

export interface QuizUnit {
  id: number;
  name: string;
  year: string;
  modules: QuizModule[];
}

export interface QuizModule {
  id: number;
  name: string;
  courses: QuizCourse[];
}

export interface QuizCourse {
  id: number;
  name: string;
  questionCount: number;
}

// Legacy quiz filters interface for backward compatibility
export interface LegacyQuizFilters {
  studyPackId?: number;
  subject?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  limit?: number;
  offset?: number;
}

// Additional types expected by the quiz hooks (need to be mapped from API response)
export interface YearLevel {
  value: string;
  name: string;
}

export interface QuizTopic {
  id: number;
  name: string;
  courseId: number;
}

export interface QuizDifficulty {
  value: string;
  name: string;
}

// User Subscription types
export interface UserSubscription {
  id: number;
  userId: number;
  studyPackId: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  startDate: string;
  endDate: string;
  amountPaid: number;
  paymentMethod: string;
  paymentReference: string;
  createdAt: string;
  updatedAt: string;
  studyPack: StudyPack;
}

// Progress tracking types
export interface ProgressOverview {
  totalQuestions: number;
  completedQuestions: number;
  accuracy: number;
  timeSpent: number;
  lastActivity: string;
}

export interface CourseProgressDetails {
  studyPackId: number;
  studyPackName: string;
  progress: ProgressOverview;
  subjectProgress: SubjectPerformance[];
}

export interface CourseProgressUpdate {
  studyPackId: number;
  questionId: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface CourseProgressResponse {
  message: string;
  updatedProgress: ProgressOverview;
}

// Exam types - Updated to match actual API response
export interface Exam {
  id: number;
  title: string;
  description?: string;
  yearLevel: string;
  examYear: string;
  university?: {
    id: number;
    name: string;
  } | string;
  // Additional properties that might be available in full exam details
  studyPackId?: number;
  questionCount?: number;
  questionsCount?: number;
  timeLimit?: number; // in minutes
  duration?: number;
  totalQuestions?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  passingScore?: number;
  maxAttempts?: number;
  instructions?: string;
  rules?: string[];
  prerequisites?: string[];
  universityName?: string;
  canAccess?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamSession {
  id: number;
  title: string;
  type: 'EXAM' | 'QUIZ' | 'PRACTICE' | 'RESIDENCY';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt?: string; // New field for when session was started
  score: number;
  percentage: number;
  questions: SessionQuestion[];
  answers: SessionAnswer[];
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  examId?: number;
  userId?: number;
  startTime?: string;
  endTime?: string;
}

export interface SessionQuestion {
  id: number;
  questionText: string;
  explanation: string;
  answers: SessionQuestionAnswer[];
}

export interface SessionQuestionAnswer {
  id: number;
  answerText: string;
  isCorrect: boolean;
  explanation: string;
  explanationImages: ExplanationImage[];
}

export interface ExplanationImage {
  id: number;
  imagePath: string;
  altText: string;
}

export interface SessionAnswer {
  questionId: number;
  selectedAnswerId?: number;
  isCorrect?: boolean;
  timeSpent?: number;
}

// Legacy interface for backward compatibility
export interface ExamAnswer {
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

// ExamQuestion now uses the same structure as QuizQuestion from API
export interface ExamQuestion extends QuizQuestion {
  // Exam questions have the same structure as quiz questions
}

export interface ExamResult {
  sessionId: number;
  examId: number;
  examTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  totalTime: number;
  completedAt: string;
}

// Exam types - Based on actual API response
export interface AvailableExamsResponse {
  examsByYear: ExamsByYear[];
  residencyExams: ResidencyExams;
}

export interface ExamsByYear {
  year: string;
  exams: ExamInfo[];
}

export interface ExamInfo {
  id: number;
  title: string;
  university: string;
  yearLevel: string;
}

export interface ResidencyExams {
  available: boolean;
  yearsAvailable: string[];
  exams: ExamInfo[];
}

export interface ExamFilters {
  universityId?: number;
  yearLevel?: string;
  examYear?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

// Session Results types
export interface SessionResult {
  id: number;
  userId: number;
  studyPackId: number;
  studyPackName: string;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  timeSpent: number;
  completedAt: string;
  createdAt: string;
}

// Submit Answer API Response - Based on session-doc.md
export interface SubmitAnswerResponse {
  message?: string;
  results?: Array<{
    questionId: number;
    isCorrect: boolean;
  }>;
  score: number; // This is the percentage (e.g., 8.33)
  totalScore20: number; // This is the score out of 20 (e.g., 1.67)
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  unansweredCount: number;
  totalQuestions: number;
  status?: string;
  sessionId?: number;
  timeSpent?: number;
}

export interface SessionResultsFilters {
  studyPackId?: number;
  startDate?: string;
  endDate?: string;
  minAccuracy?: number;
  maxAccuracy?: number;
  limit?: number;
  offset?: number;
  // Extended filters to match actual API endpoints
  answerType?: 'all' | 'correct' | 'incorrect';
  sessionType?: 'PRACTICE' | 'EXAM';
  sessionIds?: string; // Comma-separated list of session IDs
  completedAfter?: string; // ISO date string
  completedBefore?: string; // ISO date string
  page?: number;
}

// Advanced analytics filters for enhanced functionality
export interface AdvancedSessionFilters extends SessionResultsFilters {
  subjects?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'all';
  performanceThreshold?: number;
  includeAbandoned?: boolean;
}

// Session comparison types
export interface SessionComparison {
  sessions: SessionSummary[];
  metrics: ComparisonMetrics;
  insights: string[];
}

export interface SessionSummary {
  sessionId: number;
  title: string;
  type: 'PRACTICE' | 'EXAM';
  completedAt: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  timeSpent: number;
  subject?: string;
}

export interface ComparisonMetrics {
  accuracyImprovement: number;
  speedImprovement: number;
  consistencyScore: number;
  strengthAreas: string[];
  weaknessAreas: string[];
}

// Time-based analytics (consolidated interface)
export interface TimeBasedAnalytics {
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  dailyPerformance: DailyPerformance[];
  weeklyTrends: WeeklyTrend[];
  monthlyProgress: MonthlyProgress[];
  studyPatterns: StudyPattern[];
  summary: {
    totalSessions: number;
    averageScore: number;
    totalTime: number;
    improvement: number;
  };
}

// Todo types aligned with endpoint contract
export type TodoType = 'READING' | 'SESSION' | 'EXAM' | 'OTHER';
export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface TodoCourse {
  id: number;
  name: string;
  description?: string;
  moduleName?: string;
  uniteName?: string;
  completed?: boolean;
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  type: TodoType;
  priority: TodoPriority;
  status: TodoStatus;
  dueDate?: string;
  completedAt?: string;
  course?: any;
  quiz?: any;
  exam?: any;
  quizSession?: any;
  isOverdue?: boolean;
  courseIds?: number[]; // Multiple course IDs
  courses?: TodoCourse[]; // Course details for display
  estimatedTime?: number; // minutes
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  type: TodoType;
  priority: TodoPriority;
  dueDate?: string;
  courseId?: number; // The API stores a single course per todo
  courseIds?: number[]; // Legacy: only the first ID is sent (as courseId)
  quizId?: number;
  estimatedTime?: number;
  tags?: string[];
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  type?: TodoType;
  priority?: TodoPriority;
  status?: TodoStatus;
  dueDate?: string;
  courseIds?: number[]; // Multiple course IDs
  estimatedTime?: number;
  tags?: string[];
}

export interface DailyPerformance {
  date: string;
  sessionsCompleted: number;
  questionsAnswered: number;
  averageAccuracy: number;
  totalTimeSpent: number;
}

// Consolidated WeeklyTrend interface (removed duplicate)
export interface WeeklyTrend {
  week: string; // ISO week format (e.g., "2024-W01")
  weekStart?: string; // Optional for backward compatibility
  weekEnd?: string; // Optional for backward compatibility
  sessionsCount: number;
  sessionsCompleted?: number; // Alias for backward compatibility
  averageScore: number;
  averageAccuracy?: number; // Alias for backward compatibility
  totalTime: number; // in minutes
  questionsAnswered: number;
  accuracy: number;
  improvementRate?: number; // Optional additional metric
  consistencyScore?: number; // Optional additional metric
}

export interface MonthlyProgress {
  month: string;
  year: number;
  totalSessions: number;
  averageScore: number;
  averageAccuracy: number;
  topSubjects: string[];
  goalsAchieved: number;
  sessionsCompleted: number;
  totalTimeSpent: number;
}

export interface StudyPattern {
  title?: string;
  description?: string;
  timeOfDay: string;
  dayOfWeek: string;
  averageAccuracy: number;
  averageSessionDuration: number;
  frequency: number | string;
  preferredSubjects?: string[];
}

// Question Report types
export interface QuestionReport {
  id: number;
  questionId: number;
  userId: number;
  reportType: 'INCORRECT_ANSWER' | 'TYPO' | 'UNCLEAR_QUESTION' | 'MISSING_INFO' | 'OTHER';
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  question: QuizQuestion;
}

export interface QuestionReportRequest {
  questionId: number;
  reportType: 'INCORRECT_ANSWER' | 'TYPO' | 'UNCLEAR_QUESTION' | 'MISSING_INFO' | 'OTHER';
  description: string;
}

export interface QuestionReportResponse {
  message: string;
  reportId: number;
}

export interface QuestionReportsFilters {
  questionId?: number;
  reportType?: 'INCORRECT_ANSWER' | 'TYPO' | 'UNCLEAR_QUESTION' | 'MISSING_INFO' | 'OTHER';
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  limit?: number;
  offset?: number;
}

// ==================== ANALYTICS TYPES ====================

// Course Analytics API Response
export interface CourseAnalyticsResponse {
  session: {
    id: number;
    title: string;
    type: 'PRACTICE' | 'EXAM' | 'MOCK';
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    completedAt: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    percentage: number;
    timeSpent: number; // in minutes
    averageTimePerQuestion: number; // in minutes
    courses: CourseAnalytics[];
  };
  pagination: {
    currentPage: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Course Analytics Object
export interface CourseAnalytics {
  id: number;
  name: string;
  description: string;
  moduleId: number;
  moduleName: string;
  courseAnalytics: {
    totalQuestions: number;
    totalCorrectAnswers: number;
    totalIncorrectAnswers: number;
    overallAccuracy: number;
  };
}

// Analytics Overview Response
export interface AnalyticsOverview {
  totalSessions: number;
  completionRate: number;
  averageScore: number;
  timeSpent: number; // in minutes
  currentStreak: number;
  longestStreak: number;
  recentActivity: RecentActivityItem[];
  subjectProgress: SubjectPerformance[];
  weeklyTrends: WeeklyTrend[];
  monthlyProgress: MonthlyProgress[];
  studyPatterns: StudyPattern[];
  achievements: Achievement[];
}

// Recent Activity Item (extends consolidated RecentActivity)
export interface RecentActivityItem extends RecentActivity {
  id: number;
  type: 'QUIZ' | 'EXAM' | 'PRACTICE';
  title: string;
  completedAt: string;
  duration: number; // in minutes
  questionsCount: number;
}

// SubjectProgress consolidated into SubjectPerformance interface above

// WeeklyTrend interface moved up and consolidated - this duplicate removed

// Achievement
export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'STREAK' | 'ACCURACY' | 'SPEED' | 'COMPLETION' | 'MILESTONE';
}

// Course Progress Update Request
export interface CourseProgressUpdateRequest {
  progressPercentage: number;
  lastAccessedAt: string;
  notes?: string;
}

// Quiz History Parameters
export interface QuizHistoryParams extends PaginationParams {
  type?: 'PRACTICE' | 'EXAM' | 'REMEDIAL';
}

// Quiz History Item
export interface QuizHistoryItem {
  id: number;
  title: string;
  type: 'PRACTICE' | 'EXAM' | 'REMEDIAL';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'ABANDONED';
  score?: number;
  accuracy?: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in minutes
  completedAt?: string;
  createdAt: string;
  subjects: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
}

// Session Results Parameters
export interface SessionResultsParams extends PaginationParams {
  answerType?: 'CORRECT' | 'INCORRECT' | 'UNANSWERED';
  sessionType?: 'PRACTICE' | 'EXAM' | 'REMEDIAL';
  sessionIds?: number[];
  examId?: number;
  quizId?: number;
  completedAfter?: string; // ISO date string
  completedBefore?: string; // ISO date string
}

// Detailed Session Result
export interface DetailedSessionResult {
  sessionId: number;
  sessionTitle: string;
  sessionType: 'PRACTICE' | 'EXAM' | 'REMEDIAL';
  questionId: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE';
  options: string[];
  correctAnswer: string | string[];
  userAnswer?: string | string[];
  isCorrect: boolean;
  timeSpent: number; // in seconds
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  subject: string;
  topic: string;
  explanation?: string;
  answeredAt?: string;
}

// Available Sessions Parameters
export interface AvailableSessionsParams {
  sessionType?: 'PRACTICE' | 'EXAM';
}

// Available Session
export interface AvailableSession {
  id: number;
  title: string;
  description?: string;
  type: 'PRACTICE' | 'EXAM';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  estimatedTime: number; // in minutes
  questionsCount: number;
  subjects: string[];
  topics: string[];
  prerequisites?: string[];
  isLocked: boolean;
  lockReason?: string;
}

// Time-based Analytics Parameters
export interface TimeBasedAnalyticsParams {
  period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

// Subject Analytics (alias for consolidated SubjectPerformance with required analytics fields)
export interface SubjectAnalytics extends Required<Pick<SubjectPerformance,
  'subjectId' | 'subjectName' | 'totalSessions' | 'averageScore' | 'accuracy' |
  'timeSpent' | 'questionsAnswered' | 'correctAnswers' | 'improvement' |
  'lastActivity' | 'strengths' | 'weaknesses' | 'recommendations'
>> { }

// ==================== NEW ANALYTICS ENDPOINT TYPES ====================

// Session stats from the new analytics endpoint
export interface SessionStats {
  averagePerQuestion: number;
  totalQuestions: number;
  answeredCorrect: number;
  answeredWrong: number;
  consulted: number;
  accuracy: string;
}

// Course-level stats from the new analytics endpoint
export interface CourseStats {
  name: string;
  totalQuestions: number;
  answeredCorrect: number;
  answeredWrong: number;
  consulted: number;
  accuracy: string;
}

// Individual session from the new analytics endpoint
export interface AnalyticsSession {
  id: number;
  type: 'PRACTICE' | 'EXAM' | 'RESIDENCY';
  title: string;
  stats: SessionStats;
  courses: CourseStats[];
}

// Response from GET /api/v1/quiz-sessions/type/{SESSION_TYPE}
export interface AnalyticsSessionsResponse {
  sessions: AnalyticsSession[];
}

// Session type enum for the new analytics endpoint
export type SessionType = 'PRACTICE' | 'EXAM' | 'RESIDENCY';

// Performance Comparison Parameters
export interface PerformanceComparisonParams {
  compareWith?: 'PEERS' | 'PREVIOUS_PERIOD' | 'TARGET';
  timeframe?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
}

// Performance Comparison
export interface PerformanceComparison {
  current: PerformanceMetrics;
  comparison: PerformanceMetrics;
  improvement: {
    score: number;
    accuracy: number;
    speed: number;
    consistency: number;
  };
  ranking?: {
    position: number;
    totalUsers: number;
    percentile: number;
  };
}

// Performance Metrics
export interface PerformanceMetrics {
  averageScore: number;
  accuracy: number;
  averageTime: number; // in seconds per question
  sessionsCompleted: number;
  questionsAnswered: number;
  consistencyScore: number;
}

// TimeBasedAnalytics interface consolidated above - this duplicate removed

export interface DailyPerformance {
  date: string;
  sessionsCompleted: number;
  questionsAnswered: number;
  averageAccuracy: number;
  totalTimeSpent: number;
}

export interface TimeBasedDataPoint {
  date: string;
  sessionsCount: number;
  averageScore: number;
  totalTime: number;
  questionsAnswered: number;
}

export interface CourseProgressResponse {
  courseId: number;
  progressPercentage: number;
  lastAccessedAt: string;
  notes?: string;
  updatedAt: string;
}

// ==================== NOTES TYPES ====================

// Note types for the new grouped API format
export interface Note {
  id: number;
  noteText: string;
  questionId?: number;
  quizId?: number;
  question?: {
    id: number;
    questionText: string;
    course?: {
      id: number;
      name: string;
    };
  };
  quiz?: any;
  createdAt: string;
  updatedAt: string;
}

// Module group for grouped notes response
export interface ModuleGroup {
  module: {
    id: number;
    name: string;
    description: string;
  };
  notes: Note[];
}

// Grouped notes response format
export interface GroupedNotesResponse {
  groupedByModule: ModuleGroup[];
  totalNotes: number;
  totalModules: number;
}

// Enhanced notes response format for by-module endpoint
export interface EnhancedNotesResponse {
  filterInfo: {
    uniteId: number | null;
    moduleId: number | null;
    uniteName: string | null;
    moduleName: string | null;
  };
  courseGroups: Array<{
    course: {
      id: number;
      name: string;
      module: {
        id: number;
        name: string;
      };
    };
    notes: Note[];
  }>;
  ungroupedNotes: Note[];
  totalNotes: number;
}

// Notes filtering parameters for enhanced endpoints
export interface NotesFilterParams {
  moduleId?: number;
  uniteId?: number;
}

// Content filters response structure
export interface ContentFiltersResponse {
  unites: Array<{
    id: number;
    name: string;
    modules: Array<{
      id: number;
      name: string;
      courses: Array<{
        id: number;
        name: string;
        description?: string;
      }>;
    }>;
  }>;
  independentModules: Array<{
    id: number;
    name: string;
    imagePath?: string | null;
    courses: Array<{
      id: number;
      name: string;
      description?: string;
    }>;
  }>;
}

// Module navigation item for hamburger menu
export interface ModuleNavigationItem {
  id: number;
  name: string;
  type: 'unite' | 'module';
  uniteId?: number;
  uniteName?: string;
  noteCount?: number;
}

// ==================== COURSE TRACKING TYPES ====================

// Course Layer interface
export interface CourseLayer {
  id: number;
  courseId: number;
  studentId: number;
  layerNumber: number;
  isCompleted: boolean;
  isQcmLayer: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: number;
    name: string;
    description?: string;
  };
}

// Course Layer Progress
export interface CourseLayerProgress {
  layer1: boolean;
  layer2: boolean;
  layer3: boolean;
  qcmLayer: boolean;
}

// Course Progress Details
export interface CourseProgressDetails {
  courseId: number;
  courseName: string;
  progressPercentage: number;
  layerProgress: CourseLayerProgress;
  completedLayers: number;
  totalLayers: number;
  course?: {
    id: number;
    name: string;
    description?: string;
    module?: {
      id: number;
      name: string;
      unite?: {
        id: number;
        name: string;
      };
    };
  };
}

// Card Course Association
export interface CardCourse {
  id: number;
  cardId: number;
  courseId: number;
  createdAt: string;
  course: {
    id: number;
    name: string;
    description?: string;
    module?: {
      id: number;
      name: string;
      unite?: {
        id: number;
        name: string;
      };
    };
  };
}

// Study Card interface
export interface StudyCard {
  id: number;
  studentId: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  cardCourses: CardCourse[];
}

// Card Progress Response
export interface CardProgressResponse {
  cardId: number;
  cardTitle: string;
  cardProgressPercentage: number;
  totalCourses: number;
  courseProgress: CourseProgressDetails[];
}

// Course Layer Upsert Request
export interface CourseLayerUpsertRequest {
  courseId: number;
  layerNumber: number;
  completed: boolean;
}

// Card Creation Request
export interface CardCreateRequest {
  title: string;
  description?: string;
  courseIds?: number[];
}

// Card Update Request
export interface CardUpdateRequest {
  title?: string;
  description?: string;
}

// Unit/Module Selection for tracking
export interface UnitModuleSelection {
  type: 'unite' | 'module';
  id: number;
  name: string;
  uniteId?: number;
  uniteName?: string;
}

// Tracker Summary (for directory view)
export interface TrackerSummary {
  id: number;
  title: string;
  description?: string;
  unitType: 'unite' | 'module';
  unitId: number;
  unitName: string;
  courseCount: number;
  progressBreakdown: {
    c1: { count: number; percentage: number };
    c2: { count: number; percentage: number };
    c3: { count: number; percentage: number };
    qcm: { count: number; percentage: number };
  };
  createdAt: string;
  updatedAt: string;
}

// ==================== LABELS TYPES ====================

// Label types for the new question-focused API format
export interface Label {
  id: number;
  name: string;
  statistics: {
    quizzesCount: number;
    questionsCount: number;
    quizSessionsCount: number;
    totalItems: number;
  };
  questionIds: number[]; // Array of associated question IDs
  questions: LabelQuestion[]; // Array of associated questions with details
  createdAt: string;
}

// Question details in labels
export interface LabelQuestion {
  id: number;
  questionText: string;
  course: {
    id: number;
    name: string;
    module: {
      id: number;
      name: string;
      description: string;
    };
  };
  createdAt: string;
}

// Enhanced labels response with filtering context (new API)
export interface LabelsResponse {
  filterInfo: {
    uniteId: number | null;
    moduleId: number | null;
    uniteName: string | null;
    moduleName: string | null;
  };
  labels: Label[];
  totalLabels: number;
}

// Filter parameters for labels
export interface LabelFilterParams {
  moduleId?: number;
  uniteId?: number;
}

// ==================== COURSE RESOURCES TYPES ====================

// Course Resource type enum matching API values
export type CourseResourceType = 'OFFICIAL_SUPPORT' | 'CHOICE_OF_TEAM' | 'VIDEO' | 'AUDIO' | 'OTHER';

// Course Resource from API response
export interface CourseResource {
  id: number;
  courseId: number;
  type: CourseResourceType;
  title: string;
  tag: string | null;
  description: string | null;
  filePath: string | null;
  externalUrl: string | null;
  youtubeVideoId: string | null;
  createdAt: string;
}

// Course Resources API Response - paginated structure
export interface CourseResourcesResponse {
  items: CourseResource[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Extended Quiz Course with additional metadata for course selection
export interface ExtendedQuizCourse extends QuizCourse {
  moduleId?: number;
  unitId?: number;
  moduleName?: string;
  unitName?: string;
  year?: string;
}


// ==================== ADMIN TYPES ====================

// Admin Dashboard Stats - Based on /admin/dashboard/stats API response
export interface DashboardStats {
  users: {
    total: number;
    students: number;
    employees: number;
    admins: number;
    newThisMonth: number;
  };
  content: {
    totalQuizzes: number;
    totalExams: number;
    totalQuestions: number;
    totalSessions: number;
  };
  activity: {
    activeUsers: number;
    sessionsToday: number;
    averageSessionScore: number;
  };
  subscriptions: {
    active: number;
    expired: number;
    revenue: number;
  };
}

// Admin Subscription Management Types
export interface AdminSubscription {
  id: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startDate: string;
  endDate: string;
  amountPaid: number;
  paymentMethod: string;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
  studyPack: {
    id: number;
    name: string;
    type: 'YEAR' | 'RESIDENCY';
    yearNumber: string | null;
    price: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscriptionFilters {
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  studyPackId?: number;
  userId?: number;
  search?: string;
}

export interface UpdateSubscriptionRequest {
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  endDate?: string;
}

export interface CancelSubscriptionRequest {
  reason: string;
}

export interface AddMonthsToSubscriptionRequest {
  months: number;
  reason: string;
}

// Admin Quiz Management Types
export interface AdminQuiz {
  id: number;
  title: string;
  description: string;
  type: 'QCM' | 'QCS' | 'PRACTICE' | 'EXAM';
  courseId: number;
  universityId: number;
  yearLevel: string;
  quizSourceId: number;
  quizYear: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: number;
    name: string;
  };
  university?: {
    id: number;
    name: string;
  };
  questions?: AdminQuizQuestion[];
  _count?: {
    questions: number;
    sessions: number;
  };
}

export interface AdminQuizQuestion {
  id?: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE';
  explanation: string;
  answers: AdminQuizAnswer[];
}

export interface AdminQuizAnswer {
  id?: number;
  answerText: string;
  isCorrect: boolean;
  explanation: string;
}

export interface CreateQuizRequest {
  title: string;
  description: string;
  type: 'QCM' | 'QCS' | 'PRACTICE' | 'EXAM';
  courseId: number;
  universityId: number;
  yearLevel: string;
  quizSourceId: number;
  quizYear: number;
  questions: AdminQuizQuestion[];
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  type?: 'QCM' | 'QCS' | 'PRACTICE' | 'EXAM';
  courseId?: number;
  universityId?: number;
  yearLevel?: string;
  quizSourceId?: number;
  quizYear?: number;
  isActive?: boolean;
}

export interface AdminQuizFilters {
  type?: 'QCM' | 'QCS' | 'PRACTICE' | 'EXAM';
  courseId?: number;
  universityId?: number;
  yearLevel?: string;
  quizSourceId?: number;
  quizYear?: number;
  isActive?: boolean;
  search?: string;
}


// Admin Exam Management Types
export interface AdminExam {
  id: number;
  title: string;
  description: string;
  moduleId: number;
  universityId: number;
  yearLevel: string;
  examYear: string;
  year: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  module?: {
    id: number;
    name: string;
  };
  university?: {
    id: number;
    name: string;
  };
  questions?: AdminExamQuestion[];
  _count?: {
    questions: number;
    sessions: number;
  };
}

export interface AdminExamQuestion {
  id?: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE';
  explanation: string;
  orderInExam: number;
  answers: AdminQuizAnswer[];
}

export interface CreateExamRequest {
  title: string;
  description: string;
  moduleId: number;
  universityId: number;
  yearLevel: string;
  examYear: string;
  year: number;
  questions: AdminExamQuestion[];
}

export interface UpdateExamRequest {
  title?: string;
  description?: string;
  moduleId?: number;
  universityId?: number;
  yearLevel?: string;
  examYear?: string;
  year?: number;
  isActive?: boolean;
}

export interface AdminExamFilters {
  moduleId?: number;
  universityId?: number;
  yearLevel?: string;
  examYear?: string;
  year?: number;
  isActive?: boolean;
  search?: string;
}

export interface UpdateExamQuestionOrderRequest {
  examId: number;
  questionOrders: Array<{
    questionId: number;
    orderInExam: number;
  }>;
}


// Admin Question Reports Management Types - Updated to match new API
export interface AdminQuestionReport {
  id: number;
  userId: number;
  questionId: number;
  reportType: 'TYPO' | 'INCORRECT_ANSWER' | 'UNCLEAR_QUESTION' | 'OTHER';
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reviewedById: number | null;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    fullName: string;
    email: string;
  };
  question: {
    id: number;
    courseId: number;
    examId: number;
    sourceId: number;
    questionText: string;
    explanation: string;
    questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';
    universityId: number;
    yearLevel: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';
    examYear: number;
    rotation: string | null;
    metadata: string;
    createdById: number;
    createdAt: string;
    updatedAt: string;
    questionAnswers: Array<{
      id: number;
      questionId: number;
      answerText: string;
      isCorrect: boolean;
      explanation: string;
      createdAt: string;
    }>;
    course: {
      name: string;
    };
  };
  reviewedBy: {
    fullName: string;
    email: string;
  } | null;
}

export interface AdminQuestionReportFilters {
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reportType?: 'TYPO' | 'INCORRECT_ANSWER' | 'UNCLEAR_QUESTION' | 'OTHER';
  questionId?: number;
  userId?: number;
  search?: string;
}

export interface ReviewQuestionReportRequest {
  action: 'RESOLVED' | 'DISMISSED';
  response: string;
}

// Admin Activation Codes Management Types (New API)
export interface ActivationCode {
  id: number;
  code: string;
  description?: string;
  durationMonths?: number;
  durationDays?: number;
  durationType: 'MONTHS' | 'DAYS';
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
  studyPacks: StudyPack[];
}

export interface CreateActivationCodeRequest {
  description?: string;
  durationMonths?: number;
  durationDays?: number;
  durationType: 'MONTHS' | 'DAYS';
  maxUses: number;
  expiresAt: string;
  studyPackIds: number[];
}

export interface UpdateActivationCodeRequest {
  description?: string;
  durationMonths?: number;
  durationDays?: number;
  durationType?: 'MONTHS' | 'DAYS';
  maxUses?: number;
  expiresAt?: string;
  studyPackIds?: number[];
  isActive?: boolean;
  // Fields PUT /admin/activation-codes/:id actually applies (updateActivationCodeSchema):
  // expiryDate (ISO datetime), maxUses, durationMonths, isActive and a single studyPackId
  // that replaces all of the code's packs. description, durationType, durationDays,
  // expiresAt and studyPackIds are stripped by the backend on update.
  expiryDate?: string;
  studyPackId?: number;
}

export interface ActivationCodeFilters {
  isActive?: boolean;
  search?: string;
  studyPackId?: number;
  expiryDate?: string;
}

// New API Response Types
export interface ActivationCodeResponse {
  success: boolean;
  data: {
    message: string;
    activationCode: ActivationCode;
  };
}

export interface ActivationCodesListResponse {
  success: boolean;
  data: {
    activationCodes: ActivationCode[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

// Admin Question Management Types
export interface AdminQuestion {
  id: number;
  questionText: string;
  explanation?: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  courseId: number;
  examId?: number;
  universityId?: number;
  yearLevel?: string;
  examYear?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: number;
    name: string;
    module?: {
      id: number;
      name: string;
      unite?: {
        id: number;
        name: string;
        studyPack?: {
          id: number;
          name: string;
        };
      };
    };
  };
  university?: {
    id: number;
    name: string;
    country: string;
  };
  exam?: {
    id: number;
    title: string;
  };
  answers: AdminQuestionAnswer[];
  questionImages?: Array<{
    id: number;
    imagePath: string;
    altText?: string;
  }>;
  _count?: {
    reports: number;
    sessions: number;
  };
}

export interface AdminQuestionAnswer {
  id?: number;
  answerText: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface AdminQuestionFilters {
  courseId?: number;
  moduleId?: number;
  unitId?: number;
  studyPackId?: number;
  universityId?: number;
  examId?: number;
  questionType?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  yearLevel?: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';
  examYear?: number;
  rotation?: 'R1' | 'R2' | 'R3' | 'R4';
  sourceId?: number;
  isActive?: boolean;
  search?: string;
}

export interface CreateQuestionRequest {
  questionText: string;
  explanation?: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC';
  courseId: number;
  universityId?: number;
  yearLevel?: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';
  rotation?: 'R1' | 'R2' | 'R3' | 'R4';
  examYear?: number;
  sourceId?: number;
  additionalInfo?: string;
  metadata?: string;
  // Legacy fields for backward compatibility
  moduleId?: number;
  unitId?: number;
  examId?: number;
  questionImages?: Array<File & { altText?: string }>;
  answers: Array<{
    answerText: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

// Hierarchical content structure for question creation
export interface QuestionCreationUnit {
  id: number;
  name: string;
  studyPack: {
    id: number;
    name: string;
    yearNumber: string;
    type: string;
  };
  modules: QuestionCreationModule[];
}

export interface QuestionCreationModule {
  id: number;
  name: string;
  unitId?: number;
  studyPack?: {
    id: number;
    name: string;
    yearNumber: string;
    type: string;
  };
  courses: QuestionCreationCourse[];
}

export interface QuestionCreationCourse {
  id: number;
  name: string;
  description: string;
  moduleId?: number;
}

export interface QuestionCreationFilters {
  unites: QuestionCreationUnit[];
  independentModules: QuestionCreationModule[];
}

export interface UpdateQuestionRequest {
  questionText?: string;
  explanation?: string;
  questionType?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  courseId?: number;
  examId?: number;
  universityId?: number;
  yearLevel?: string;
  examYear?: number;
  questionImages?: Array<{ imagePath: string; altText?: string }>;
  answers?: Array<{
    id?: number;
    answerText: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  isActive?: boolean;
}

export interface UpdateQuestionExplanationRequest {
  explanation: string;
  explanationImages?: File[];
}

// Admin File Upload Types
export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface ImageUploadResponse {
  success: boolean;
  files: UploadedFile[];
  message: string;
}

export interface PDFUploadResponse {
  success: boolean;
  files: UploadedFile[];
  message: string;
}

export interface StudyPackMediaUploadResponse {
  success: boolean;
  files: {
    images: UploadedFile[];
    pdfs: UploadedFile[];
  };
  message: string;
}

export interface ExplanationUploadResponse {
  success: boolean;
  files: UploadedFile[];
  message: string;
}

export interface LogoUploadResponse {
  success: boolean;
  files: UploadedFile[];
  message: string;
}

// File upload error types
export interface FileUploadError {
  success: false;
  error: string;
}

// Payment types
export type PaymentMethod = 'edahabia' | 'cib' | 'chargily_app';
export type PaymentDurationType = 'monthly' | 'yearly';
export type PaymentLocale = 'ar' | 'en' | 'fr';

export interface PaymentDuration {
  type: PaymentDurationType;
  months?: number; // required if type is "monthly"
  years?: number;  // required if type is "yearly"
}

export interface CreateCheckoutSessionRequest {
  studyPackId: number;
  paymentDuration: PaymentDuration;
  locale?: PaymentLocale;
  paymentMethod?: PaymentMethod;
}

export interface CreateCheckoutSessionResponse {
  checkoutUrl: string;
  checkoutId: string;
}

export interface PaymentValidationError {
  field: string;
  message: string;
}

// Question Sources types based on API documentation
export interface QuestionSource {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    questions: number;
  };
}

export interface CreateQuestionSourceRequest {
  name: string;
}

export interface UpdateQuestionSourceRequest {
  name?: string;
}

export interface QuestionSourcesResponse {
  items: QuestionSource[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QuestionSourceResponse {
  questionSource: QuestionSource;
}

export interface QuestionSourceFilters {
  search?: string;
}

// Residency Questions Management Types
export interface ResidencyQuestion {
  id: number;
  questionId: number;
  part: 'Sciences fondamentales' | 'Pathologie medico-chirurgical' | 'Dossier clinique';
  examYear?: number;
  universityId?: number;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  question: {
    id: number;
    questionText: string;
    explanation?: string;
    questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
    questionImages: Array<{
      id: number;
      imagePath: string;
      altText: string;
    }>;
    questionExplanationImages: Array<{
      id: number;
      imagePath: string;
      altText: string;
    }>;
    questionAnswers: Array<{
      id: number;
      answerText: string;
      isCorrect: boolean;
    }>;
  };
  university?: {
    id: number;
    name: string;
  };
}

export interface ResidencyQuestionFilters {
  part?: 'Sciences fondamentales' | 'Pathologie medico-chirurgical' | 'Dossier clinique';
  examYear?: number;
  universityId?: number;
  search?: string;
}

// Residency Questions API Response (different structure from generic PaginatedResponse)
export interface ResidencyQuestionsResponse {
  questions: ResidencyQuestion[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

export interface CreateResidencyQuestionRequest {
  questionText: string;
  explanation?: string;
  part: 'Sciences fondamentales' | 'Pathologie medico-chirurgical' | 'Dossier clinique';
  examYear?: number;
  universityId?: number;
  metadata?: string;
  questionAnswers: Array<{
    answerText: string;
    isCorrect: boolean;
  }>;
  questionImages?: File[];
  questionExplanationImages?: File[];
}

export interface UpdateResidencyQuestionRequest {
  questionText?: string;
  explanation?: string;
  part?: 'Sciences fondamentales' | 'Pathologie medico-chirurgical' | 'Dossier clinique';
  examYear?: number;
  universityId?: number;
  metadata?: string;
  questionAnswers?: Array<{
    id?: number;
    answerText: string;
    isCorrect: boolean;
  }>;
  questionImages?: File[];
  questionExplanationImages?: File[];
}

export interface BulkResidencyQuestionRequest {
  universityId: number;
  examYear: number;
  part: 'Sciences fondamentales' | 'Pathologie medico-chirurgical' | 'Dossier clinique';
  questions: Array<{
    questionText: string;
    explanation?: string;
    metadata?: string;
    questionAnswers: Array<{
      answerText: string;
      isCorrect: boolean;
      explanation?: string;
    }>;
  }>;
}

export interface BulkResidencyQuestionResponse {
  questions: Array<{
    id: number;
    questionId: number;
    part: 'Sciences fondamentales' | 'Pathologie medico-chirurgical' | 'Dossier clinique';
    question: {
      id: number;
      questionText: string;
      explanation?: string;
      questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
      universityId: number;
      yearLevel: 'SEVEN';
      examYear: number;
      metadata?: string;
      createdAt: string;
      updatedAt: string;
      questionAnswers: Array<{
        id: number;
        answerText: string;
        isCorrect: boolean;
        explanation?: string;
      }>;
      questionImages: any[];
      questionExplanationImages: any[];
    };
  }>;
  totalCreated: number;
}

// Admin Study Pack Management Types
export interface CreateStudyPackRequest {
  name: string;
  description: string;
  // Backend PackType enum; RESIDENCY packs have no yearNumber
  type: 'YEAR' | 'RESIDENCY';
  yearNumber?: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';
  pricePerMonth: number;
  pricePerYear: number;
}

export interface UpdateStudyPackRequest {
  name?: string;
  description?: string;
  type?: 'YEAR' | 'RESIDENCY';
  yearNumber?: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';
  pricePerMonth?: number;
  pricePerYear?: number;
  isActive?: boolean;
}

// Study Pack validation helpers
// Must match the backend Prisma PackType enum
export const STUDY_PACK_TYPES = ['YEAR', 'RESIDENCY'] as const;
export const YEAR_NUMBERS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'] as const;

export type StudyPackType = typeof STUDY_PACK_TYPES[number];
export type YearNumber = typeof YEAR_NUMBERS[number];

export interface StudyPackResponse {
  success: boolean;
  data: {
    message: string;
    studyPack: StudyPack & {
      _count?: {
        subscriptions: number;
      };
    };
  };
}

export interface StudyPacksListResponse {
  success: boolean;
  data: {
    studyPacks: (StudyPack & {
      _count?: {
        subscriptions: number;
      };
    })[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}
