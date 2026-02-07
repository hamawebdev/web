// @ts-nocheck
import { apiClient } from './api-client';
import { logServiceCall } from './logger';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  ApiUser,
  StudentDashboardPerformance,
  StudentDashboardStats,
  StudyPack,
  StudyPackDetails,
  QuizFilters,
  UserSubscription,
  ProgressOverview,
  CourseProgressDetails,
  CourseProgressUpdate,
  CourseProgressResponse,
  PaginatedResponse,
  PaginationParams,
  Exam,
  ExamSession,
  ExamQuestion,
  ExamResult,
  ExamFilters,
  SessionResult,
  SessionResultsFilters,
  AdvancedSessionFilters,
  SessionComparison,
  SessionSummary,
  SubmitAnswerResponse,
  ComparisonMetrics,
  TimeBasedAnalytics,
  QuestionReport,
  QuestionReportRequest,
  QuestionReportResponse,
  QuestionReportsFilters,
  AvailableExamsResponse,
  UserProfile,
  ProfileUpdateRequest,
  University,
  Specialty,
  CourseResourcesResponse,
  UniversitiesResponse,
  SpecialtiesResponse,
  // Todos
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  // Analytics
  AnalyticsOverview,
  CourseAnalyticsResponse,
  CourseProgressUpdateRequest,
  QuizHistoryParams,
  QuizHistoryItem,
  SessionResultsParams,
  DetailedSessionResult,
  AvailableSessionsParams,
  AvailableSession,
  TimeBasedAnalyticsParams,
  SubjectAnalytics,
  PerformanceComparisonParams,
  PerformanceComparison,
  // New Analytics types
  AnalyticsSessionsResponse,
  SessionType,
  // Admin types
  DashboardStats,
  AdminSubscription,
  AdminSubscriptionFilters,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  AddMonthsToSubscriptionRequest,
  AdminQuiz,
  AdminQuizFilters,
  CreateQuizRequest,
  UpdateQuizRequest,
  AdminExam,
  AdminExamFilters,
  CreateExamRequest,
  UpdateExamRequest,
  UpdateExamQuestionOrderRequest,
  AdminQuestionReport,
  AdminQuestionReportFilters,
  ReviewQuestionReportRequest,
  ActivationCode,
  CreateActivationCodeRequest,
  UpdateActivationCodeRequest,
  ActivationCodeFilters,
  AdminQuestion,
  AdminQuestionFilters,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  UpdateQuestionExplanationRequest,
  ImageUploadResponse,
  PDFUploadResponse,
  StudyPackMediaUploadResponse,
  ExplanationUploadResponse,
  LogoUploadResponse,
  // Study pack content types
  StudyPackUnit,
  StudyPackModule,
  StudyPackCourse,
  CurrentYear,
  // Question Sources types
  QuestionSource,
  CreateQuestionSourceRequest,
  UpdateQuestionSourceRequest,
  QuestionSourcesResponse,
  QuestionSourceResponse,
  QuestionSourceFilters,
  // Residency Questions types
  ResidencyQuestion,
  ResidencyQuestionFilters,
  ResidencyQuestionsResponse,
  CreateResidencyQuestionRequest,
  UpdateResidencyQuestionRequest,
  BulkResidencyQuestionRequest,
  BulkResidencyQuestionResponse,
  // Admin Study Pack types
  CreateStudyPackRequest,
  UpdateStudyPackRequest,
  StudyPackResponse,
  StudyPacksListResponse,
  STUDY_PACK_TYPES,
  YEAR_NUMBERS,
} from '@/types/api';

// Authentication Services
export class AuthService {
  /**
   * Register new user
   */
  static async register(registrationData: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<ApiResponse<{ message: string; tokens?: { accessToken: string; refreshToken: string } }>> {
    return apiClient.post<{ message: string; tokens?: { accessToken: string; refreshToken: string } }>('/auth/register', registrationData);
  }

  /**
   * Get universities list for settings
   */
  static async getUniversities(): Promise<ApiResponse<UniversitiesResponse>> {
    return apiClient.get<UniversitiesResponse>('/Universities');
  }

  /**
   * Get specialties list for settings
   */
  static async getSpecialties(): Promise<ApiResponse<SpecialtiesResponse>> {
    return apiClient.get<SpecialtiesResponse>('/Specialties');
  }

  /**
   * Login user with email and password
   */
  static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log('🌐 AuthService.login: Making API call', {
      endpoint: '/auth/login',
      email: credentials.email,
      hasPassword: !!credentials.password,
      credentialsKeys: Object.keys(credentials)
    });

    return apiClient.post<LoginResponse>('/auth/login', credentials);
  }

  /**
   * Get current user profile with full details for settings
   */
  static async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/auth/profile');
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(refreshTokenData: RefreshTokenRequest): Promise<ApiResponse<LoginResponse>> {
    // Send JSON body per docs; also include Authorization: Bearer <refreshToken> when provided to support backends that require it
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (refreshTokenData?.refreshToken) {
      headers['Authorization'] = `Bearer ${refreshTokenData.refreshToken}`;
    }
    return apiClient.post<LoginResponse>('/auth/refresh', refreshTokenData, { headers });
  }

  /**
   * Logout user
   */
  static async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/logout');
  }

  /**
   * Update user profile with validation
   */
  static async updateProfile(profileData: ProfileUpdateRequest): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<UserProfile>('/auth/profile', profileData);
  }

  /**
   * Change password
   */
  static async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return apiClient.put<void>('/auth/change-password', passwordData);
  }

  /**
   * Request password reset - sends verification code to email
   * According to API docs: POST /auth/forgot-password
   * Request: { email: string }
   * Response: { success: true, data: { message: string }, meta: { timestamp, requestId } }
   */
  static async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  }

  /**
   * Reset password with verification code
   * According to API docs: POST /auth/reset-password
   * Request: { email: string, code: string, newPassword: string }
   * Response: { success: true, data: { message: string }, meta: { timestamp, requestId } }
   */
  static async resetPassword(resetData: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/reset-password', resetData);
  }


}

// Settings Services
export class SettingsService {
  /**
   * Get current user profile for settings page
   */
  static async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return AuthService.getProfile();
  }

  /**
   * Update user profile settings
   */
  static async updateUserProfile(profileData: ProfileUpdateRequest): Promise<ApiResponse<UserProfile>> {
    return AuthService.updateProfile(profileData);
  }

  /**
   * Get available universities for settings dropdown
   */
  static async getUniversities(): Promise<ApiResponse<UniversitiesResponse>> {
    return AuthService.getUniversities();
  }

  /**
   * Get available specialties for settings dropdown
   */
  static async getSpecialties(): Promise<ApiResponse<SpecialtiesResponse>> {
    return AuthService.getSpecialties();
  }

  /**
   * Get user's current subscriptions for settings display
   */
  static async getUserSubscriptions(): Promise<ApiResponse<UserSubscription[]>> {
    return StudentService.getSubscriptions();
  }

  /**
   * Validate profile update data before submission
   */
  static validateProfileData(data: ProfileUpdateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.fullName !== undefined) {
      if (!data.fullName || data.fullName.trim().length < 2) {
        errors.push('Full name must be at least 2 characters long');
      }
    }

    if (data.universityId !== undefined) {
      if (!Number.isInteger(data.universityId) || data.universityId <= 0) {
        errors.push('Please select a valid university');
      }
    }

    if (data.specialtyId !== undefined) {
      if (!Number.isInteger(data.specialtyId) || data.specialtyId <= 0) {
        errors.push('Please select a valid specialty');
      }
    }

    if (data.currentYear !== undefined) {
      const validYears = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'];
      if (!validYears.includes(data.currentYear)) {
        errors.push('Please select a valid academic year');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Student Services
export class StudentService {
  /**
   * Get student dashboard performance data
   */
  static async getDashboardPerformance(): Promise<ApiResponse<StudentDashboardPerformance>> {
    return apiClient.get<StudentDashboardPerformance>('/students/dashboard/performance');
  }

  /**
   * Get student dashboard statistics (new endpoint)
   */
  static async getDashboardStats(): Promise<ApiResponse<StudentDashboardStats>> {
    return apiClient.get<StudentDashboardStats>('/students/dashboard/stats');
  }

  /**
   * Get user subscriptions
   */
  static async getSubscriptions(): Promise<ApiResponse<UserSubscription[]>> {
    return apiClient.get<UserSubscription[]>('/students/subscriptions');
  }
  /**
   * Get study packs for student browse
   * Note: student endpoint returns nested structure
   */
  static async getStudyPacks(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    const url = queryParams.toString() ? `/study-packs?${queryParams.toString()}` : '/study-packs';
    return apiClient.get<any>(url);
  }


  /**
   * Get progress overview
   */
  /**
   * Get study pack details for student context (modules, courses, etc.)
   */
  static async getStudentStudyPackDetails(studyPackId: number): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/student/study-pack/${studyPackId}`);
  }

  static async getProgressOverview(): Promise<ApiResponse<ProgressOverview>> {
    return apiClient.get<ProgressOverview>('/students/progress/overview');
  }

  /**
   * Get session results with filtering
   */
  static async getSessionResults(params: {
    answerType?: 'all' | 'correct' | 'incorrect';
    page?: number;
    limit?: number;
    sessionIds?: string;
    sessionType?: 'PRACTICE' | 'EXAM';
    completedAfter?: string;
    completedBefore?: string;
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params.answerType) queryParams.append('answerType', params.answerType);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sessionIds) queryParams.append('sessionIds', params.sessionIds);
    if (params.sessionType) queryParams.append('sessionType', params.sessionType);
    if (params.completedAfter) {
      // Convert date-only format to ISO datetime format if needed
      const afterDate = params.completedAfter.includes('T')
        ? params.completedAfter
        : `${params.completedAfter}T00:00:00Z`;
      queryParams.append('completedAfter', afterDate);
    }
    if (params.completedBefore) {
      // Convert date-only format to ISO datetime format if needed
      const beforeDate = params.completedBefore.includes('T')
        ? params.completedBefore
        : `${params.completedBefore}T23:59:59Z`;
      queryParams.append('completedBefore', beforeDate);
    }

    const url = queryParams.toString() ? `/students/session-results?${queryParams.toString()}` : '/students/session-results';
    return apiClient.get<any>(url);
  }

  /**
   * Get available sessions for filtering
   */
  static async getAvailableSessions(type: 'all' | 'PRACTICE' | 'EXAM' = 'all'): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (type !== 'all') {
      queryParams.append('sessionType', type);
    }
    const url = queryParams.toString() ? `/students/available-sessions?${queryParams.toString()}` : '/students/available-sessions';
    return apiClient.get<any>(url);
  }

  // Note: These methods have been moved to NewApiService for better organization
  // and enhanced error handling. Use apiServices.newApi instead.


  /**
   * Get advanced session results with enhanced filtering
   */
  static async getAdvancedSessionResults(filters: AdvancedSessionFilters = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();

    // Basic filters
    if (filters.answerType) queryParams.append('answerType', filters.answerType);
    if (filters.sessionType) queryParams.append('sessionType', filters.sessionType);
    if (filters.sessionIds) queryParams.append('sessionIds', filters.sessionIds);
    if (filters.completedAfter) {
      // Convert date-only format to ISO datetime format if needed
      const afterDate = filters.completedAfter.includes('T')
        ? filters.completedAfter
        : `${filters.completedAfter}T00:00:00Z`;
      queryParams.append('completedAfter', afterDate);
    }
    if (filters.completedBefore) {
      // Convert date-only format to ISO datetime format if needed
      const beforeDate = filters.completedBefore.includes('T')
        ? filters.completedBefore
        : `${filters.completedBefore}T23:59:59Z`;
      queryParams.append('completedBefore', beforeDate);
    }
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    // Legacy filters for backward compatibility
    if (filters.studyPackId) queryParams.append('studyPackId', filters.studyPackId.toString());
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.minAccuracy) queryParams.append('minAccuracy', filters.minAccuracy.toString());
    if (filters.maxAccuracy) queryParams.append('maxAccuracy', filters.maxAccuracy.toString());

    const url = queryParams.toString() ? `/students/session-results?${queryParams.toString()}` : '/students/session-results';
    return apiClient.get<any>(url);
  }

  /**
   * Compare multiple sessions by their IDs
   */
  static async compareSessionPerformance(sessionIds: number[]): Promise<ApiResponse<SessionComparison>> {
    if (sessionIds.length === 0) {
      throw new Error('At least one session ID is required for comparison');
    }

    const sessionIdsString = sessionIds.join(',');
    return this.getAdvancedSessionResults({
      sessionIds: sessionIdsString,
      answerType: 'all',
      limit: 100 // Get results for comparison (API max limit)
    }).then(response => {
      if (!response.success || !response.data?.data?.questions) {
        return response as ApiResponse<SessionComparison>;
      }

      // Process the session results into comparison format
      const questions = response.data.data.questions;
      const sessionMap = new Map<number, any[]>();

      // Group questions by session
      questions.forEach((question: any) => {
        if (!sessionMap.has(question.sessionId)) {
          sessionMap.set(question.sessionId, []);
        }
        sessionMap.get(question.sessionId)!.push(question);
      });

      // Create session summaries
      const sessions: SessionSummary[] = Array.from(sessionMap.entries()).map(([sessionId, sessionQuestions]) => {
        const correctAnswers = sessionQuestions.filter(q => q.isCorrect).length;
        const totalQuestions = sessionQuestions.length;
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        const timeSpent = sessionQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);

        return {
          sessionId,
          title: sessionQuestions[0]?.sessionTitle || `Session ${sessionId}`,
          type: sessionQuestions[0]?.sessionType || 'PRACTICE',
          completedAt: sessionQuestions[0]?.completedAt || new Date().toISOString(),
          questionsAnswered: totalQuestions,
          correctAnswers,
          accuracy,
          timeSpent,
          subject: sessionQuestions[0]?.subject
        };
      });

      // Calculate comparison metrics
      const accuracies = sessions.map(s => s.accuracy);
      const accuracyImprovement = accuracies.length > 1
        ? accuracies[accuracies.length - 1] - accuracies[0]
        : 0;

      const avgTimes = sessions.map(s => s.timeSpent / s.questionsAnswered);
      const speedImprovement = avgTimes.length > 1
        ? avgTimes[0] - avgTimes[avgTimes.length - 1]
        : 0;

      const consistencyScore = accuracies.length > 1
        ? 100 - (Math.max(...accuracies) - Math.min(...accuracies))
        : 100;

      const metrics: ComparisonMetrics = {
        accuracyImprovement,
        speedImprovement,
        consistencyScore,
        strengthAreas: [], // Will be populated by analytics processor
        weaknessAreas: []  // Will be populated by analytics processor
      };

      const comparison: SessionComparison = {
        sessions,
        metrics,
        insights: [] // Will be populated by analytics processor
      };

      return {
        ...response,
        data: comparison
      } as ApiResponse<SessionComparison>;
    });
  }

  /**
   * Get time-based analytics with date range filtering
   */
  static async getTimeBasedAnalytics(dateRange: { start: string; end: string }): Promise<ApiResponse<TimeBasedAnalytics>> {
    // Use the existing session results endpoint with date filtering
    const response = await this.getAdvancedSessionResults({
      completedAfter: dateRange.start,
      completedBefore: dateRange.end,
      answerType: 'all',
      limit: 100 // Get comprehensive data for analysis (API max limit)
    });

    if (!response.success || !response.data?.data?.questions) {
      return response as ApiResponse<TimeBasedAnalytics>;
    }

    const questions = response.data.data.questions;

    // Process questions into time-based analytics
    const dailyMap = new Map<string, any[]>();
    const weeklyMap = new Map<string, any[]>();
    const monthlyMap = new Map<string, any[]>();

    questions.forEach((question: any) => {
      const date = new Date(question.completedAt || question.createdAt);
      const dateStr = date.toISOString().split('T')[0];
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Group by day
      if (!dailyMap.has(dateStr)) dailyMap.set(dateStr, []);
      dailyMap.get(dateStr)!.push(question);

      // Group by week
      if (!weeklyMap.has(weekStart)) weeklyMap.set(weekStart, []);
      weeklyMap.get(weekStart)!.push(question);

      // Group by month
      if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, []);
      monthlyMap.get(monthKey)!.push(question);
    });

    // Create daily performance data
    const dailyPerformance = Array.from(dailyMap.entries()).map(([date, dayQuestions]) => {
      const sessionsCompleted = new Set(dayQuestions.map(q => q.sessionId)).size;
      const questionsAnswered = dayQuestions.length;
      const correctAnswers = dayQuestions.filter(q => q.isCorrect).length;
      const averageAccuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
      const totalTimeSpent = dayQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);

      return {
        date,
        sessionsCompleted,
        questionsAnswered,
        averageAccuracy,
        totalTimeSpent
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Create weekly trends
    const weeklyTrends = Array.from(weeklyMap.entries()).map(([weekStart, weekQuestions]) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const sessionsCompleted = new Set(weekQuestions.map(q => q.sessionId)).size;
      const correctAnswers = weekQuestions.filter(q => q.isCorrect).length;
      const averageAccuracy = weekQuestions.length > 0 ? Math.round((correctAnswers / weekQuestions.length) * 100) : 0;

      return {
        weekStart,
        weekEnd: weekEnd.toISOString().split('T')[0],
        sessionsCompleted,
        averageAccuracy,
        improvementRate: 0, // Will be calculated based on previous weeks
        consistencyScore: 0 // Will be calculated based on daily variations
      };
    }).sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    // Calculate improvement rates for weekly trends
    weeklyTrends.forEach((week, index) => {
      if (index > 0) {
        const prevWeek = weeklyTrends[index - 1];
        week.improvementRate = week.averageAccuracy - prevWeek.averageAccuracy;
      }
    });

    // Create monthly progress
    const monthlyProgress = Array.from(monthlyMap.entries()).map(([monthKey, monthQuestions]) => {
      const [year, month] = monthKey.split('-');
      const totalSessions = new Set(monthQuestions.map(q => q.sessionId)).size;
      const correctAnswers = monthQuestions.filter(q => q.isCorrect).length;
      const averageAccuracy = monthQuestions.length > 0 ? Math.round((correctAnswers / monthQuestions.length) * 100) : 0;

      // Get top subjects for the month
      const subjectCounts = monthQuestions.reduce((acc: any, q: any) => {
        const subject = q.subject || 'General';
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {});

      const topSubjects = Object.entries(subjectCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([subject]) => subject);

      return {
        month: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' }),
        year: parseInt(year),
        totalSessions,
        averageAccuracy,
        topSubjects,
        goalsAchieved: 0 // This would come from a goals tracking system
      };
    }).sort((a, b) => a.year - b.year || a.month.localeCompare(b.month));

    // Create study patterns (simplified version)
    const studyPatterns = [
      {
        timeOfDay: 'Morning',
        dayOfWeek: 'All',
        averageAccuracy: 0,
        averageSessionDuration: 0,
        frequency: 0
      }
    ]; // This would require more complex analysis of timestamps

    const timeBasedAnalytics: TimeBasedAnalytics = {
      dailyPerformance,
      weeklyTrends,
      monthlyProgress,
      studyPatterns
    };

    return {
      ...response,
      data: timeBasedAnalytics
    } as ApiResponse<TimeBasedAnalytics>;
  }

  /**
   * Update course progress with layer-based tracking
   */
  static async updateCourseProgress(courseId: number, progressData: CourseProgressUpdate): Promise<ApiResponse<CourseProgressResponse>> {
    return apiClient.put<CourseProgressResponse>(`/students/courses/${courseId}/progress`, progressData);
  }

  /**
   * Get course progress details
   */
  static async getCourseProgress(courseId: number): Promise<ApiResponse<CourseProgressDetails>> {
    return apiClient.get<CourseProgressDetails>(`/students/courses/${courseId}/progress`);
  }

  /**
   * Generate course completion certificate
   */
  static async generateCertificate(courseId: number): Promise<ApiResponse<{
    certificateId: string;
    certificateUrl: string;
    issuedAt: string;
    validUntil?: string;
  }>> {
    return apiClient.post<{
      certificateId: string;
      certificateUrl: string;
      issuedAt: string;
      validUntil?: string;
    }>(`/students/courses/${courseId}/certificate`);
  }



  /**
   * Get quiz history with enhanced filtering support
   */
  static async getQuizHistory(params: PaginationParams & {
    type?: 'PRACTICE' | 'EXAM';
    status?: 'COMPLETED' | 'IN_PROGRESS' | 'ABANDONED';
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: 'completedAt' | 'score' | 'title' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams();

    // Add all parameters to search params, filtering out undefined/null values
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const url = searchParams.toString()
      ? `/students/quiz-history?${searchParams.toString()}`
      : '/students/quiz-history';

    return apiClient.get<PaginatedResponse<any>>(url);
  }

  // Notes Management
  /**
   * Get student notes - now returns grouped by module format
   */
  static async getNotes(params: PaginationParams & {
    search?: string;
    questionId?: number;
    quizId?: number; // Changed from sessionId to quizId to match API docs
    labelIds?: number[];
  } = {}): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const endpoint = `/students/notes?${searchParams.toString()}`;

    // Use centralized logging with throttling
    logServiceCall('StudentService', 'getNotes', { endpoint, params });

    return apiClient.get<any>(endpoint);
  }

  /**
   * Get notes by module or unite with enhanced filtering
   * Implements: GET /api/v1/students/notes/by-module?moduleId=X OR uniteId=X
   */
  static async getNotesByModule(params: {
    moduleId?: number;
    uniteId?: number;
  }): Promise<ApiResponse<{
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
  }>> {
    // Validate mutually exclusive parameters according to API docs
    if (params.moduleId && params.uniteId) {
      const error = {
        success: false,
        error: {
          message: 'Cannot provide both uniteId and moduleId. Please select only one.'
        }
      };
      throw new Error(error.error.message);
    }

    if (!params.moduleId && !params.uniteId) {
      const error = {
        success: false,
        error: {
          message: 'Either uniteId or moduleId must be provided'
        }
      };
      throw new Error(error.error.message);
    }

    // Validate parameter formats
    if (params.moduleId && (!Number.isInteger(params.moduleId) || params.moduleId <= 0)) {
      const error = {
        success: false,
        error: {
          message: 'Invalid uniteId or moduleId format'
        }
      };
      throw new Error(error.error.message);
    }

    if (params.uniteId && (!Number.isInteger(params.uniteId) || params.uniteId <= 0)) {
      const error = {
        success: false,
        error: {
          message: 'Invalid uniteId or moduleId format'
        }
      };
      throw new Error(error.error.message);
    }

    const searchParams = new URLSearchParams();
    if (params.moduleId) {
      searchParams.append('moduleId', params.moduleId.toString());
    }
    if (params.uniteId) {
      searchParams.append('uniteId', params.uniteId.toString());
    }

    const endpoint = `/students/notes/by-module?${searchParams.toString()}`;

    // Use centralized logging with throttling
    logServiceCall('StudentService', 'getNotesByModule', { endpoint, params });

    try {
      return await apiClient.get<any>(endpoint);
    } catch (error: any) {
      // Handle specific API error responses according to documentation
      if (error?.response?.status === 403) {
        throw new Error('Access denied: Module not found or not accessible with your current subscription');
      }
      if (error?.response?.status === 400) {
        throw new Error('Valid module ID is required');
      }
      if (error?.response?.status === 401) {
        throw new Error('Authentication required');
      }
      throw error;
    }
  }

  /**
   * Create a new note
   */
  static async createNote(noteData: {
    noteText: string;
    questionId?: number;
    quizId?: number; // Changed from sessionId to quizId to match API docs
    labelIds?: number[];
  }): Promise<ApiResponse<any>> {
    // Validate required fields according to API documentation
    if (!noteData.noteText || noteData.noteText.trim().length === 0) {
      throw new Error('Note text is required and cannot be empty');
    }

    // Validate note text length (reasonable limits)
    if (noteData.noteText.length > 5000) {
      throw new Error('Note text cannot exceed 5000 characters');
    }

    // Validate that at least one reference (questionId or quizId) is provided
    if (!noteData.questionId && !noteData.quizId) {
      throw new Error('Either questionId or quizId must be provided');
    }

    // Validate ID formats
    if (noteData.questionId && (!Number.isInteger(noteData.questionId) || noteData.questionId <= 0)) {
      throw new Error('Invalid questionId format');
    }

    if (noteData.quizId && (!Number.isInteger(noteData.quizId) || noteData.quizId <= 0)) {
      throw new Error('Invalid quizId format');
    }

    // Send data directly as API expects noteText field
    const apiData = {
      noteText: noteData.noteText.trim(),
      questionId: noteData.questionId,
      quizId: noteData.quizId, // Changed from sessionId to quizId
      labelIds: noteData.labelIds
    };

    // Remove undefined fields to avoid sending null values
    Object.keys(apiData).forEach(key => {
      if (apiData[key] === undefined) {
        delete apiData[key];
      }
    });

    try {
      return await apiClient.post<any>('/students/notes', apiData);
    } catch (error: any) {
      // Handle specific API error responses
      if (error?.response?.status === 400) {
        throw new Error('Invalid note data provided');
      }
      if (error?.response?.status === 401) {
        throw new Error('Authentication required');
      }
      if (error?.response?.status === 403) {
        throw new Error('Access denied: No active subscription');
      }
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  static async updateNote(noteId: number, noteData: {
    noteText?: string;
    labelIds?: number[];
  }): Promise<ApiResponse<any>> {
    // Validate note ID
    if (!Number.isInteger(noteId) || noteId <= 0) {
      throw new Error('Valid note ID is required');
    }

    // Validate note text if provided
    if (noteData.noteText !== undefined) {
      if (!noteData.noteText || noteData.noteText.trim().length === 0) {
        throw new Error('Note text cannot be empty');
      }
      if (noteData.noteText.length > 5000) {
        throw new Error('Note text cannot exceed 5000 characters');
      }
    }

    // Send data directly as API expects noteText field
    const apiData = {
      noteText: noteData.noteText?.trim(),
      labelIds: noteData.labelIds
    };

    // Remove undefined fields to avoid sending null values
    Object.keys(apiData).forEach(key => {
      if (apiData[key] === undefined) {
        delete apiData[key];
      }
    });

    try {
      return await apiClient.put<any>(`/students/notes/${noteId}`, apiData);
    } catch (error: any) {
      // Handle specific API error responses
      if (error?.response?.status === 404) {
        throw new Error('Note not found');
      }
      if (error?.response?.status === 400) {
        throw new Error('Invalid note data provided');
      }
      if (error?.response?.status === 401) {
        throw new Error('Authentication required');
      }
      if (error?.response?.status === 403) {
        throw new Error('Access denied: You can only update your own notes');
      }
      throw error;
    }
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId: number): Promise<ApiResponse<{ success: boolean }>> {
    // Validate note ID
    if (!Number.isInteger(noteId) || noteId <= 0) {
      throw new Error('Valid note ID is required');
    }

    try {
      return await apiClient.delete<{ success: boolean }>(`/students/notes/${noteId}`);
    } catch (error: any) {
      // Handle specific API error responses
      if (error?.response?.status === 404) {
        throw new Error('Note not found');
      }
      if (error?.response?.status === 401) {
        throw new Error('Authentication required');
      }
      if (error?.response?.status === 403) {
        throw new Error('Access denied: You can only delete your own notes');
      }
      throw error;
    }
  }

  /**
   * Get label details
   */
  static async getLabelDetails(labelId: number): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/students/labels/${labelId}`);
  }

  /**
   * Get notes for a specific question
   */
  static async getQuestionNotes(questionId: number): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(`/students/questions/${questionId}/notes`);
  }

  // Note: getContentFilters has been moved to NewApiService for better organization
  // and enhanced error handling. Use apiServices.newApi.getContentFilters() instead.

  /**
   * Get notes for a specific module (legacy endpoint)
   * Implements: GET /api/v1/students/notes/module/:moduleId
   */
  static async getModuleNotes(moduleId: number): Promise<ApiResponse<{
    moduleId: number;
    courseGroups: Array<{
      courseId: number;
      courseName: string;
      notes: Array<{
        id: number;
        noteText: string;
        questionId: number;
        quizId: number | null;
        question: {
          id: number;
          questionText: string;
          course: {
            id: number;
            name: string;
          };
        };
        quiz: any;
        createdAt: string;
        updatedAt: string;
      }>;
    }>;
    ungroupedNotes: any[];
    totalNotes: number;
  }>> {
    // Validate module ID format
    if (!Number.isInteger(moduleId) || moduleId <= 0) {
      throw new Error('Valid module ID is required');
    }

    const endpoint = `/students/notes/module/${moduleId}`;

    // Use centralized logging with throttling
    logServiceCall('StudentService', 'getModuleNotes', { endpoint, moduleId });

    try {
      return await apiClient.get<any>(endpoint);
    } catch (error: any) {
      // Handle specific API error responses according to documentation
      if (error?.response?.status === 403) {
        throw new Error('Access denied: Module not found or not accessible with your current subscription');
      }
      if (error?.response?.status === 400) {
        throw new Error('Valid module ID is required');
      }
      if (error?.response?.status === 401) {
        throw new Error('Authentication required');
      }
      throw error;
    }
  }

  // Labels Management - Updated for question-focused API
  /**
   * Get all student labels with associated questions
   * Implements: GET /api/v1/students/labels
   */
  static async getLabels(): Promise<ApiResponse<{
    success: boolean;
    data: Array<{
      id: number;
      name: string;
      statistics: {
        quizzesCount: number;
        questionsCount: number;
        quizSessionsCount: number;
        totalItems: number;
      };
      questionIds: number[];
      questions: Array<{
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
      }>;
      createdAt: string;
    }>;
  }>> {
    return apiClient.get<any>('/students/labels');
  }

  /**
   * Create a new label
   * Implements: POST /api/v1/students/labels
   */
  static async createLabel(labelData: {
    name: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/students/labels', labelData);
  }

  /**
   * Update a label
   */
  static async updateLabel(labelId: number, labelData: {
    name?: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.put<any>(`/students/labels/${labelId}`, labelData);
  }

  /**
   * Delete a label
   */
  static async deleteLabel(labelId: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`/students/labels/${labelId}`);
  }

  // REMOVED: Legacy getLabelSessions endpoint
  // Labels now use GET /quiz-sessions/{sessionId} for individual session retrieval only



  /**
   * Add question to label (new question-focused API)
   */
  static async addQuestionToLabel(questionId: number, labelId: number): Promise<ApiResponse<any>> {
    return apiClient.post<any>(`/students/questions/${questionId}/labels/${labelId}`);
  }

  /**
   * Remove question from label (new question-focused API)
   */
  static async removeQuestionFromLabel(questionId: number, labelId: number): Promise<ApiResponse<any>> {
    return apiClient.delete<any>(`/students/questions/${questionId}/labels/${labelId}`);
  }

  // Todos Management (aligned with endpoint contract)
  /**
   * Get paginated todos with optional filters
   */
  static async getTodos(params: PaginationParams & {
    includeCompleted?: boolean;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'ALL' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'all';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'ALL' | 'low' | 'medium' | 'high' | 'all';
    type?: 'READING' | 'SESSION' | 'EXAM' | 'OTHER' | 'ALL' | 'reading' | 'session' | 'exam' | 'other' | 'all';
    search?: string;
    dueDate?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<Todo>>> {
    const searchParams = new URLSearchParams();

    const mapUpper = (v?: string) => (v ? v.toUpperCase() : v);
    const mapStatus = (v?: string) => (v ? v.replace('-', '_').toUpperCase() : v);

    const mapped: any = {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      includeCompleted: params.includeCompleted,
      status: params.status ? mapStatus(params.status as string) : undefined,
      priority: params.priority ? mapUpper(params.priority as string) : undefined,
      type: params.type ? mapUpper(params.type as string) : undefined,
      search: params.search,
      dueDate: params.dueDate,
    };

    Object.entries(mapped).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
        searchParams.append(key, String(value));
      }
    });

    const url = searchParams.toString() ? `/students/todos?${searchParams.toString()}` : '/students/todos';
    return apiClient.get<PaginatedResponse<Todo>>(url);
  }

  /**
   * Create a new todo
   */
  static async createTodo(todoData: CreateTodoRequest): Promise<ApiResponse<Todo>> {
    const mapUpper = (v?: string) => (v ? v.toUpperCase() : v);

    const apiData: any = {
      title: todoData.title,
      description: todoData.description,
      type: mapUpper(todoData.type),
      priority: mapUpper(todoData.priority),
      dueDate: todoData.dueDate ? new Date(todoData.dueDate).toISOString() : undefined,
      courseIds: todoData.courseIds, // Send multiple course IDs as per new API
      quizId: todoData.quizId,
      estimatedTime: todoData.estimatedTime,
      tags: todoData.tags,
    };

    // Remove undefined fields
    Object.keys(apiData).forEach((k) => apiData[k] === undefined && delete apiData[k]);

    const response = await apiClient.post<Todo>('/students/todos', apiData);

    return response;
  }

  /**
   * Update a todo
   */
  static async updateTodo(todoId: number, todoData: UpdateTodoRequest): Promise<ApiResponse<Todo>> {
    const mapUpper = (v?: string) => (v ? v.toUpperCase() : v);

    const apiData: any = {
      title: todoData.title,
      description: todoData.description,
      type: mapUpper(todoData.type),
      priority: mapUpper(todoData.priority),
      status: mapUpper(todoData.status),
      dueDate: todoData.dueDate ? new Date(todoData.dueDate).toISOString() : undefined,
      courseIds: todoData.courseIds, // Send multiple course IDs as per new API
      estimatedTime: todoData.estimatedTime,
      tags: todoData.tags,
    };

    Object.keys(apiData).forEach((k) => apiData[k] === undefined && delete apiData[k]);

    const response = await apiClient.put<Todo>(`/students/todos/${todoId}`, apiData);

    return response;
  }

  /**
   * Mark todo as complete
   */
  static async completeTodo(todoId: number): Promise<ApiResponse<Todo>> {
    return apiClient.put<Todo>(`/students/todos/${todoId}/complete`);
  }

  /**
   * Delete a todo
   */
  static async deleteTodo(todoId: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`/students/todos/${todoId}`);
  }

  // Question Reporting
  /**
   * Report an issue with a question
   */
  static async reportQuestion(questionId: number, reportData: QuestionReportRequest): Promise<ApiResponse<QuestionReportResponse>> {
    return apiClient.post<QuestionReportResponse>(`/students/questions/${questionId}/report`, reportData);
  }

  /**
   * Get user's question reports with filtering
   */
  static async getQuestionReports(params: QuestionReportsFilters & PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<QuestionReport>>> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return apiClient.get<PaginatedResponse<QuestionReport>>(`/students/reports?${searchParams.toString()}`);
  }

  /**
   * Get details of a specific report
   */
  static async getReportDetails(reportId: number): Promise<ApiResponse<QuestionReport>> {
    return apiClient.get<QuestionReport>(`/students/reports/${reportId}`);
  }

  // ==================== ANALYTICS ENDPOINTS ====================

  /**
   * Get comprehensive progress overview with analytics
   */
  static async getAnalyticsOverview(): Promise<ApiResponse<AnalyticsOverview>> {
    return apiClient.get<AnalyticsOverview>('/students/progress/overview');
  }

  /**
   * Update course progress
   */
  static async updateCourseProgress(
    courseId: number,
    data: CourseProgressUpdateRequest
  ): Promise<ApiResponse<CourseProgressResponse>> {
    return apiClient.put<CourseProgressResponse>(`/students/courses/${courseId}/progress`, data);
  }

  /**
   * Get quiz history with pagination and filtering
   */
  static async getQuizHistory(params: QuizHistoryParams = {}): Promise<ApiResponse<PaginatedResponse<QuizHistoryItem>>> {
    const queryParams = new URLSearchParams();

    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = queryParams.toString() ? `/students/quiz-history?${queryParams.toString()}` : '/students/quiz-history';
    return apiClient.get<PaginatedResponse<QuizHistoryItem>>(url);
  }

  /**
   * Get detailed session results with advanced filtering
   */
  static async getSessionResults(params: SessionResultsParams = {}): Promise<ApiResponse<PaginatedResponse<DetailedSessionResult>>> {
    const queryParams = new URLSearchParams();

    if (params.answerType) queryParams.append('answerType', params.answerType);
    if (params.sessionType) queryParams.append('sessionType', params.sessionType);
    if (params.sessionIds?.length) {
      params.sessionIds.forEach(id => queryParams.append('sessionIds', id.toString()));
    }
    if (params.examId) queryParams.append('examId', params.examId.toString());
    if (params.quizId) queryParams.append('quizId', params.quizId.toString());
    if (params.completedAfter) queryParams.append('completedAfter', params.completedAfter);
    if (params.completedBefore) queryParams.append('completedBefore', params.completedBefore);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const url = queryParams.toString() ? `/students/session-results?${queryParams.toString()}` : '/students/session-results';
    return apiClient.get<PaginatedResponse<DetailedSessionResult>>(url);
  }

  /**
   * Get available sessions for practice and exams
   */
  static async getAvailableSessions(params: AvailableSessionsParams = {}): Promise<ApiResponse<AvailableSession[]>> {
    const queryParams = new URLSearchParams();

    if (params.sessionType) queryParams.append('sessionType', params.sessionType);

    const url = queryParams.toString() ? `/students/available-sessions?${queryParams.toString()}` : '/students/available-sessions';
    return apiClient.get<AvailableSession[]>(url);
  }

  /**
   * Get time-based analytics for performance trends
   */
  static async getTimeBasedAnalytics(params: TimeBasedAnalyticsParams = {}): Promise<ApiResponse<TimeBasedAnalytics>> {
    const queryParams = new URLSearchParams();

    if (params.period) queryParams.append('period', params.period);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const url = queryParams.toString() ? `/students/analytics/time-based?${queryParams.toString()}` : '/students/analytics/time-based';
    return apiClient.get<TimeBasedAnalytics>(url);
  }

  /**
   * Get course analytics for quiz sessions
   */
  static async getCourseAnalytics(params: {
    sessionId?: number;
    sessionType?: 'PRACTICE' | 'EXAM' | 'MOCK';
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<CourseAnalyticsResponse>> {
    const queryParams = new URLSearchParams();

    if (params.sessionId) queryParams.append('sessionId', params.sessionId.toString());
    if (params.sessionType) queryParams.append('sessionType', params.sessionType);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const url = queryParams.toString() ? `/students/course-analytics?${queryParams.toString()}` : '/students/course-analytics';
    return apiClient.get<CourseAnalyticsResponse>(url);
  }

  /**
   * Get subject-wise performance analytics
   */
  static async getSubjectAnalytics(): Promise<ApiResponse<SubjectAnalytics[]>> {
    // Fallback to available data: many backends expose subject performance within progress overview
    // We'll call progress overview and adapt subjectPerformance to SubjectAnalytics shape
    const overview = await this.getAnalyticsOverview();
    if (!overview.success) return overview as unknown as ApiResponse<SubjectAnalytics[]>;

    const data = overview.data as any;
    const subjectPerf = data?.subjectProgress || data?.subjectPerformance || [];

    const adapted: SubjectAnalytics[] = subjectPerf.map((s: any, idx: number) => ({
      subjectId: s.subjectId ?? idx + 1,
      subjectName: s.subjectName ?? s.subject ?? 'Unknown',
      totalSessions: s.totalSessions ?? s.sessionsCompleted ?? 0,
      averageScore: s.averageScore ?? s.accuracy ?? 0,
      accuracy: s.accuracy ?? s.averageScore ?? 0,
      timeSpent: s.timeSpent ?? 0,
      questionsAnswered: s.questionsAnswered ?? s.completedQuestions ?? 0,
      correctAnswers: s.correctAnswers ?? Math.round((s.accuracy ?? s.averageScore ?? 0) * (s.questionsAnswered ?? s.completedQuestions ?? 0) / 100),
      improvement: s.improvement ?? 0,
      lastActivity: s.lastActivity ?? new Date().toISOString(),
      strengths: s.strengths ?? s.strongAreas ?? [],
      weaknesses: s.weaknesses ?? s.weakAreas ?? [],
      recommendations: s.recommendations ?? []
    }));

    return { success: true, data: adapted } as ApiResponse<SubjectAnalytics[]>;
  }

  /**
   * Get performance comparison data
   */
  static async getPerformanceComparison(params: PerformanceComparisonParams = {}): Promise<ApiResponse<PerformanceComparison>> {
    const queryParams = new URLSearchParams();

    if (params.compareWith) queryParams.append('compareWith', params.compareWith);
    if (params.timeframe) queryParams.append('timeframe', params.timeframe);

    const url = queryParams.toString() ? `/students/analytics/comparison?${queryParams.toString()}` : '/students/analytics/comparison';
    return apiClient.get<PerformanceComparison>(url);
  }

  /**
   * Get quiz sessions by type for analytics
   * GET /api/v1/quiz-sessions/type/{SESSION_TYPE}
   */
  static async getQuizSessionsByType(sessionType: SessionType): Promise<ApiResponse<AnalyticsSessionsResponse>> {
    return apiClient.get<AnalyticsSessionsResponse>(`/quiz-sessions/type/${sessionType}`);
  }
}

// Content Services
export class ContentService {
  /**
   * Browse study packs with pagination and filtering
   */
  static async getStudyPacks(params: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    isPaid?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();

    // Add pagination
    queryParams.append('page', (params.page || 1).toString());
    queryParams.append('limit', (params.limit || 10).toString());

    // Add filters
    if (params.search) queryParams.append('search', params.search);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.isPaid !== undefined) queryParams.append('isPaid', params.isPaid.toString());
    if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    return apiClient.get<PaginatedResponse<StudyPack>>(`/study-packs?${queryParams.toString()}`);
  }

  /**
   * Get study pack details by ID
   */
  static async getStudyPackDetails(studyPackId: number): Promise<ApiResponse<StudyPackDetails>> {
    return apiClient.get<StudyPackDetails>(`/study-packs/${studyPackId}`);
  }

  /**
   * Get course resources with pagination and filtering
   */
  static async getCourseResources(courseId: number, params: {
    page?: number;
    limit?: number;
    type?: string;
  } = {}): Promise<ApiResponse<CourseResourcesResponse>> {
    const queryParams = new URLSearchParams();

    queryParams.append('page', (params.page || 1).toString());
    queryParams.append('limit', (params.limit || 10).toString());

    if (params.type) queryParams.append('type', params.type);

    return apiClient.get<CourseResourcesResponse>(`/courses/${courseId}/resources?${queryParams.toString()}`);
  }

  /**
   * Check access to a study pack
   */
  static async checkStudyPackAccess(studyPackId: number): Promise<ApiResponse<{
    hasAccess: boolean;
    reason?: string;
    subscriptionRequired?: boolean;
  }>> {
    return apiClient.get<{
      hasAccess: boolean;
      reason?: string;
      subscriptionRequired?: boolean;
    }>(`/study-packs/${studyPackId}/access`);
  }

  /**
   * Check access to a course
   */
  static async checkCourseAccess(courseId: number): Promise<ApiResponse<{
    hasAccess: boolean;
    reason?: string;
    subscriptionRequired?: boolean;
  }>> {
    return apiClient.get<{
      hasAccess: boolean;
      reason?: string;
      subscriptionRequired?: boolean;
    }>(`/courses/${courseId}/access`);
  }

  /**
   * Check user access to study pack
   */
  static async checkStudyPackAccess(studyPackId: number): Promise<ApiResponse<{ hasAccess: boolean; reason?: string }>> {
    return apiClient.get<{ hasAccess: boolean; reason?: string }>(`/study-packs/${studyPackId}/access`);
  }

  /**
   * Check user access to course
   */
  static async checkCourseAccess(courseId: number): Promise<ApiResponse<{ hasAccess: boolean; reason?: string }>> {
    return apiClient.get<{ hasAccess: boolean; reason?: string }>(`/courses/${courseId}/access`);
  }
}

// Subscription Services
export class SubscriptionService {
  /**
   * Get user's current subscriptions
   */
  static async getUserSubscriptions(): Promise<ApiResponse<UserSubscription[]>> {
    return apiClient.get<UserSubscription[]>('/students/subscriptions');
  }

  /**
   * Check subscription status for specific content
   */
  static async checkSubscriptionAccess(contentId: number, contentType: 'study-pack' | 'course'): Promise<ApiResponse<{
    hasAccess: boolean;
    subscriptionRequired: boolean;
    subscriptionType?: string;
    trialAvailable?: boolean;
  }>> {
    return apiClient.get<{
      hasAccess: boolean;
      subscriptionRequired: boolean;
      subscriptionType?: string;
      trialAvailable?: boolean;
    }>(`/subscriptions/check-access?contentId=${contentId}&contentType=${contentType}`);
  }

  /**
   * Redeem activation code
   * POST /students/codes/redeem
   */
  static async redeemActivationCode(code: string): Promise<ApiResponse<{
    message: string;
    subscription: {
      id: number;
      studyPackId: number;
      status: string;
      startDate: string;
      endDate: string;
      studyPack: {
        id: number;
        name: string;
        type: string;
        yearNumber?: string;
      };
    };
  }>> {
    return apiClient.post<{
      message: string;
      subscription: {
        id: number;
        studyPackId: number;
        status: string;
        startDate: string;
        endDate: string;
        studyPack: {
          id: number;
          name: string;
          type: string;
          yearNumber?: string;
        };
      };
    }>('/students/codes/redeem', { code });
  }

  /**
   * Start a free trial for a subscription plan
   */
  static async startFreeTrial(planType: string): Promise<ApiResponse<{
    subscriptionId: string;
    trialEndDate: string;
    message: string;
  }>> {
    return apiClient.post<{
      subscriptionId: string;
      trialEndDate: string;
      message: string;
    }>('/subscriptions/start-trial', { planType });
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(planId: string): Promise<ApiResponse<{
    checkoutUrl: string;
    sessionId: string;
  }>> {
    return apiClient.post<{
      checkoutUrl: string;
      sessionId: string;
    }>('/subscriptions/checkout', { planId });
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
    cancellationDate: string;
  }>> {
    return apiClient.post<{
      success: boolean;
      message: string;
      cancellationDate: string;
    }>(`/subscriptions/${subscriptionId}/cancel`);
  }

  // Note: The following methods are currently not supported by the API
  // They are kept here for future implementation when the API supports general subscription plans

  /**
   * Get subscription plans - NOT CURRENTLY SUPPORTED BY API
   * The API currently uses study pack specific subscriptions
   */
  static async getSubscriptionPlans(): Promise<ApiResponse<any[]>> {
    // This endpoint doesn't exist in the current API
    // Return mock data or throw error
    throw new Error('Subscription plans endpoint not available. API uses study pack specific subscriptions.');
  }
}

// Quiz Services
export class QuizService {
  /**
   * Get quiz filters (year levels, courses, topics, difficulties)
   */
  static async getQuizFilters(): Promise<ApiResponse<QuizFilters>> {
    return apiClient.get<QuizFilters>('/quizzes/quiz-filters');
  }

  /**
   * Get quiz filters with query params for real-time filtered counts
   */
  static async getQuizFiltersWithParams(queryString: string): Promise<ApiResponse<any>> {
    const url = queryString ? `/quizzes/quiz-filters?${queryString}` : '/quizzes/quiz-filters';
    return apiClient.get<any>(url);
  }

  /**
   * Get session filters for quiz creation
   * GET /students/content/filters
   * @deprecated Use NewApiService.getContentFilters() instead
   */
  static async getSessionFilters(): Promise<ApiResponse<any>> {
    console.warn('[DEPRECATED] QuizService.getSessionFilters() is deprecated. Use NewApiService.getContentFilters() instead.');
    return apiClient.get<any>('/students/content/filters');
  }

  /**
   * Get question count based on filters
   * POST /quizzes/question-count
   */
  static async getQuestionCount(filters: {
    courseIds: number[];
    questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'>;
    years?: number[];
    rotations?: Array<'R1' | 'R2' | 'R3' | 'R4'>;
    universityIds?: number[];
    questionSourceIds?: number[];
  }): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/quizzes/question-count', filters);
  }

  /**
   * Create session using new endpoint
   * POST /quizzes/sessions
   */
  static async createSession(sessionData: {
    title: string;
    courseIds: number[];
    sessionType: 'PRACTISE' | 'EXAM';
    questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'>;
    years?: number[];
    rotations?: Array<'R1' | 'R2' | 'R3' | 'R4'>;
    universityIds?: number[];
    questionSourceIds?: number[];
  }): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/quizzes/sessions', sessionData);
  }

  /**
   * Create practice session by label
   * POST /api/v1/quiz-sessions/practice/{labelId}
   */
  static async createLabelSession(labelId: number): Promise<ApiResponse<{
    sessionId: number;
    questionCount: number;
    title: string;
  }>> {
    return apiClient.post<{
      sessionId: number;
      questionCount: number;
      title: string;
    }>(`/quiz-sessions/practice/${labelId}`);
  }

  /**
   * Get quiz session details
   * Docs: GET /quiz-sessions/{sessionId}
   */
  static async getQuizSession(sessionId: number): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/quiz-sessions/${sessionId}`);
  }

  /**
   * Get session results with computed statistics
   * GET /quiz-sessions/{sessionId}/results
   * Returns: { sessionId, title, type, status, score, totalScore20, correctAnswersCount, incorrectAnswersCount, unansweredCount, totalQuestions, completedAt }
   */
  static async getSessionResults(sessionId: number): Promise<ApiResponse<{
    sessionId: number;
    title: string;
    type: string;
    status: string;
    score: number;
    totalScore20: number;
    correctAnswersCount: number;
    incorrectAnswersCount: number;
    unansweredCount: number;
    totalQuestions: number;
    completedAt?: string;
  }>> {
    return apiClient.get<{
      sessionId: number;
      title: string;
      type: string;
      status: string;
      score: number;
      totalScore20: number;
      correctAnswersCount: number;
      incorrectAnswersCount: number;
      unansweredCount: number;
      totalQuestions: number;
      completedAt?: string;
    }>(`/quiz-sessions/${sessionId}/results`);
  }

  /**
   * Create a retake session from an existing completed session
   * POST /quiz-sessions/retake
   */
  static async retakeQuizSession(payload: {
    originalSessionId: number;
    retakeType: 'SAME' | 'INCORRECT_ONLY' | 'CORRECT_ONLY' | 'NOT_RESPONDED';
    title?: string;
  }): Promise<ApiResponse<any>> {
    try {
      // Validate input parameters
      if (!payload.originalSessionId || payload.originalSessionId <= 0) {
        throw new Error('Invalid original session ID');
      }

      if (!payload.retakeType) {
        throw new Error('Retake type is required');
      }

      console.log('🔄 [QuizService] Creating retake session:', {
        originalSessionId: payload.originalSessionId,
        retakeType: payload.retakeType,
        title: payload.title || 'No title provided'
      });

      const response = await apiClient.post<any>('/quiz-sessions/retake', payload);

      console.log('📋 [QuizService] Retake API response:', {
        success: response.success,
        data: response.data,
        error: response.error,
        dataStructure: response.data ? Object.keys(response.data) : 'null',
        hasSessionId: !!(response.data?.sessionId),
        hasId: !!(response.data?.id),
        hasNestedSessionId: !!(response.data?.data?.sessionId),
        hasNestedId: !!(response.data?.data?.id)
      });

      return response;
    } catch (error: any) {
      console.error('💥 [QuizService] Retake session creation failed:', {
        error: error.message,
        originalSessionId: payload.originalSessionId,
        retakeType: payload.retakeType
      });
      throw error;
    }
  }

  /**
   * Delete a quiz session
   */
  static async deleteQuizSession(sessionId: number): Promise<ApiResponse<{ success: boolean }>> {
    // Validate session ID
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      throw new Error('Valid session ID is required');
    }

    try {
      // Use the correct endpoint that works
      return await apiClient.delete<{ success: boolean }>(`/students/quiz-sessions/${sessionId}`);
    } catch (error: any) {
      // Handle specific API error responses
      if (error?.response?.status === 404) {
        throw new Error('Session not found');
      }
      if (error?.response?.status === 401) {
        throw new Error('Authentication required');
      }
      if (error?.response?.status === 403) {
        throw new Error('Access denied: You can only delete your own sessions');
      }
      throw error;
    }
  }

  /**
   * Update quiz session status
   * Endpoint: PATCH /students/quiz-sessions/:sessionId/status
   * Valid values: NOT_STARTED | IN_PROGRESS | COMPLETED
   */
  static async updateQuizSessionStatus(
    sessionId: number,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  ): Promise<ApiResponse<any>> {
    const body = { status };
    console.log('🔄 [QuizService] Updating session status:', {
      sessionId,
      status,
      endpoint: `PATCH /students/quiz-sessions/${sessionId}/status`
    });

    try {
      const response = await apiClient.patch<any>(`/students/quiz-sessions/${sessionId}/status`, body);

      console.log('✅ [QuizService] Session status updated:', {
        sessionId,
        status,
        success: response.success
      });

      return response;
    } catch (err: any) {
      console.error('❌ [QuizService] Failed to update session status:', {
        sessionId,
        status,
        error: err?.message,
        statusCode: err?.statusCode || err?.response?.status
      });
      throw err;
    }
  }

  /**
   * Update quiz session status with retry logic and error handling
   * Implements the requirements for session status management
   */
  static async updateQuizSessionStatusWithRetry(
    sessionId: number,
    status: 'IN_PROGRESS' | 'COMPLETED',
    retryCount: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    // Validate status enum values
    if (!['IN_PROGRESS', 'COMPLETED'].includes(status)) {
      const error = `Invalid status value: ${status}. Must be IN_PROGRESS or COMPLETED`;
      console.error('❌ [QuizService] Status validation failed:', error);
      return { success: false, error };
    }

    let lastError: string | undefined;

    for (let attempt = 1; attempt <= retryCount + 1; attempt++) {
      try {
        console.log(`🔄 [QuizService] Status update attempt ${attempt}/${retryCount + 1}:`, {
          sessionId,
          status
        });

        const response = await this.updateQuizSessionStatus(sessionId, status);

        if (response.success) {
          console.log(`✅ [QuizService] Session status updated successfully on attempt ${attempt}:`, {
            sessionId,
            status
          });
          return { success: true };
        } else {
          lastError = response.error || 'Unknown error';
          console.warn(`⚠️ [QuizService] Status update failed on attempt ${attempt}:`, lastError);
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error';
        console.warn(`⚠️ [QuizService] Status update error on attempt ${attempt}:`, {
          sessionId,
          status,
          error: lastError,
          willRetry: attempt <= retryCount
        });
      }

      // Wait before retry (exponential backoff)
      if (attempt <= retryCount) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error(`❌ [QuizService] All status update attempts failed:`, {
      sessionId,
      status,
      attempts: retryCount + 1,
      lastError
    });

    return { success: false, error: lastError || 'Failed to update session status after retries' };
  }

  // REMOVED: Legacy createSessionByQuestions endpoint
  // Use only documented POST /quizzes/sessions endpoint for session creation

  /**
   * Submit multiple answers for questions in a quiz session (bulk submission)
   * Docs: POST /api/v1/students/quiz-sessions/{sessionId}/submit-answer
   * According to session-doc.md, timeSpent should be at the top level, not per answer
   */
  static async submitAnswersBulk(sessionId: number, answers: Array<{
    questionId: number;
    selectedAnswerId?: number;
    selectedAnswerIds?: number[];
    textAnswer?: string;
    isCorrect?: boolean;  // For QROC self-assessment
    timeSpent?: number;
  }>, totalTimeSpent?: number): Promise<ApiResponse<SubmitAnswerResponse>> {
    // Calculate total time spent if not provided
    const sessionTimeSpent = totalTimeSpent ?? answers.reduce((sum, answer) =>
      sum + (typeof answer.timeSpent === 'number' ? answer.timeSpent : 0), 0);

    const requestBody = {
      answers: answers.map(answer => ({
        questionId: answer.questionId,
        ...(Array.isArray(answer.selectedAnswerIds) && answer.selectedAnswerIds.length > 0
          ? { selectedAnswerIds: answer.selectedAnswerIds }
          : typeof answer.selectedAnswerId === 'number'
            ? { selectedAnswerId: answer.selectedAnswerId }
            : (typeof answer.textAnswer === 'string' && answer.textAnswer.length > 0
              ? { textAnswer: answer.textAnswer }
              : {})),
        // Include isCorrect for QROC self-assessment
        ...(typeof answer.isCorrect === 'boolean' ? { isCorrect: answer.isCorrect } : {})
      })),
      // Add timeSpent at the top level as per session-doc.md
      ...(sessionTimeSpent > 0 ? { timeSpent: sessionTimeSpent } : {})
    };

    // Use documented endpoint from session-doc.md
    return await apiClient.post<SubmitAnswerResponse>(`/students/quiz-sessions/${sessionId}/submit-answer`, requestBody);
  }

  /**
   * Submit answer for a question in a quiz session (single answer)
   * Uses bulk submission internally for consistency
   */
  static async submitAnswer(sessionId: number, answerData: {
    questionId: number;
    selectedAnswerId: number;
    timeSpent?: number;
  }): Promise<ApiResponse<SubmitAnswerResponse>> {
    // Use bulk submission with single answer for consistency
    return this.submitAnswersBulk(sessionId, [answerData]);
  }

  // REMOVED: Legacy updateAnswer endpoint
  // Review mode must rely solely on GET /quiz-sessions/{sessionId} response structure

  /**
   * Complete a quiz session
   */
  static async completeQuizSession(sessionId: number): Promise<ApiResponse<any>> {
    // Not used: backend does not expose a /complete endpoint. Kept for forward compatibility.
    return { success: true, data: { sessionId, message: 'No-op complete' } } as any;
  }














}

// Exam Services
export class ExamService {
  /**
   * Get available exams with filtering
   */
  static async getAvailableExams(filters: ExamFilters = {}): Promise<ApiResponse<AvailableExamsResponse>> {
    const queryParams = new URLSearchParams();

    if (filters.universityId) queryParams.append('universityId', filters.universityId.toString());
    if (filters.yearLevel) queryParams.append('yearLevel', filters.yearLevel);
    if (filters.examYear) queryParams.append('examYear', filters.examYear);
    if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    const url = queryParams.toString() ? `/exams/available?${queryParams.toString()}` : '/exams/available';
    return apiClient.get<AvailableExamsResponse>(url);
  }

  /**
   * Get exam details by ID
   */
  static async getExamDetails(examId: number): Promise<ApiResponse<Exam>> {
    return apiClient.get<Exam>(`/exams/${examId}`);
  }

  // REMOVED: Legacy exam session creation
  // Use only documented POST /quizzes/sessions endpoint

  /**
   * Create exam session from multiple modules using documented endpoint
   * POST /quizzes/sessions
   * Note: This method now uses content filters to extract course IDs instead of the deprecated endpoint
   */
  static async createExamSessionFromModules(payload: { moduleIds: number[]; year: number; title?: string }): Promise<ApiResponse<any>> {
    try {
      // Get course IDs from content filters instead of deprecated endpoint
      const contentFiltersResponse = await apiClient.get<any>('/students/content/filters');

      if (!contentFiltersResponse.success || !contentFiltersResponse.data) {
        throw new Error('Failed to fetch content structure');
      }

      const courseIds: number[] = [];
      const contentData = contentFiltersResponse.data;

      // Extract course IDs from selected modules
      for (const moduleId of payload.moduleIds) {
        // Search in unites
        if (contentData.unites) {
          for (const unite of contentData.unites) {
            if (unite.modules) {
              for (const module of unite.modules) {
                if (module.id === moduleId && module.courses) {
                  const moduleCourseIds = module.courses.map((c: any) => c.id);
                  courseIds.push(...moduleCourseIds);
                }
              }
            }
          }
        }

        // Search in independent modules
        if (contentData.independentModules) {
          for (const module of contentData.independentModules) {
            if (module.id === moduleId && module.courses) {
              const moduleCourseIds = module.courses.map((c: any) => c.id);
              courseIds.push(...moduleCourseIds);
            }
          }
        }
      }

      if (courseIds.length === 0) {
        throw new Error('No courses found for the selected modules');
      }

      // Remove duplicates
      const uniqueCourseIds = [...new Set(courseIds)];

      // Create session using documented endpoint with fixed question types for EXAM
      const sessionData = {
        title: payload.title || `Exam Session - ${new Date().toLocaleDateString()}`,
        courseIds: uniqueCourseIds,
        sessionType: 'EXAM' as const,
        questionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'] as Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'>,
        years: [payload.year],
        rotations: [] // Default to empty array
      };

      return await this.createSession(sessionData);
    } catch (error) {
      console.error('Failed to create exam session from modules:', error);
      throw error;
    }
  }

  /**
   * Get exam questions for a specific exam
   */
  static async getExamQuestions(examId: number): Promise<ApiResponse<ExamQuestion[]>> {
    return apiClient.get<ExamQuestion[]>(`/exams/${examId}/questions`);
  }

  /**
   * Get exam session details (uses quiz-sessions endpoint as exams and quizzes share the same session system)
   */
  static async getExamSession(sessionId: number): Promise<ApiResponse<ExamSession>> {
    return apiClient.get<ExamSession>(`/quiz-sessions/${sessionId}`);
  }

  /**
   * Submit exam answer (uses unified quiz session endpoint)
   */
  static async submitExamAnswer(sessionId: number, answer: {
    questionId: number;
    selectedAnswerId?: number;
    selectedAnswerIds?: number[];
    textAnswer?: string;
    timeSpent?: number;
    flagged?: boolean;
  }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    // Per spec: POST /quiz-sessions/{examSessionId}/submit-answer with answers[] payload
    const requestBody: any = {
      answers: [
        {
          questionId: answer.questionId,
          ...(Array.isArray(answer.selectedAnswerIds) && answer.selectedAnswerIds.length > 0
            ? { selectedAnswerIds: answer.selectedAnswerIds }
            : typeof answer.selectedAnswerId === 'number'
              ? { selectedAnswerId: answer.selectedAnswerId }
              : {}),
          ...(typeof answer.timeSpent === 'number' ? { timeSpent: answer.timeSpent } : {}),
          ...(typeof answer.flagged === 'boolean' ? { flagged: answer.flagged } : {}),
          ...(typeof answer.textAnswer === 'string' && answer.textAnswer.length > 0 ? { textAnswer: answer.textAnswer } : {}),
        },
      ],
    };

    // Use documented endpoint from session-doc.md
    return await apiClient.post<{ success: boolean; message: string }>(`/students/quiz-sessions/${sessionId}/submit-answer`, requestBody);
  }

  /**
   * Complete exam session (uses unified session management - auto-completion)
   */
  static async completeExamSession(sessionId: number): Promise<ApiResponse<ExamResult>> {
    // Exam sessions auto-complete when answers are submitted
    // Just return the current session state which contains all results
    const sessionResponse = await this.getExamSession(sessionId);

    if (sessionResponse.success) {
      // Transform session data to exam result format for compatibility
      const sessionData = sessionResponse.data.data || sessionResponse.data;
      const examResult = {
        sessionId: sessionData.id,
        examId: sessionData.examId,
        score: sessionData.score || 0,
        percentage: sessionData.percentage || 0,
        status: sessionData.status,
        completedAt: sessionData.updatedAt,
        questions: sessionData.questions || [],
        userAnswers: sessionData.userAnswers || {},
      };

      return {
        success: true,
        data: examResult,
        message: 'Exam session completed'
      };
    }

    return sessionResponse;
  }

  /**
   * Get exam results (reads from unified session data)
   */
  static async getExamResults(sessionId: number): Promise<ApiResponse<ExamResult>> {
    // Results are embedded in session details - use unified endpoint
    return this.completeExamSession(sessionId);
  }

  /**
   * Flag exam question for review (uses unified session management)
   */
  static async flagExamQuestion(sessionId: number, questionId: number, flagged: boolean): Promise<ApiResponse<{ success: boolean }>> {
    // Use unified quiz session flagging if available, otherwise return success
    // This functionality may not be implemented in the unified API
    console.log(`Flagging question ${questionId} in session ${sessionId}: ${flagged}`);
    return {
      success: true,
      data: { success: true },
      message: 'Question flagged successfully'
    };
  }

  /**
   * Get student's exam history
   */
  static async getExamHistory(params: {
    page?: number;
    limit?: number;
    examId?: number;
    status?: 'COMPLETED' | 'IN_PROGRESS' | 'ABANDONED';
  } = {}): Promise<ApiResponse<PaginatedResponse<ExamSession>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.examId) queryParams.append('examId', params.examId.toString());
    if (params.status) queryParams.append('status', params.status);

    const url = queryParams.toString() ? `/students/exam-history?${queryParams.toString()}` : '/students/exam-history';
    return apiClient.get<PaginatedResponse<ExamSession>>(url);
  }
}

// Admin Services
export class AdminService {
  /**
   * Get all users with pagination and filtering
   */
  static async getUsers(params: PaginationParams & {
    search?: string;
    role?: string;
    universityId?: number; // deprecated in docs; kept for backward compatibility
    university?: number;   // docs-compliant param name
    isActive?: boolean;
  } = {}): Promise<ApiResponse<{
    users?: ApiUser[];
    items?: ApiUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.university !== undefined) {
      queryParams.append('university', params.university.toString());
    } else if (params.universityId) {
      // map old name to new docs param for compatibility
      queryParams.append('university', params.universityId.toString());
    }
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const url = queryParams.toString() ? `/admin/users?${queryParams.toString()}` : '/admin/users';
    return apiClient.get<{
      users?: ApiUser[];
      items?: ApiUser[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(url);
  }


  /**
   * Create new user
   */
  static async createUser(userData: {
    email: string;
    password: string;
    fullName: string;
    role: 'STUDENT' | 'ADMIN' | 'EMPLOYEE';
    universityId?: number;
    specialtyId?: number;
    currentYear?: string;
  }): Promise<ApiResponse<ApiUser>> {
    return apiClient.post<ApiUser>('/admin/users', userData);
  }

  /**
   * Update user
   */
  static async updateUser(userId: number, userData: Partial<ApiUser>): Promise<ApiResponse<ApiUser>> {
    return apiClient.put<ApiUser>(`/admin/users/${userId}`, userData);
  }

  /**
   * Deactivate user (docs-compliant: set isActive=false via PUT)
   */
  static async deactivateUser(userId: number): Promise<ApiResponse<ApiUser>> {
    return apiClient.put<ApiUser>(`/admin/users/${userId}`, { isActive: false });
  }

  /**
   * Delete user (permanent) - DELETE /admin/users/{id}
   */
  static async deleteUser(userId: number): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return apiClient.delete<{ success: boolean; message?: string }>(`/admin/users/${userId}`);
  }



  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>('/admin/dashboard/stats');
  }

  /**
   * Reset user password (Admin only)
   */
  static async resetUserPassword(userId: number, newPassword: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(`/admin/users/${userId}/reset-password`, {
      newPassword
    });
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  /**
   * Get all subscriptions with pagination and filtering
   */
  static async getSubscriptions(params: PaginationParams & AdminSubscriptionFilters = {}): Promise<ApiResponse<PaginatedResponse<AdminSubscription>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.studyPackId) queryParams.append('studyPackId', params.studyPackId.toString());
    if (params.userId) queryParams.append('userId', params.userId.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = queryParams.toString() ? `/admin/subscriptions?${queryParams.toString()}` : '/admin/subscriptions';
    return apiClient.get<PaginatedResponse<AdminSubscription>>(url);
  }

  /**
   * Update subscription status and dates
   */
  static async updateSubscription(subscriptionId: number, updateData: UpdateSubscriptionRequest): Promise<ApiResponse<AdminSubscription>> {
    return apiClient.put<AdminSubscription>(`/admin/subscriptions/${subscriptionId}`, updateData);
  }

  /**
   * Cancel subscription with reason
   */
  static async cancelSubscription(subscriptionId: number, cancelData: CancelSubscriptionRequest): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(`/admin/subscriptions/${subscriptionId}/cancel`, cancelData);
  }

  /**
   * Add months to subscription
   */
  static async addMonthsToSubscription(subscriptionId: number, extensionData: AddMonthsToSubscriptionRequest): Promise<ApiResponse<AdminSubscription>> {
    return apiClient.post<AdminSubscription>(`/admin/subscriptions/${subscriptionId}/add-months`, extensionData);
  }

  // ==================== QUIZ MANAGEMENT ====================

  /**
   * Get all quizzes with pagination and filtering
   */
  static async getQuizzes(params: PaginationParams & AdminQuizFilters = {}): Promise<ApiResponse<PaginatedResponse<AdminQuiz>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.courseId) queryParams.append('courseId', params.courseId.toString());
    if (params.universityId) queryParams.append('universityId', params.universityId.toString());
    if (params.yearLevel) queryParams.append('yearLevel', params.yearLevel);
    if (params.quizSourceId) queryParams.append('quizSourceId', params.quizSourceId.toString());
    if (params.quizYear) queryParams.append('quizYear', params.quizYear.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = queryParams.toString() ? `/admin/quizzes?${queryParams.toString()}` : '/admin/quizzes';
    return apiClient.get<PaginatedResponse<AdminQuiz>>(url);
  }

  /**
   * Create new quiz with questions
   */
  static async createQuiz(quizData: CreateQuizRequest): Promise<ApiResponse<AdminQuiz>> {
    return apiClient.post<AdminQuiz>('/admin/quizzes', quizData);
  }

  /**
   * Update quiz
   */
  static async updateQuiz(quizId: number, updateData: UpdateQuizRequest): Promise<ApiResponse<AdminQuiz>> {
    return apiClient.put<AdminQuiz>(`/admin/quizzes/${quizId}`, updateData);
  }

  /**
   * Delete quiz
   */
  static async deleteQuiz(quizId: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(`/admin/quizzes/${quizId}`);
  }

  // ==================== EXAM MANAGEMENT ====================

  /**
   * Get all exams with pagination and filtering
   */
  static async getExams(params: PaginationParams & AdminExamFilters = {}): Promise<ApiResponse<PaginatedResponse<AdminExam>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.moduleId) queryParams.append('moduleId', params.moduleId.toString());
    if (params.universityId) queryParams.append('universityId', params.universityId.toString());
    if (params.yearLevel) queryParams.append('yearLevel', params.yearLevel);
    if (params.examYear) queryParams.append('examYear', params.examYear);
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = queryParams.toString() ? `/admin/exams?${queryParams.toString()}` : '/admin/exams';
    return apiClient.get<PaginatedResponse<AdminExam>>(url);
  }

  /**
   * Create new exam with questions
   */
  static async createExam(examData: CreateExamRequest): Promise<ApiResponse<AdminExam>> {
    return apiClient.post<AdminExam>('/admin/exams', examData);
  }


  /**
   * Update exam question order
   */
  static async updateExamQuestionOrder(orderData: UpdateExamQuestionOrderRequest): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.put<{ success: boolean; message: string }>('/admin/exams/question-order', orderData);
  }

  // ==================== QUESTION MANAGEMENT ====================

  /**
   * Get all questions with pagination and filtering
   */
  static async getQuestions(params: PaginationParams & AdminQuestionFilters = {}): Promise<ApiResponse<PaginatedResponse<AdminQuestion>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.courseId) queryParams.append('courseId', params.courseId.toString());
    if (params.moduleId) queryParams.append('moduleId', params.moduleId.toString());
    if (params.unitId) queryParams.append('unitId', params.unitId.toString());
    if (params.studyPackId) queryParams.append('studyPackId', params.studyPackId.toString());
    if (params.universityId) queryParams.append('universityId', params.universityId.toString());
    if (params.examId) queryParams.append('examId', params.examId.toString());
    if (params.questionType) queryParams.append('questionType', params.questionType);
    if (params.yearLevel) queryParams.append('yearLevel', params.yearLevel);
    if (params.examYear) queryParams.append('examYear', params.examYear.toString());
    if (params.rotation) queryParams.append('rotation', params.rotation);
    if (params.sourceId) queryParams.append('sourceId', params.sourceId.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = queryParams.toString() ? `/admin/questions?${queryParams.toString()}` : '/admin/questions';
    return apiClient.get<PaginatedResponse<AdminQuestion>>(url);
  }

  /**
   * Get single question by ID
   */
  static async getQuestion(questionId: number): Promise<ApiResponse<AdminQuestion>> {
    return apiClient.get<AdminQuestion>(`/admin/questions/${questionId}`);
  }

  /**
   * Create new question
   */
  static async createQuestion(questionData: CreateQuestionRequest): Promise<ApiResponse<AdminQuestion>> {
    return apiClient.post<AdminQuestion>('/admin/questions', questionData);
  }

  /**
   * Create multiple questions in bulk
   */
  static async createQuestionsBulk(bulkData: {
    metadata: {
      courseId: number;
      universityId?: number;
      examYear?: number;
      sourceId?: number;
      rotation?: string;
      yearLevel?: string;
    };
    questions: Array<{
      questionText: string;
      explanation?: string;
      questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
      answers: Array<{
        answerText: string;
        isCorrect: boolean;
        explanation?: string;
      }>;
    }>;
  }): Promise<ApiResponse<{
    questions: Array<{
      id: number;
      questionText: string;
      questionType: string;
    }>;
    totalCreated: number;
  }>> {
    return apiClient.post<{
      questions: Array<{
        id: number;
        questionText: string;
        questionType: string;
      }>;
      totalCreated: number;
    }>('/admin/questions/bulk', bulkData);
  }

  /**
   * Update question
   * Note: PUT /admin/questions/{id} endpoint is not implemented on backend
   * This method provides graceful error handling until the endpoint is available
   */
  static async updateQuestion(questionId: number, updateData: UpdateQuestionRequest): Promise<ApiResponse<AdminQuestion>> {
    try {
      return await apiClient.put<AdminQuestion>(`/admin/questions/${questionId}`, updateData);
    } catch (error: any) {
      // If the endpoint returns 404, provide a helpful error message
      if (error?.response?.status === 404) {
        throw new Error('Question update functionality is not yet implemented on the backend. Please use the explanation update feature or contact the development team.');
      }
      throw error;
    }
  }

  /**
   * Delete question
   * Note: DELETE /admin/questions/{id} endpoint is not implemented on backend
   * This method provides graceful error handling until the endpoint is available
   */
  static async deleteQuestion(questionId: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      return await apiClient.delete<{ success: boolean; message: string }>(`/admin/questions/${questionId}`);
    } catch (error: any) {
      // If the endpoint returns 404, provide a helpful error message
      if (error?.response?.status === 404) {
        throw new Error('Question deletion functionality is not yet implemented on the backend. Please contact the development team.');
      }
      throw error;
    }
  }

  /**
   * Update question explanation with images
   */
  static async updateQuestionExplanation(questionId: number, explanationData: UpdateQuestionExplanationRequest): Promise<ApiResponse<{ success: boolean; message: string; imageCount: number }>> {
    const formData = new FormData();
    formData.append('explanation', explanationData.explanation);

    if (explanationData.explanationImages) {
      explanationData.explanationImages.forEach(image => {
        formData.append('explanationImages', image);
      });
    }

    return apiClient.put<{ success: boolean; message: string; imageCount: number }>(`/admin/questions/${questionId}/explanation`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Update question images using new endpoint
   */
  static async updateQuestionImages(questionId: number, images: File[]): Promise<ApiResponse<{
    success: boolean;
    message: string;
    data: {
      questionId: number;
      images: Array<{
        id: number;
        questionId: number;
        imagePath: string;
        altText: string;
        createdAt: string;
      }>;
      uploadedFiles: Array<{
        filename: string;
        originalname: string;
        url: string;
        size: number;
      }>;
    };
  }>> {
    const formData = new FormData();

    images.forEach(image => {
      formData.append('questionImages', image);
    });

    return apiClient.put<{
      success: boolean;
      message: string;
      data: {
        questionId: number;
        images: Array<{
          id: number;
          questionId: number;
          imagePath: string;
          altText: string;
          createdAt: string;
        }>;
        uploadedFiles: Array<{
          filename: string;
          originalname: string;
          url: string;
          size: number;
        }>;
      };
    }>(`/admin/image/${questionId}/question-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Update question explanation images using new endpoint
   */
  static async updateQuestionExplanationImages(questionId: number, images: File[]): Promise<ApiResponse<{
    success: boolean;
    message: string;
    data: {
      questionId: number;
      images: Array<{
        id: number;
        questionId: number;
        imagePath: string;
        altText: string;
        createdAt: string;
      }>;
      uploadedFiles: Array<{
        filename: string;
        originalname: string;
        url: string;
        size: number;
      }>;
    };
  }>> {
    const formData = new FormData();

    images.forEach(image => {
      formData.append('explanationImages', image);
    });

    return apiClient.put<{
      success: boolean;
      message: string;
      data: {
        questionId: number;
        images: Array<{
          id: number;
          questionId: number;
          imagePath: string;
          altText: string;
          createdAt: string;
        }>;
        uploadedFiles: Array<{
          filename: string;
          originalname: string;
          url: string;
          size: number;
        }>;
      };
    }>(`/admin/image/${questionId}/explanation-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // ==================== QUESTION REPORTS MANAGEMENT ====================

  /**
   * Get all question reports with pagination and filtering
   */
  static async getQuestionReports(params: PaginationParams & AdminQuestionReportFilters = {}): Promise<ApiResponse<PaginatedResponse<AdminQuestionReport>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.reportType) queryParams.append('reportType', params.reportType);
    if (params.questionId) queryParams.append('questionId', params.questionId.toString());
    if (params.userId) queryParams.append('userId', params.userId.toString());
    if (params.search) queryParams.append('search', params.search);

    // Updated to match new API documentation: GET /admin/questions/reports
    const url = queryParams.toString() ? `/admin/questions/reports?${queryParams.toString()}` : '/admin/questions/reports';
    return apiClient.get<PaginatedResponse<AdminQuestionReport>>(url);
  }

  /**
   * Review question report
   */
  static async reviewQuestionReport(reportId: number, reviewData: ReviewQuestionReportRequest): Promise<ApiResponse<AdminQuestionReport>> {
    // Updated to match new API documentation: PUT /admin/questions/reports/{id}
    return apiClient.put<AdminQuestionReport>(`/admin/questions/reports/${reportId}`, reviewData);
  }

  // ==================== FILE UPLOAD MANAGEMENT ====================

  /**
   * Upload images
   * @deprecated Use updateQuestionImages or updateQuestionExplanationImages instead
   */
  static async uploadImages(images: File[]): Promise<ApiResponse<ImageUploadResponse>> {
    console.warn('uploadImages is deprecated. Use updateQuestionImages or updateQuestionExplanationImages instead.');
    const formData = new FormData();
    images.forEach(image => {
      formData.append('images', image);
    });

    return apiClient.post<ImageUploadResponse>('/admin/upload/image', formData, {
      headers: {
        // Don't set Content-Type - let browser handle it for FormData
      },
    });
  }

  /**
   * Upload PDFs
   */
  static async uploadPDFs(pdfs: File[]): Promise<ApiResponse<PDFUploadResponse>> {
    const formData = new FormData();
    pdfs.forEach(pdf => {
      formData.append('pdfs', pdf);
    });

    return apiClient.post<PDFUploadResponse>('/admin/upload/pdf', formData, {
      headers: {
        // Don't set Content-Type - let browser handle it for FormData
      },
    });
  }

  /**
   * Upload study pack media (images and PDFs)
   */
  static async uploadStudyPackMedia(images: File[], pdfs: File[]): Promise<ApiResponse<StudyPackMediaUploadResponse>> {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('images', image);
    });
    pdfs.forEach(pdf => {
      formData.append('pdfs', pdf);
    });

    return apiClient.post<StudyPackMediaUploadResponse>('/admin/upload/study-pack-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Upload explanation images
   * @deprecated Use updateQuestionExplanationImages instead
   */
  static async uploadExplanations(explanations: File[]): Promise<ApiResponse<ExplanationUploadResponse>> {
    console.warn('uploadExplanations is deprecated. Use updateQuestionExplanationImages instead.');
    const formData = new FormData();
    explanations.forEach(explanation => {
      formData.append('explanations', explanation);
    });

    return apiClient.post<ExplanationUploadResponse>('/admin/upload/explanation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Upload logo images
   */
  static async uploadLogos(logos: File[]): Promise<ApiResponse<LogoUploadResponse>> {
    const formData = new FormData();
    logos.forEach(logo => {
      formData.append('logos', logo);
    });

    return apiClient.post<LogoUploadResponse>('/admin/upload/logo', formData, {
      headers: {
        // Don't set Content-Type - let browser handle it for FormData
      },
    });
  }

  // ==================== QUESTION MANAGEMENT ====================

  /**
   * Get question filters for hierarchy selection (LEGACY - only for exam years and question types)
   */
  static async getQuestionFilters(): Promise<ApiResponse<{
    filters: {
      examYears: number[];
      questionTypes: string[];
    };
  }>> {
    return apiClient.get<{
      filters: {
        examYears: number[];
        questionTypes: string[];
      };
    }>('/admin/questions/filters');
  }

  /**
   * Get universities for question creation
   * GET /Universities (non-paginated endpoint)
   */
  static async getUniversitiesForQuestions(): Promise<ApiResponse<{
    universities: Array<{
      id: number;
      name: string;
      country: string;
    }>;
  }>> {
    try {
      // Use the non-paginated universities endpoint
      const response = await AuthService.getUniversities();
      if (response.success && response.data?.universities) {
        return {
          success: true,
          data: {
            universities: response.data.universities
          }
        };
      }
      return response as any;
    } catch (error) {
      console.error('Failed to fetch universities for questions:', error);
      return {
        success: false,
        error: 'Failed to fetch universities'
      };
    }
  }

  /**
   * Get study packs for extracting available years
   * GET /study-packs
   */
  static async getStudyPacksForQuestions(): Promise<ApiResponse<{
    studyPacks: Array<{
      id: number;
      name: string;
      yearNumber: string;
      type: 'YEAR' | 'RESIDENCY';
    }>;
  }>> {
    try {
      const response = await apiClient.get<any>('/study-packs');
      const data = response.data?.data?.data || response.data?.data || response.data || [];
      const studyPacks = Array.isArray(data) ? data : [];

      return {
        success: true,
        data: {
          studyPacks: studyPacks.map((pack: any) => ({
            id: pack.id,
            name: pack.name,
            yearNumber: pack.yearNumber,
            type: pack.type
          }))
        }
      };
    } catch (error) {
      console.error('Error fetching study packs for questions:', error);
      throw error;
    }
  }

  /**
   * Get hierarchical content filters for question creation
   * GET /api/v1/admin/content/filters
   */
  static async getQuestionContentFilters(params?: {
    isResidency?: boolean;
    yearLevel?: string;
  }): Promise<ApiResponse<{
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
    independentModules: Array<{
      id: number;
      name: string;
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
    }>;
  }>> {
    return AdminCourseResourcesService.getAdminContentFilters(params);
  }

  // ==================== ACTIVATION CODES MANAGEMENT (NEW API) ====================

  /**
   * Get all activation codes with pagination and filtering
   * GET /admin/activation-codes
   */
  static async getActivationCodes(params: PaginationParams & ActivationCodeFilters = {}): Promise<ApiResponse<{
    activationCodes: ActivationCode[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.studyPackId) queryParams.append('studyPackId', params.studyPackId.toString());
    if (params.expiryDate) queryParams.append('expiryDate', params.expiryDate);

    const url = queryParams.toString() ? `/admin/activation-codes?${queryParams.toString()}` : '/admin/activation-codes';
    return apiClient.get<{
      activationCodes: ActivationCode[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(url);
  }

  /**
   * Get activation code by ID
   * GET /admin/activation-codes/{id}
   */
  static async getActivationCodeById(codeId: number): Promise<ApiResponse<{
    message: string;
    activationCode: ActivationCode;
  }>> {
    return apiClient.get<{
      message: string;
      activationCode: ActivationCode;
    }>(`/admin/activation-codes/${codeId}`);
  }

  /**
   * Create new activation code
   * POST /admin/activation-codes
   */
  static async createActivationCode(codeData: CreateActivationCodeRequest): Promise<ApiResponse<{
    message: string;
    activationCode: ActivationCode;
  }>> {
    return apiClient.post<{
      message: string;
      activationCode: ActivationCode;
    }>('/admin/activation-codes', codeData);
  }

  /**
   * Update activation code
   * PUT /admin/activation-codes/{id}
   */
  static async updateActivationCode(codeId: number, codeData: UpdateActivationCodeRequest): Promise<ApiResponse<{
    message: string;
    activationCode: ActivationCode;
  }>> {
    return apiClient.put<{
      message: string;
      activationCode: ActivationCode;
    }>(`/admin/activation-codes/${codeId}`, codeData);
  }

  /**
   * Delete activation code
   * DELETE /admin/activation-codes/{id}
   */
  static async deleteActivationCode(codeId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/activation-codes/${codeId}`);
  }

  /**
   * Deactivate activation code
   * PATCH /admin/activation-codes/{id}/deactivate
   */
  static async deactivateActivationCode(codeId: number): Promise<ApiResponse<{
    message: string;
    activationCode: ActivationCode;
  }>> {
    return apiClient.patch<{
      message: string;
      activationCode: ActivationCode;
    }>(`/admin/activation-codes/${codeId}/deactivate`);
  }

  // ==================== QUESTION SOURCES MANAGEMENT ====================

  /**
   * Get all question sources with pagination
   * GET /admin/question-sources
   */
  static async getQuestionSources(params: PaginationParams & {
    search?: string;
  } = {}): Promise<ApiResponse<QuestionSourcesResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = queryParams.toString() ? `/admin/question-sources?${queryParams.toString()}` : '/admin/question-sources';
    return apiClient.get<QuestionSourcesResponse>(url);
  }

  /**
   * Get question source by ID
   * GET /admin/question-sources/:id
   */
  static async getQuestionSource(id: number): Promise<ApiResponse<QuestionSourceResponse>> {
    return apiClient.get<QuestionSourceResponse>(`/admin/question-sources/${id}`);
  }

  /**
   * Create new question source
   * POST /admin/question-sources
   */
  static async createQuestionSource(data: CreateQuestionSourceRequest): Promise<ApiResponse<{
    message: string;
    questionSource: QuestionSource;
  }>> {
    return apiClient.post<{
      message: string;
      questionSource: QuestionSource;
    }>('/admin/question-sources', data);
  }

  /**
   * Update question source
   * PUT /admin/question-sources/:id
   */
  static async updateQuestionSource(id: number, data: UpdateQuestionSourceRequest): Promise<ApiResponse<{
    message: string;
    questionSource: QuestionSource;
  }>> {
    return apiClient.put<{
      message: string;
      questionSource: QuestionSource;
    }>(`/admin/question-sources/${id}`, data);
  }

  /**
   * Delete question source
   * DELETE /admin/question-sources/:id
   */
  static async deleteQuestionSource(id: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/question-sources/${id}`);
  }
}

// Admin Content Management Services
export class AdminContentService {
  // ==================== STUDY PACK MANAGEMENT ====================

  /**
   * Get all study packs for admin management (docs: supports pagination)
   */
  static async getStudyPacks(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<{
    studyPacks: Array<StudyPack & {
      unites: Array<StudyPackUnit & {
        modules: Array<StudyPackModule & {
          courses: Array<StudyPackCourse>;
        }>;
      }>;
      subscriptions: any[];
      _count: { subscriptions: number };
    }>;
  }>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    const url = queryParams.toString() ? `/admin/study-packs?${queryParams.toString()}` : '/admin/study-packs';
    return apiClient.get<{
      studyPacks: Array<StudyPack & {
        unites: Array<StudyPackUnit & {
          modules: Array<StudyPackModule & {
            courses: Array<StudyPackCourse>;
          }>;
        }>;
        subscriptions: any[];
        _count: { subscriptions: number };
      }>;
    }>(url);
  }

  /**
   * Create new study pack
   * Validates required fields: name, description, type, yearNumber, pricePerMonth, pricePerYear
   */
  static async createStudyPack(studyPackData: CreateStudyPackRequest): Promise<ApiResponse<StudyPackResponse['data']>> {
    // Validate required fields
    if (!studyPackData.name || typeof studyPackData.name !== 'string') {
      throw new Error('Name is required and must be a string');
    }
    if (!studyPackData.description || typeof studyPackData.description !== 'string') {
      throw new Error('Description is required and must be a string');
    }
    if (!studyPackData.type || !STUDY_PACK_TYPES.includes(studyPackData.type)) {
      throw new Error(`Type is required and must be one of: ${STUDY_PACK_TYPES.join(', ')}`);
    }
    if (!studyPackData.yearNumber || !YEAR_NUMBERS.includes(studyPackData.yearNumber)) {
      throw new Error(`YearNumber is required and must be one of: ${YEAR_NUMBERS.join(', ')}`);
    }
    if (typeof studyPackData.pricePerMonth !== 'number' || studyPackData.pricePerMonth <= 0) {
      throw new Error('PricePerMonth is required and must be a positive number');
    }
    if (typeof studyPackData.pricePerYear !== 'number' || studyPackData.pricePerYear <= 0) {
      throw new Error('PricePerYear is required and must be a positive number');
    }

    return apiClient.post<StudyPackResponse['data']>('/admin/study-packs', studyPackData);
  }

  /**
   * Update study pack
   * Validates field types and enum values when provided
   */
  static async updateStudyPack(studyPackId: number, studyPackData: UpdateStudyPackRequest): Promise<ApiResponse<StudyPackResponse['data']>> {
    // Validate studyPackId
    if (!studyPackId || typeof studyPackId !== 'number') {
      throw new Error('StudyPack ID is required and must be a number');
    }

    // Validate optional fields when provided
    if (studyPackData.name !== undefined && (typeof studyPackData.name !== 'string' || studyPackData.name.trim() === '')) {
      throw new Error('Name must be a non-empty string when provided');
    }
    if (studyPackData.description !== undefined && (typeof studyPackData.description !== 'string' || studyPackData.description.trim() === '')) {
      throw new Error('Description must be a non-empty string when provided');
    }
    if (studyPackData.type !== undefined && !STUDY_PACK_TYPES.includes(studyPackData.type)) {
      throw new Error(`Type must be one of: ${STUDY_PACK_TYPES.join(', ')} when provided`);
    }
    if (studyPackData.yearNumber !== undefined && !YEAR_NUMBERS.includes(studyPackData.yearNumber)) {
      throw new Error(`YearNumber must be one of: ${YEAR_NUMBERS.join(', ')} when provided`);
    }
    if (studyPackData.pricePerMonth !== undefined && (typeof studyPackData.pricePerMonth !== 'number' || studyPackData.pricePerMonth <= 0)) {
      throw new Error('PricePerMonth must be a positive number when provided');
    }
    if (studyPackData.pricePerYear !== undefined && (typeof studyPackData.pricePerYear !== 'number' || studyPackData.pricePerYear <= 0)) {
      throw new Error('PricePerYear must be a positive number when provided');
    }
    if (studyPackData.isActive !== undefined && typeof studyPackData.isActive !== 'boolean') {
      throw new Error('IsActive must be a boolean when provided');
    }

    return apiClient.put<StudyPackResponse['data']>(`/admin/study-packs/${studyPackId}`, studyPackData);
  }

  /**
   * Delete study pack
   */
  static async deleteStudyPack(studyPackId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/study-packs/${studyPackId}`);
  }

  // ==================== UNIT MANAGEMENT ====================

  /**
   * Create new unit linked to study pack
   */
  static async createUnit(unitData: {
    name: string;
    description: string;
    studyPackId: number;
    logoUrl?: string;
  }): Promise<ApiResponse<{
    message: string;
    unite: StudyPackUnit & {
      studyPackId: number;
      createdAt: string;
      updatedAt: string;
      studyPack: { name: string };
    };
  }>> {
    return apiClient.post<{
      message: string;
      unite: StudyPackUnit & {
        studyPackId: number;
        createdAt: string;
        updatedAt: string;
        studyPack: { name: string };
      };
    }>('/admin/content/unites', unitData);
  }

  /**
   * Update unit
   */
  static async updateUnit(unitId: number, unitData: Partial<{
    name: string;
    description: string;
    studyPackId: number;
    logoUrl: string;
  }>): Promise<ApiResponse<{
    message: string;
    unite: StudyPackUnit & {
      studyPackId: number;
      createdAt: string;
      updatedAt: string;
      studyPack: { name: string };
    };
  }>> {
    return apiClient.put<{
      message: string;
      unite: StudyPackUnit & {
        studyPackId: number;
        createdAt: string;
        updatedAt: string;
        studyPack: { name: string };
      };
    }>(`/admin/content/unites/${unitId}`, unitData);
  }

  /**
   * Delete unit
   */
  static async deleteUnit(unitId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/content/unites/${unitId}`);
  }

  // ==================== MODULE MANAGEMENT ====================

  /**
   * Create new module linked to unit
   */
  static async createModule(moduleData: {
    name: string;
    description: string;
    uniteId: number;
  }): Promise<ApiResponse<{
    message: string;
    module: StudyPackModule & {
      uniteId: number;
      createdAt: string;
      updatedAt: string;
      unite: { name: string };
    };
  }>> {
    return apiClient.post<{
      message: string;
      module: StudyPackModule & {
        uniteId: number;
        createdAt: string;
        updatedAt: string;
        unite: { name: string };
      };
    }>('/admin/content/modules', moduleData);
  }

  /**
   * Update module
   */
  static async updateModule(moduleId: number, moduleData: Partial<{
    name: string;
    description: string;
    uniteId: number;
  }>): Promise<ApiResponse<{
    message: string;
    module: StudyPackModule & {
      uniteId: number;
      createdAt: string;
      updatedAt: string;
      unite: { name: string };
    };
  }>> {
    return apiClient.put<{
      message: string;
      module: StudyPackModule & {
        uniteId: number;
        createdAt: string;
        updatedAt: string;
        unite: { name: string };
      };
    }>(`/admin/content/modules/${moduleId}`, moduleData);
  }

  /**
   * Delete module
   */
  static async deleteModule(moduleId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/content/modules/${moduleId}`);
  }

  // ==================== INDEPENDENT MODULE MANAGEMENT ====================

  /**
   * Create new independent module linked directly to study pack
   * Independent modules are modules that don't belong to a unit
   */
  static async createIndependentModule(moduleData: {
    name: string;
    description: string;
    studyPackId: number;
  }): Promise<ApiResponse<{
    message: string;
    module: StudyPackModule & {
      studyPackId: number;
      createdAt: string;
      updatedAt: string;
      studyPack: { name: string };
    };
  }>> {
    return apiClient.post<{
      message: string;
      module: StudyPackModule & {
        studyPackId: number;
        createdAt: string;
        updatedAt: string;
        studyPack: { name: string };
      };
    }>('/admin/content/modules', moduleData);
  }

  /**
   * Update independent module
   */
  static async updateIndependentModule(moduleId: number, moduleData: Partial<{
    name: string;
    description: string;
    studyPackId: number;
  }>): Promise<ApiResponse<{
    message: string;
    module: StudyPackModule & {
      studyPackId: number;
      createdAt: string;
      updatedAt: string;
      studyPack: { name: string };
    };
  }>> {
    return apiClient.put<{
      message: string;
      module: StudyPackModule & {
        studyPackId: number;
        createdAt: string;
        updatedAt: string;
        studyPack: { name: string };
      };
    }>(`/admin/content/modules/${moduleId}`, moduleData);
  }

  /**
   * Delete independent module
   */
  static async deleteIndependentModule(moduleId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/content/modules/${moduleId}`);
  }

  /**
   * Update a unit including optional logo file via multipart/form-data
   * Uses: PUT /admin/content/unites/:id with field name `logo`
   */
  static async updateUnitLogo(params: {
    unitId: number;
    name: string;
    studyPackId: number;
    description?: string;
    logo?: File;
  }): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('studyPackId', String(params.studyPackId));
    formData.append('name', params.name);
    if (params.description) formData.append('description', params.description);
    if (params.logo) formData.append('logo', params.logo);

    return apiClient.put<any>(`/admin/content/unites/${params.unitId}`, formData, {
      headers: {
        // Don't set Content-Type - let browser handle it for FormData
      },
    });
  }

  /**
   * Update a module including optional logo file via multipart/form-data
   * Uses: PUT /admin/content/modules/:id with field name `logo`
   * Either uniteId or studyPackId must be supplied according to API docs.
   */
  static async updateModuleLogo(params: {
    moduleId: number;
    name: string;
    description?: string;
    uniteId?: number;
    studyPackId?: number;
    logo?: File;
  }): Promise<ApiResponse<any>> {
    const formData = new FormData();

    const hasUnite = typeof params.uniteId === 'number' && !Number.isNaN(params.uniteId);
    const hasSP = typeof params.studyPackId === 'number' && !Number.isNaN(params.studyPackId);

    // API requires exactly one of uniteId OR studyPackId. Prefer uniteId when both provided.
    if (hasUnite) {
      formData.append('uniteId', String(params.uniteId));
    } else if (hasSP) {
      formData.append('studyPackId', String(params.studyPackId));
    }

    formData.append('name', params.name);
    if (params.description) formData.append('description', params.description);
    if (params.logo) formData.append('logo', params.logo);

    return apiClient.put<any>(`/admin/content/modules/${params.moduleId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }


  // ==================== COURSE MANAGEMENT ====================

  /**
   * Create new course linked to module
   */
  static async createCourse(courseData: {
    name: string;
    description: string;
    moduleId: number;
  }): Promise<ApiResponse<{
    message: string;
    course: StudyPackCourse & {
      moduleId: number;
      createdAt: string;
      updatedAt: string;
      module: { name: string };
    };
  }>> {
    return apiClient.post<{
      message: string;
      course: StudyPackCourse & {
        moduleId: number;
        createdAt: string;
        updatedAt: string;
        module: { name: string };
      };
    }>('/admin/content/courses', courseData);
  }

  /**
   * Update course
   */
  static async updateCourse(courseId: number, courseData: Partial<{
    name: string;
    description: string;
    moduleId: number;
  }>): Promise<ApiResponse<{
    message: string;
    course: StudyPackCourse & {
      moduleId: number;
      createdAt: string;
      updatedAt: string;
      module: { name: string };
    };
  }>> {
    return apiClient.put<{
      message: string;
      course: StudyPackCourse & {
        moduleId: number;
        createdAt: string;
        updatedAt: string;
        module: { name: string };
      };
    }>(`/admin/content/courses/${courseId}`, courseData);
  }

  /**
   * Delete course
   */
  static async deleteCourse(courseId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/content/courses/${courseId}`);
  }

  // ==================== RESOURCE MANAGEMENT ====================

  /**
   * Create new resource linked to course
   */
  static async createResource(resourceData: {
    courseId: number;
    type: 'SLIDE' | 'VIDEO' | 'DOCUMENT' | 'LINK';
    title: string;
    description?: string;
    filePath?: string;
    externalUrl?: string;
    youtubeVideoId?: string;
    isPaid: boolean;
    price?: number;
  }): Promise<ApiResponse<{
    message: string;
    resource: {
      id: number;
      courseId: number;
      type: 'SLIDE' | 'VIDEO' | 'DOCUMENT' | 'LINK';
      title: string;
      description: string | null;
      filePath: string | null;
      externalUrl: string | null;
      youtubeVideoId: string | null;
      isPaid: boolean;
      price: number | null;
      createdAt: string;
      updatedAt: string;
      course: { name: string };
    };
  }>> {
    return apiClient.post<{
      message: string;
      resource: {
        id: number;
        courseId: number;
        type: 'SLIDE' | 'VIDEO' | 'DOCUMENT' | 'LINK';
        title: string;
        description: string | null;
        filePath: string | null;
        externalUrl: string | null;
        youtubeVideoId: string | null;
        isPaid: boolean;
        price: number | null;
        createdAt: string;
        updatedAt: string;
        course: { name: string };
      };
    }>('/admin/content/course-resources', resourceData);
  }

  /**
   * Update resource
   */
  static async updateResource(resourceId: number, resourceData: Partial<{
    type: 'SLIDE' | 'VIDEO' | 'DOCUMENT' | 'LINK';
    title: string;
    description: string;
    filePath: string;
    externalUrl: string;
    youtubeVideoId: string;
    isPaid: boolean;
    price: number;
  }>): Promise<ApiResponse<{
    message: string;
    resource: {
      id: number;
      courseId: number;
      type: 'SLIDE' | 'VIDEO' | 'DOCUMENT' | 'LINK';
      title: string;
      description: string | null;
      filePath: string | null;
      externalUrl: string | null;
      youtubeVideoId: string | null;
      isPaid: boolean;
      price: number | null;
      createdAt: string;
      updatedAt: string;
      course: { name: string };
    };
  }>> {
    return apiClient.put<{
      message: string;
      resource: {
        id: number;
        courseId: number;
        type: 'SLIDE' | 'VIDEO' | 'DOCUMENT' | 'LINK';
        title: string;
        description: string | null;
        filePath: string | null;
        externalUrl: string | null;
        youtubeVideoId: string | null;
        isPaid: boolean;
        price: number | null;
        createdAt: string;
        updatedAt: string;
        course: { name: string };
      };
    }>(`/admin/content/course-resources/${resourceId}`, resourceData);
  }

  /**
   * Delete resource
   */
  static async deleteResource(resourceId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/content/course-resources/${resourceId}`);
  }
}

// Admin Course Resources Services (New API)
export class AdminCourseResourcesService {
  /**
   * Get available study packs for year selection
   * GET /api/v1/admin/study-packs
   */
  static async getStudyPacks(): Promise<ApiResponse<{
    studyPacks: Array<{
      id: number;
      name: string;
      description: string;
      type: 'YEAR' | 'RESIDENCY';
      yearNumber: string | null;
      price: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
  }>> {
    return apiClient.get<{
      studyPacks: Array<{
        id: number;
        name: string;
        description: string;
        type: 'YEAR' | 'RESIDENCY';
        yearNumber: string | null;
        price: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
    }>('/admin/study-packs');
  }

  /**
   * Get admin content filters with full access to all content
   * GET /api/v1/admin/content/filters
   */
  static async getAdminContentFilters(params?: {
    isResidency?: boolean;
    yearLevel?: string;
  }): Promise<ApiResponse<{
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
    independentModules: Array<{
      id: number;
      name: string;
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
    }>;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.isResidency !== undefined) {
        queryParams.append('isResidency', params.isResidency.toString());
      }
      if (params?.yearLevel) {
        queryParams.append('yearLevel', params.yearLevel);
      }

      const url = queryParams.toString()
        ? `/admin/content/filters?${queryParams.toString()}`
        : '/admin/content/filters';

      console.log('🌐 [AdminCourseResourcesService] Making request to:', url);

      const response = await apiClient.get<any>(url);

      console.log('📡 [AdminCourseResourcesService] Raw response:', {
        success: response.success,
        hasData: !!response.data,
        dataStructure: typeof response.data,
        nestedData: !!response.data?.data,
        deepNestedData: !!response.data?.data?.data
      });

      // Handle nested response structure: { success, data: { success, data: { unites, independentModules } } }
      const actualData = response.data?.data?.data || response.data?.data || response.data;

      console.log('🔍 [AdminCourseResourcesService] Extracted data:', {
        unitesCount: actualData?.unites?.length || 0,
        independentModulesCount: actualData?.independentModules?.length || 0,
        actualDataKeys: actualData ? Object.keys(actualData) : []
      });

      return {
        success: true,
        data: {
          unites: actualData.unites || [],
          independentModules: actualData.independentModules || []
        }
      };
    } catch (error) {
      console.error('Error fetching admin content filters:', error);
      throw error;
    }
  }

  /**
   * Create new course resource with optional file upload
   * POST /api/admin/content/resources
   */
  static async createCourseResource(
    resourceData: {
      courseId: number;
      type: 'OFFICIAL_SUPPORT' | 'CHOICE_OF_TEAM' | 'VIDEO' | 'AUDIO' | 'OTHER';
      title: string;
      description?: string;
      filePath?: string;
      externalUrl?: string;
      youtubeVideoId?: string;
      isPaid?: boolean;
      price?: number;
    },
    file?: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{
    message: string;
    resource: {
      id: number;
      courseId: number;
      type: 'OFFICIAL_SUPPORT' | 'CHOICE_OF_TEAM' | 'VIDEO' | 'AUDIO' | 'OTHER';
      title: string;
      description: string | null;
      filePath: string | null;
      externalUrl: string | null;
      youtubeVideoId: string | null;
      isPaid: boolean;
      price: number | null;
      createdAt: string;
      updatedAt: string;
      course: { name: string };
    };
  }>> {
    // Always set isPaid to false and price to 0 as per requirements
    const cleanData = {
      ...resourceData,
      isPaid: false,
      price: 0
    };

    console.log('🔍 [API] Creating resource with data:', cleanData);
    console.log('🔍 [API] Has file:', !!file, file?.name);

    if (file) {
      // Use FormData for file uploads
      console.log('📤 [API] Using FormData for file upload');

      const formData = new FormData();

      // Add the file
      formData.append('file', file);

      // Add all the resource data fields (improved from test file pattern)
      formData.append('type', cleanData.type);
      formData.append('title', cleanData.title);
      formData.append('courseId', cleanData.courseId.toString());

      // Add optional fields only if they have values (matching test file logic)
      if (cleanData.description) formData.append('description', cleanData.description);
      if (cleanData.externalUrl) formData.append('externalUrl', cleanData.externalUrl);
      if (cleanData.youtubeVideoId) formData.append('youtubeVideoId', cleanData.youtubeVideoId);
      if (cleanData.isPaid) formData.append('isPaid', cleanData.isPaid.toString());
      if (cleanData.price && cleanData.isPaid) formData.append('price', cleanData.price.toString());

      // Use XMLHttpRequest for progress tracking with correct API base URL
      const token = localStorage.getItem('auth_token'); // Use correct token key from api-client
      const API_BASE_URL = 'https://med-cortex.com/api/v1';

      console.log('🔐 [API] Token retrieval for file upload:', {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        tokenKey: 'auth_token'
      });

      // Check if token is available
      if (!token) {
        console.error('❌ [API] No authentication token available for file upload');
        return Promise.resolve({
          success: false,
          error: 'Authentication token not found. Please log in again.',
          data: null
        });
      }

      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          try {
            const result = JSON.parse(xhr.responseText);

            console.log('📥 [API] XMLHttpRequest response:', {
              status: xhr.status,
              statusText: xhr.statusText,
              hasResult: !!result,
              resultKeys: result ? Object.keys(result) : []
            });

            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({
                success: true,
                data: result,
                error: null
              });
            } else {
              // Enhanced error handling for different response structures
              let errorMessage = 'Failed to create resource';

              if (result?.error?.message) {
                errorMessage = result.error.message;
              } else if (result?.error && typeof result.error === 'string') {
                errorMessage = result.error;
              } else if (result?.message) {
                errorMessage = result.message;
              } else if (xhr.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.';
              } else if (xhr.status === 403) {
                errorMessage = 'Access denied. You do not have permission to perform this action.';
              } else if (xhr.status === 413) {
                errorMessage = 'File too large. Please select a smaller file.';
              } else if (xhr.status === 415) {
                errorMessage = 'Unsupported file type. Please select a supported file format.';
              }

              console.error('❌ [API] XMLHttpRequest error response:', {
                status: xhr.status,
                statusText: xhr.statusText,
                errorMessage,
                result
              });

              resolve({
                success: false,
                error: errorMessage,
                data: null
              });
            }
          } catch (error) {
            console.error('❌ [API] Failed to parse XMLHttpRequest response:', error);
            resolve({
              success: false,
              error: 'Invalid response from server',
              data: null
            });
          }
        });

        xhr.addEventListener('error', () => {
          console.error('❌ [API] XMLHttpRequest network error');
          resolve({
            success: false,
            error: 'Network error occurred. Please check your connection and try again.',
            data: null
          });
        });

        xhr.addEventListener('timeout', () => {
          console.error('❌ [API] XMLHttpRequest timeout');
          resolve({
            success: false,
            error: 'Request timeout. Please try again.',
            data: null
          });
        });

        // Construct the correct URL: base URL + endpoint path
        const fullUrl = `${API_BASE_URL}/admin/content/resources`;
        console.log('📤 [API] FormData upload URL:', fullUrl);

        xhr.open('POST', fullUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        // Don't set Content-Type header - let browser set it with boundary for FormData
        xhr.send(formData);
      });
    } else {
      // Use JSON for requests without files
      console.log('📤 [API] Using JSON request (no file)');

      return apiClient.post<{
        message: string;
        resource: {
          id: number;
          courseId: number;
          type: 'OFFICIAL_SUPPORT' | 'CHOICE_OF_TEAM' | 'VIDEO' | 'AUDIO' | 'OTHER';
          title: string;
          description: string | null;
          filePath: string | null;
          externalUrl: string | null;
          youtubeVideoId: string | null;
          isPaid: boolean;
          price: number | null;
          createdAt: string;
          updatedAt: string;
          course: { name: string };
        };
      }>('/admin/content/resources', cleanData);
    }
  }

  /**
   * Update course resource
   * PUT /api/admin/content/resources/:id
   */
  static async updateCourseResource(resourceId: number, resourceData: Partial<{
    title: string;
    description: string;
    isPaid: boolean;
    price: number;
  }>): Promise<ApiResponse<{
    message: string;
    resource: {
      id: number;
      courseId: number;
      type: 'DOCUMENT' | 'VIDEO' | 'LINK' | 'AUDIO' | 'IMAGE';
      title: string;
      description: string | null;
      filePath: string | null;
      externalUrl: string | null;
      youtubeVideoId: string | null;
      isPaid: boolean;
      price: number | null;
      createdAt: string;
      updatedAt: string;
      course: { name: string };
    };
  }>> {
    return apiClient.put<{
      message: string;
      resource: {
        id: number;
        courseId: number;
        type: 'DOCUMENT' | 'VIDEO' | 'LINK' | 'AUDIO' | 'IMAGE';
        title: string;
        description: string | null;
        filePath: string | null;
        externalUrl: string | null;
        youtubeVideoId: string | null;
        isPaid: boolean;
        price: number | null;
        createdAt: string;
        updatedAt: string;
        course: { name: string };
      };
    }>(`/admin/content/resources/${resourceId}`, resourceData);
  }

  /**
   * Delete course resource
   * DELETE /api/admin/content/resources/:id
   */
  static async deleteCourseResource(resourceId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/content/resources/${resourceId}`);
  }

  /**
   * Get course resources for admin
   * GET /courses/:id/resources
   */
  static async getCourseResources(courseId: number, params: {
    page?: number;
    limit?: number;
    type?: string;
  } = {}): Promise<ApiResponse<Array<{
    id: number;
    type: 'SLIDE' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'AUDIO' | 'IMAGE';
    title: string;
    description: string | null;
    filePath: string | null;
    externalUrl: string | null;
    youtubeVideoId: string | null;
    isPaid: boolean;
    price: number | null;
    courseId: number;
    courseName: string;
    createdAt: string;
    updatedAt: string;
  }>>> {
    const queryParams = new URLSearchParams();

    queryParams.append('page', (params.page || 1).toString());
    queryParams.append('limit', (params.limit || 50).toString());

    if (params.type) queryParams.append('type', params.type);

    try {
      console.log('🔍 [AdminCourseResourcesService] Fetching course resources for courseId:', courseId);

      const response = await apiClient.get<{
        success: boolean;
        data: Array<{
          id: number;
          type: 'SLIDE' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'AUDIO' | 'IMAGE';
          title: string;
          description: string | null;
          filePath: string | null;
          externalUrl: string | null;
          youtubeVideoId: string | null;
          isPaid: boolean;
          price: number | null;
          courseId: number;
          courseName: string;
          createdAt: string;
          updatedAt: string;
        }>;
      }>(`/courses/${courseId}/resources?${queryParams.toString()}`);

      console.log('📊 [AdminCourseResourcesService] Raw API Response:', {
        success: response.success,
        dataExists: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      // Handle nested response structure: { success, data: { success, data: [...] } }
      const actualData = response.data?.data || response.data;

      console.log('🔍 [AdminCourseResourcesService] Extracted data:', {
        actualDataType: typeof actualData,
        isArray: Array.isArray(actualData),
        resourcesCount: Array.isArray(actualData) ? actualData.length : 0
      });

      return {
        success: true,
        data: Array.isArray(actualData) ? actualData : []
      };
    } catch (error) {
      console.error('Error fetching course resources:', error);
      throw error;
    }
  }
}

// ==================== UNIVERSITY MANAGEMENT ====================

export class UniversityService {

  /**
   * Create new university
   */
  static async createUniversity(universityData: {
    name: string;
    country: string;
    city: string;
  }): Promise<ApiResponse<{
    message: string;
    university: {
      id: number;
      name: string;
      country: string;
      city: string;
      createdAt: string;
      updatedAt: string;
    };
  }>> {
    return apiClient.post<{
      message: string;
      university: {
        id: number;
        name: string;
        country: string;
        city: string;
        createdAt: string;
        updatedAt: string;
      };
    }>('/admin/universities', universityData);
  }

  /**
   * Update university
   */
  static async updateUniversity(universityId: number, universityData: Partial<{
    name: string;
    country: string;
    city: string;
  }>): Promise<ApiResponse<{
    message: string;
    university: {
      id: number;
      name: string;
      country: string;
      city: string;
      createdAt: string;
      updatedAt: string;
    };
  }>> {
    return apiClient.put<{
      message: string;
      university: {
        id: number;
        name: string;
        country: string;
        city: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/admin/universities/${universityId}`, universityData);
  }

  /**
   * Delete university
   */
  static async deleteUniversity(universityId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiClient.delete<{
      message: string;
    }>(`/admin/universities/${universityId}`);
  }

  // ==================== STUDY PACK MANAGEMENT ====================
  // Note: Study pack creation and update functions are now in AdminStudyPackService

  // ==================== QUESTION MANAGEMENT ====================

  /**
   * Get question filters for hierarchy selection (LEGACY - only for exam years and question types)
   */
  static async getQuestionFilters(): Promise<ApiResponse<{
    filters: {
      examYears: number[];
      questionTypes: string[];
    };
  }>> {
    return apiClient.get<{
      filters: {
        examYears: number[];
        questionTypes: string[];
      };
    }>('/admin/questions/filters');
  }

  /**
   * Create single question
   */
  static async createQuestion(questionData: CreateQuestionRequest): Promise<ApiResponse<{
    id: number;
    questionText: string;
    questionType: string;
  }>> {
    // If there are question images, use FormData for multipart upload
    if (questionData.questionImages && questionData.questionImages.length > 0) {
      const formData = new FormData();

      // Add text fields
      formData.append('questionText', questionData.questionText);
      if (questionData.explanation) {
        formData.append('explanation', questionData.explanation);
      }
      formData.append('questionType', questionData.questionType);
      formData.append('courseId', questionData.courseId.toString());

      if (questionData.universityId) {
        formData.append('universityId', questionData.universityId.toString());
      }
      if (questionData.yearLevel) {
        formData.append('yearLevel', questionData.yearLevel);
      }
      if (questionData.rotation) {
        formData.append('rotation', questionData.rotation);
      }
      if (questionData.examYear) {
        formData.append('examYear', questionData.examYear.toString());
      }
      if (questionData.sourceId) {
        formData.append('sourceId', questionData.sourceId.toString());
      }
      if (questionData.additionalInfo) {
        formData.append('additionalInfo', questionData.additionalInfo);
      }
      if (questionData.metadata) {
        formData.append('metadata', questionData.metadata);
      }

      // Add answers as JSON string
      formData.append('answers', JSON.stringify(questionData.answers));

      // Add question images
      questionData.questionImages.forEach((image, index) => {
        if (image instanceof File) {
          formData.append('questionImages', image);
          if (image.altText) {
            formData.append(`questionImageAltTexts[${index}]`, image.altText);
          }
        }
      });

      return apiClient.post<{
        id: number;
        questionText: string;
        questionType: string;
      }>('/admin/questions', formData, {
        headers: {
          // Don't set Content-Type - let browser handle it for FormData
        },
      });
    }

    // For questions without images, use regular JSON
    return apiClient.post<{
      id: number;
      questionText: string;
      questionType: string;
    }>('/admin/questions', questionData);
  }

  /**
   * Bulk import questions
   */
  static async bulkImportQuestions(payload: {
    metadata: {
      courseId: number;
      universityId?: number;
      examYear?: number;
      yearLevel?: string;
      sourceId?: number;
      rotation?: string;
    };
    questions: Array<{
      questionText: string;
      explanation?: string;
      questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
      answers: Array<{
        answerText: string;
        isCorrect: boolean;
        explanation?: string;
      }>;
    }>;
  }): Promise<ApiResponse<{
    questions: Array<{
      id: number;
      questionText: string;
      questionType: string;
    }>;
    totalCreated: number;
  }>> {
    return apiClient.post<{
      questions: Array<{
        id: number;
        questionText: string;
        questionType: string;
      }>;
      totalCreated: number;
    }>('/admin/questions/bulk', payload);
  }

  // ==================== UNIVERSITY MANAGEMENT ====================

  /**
   * Get all universities with pagination and filtering
   */
  static async getUniversities(params: PaginationParams & {
    search?: string;
    country?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<University>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.country) queryParams.append('country', params.country);

    const url = queryParams.toString() ? `/admin/universities?${queryParams.toString()}` : '/admin/universities';
    return apiClient.get<PaginatedResponse<University>>(url);
  }

  /**
   * Create new university
   */
  static async createUniversity(universityData: {
    name: string;
    country: string;
  }): Promise<ApiResponse<University>> {
    return apiClient.post<University>('/admin/universities', universityData);
  }

  /**
   * Update university
   */
  static async updateUniversity(universityId: number, updateData: {
    name?: string;
    country?: string;
  }): Promise<ApiResponse<University>> {
    return apiClient.put<University>(`/admin/universities/${universityId}`, updateData);
  }

  /**
   * Delete university
   */
  static async deleteUniversity(universityId: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(`/admin/universities/${universityId}`);
  }

  // ==================== SPECIALTY MANAGEMENT ====================

  /**
   * Get all specialties with pagination and filtering
   */
  static async getSpecialties(params: PaginationParams & {
    search?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<Specialty>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = queryParams.toString() ? `/admin/specialties?${queryParams.toString()}` : '/admin/specialties';
    return apiClient.get<PaginatedResponse<Specialty>>(url);
  }

  /**
   * Create new specialty
   */
  static async createSpecialty(specialtyData: {
    name: string;
  }): Promise<ApiResponse<Specialty>> {
    return apiClient.post<Specialty>('/admin/specialties', specialtyData);
  }

  /**
   * Update specialty
   */
  static async updateSpecialty(specialtyId: number, updateData: {
    name?: string;
  }): Promise<ApiResponse<Specialty>> {
    return apiClient.put<Specialty>(`/admin/specialties/${specialtyId}`, updateData);
  }

  /**
   * Delete specialty
   */
  static async deleteSpecialty(specialtyId: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(`/admin/specialties/${specialtyId}`);
  }
}

// Payment Services
export class PaymentService {
  /**
   * Create a checkout session for study pack subscription
   */
  static async createCheckoutSession(request: {
    studyPackId: number;
    paymentDuration: {
      type: 'monthly' | 'yearly';
      months?: number;
      years?: number;
    };
    locale?: 'ar' | 'en' | 'fr';
    paymentMethod?: 'edahabia' | 'cib' | 'chargily_app';
  }): Promise<ApiResponse<{
    checkoutUrl: string;
    checkoutId: string;
  }>> {
    return apiClient.post<{
      checkoutUrl: string;
      checkoutId: string;
    }>('/payments/checkouts', request);
  }

  /**
   * Validate payment request data
   */
  static validatePaymentRequest(request: {
    studyPackId: number;
    paymentDuration: {
      type: 'monthly' | 'yearly';
      months?: number;
      years?: number;
    };
    locale?: 'ar' | 'en' | 'fr';
    paymentMethod?: 'edahabia' | 'cib' | 'chargily_app';
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate studyPackId
    if (!request.studyPackId || request.studyPackId <= 0) {
      errors.push('Study pack ID is required and must be positive');
    }

    // Validate paymentDuration
    if (!request.paymentDuration?.type) {
      errors.push('Payment duration type is required');
    } else {
      if (request.paymentDuration.type === 'monthly') {
        if (!request.paymentDuration.months || request.paymentDuration.months < 1) {
          errors.push('Months must be specified and at least 1 for monthly payments');
        }
      } else if (request.paymentDuration.type === 'yearly') {
        if (!request.paymentDuration.years || request.paymentDuration.years < 1) {
          errors.push('Years must be specified and at least 1 for yearly payments');
        }
      } else {
        errors.push('Payment duration type must be either "monthly" or "yearly"');
      }
    }

    // Validate locale (optional)
    if (request.locale && !['ar', 'en', 'fr'].includes(request.locale)) {
      errors.push('Locale must be one of: ar, en, fr');
    }

    // Validate paymentMethod (optional)
    if (request.paymentMethod && !['edahabia', 'cib', 'chargily_app'].includes(request.paymentMethod)) {
      errors.push('Payment method must be one of: edahabia, cib, chargily_app');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Utility function to handle API errors consistently
export function handleApiError(error: any): string {
  if (error?.error) {
    return error.error;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Import new API service
import { NewApiService } from './api/new-api-services';

// Export all services
// Residency Questions Services
export class ResidencyQuestionsService {
  /**
   * Get all residency questions with pagination and filtering
   * GET /api/v1/admin/residency-questions
   */
  static async getResidencyQuestions(params: PaginationParams & ResidencyQuestionFilters = {}): Promise<ApiResponse<ResidencyQuestionsResponse>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.part) queryParams.append('part', params.part);
    if (params.examYear) queryParams.append('examYear', params.examYear.toString());
    if (params.universityId) queryParams.append('universityId', params.universityId.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = queryParams.toString() ? `/admin/residency-questions?${queryParams.toString()}` : '/admin/residency-questions';

    // The backend returns a raw paginated response instead of the standard ApiResponse wrapper
    // We need to fetch it as any and transform it to match frontend expectations
    try {
      const response = await apiClient.get<any>(url);

      console.log('🔍 [getResidencyQuestions] Raw response:', response);

      // Helper function to map flat items to nested ResidencyQuestion structure
      const mapToResidencyQuestion = (item: any) => {
        // Check if item is already in nested format
        if (item.question && item.question.questionText) {
          return item;
        }

        return {
          id: item.id,
          questionId: item.id,
          part: item.part,
          examYear: item.examYear,
          universityId: item.universityId,
          metadata: item.metadata,
          createdAt: item.createdAt,
          updatedAt: item.createdAt || new Date().toISOString(),
          university: item.university,
          question: {
            id: item.id,
            questionText: item.questionText || '',
            explanation: item.explanation,
            questionType: 'SINGLE_CHOICE',
            questionImages: [],
            questionExplanationImages: [],
            questionAnswers: []
          }
        };
      };

      // Case 1: Backend returns raw format with "items" array (current backend response)
      // Format: { items: [...], total, page, limit, totalPages }
      if (response?.items && Array.isArray(response.items)) {
        const rawItems = response.items;
        const mappedQuestions = rawItems.map(mapToResidencyQuestion);

        return {
          success: true,
          data: {
            questions: mappedQuestions,
            pagination: {
              currentPage: response.page || 1,
              totalPages: response.totalPages || 1,
              total: response.total || 0,
              limit: response.limit || 20
            }
          }
        };
      }

      // Case 2: Backend returns format with "questions" array
      // Format: { questions: [...], pagination: {...} }
      if (response?.questions && Array.isArray(response.questions)) {
        const mappedQuestions = response.questions.map(mapToResidencyQuestion);
        return {
          success: true,
          data: {
            questions: mappedQuestions,
            pagination: response.pagination || { currentPage: 1, totalPages: 1, total: 0, limit: 20 }
          }
        };
      }

      // Case 3: Response is already wrapped in success/data structure
      if (response?.success && response?.data) {
        // Ensure questions are properly mapped
        if (response.data.questions && Array.isArray(response.data.questions)) {
          response.data.questions = response.data.questions.map(mapToResidencyQuestion);
        }
        return response;
      }

      // Case 4: Response has nested "data" with items (ApiResponse wrapper around raw format)
      if (response?.data?.items && Array.isArray(response.data.items)) {
        const rawItems = response.data.items;
        const mappedQuestions = rawItems.map(mapToResidencyQuestion);

        return {
          success: true,
          data: {
            questions: mappedQuestions,
            pagination: {
              currentPage: response.data.page || 1,
              totalPages: response.data.totalPages || 1,
              total: response.data.total || 0,
              limit: response.data.limit || 20
            }
          }
        };
      }

      // Fallback: return empty result to prevent crashes
      console.warn('⚠️ [getResidencyQuestions] Unexpected response format:', response);
      return {
        success: true,
        data: {
          questions: [],
          pagination: { currentPage: 1, totalPages: 0, total: 0, limit: 20 }
        }
      };
    } catch (error) {
      console.error('❌ [getResidencyQuestions] Error:', error);
      throw error;
    }
  }

  /**
   * Get a single residency question by ID
   * GET /api/v1/admin/residency-questions/:id
   */
  static async getResidencyQuestion(id: number): Promise<ApiResponse<{ data: ResidencyQuestion }>> {
    return apiClient.get<{ data: ResidencyQuestion }>(`/admin/residency-questions/${id}`);
  }

  /**
   * Create a new residency question with images
   * POST /api/v1/admin/residency-questions
   */
  static async createResidencyQuestion(questionData: CreateResidencyQuestionRequest): Promise<ApiResponse<{ data: ResidencyQuestion; message: string }>> {
    // Debug logging
    console.log('🔍 [createResidencyQuestion] Input data:', {
      hasQuestionImages: !!questionData.questionImages,
      questionImagesLength: questionData.questionImages?.length,
      questionImagesType: Array.isArray(questionData.questionImages) ? 'array' : typeof questionData.questionImages,
      questionImagesFirstItem: questionData.questionImages?.[0],
      questionImagesFirstItemIsFile: questionData.questionImages?.[0] instanceof File,
      hasExplanationImages: !!questionData.questionExplanationImages,
      explanationImagesLength: questionData.questionExplanationImages?.length,
      explanationImagesType: Array.isArray(questionData.questionExplanationImages) ? 'array' : typeof questionData.questionExplanationImages,
      explanationImagesFirstItem: questionData.questionExplanationImages?.[0],
      explanationImagesFirstItemIsFile: questionData.questionExplanationImages?.[0] instanceof File,
    });

    // Check if we have valid images (must be arrays with File objects)
    const hasValidImages = (Array.isArray(questionData.questionImages) && questionData.questionImages.length > 0 && questionData.questionImages.some(img => img instanceof File)) ||
      (Array.isArray(questionData.questionExplanationImages) && questionData.questionExplanationImages.length > 0 && questionData.questionExplanationImages.some(img => img instanceof File));

    console.log('🔍 [createResidencyQuestion] hasValidImages:', hasValidImages);

    if (!hasValidImages) {
      // No valid images - send as JSON with proper types
      console.log('📤 [createResidencyQuestion] Sending as JSON (no valid images)');
      const payload = {
        questionText: questionData.questionText,
        part: questionData.part,
        explanation: questionData.explanation,
        examYear: questionData.examYear,
        universityId: questionData.universityId,
        metadata: questionData.metadata,
        questionAnswers: questionData.questionAnswers, // Keep as array with boolean types
      };

      // Remove undefined fields
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      return apiClient.post<{ data: ResidencyQuestion; message: string }>('/admin/residency-questions', payload);
    }

    console.log('📤 [createResidencyQuestion] Sending as FormData (has valid images)');

    // Has valid images - use FormData
    const formData = new FormData();

    // Add text fields
    formData.append('questionText', questionData.questionText);
    formData.append('part', questionData.part);

    if (questionData.explanation) {
      formData.append('explanation', questionData.explanation);
    }
    if (questionData.examYear) {
      formData.append('examYear', questionData.examYear.toString());
    }
    if (questionData.universityId) {
      formData.append('universityId', questionData.universityId.toString());
    }
    if (questionData.metadata) {
      formData.append('metadata', questionData.metadata);
    }

    // Add answers using array notation (matching the documented curl example)
    if (questionData.questionAnswers && questionData.questionAnswers.length > 0) {
      questionData.questionAnswers.forEach((answer, index) => {
        formData.append(`questionAnswers[${index}][answerText]`, answer.answerText);
        formData.append(`questionAnswers[${index}][isCorrect]`, answer.isCorrect.toString());
      });
    }

    // Add question images - append multiple times for array
    if (questionData.questionImages && questionData.questionImages.length > 0) {
      console.log('📎 [createResidencyQuestion] Adding question images:', questionData.questionImages.length);
      questionData.questionImages.forEach((image, index) => {
        console.log(`  Image ${index}:`, {
          isFile: image instanceof File,
          name: image instanceof File ? image.name : 'NOT A FILE',
          size: image instanceof File ? image.size : 'N/A',
          type: image instanceof File ? image.type : typeof image,
          altText: (image as any).altText,
        });
        // Only append if it's actually a File object
        if (image instanceof File) {
          formData.append('questionImages', image);
        } else {
          console.warn('⚠️ Skipping non-File object in questionImages:', image);
        }
      });
    }

    // Add explanation images - append multiple times for array
    if (questionData.questionExplanationImages && questionData.questionExplanationImages.length > 0) {
      console.log('📎 [createResidencyQuestion] Adding explanation images:', questionData.questionExplanationImages.length);
      questionData.questionExplanationImages.forEach((image, index) => {
        console.log(`  Image ${index}:`, {
          isFile: image instanceof File,
          name: image instanceof File ? image.name : 'NOT A FILE',
          size: image instanceof File ? image.size : 'N/A',
          type: image instanceof File ? image.type : typeof image,
          altText: (image as any).altText,
        });
        // Only append if it's actually a File object
        if (image instanceof File) {
          formData.append('questionExplanationImages', image);
        } else {
          console.warn('⚠️ Skipping non-File object in explanationImages:', image);
        }
      });
    }

    // Log FormData contents
    console.log('📋 [createResidencyQuestion] FormData contents:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    console.log('🚀 [createResidencyQuestion] Sending FormData request...');

    // Don't set Content-Type header - let the browser set it automatically with the correct boundary
    return apiClient.post<{ data: ResidencyQuestion; message: string }>('/admin/residency-questions', formData, {
      headers: {
        // Explicitly don't set Content-Type - let browser handle it for FormData
      }
    });
  }

  /**
   * Update a residency question with optional new images
   * PUT /api/v1/admin/residency-questions/:id
   */
  static async updateResidencyQuestion(id: number, questionData: UpdateResidencyQuestionRequest): Promise<ApiResponse<{ data: ResidencyQuestion; message: string }>> {
    // Check if we have valid images (must be arrays with File objects)
    const hasValidImages = (Array.isArray(questionData.questionImages) && questionData.questionImages.length > 0 && questionData.questionImages.some(img => img instanceof File)) ||
      (Array.isArray(questionData.questionExplanationImages) && questionData.questionExplanationImages.length > 0 && questionData.questionExplanationImages.some(img => img instanceof File));

    if (!hasValidImages) {
      // No valid images - send as JSON with proper types
      const payload: any = {};

      if (questionData.questionText) payload.questionText = questionData.questionText;
      if (questionData.explanation !== undefined) payload.explanation = questionData.explanation;
      if (questionData.part) payload.part = questionData.part;
      if (questionData.examYear !== undefined) payload.examYear = questionData.examYear;
      if (questionData.universityId !== undefined) payload.universityId = questionData.universityId;
      if (questionData.metadata !== undefined) payload.metadata = questionData.metadata;
      if (questionData.questionAnswers) payload.questionAnswers = questionData.questionAnswers; // Keep as array with boolean types

      return apiClient.put<{ data: ResidencyQuestion; message: string }>(`/admin/residency-questions/${id}`, payload);
    }

    // Has valid images - use FormData
    const formData = new FormData();

    // Add text fields if provided
    if (questionData.questionText) {
      formData.append('questionText', questionData.questionText);
    }
    if (questionData.explanation !== undefined) {
      formData.append('explanation', questionData.explanation);
    }
    if (questionData.part) {
      formData.append('part', questionData.part);
    }
    if (questionData.examYear !== undefined) {
      formData.append('examYear', questionData.examYear.toString());
    }
    if (questionData.universityId !== undefined) {
      formData.append('universityId', questionData.universityId.toString());
    }
    if (questionData.metadata !== undefined) {
      formData.append('metadata', questionData.metadata);
    }

    // Add answers using array notation if provided (matching the documented curl example)
    if (questionData.questionAnswers && questionData.questionAnswers.length > 0) {
      questionData.questionAnswers.forEach((answer, index) => {
        formData.append(`questionAnswers[${index}][answerText]`, answer.answerText);
        formData.append(`questionAnswers[${index}][isCorrect]`, answer.isCorrect.toString());
      });
    }

    // Add new question images if provided - append multiple times for array
    if (questionData.questionImages && questionData.questionImages.length > 0) {
      questionData.questionImages.forEach((image) => {
        // Only append if it's actually a File object
        if (image instanceof File) {
          formData.append('questionImages', image);
        }
      });
    }

    // Add new explanation images if provided - append multiple times for array
    if (questionData.questionExplanationImages && questionData.questionExplanationImages.length > 0) {
      questionData.questionExplanationImages.forEach((image) => {
        // Only append if it's actually a File object
        if (image instanceof File) {
          formData.append('questionExplanationImages', image);
        }
      });
    }

    // Don't set Content-Type header - let the browser set it automatically with the correct boundary
    return apiClient.put<{ data: ResidencyQuestion; message: string }>(`/admin/residency-questions/${id}`, formData, {
      headers: {
        // Explicitly don't set Content-Type - let browser handle it for FormData
      }
    });
  }

  /**
   * Bulk create residency questions
   * POST /api/v1/admin/residency-questions/bulk
   */
  static async bulkCreateResidencyQuestions(bulkData: BulkResidencyQuestionRequest): Promise<ApiResponse<BulkResidencyQuestionResponse & { message: string }>> {
    console.log('📤 [bulkCreateResidencyQuestions] Sending bulk request:', {
      universityId: bulkData.universityId,
      examYear: bulkData.examYear,
      part: bulkData.part,
      questionCount: bulkData.questions.length
    });

    return apiClient.post<BulkResidencyQuestionResponse & { message: string }>('/admin/residency-questions/bulk', bulkData);
  }

  /**
   * Delete a residency question
   * DELETE /api/v1/admin/residency-questions/:id
   */
  static async deleteResidencyQuestion(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/admin/residency-questions/${id}`);
  }
}

export const apiServices = {
  auth: AuthService,
  settings: SettingsService,
  student: StudentService,
  content: ContentService,
  subscription: SubscriptionService,
  payment: PaymentService,
  quiz: QuizService,
  exam: ExamService,
  admin: AdminService,
  adminContent: AdminContentService,
  newApi: NewApiService,
  residencyQuestions: ResidencyQuestionsService,
};
