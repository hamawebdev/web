/**
 * New API Services
 *
 * Service layer for the new API endpoints that provide enhanced module filtering,
 * session type separation, and content organization according to the new API specifications.
 */

import { apiClient } from '../api-client';
import { ApiResponse } from '../api-client';

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function handleApiError(error: any, context: string): never {
  console.error(`API Error in ${context}:`, error);

  if (error?.response?.data?.message) {
    throw new ApiError(error.response.data.message, error.response.status, error.response.data);
  } else if (error?.message) {
    throw new ApiError(error.message, error?.response?.status);
  } else {
    throw new ApiError(`Failed to ${context}`, error?.response?.status);
  }
}

// Type definitions for the new API structure
export interface ContentFilters {
  unites?: Array<{
    id: number;
    name: string;
    logoUrl?: string;
    modules?: Array<{
      id: number;
      name: string;
      description?: string;
      logoUrl?: string;
      courses?: Array<{
        id: number;
        name: string;
        description?: string;
      }>;
    }>;
  }>;
  independentModules?: Array<{
    id: number;
    name: string;
    description?: string;
    logoUrl?: string;
    imagePath?: string | null;
    courses?: Array<{
      id: number;
      name: string;
      description?: string;
    }>;
  }>;
}

export interface SessionFilters {
  unites: Array<{
    id: number;
    name: string;
    sessionsCount: number;
    modules: Array<{
      id: number;
      name: string;
      sessionsCount: number;
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
    sessionsCount: number;
    courses: Array<{
      id: number;
      name: string;
      description?: string;
    }>;
  }>;
}

export interface PracticeSession {
  sessionId: number;
  title: string;
  status: string;
  type: 'PRACTICE' | 'EXAM';
  timeSpent: number;
  totalQuestions: number;
  questionsAnswered: number;
  questionsNotAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  percentage: number;
  averageTimePerQuestion: number;
  completedAt: string;
  // Unit and Module information with logos
  unit?: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  module?: {
    id: number;
    name: string;
    logoUrl?: string;
  };
}

export interface PracticeSessionsResponse {
  filterInfo: {
    uniteId?: number;
    moduleId?: number;
    uniteName?: string;
    moduleName?: string;
    sessionType: 'PRACTICE' | 'EXAM';
  };
  totalSessions: number;
  sessions: PracticeSession[];
  aggregateStats: {
    totalTimeSpent: number;
    totalQuestionsAnswered: number;
    totalCorrectAnswers: number;
    overallAccuracy: number;
    averageSessionScore: number;
  };
}

export interface ExamSessionFilters {
  universities: Array<{
    id: number;
    name: string;
    country: string;
    questionCount: number;
  }>;
  questionSources: Array<{
    id: number;
    name: string;
    questionCount: number;
  }>;
  examYears: Array<{
    year: number;
    questionCount: number;
  }>;
  rotations: Array<{
    rotation: string;
    questionCount: number;
  }>;
  unites: Array<{
    id: number;
    name: string;
    questionCount: number;
    modules: Array<{
      id: number;
      name: string;
      questionCount: number;
    }>;
  }>;
  individualModules: Array<{
    id: number;
    name: string;
    questionCount: number;
  }>;
  totalQuestionCount: number;
}

export interface Question {
  id: number;
  questionText: string;
  questionType: string;
  universityId: number;
  yearLevel: string;
  examYear: number;
  rotation?: string;
  metadata: string;
  sourceId: number;
  createdAt: string;
  updatedAt: string;
  university: {
    id: number;
    name: string;
    country: string;
  };
  course: {
    id: number;
    name: string;
    module: {
      id: number;
      name: string;
      unite?: {
        id: number;
        name: string;
      };
    };
  };
  source: {
    id: number;
    name: string;
  };
}

export interface QuestionsResponse {
  questions: Question[];
  totalCount: number;
  filterInfo: {
    uniteId?: number;
    moduleId?: number;
    uniteName?: string;
    moduleName?: string;
  };
}

/**
 * New API Services Class
 * Implements the new API endpoints according to the specifications
 */
export class NewApiService {
  /**
   * Get practice/exam sessions (by unit/module or all)
   * GET /api/v1/students/practise-sessions
   */
  static async getPracticeSessions(params: {
    sessionType: 'PRACTICE' | 'EXAM';
    moduleId?: number;
    uniteId?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const { sessionType, moduleId, uniteId, page = 1, limit = 10 } = params;

      if (!sessionType) {
        throw new ApiError('sessionType is required (PRACTICE or EXAM)');
      }

      if (moduleId && uniteId) {
        throw new ApiError('Cannot provide both moduleId and uniteId');
      }

      const query = new URLSearchParams();
      query.append('sessionType', sessionType);
      if (moduleId) query.append('moduleId', moduleId.toString());
      if (uniteId) query.append('uniteId', uniteId.toString());
      query.append('page', page.toString());
      query.append('limit', limit.toString());

      const url = `/students/practise-sessions?${query.toString()}`;
      console.log('🌐 [NewApiService] Getting practise sessions:', params);

      const response = await apiClient.get<any>(url);

      // Unwrap nested data if backend wraps in { data: { ... } }
      if (response?.success && (response as any).data?.data) {
        return { ...response, data: (response as any).data.data };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get practise sessions error:', error);
      handleApiError(error, 'get practise sessions');
    }
  }

  /**
   * Get all sessions by type (convenience wrapper)
   * GET /api/v1/students/practise-sessions?sessionType=...
   */
  static async getAllSessionsByType(
    sessionType: 'PRACTICE' | 'EXAM',
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<any>> {
    return this.getPracticeSessions({ sessionType, page, limit });
  }

  /**
   * Get questions by unite or module (exactly one of the two)
   * GET /api/v1/quizzes/questions-by-unite-or-module?uniteId=|moduleId=
   * Returns: { questions: [...] } (each question includes course { id, name, module })
   */
  static async getQuestionsByUniteOrModule(params: { uniteId?: number; moduleId?: number }): Promise<ApiResponse<{ questions: any[] }>> {
    const { uniteId, moduleId } = params;
    if ((uniteId && moduleId) || (!uniteId && !moduleId)) {
      throw new ApiError('Either uniteId or moduleId must be provided, not both');
    }

    const query = new URLSearchParams();
    if (uniteId) query.append('uniteId', uniteId.toString());
    if (moduleId) query.append('moduleId', moduleId.toString());

    return apiClient.get<{ questions: any[] }>(`/quizzes/questions-by-unite-or-module?${query.toString()}`);
  }

  /**
   * Create Card (tracker)
   * POST /api/v1/students/cards
   */
  static async createCard(payload: any): Promise<ApiResponse<any>> {
    try {
      console.log('🃏 [NewApiService] Creating card:', payload);
      const response = await apiClient.post<any>('/students/cards', payload);
      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Create card error:', error);
      handleApiError(error, 'create card');
    }
  }

  /**
   * Update Card
   * PUT /api/v1/students/cards/:cardId
   */
  static async updateCard(cardId: number, payload: any): Promise<ApiResponse<any>> {
    try {
      console.log('🃏 [NewApiService] Updating card:', { cardId, payload });
      const response = await apiClient.put<any>(`/students/cards/${cardId}`, payload);
      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Update card error:', error);
      handleApiError(error, 'update card');
    }
  }

  /**
   * Delete Card
   * DELETE /api/v1/students/cards/:cardId
   */
  static async deleteCard(cardId: number): Promise<ApiResponse<any>> {
    try {
      console.log('🃏 [NewApiService] Deleting card:', cardId);
      const response = await apiClient.delete<any>(`/students/cards/${cardId}`);
      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Delete card error:', error);
      handleApiError(error, 'delete card');
    }
  }

  /**
   * Get Card By ID
   * GET /api/v1/students/cards/:cardId
   */
  static async getCardById(cardId: number): Promise<ApiResponse<any>> {
    try {
      console.log('🃏 [NewApiService] Getting card by id:', cardId);
      const response = await apiClient.get<any>(`/students/cards/${cardId}`);
      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get card by id error:', error);
      handleApiError(error, 'get card by id');
    }
  }

  /**
   * Get Cards filtered by unit or module
   * GET /api/v1/students/cards/filter-by-unit-module
   */
  static async getCardsByUnitOrModule(params: { moduleId?: number; uniteId?: number; page?: number; limit?: number } = {}): Promise<ApiResponse<any>> {
    try {
      const { moduleId, uniteId, page = 1, limit = 10 } = params;

      if (moduleId && uniteId) {
        throw new ApiError('Cannot specify both moduleId and uniteId');
      }

      const queryParams = new URLSearchParams();
      if (moduleId) queryParams.append('moduleId', moduleId.toString());
      if (uniteId) queryParams.append('uniteId', uniteId.toString());
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      const url = `/students/cards/filter-by-unit-module?${queryParams.toString()}`;
      console.log('🃏 [NewApiService] Getting cards by unit/module:', params);

      const response = await apiClient.get<any>(url);

      // Unwrap nested data if present
      if (response?.success && (response as any).data?.data) {
        return { ...response, data: (response as any).data.data };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get cards by unit/module error:', error);
      handleApiError(error, 'get cards by unit/module');
    }
  }

  /**
   * Get student courses by unit or module
   * GET /api/v1/students/courses/by-module
   */
  static async getStudentCourses(params: { moduleId?: number; uniteId?: number }): Promise<ApiResponse<any>> {
    try {
      const { moduleId, uniteId } = params;

      if (!moduleId && !uniteId) {
        throw new ApiError('Either moduleId or uniteId is required');
      }

      if (moduleId && uniteId) {
        throw new ApiError('Provide only one of moduleId or uniteId');
      }

      const queryParams = new URLSearchParams();
      if (moduleId) queryParams.append('moduleId', moduleId.toString());
      if (uniteId) queryParams.append('uniteId', uniteId.toString());

      const url = `/students/courses/by-module?${queryParams.toString()}`;
      console.log('🃏 [NewApiService] Getting student courses:', params);

      const response = await apiClient.get<any>(url);

      if (response?.success && (response as any).data?.data) {
        return { ...response, data: (response as any).data.data };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get student courses error:', error);
      handleApiError(error, 'get student courses');
    }
  }

  /**
   * Upsert course layer completion status
   * POST /api/v1/students/course-layers
   */
  static async upsertCourseLayer(payload: { courseId: number; layerNumber: number; completed: boolean }): Promise<ApiResponse<any>> {
    try {
      console.log('🃏 [NewApiService] Upserting course layer:', payload);
      const response = await apiClient.post<any>('/students/course-layers', payload);
      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Upsert course layer error:', error);
      handleApiError(error, 'upsert course layer');
    }
  }

  /**
   * Add Course to Card
   * POST /api/v1/students/cards/:cardId/courses/:courseId
   */
  static async addCourseToCard(cardId: number, courseId: number): Promise<ApiResponse<any>> {
    try {
      const url = `/students/cards/${cardId}/courses/${courseId}`;
      console.log('🃏 [NewApiService] Adding course to card:', { cardId, courseId });

      const response = await apiClient.post<any>(url);

      console.log('📥 [NewApiService] Add course to card response:', {
        success: response.success,
        cardId,
        courseId,
        message: response.message
      });

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Add course to card error:', error);
      handleApiError(error, 'add course to card');
    }
  }

  /**
   * Remove Course from Card
   * DELETE /api/v1/students/cards/:cardId/courses/:courseId
   */
  static async removeCourseFromCard(cardId: number, courseId: number): Promise<ApiResponse<any>> {
    try {
      const url = `/students/cards/${cardId}/courses/${courseId}`;
      console.log('🃏 [NewApiService] Removing course from card:', { cardId, courseId });

      const response = await apiClient.delete<any>(url);

      console.log('📥 [NewApiService] Remove course from card response:', {
        success: response.success,
        cardId,
        courseId,
        message: response.message
      });

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Remove course from card error:', error);
      handleApiError(error, 'remove course from card');
    }
  }

  /**
   * Get Card Progress
   * GET /api/v1/students/cards/:cardId/progress
   */
  static async getCardProgress(cardId: number): Promise<ApiResponse<any>> {
    try {
      const url = `/students/cards/${cardId}/progress`;
      console.log('🃏 [NewApiService] Getting card progress:', cardId);

      const response = await apiClient.get<any>(url);

      console.log('📥 [NewApiService] Card progress response:', {
        success: response.success,
        cardId,
        progressPercentage: response.data?.cardProgressPercentage,
        coursesCount: response.data?.courseProgress?.length || 0,
        totalCourses: response.data?.totalCourses,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        courseProgressExists: !!response.data?.courseProgress,
        courseProgressType: typeof response.data?.courseProgress,
        courseProgressIsArray: Array.isArray(response.data?.courseProgress),
        firstCourse: response.data?.courseProgress?.[0] || 'no courses',
        // Check for nested structure like other APIs
        hasNestedData: !!response.data?.data,
        nestedDataKeys: response.data?.data ? Object.keys(response.data.data) : 'no nested data',
        nestedCourseProgress: response.data?.data?.courseProgress,
        nestedCoursesCount: response.data?.data?.courseProgress?.length || 0,
        fullResponse: response
      });

      // Handle potential nested response structure
      if (response.success && response.data?.data && !response.data?.courseProgress) {
        console.log('🔄 [NewApiService] Detected nested progress data structure, extracting...');
        return {
          ...response,
          data: response.data.data
        };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get card progress error:', error);
      handleApiError(error, 'get card progress');
    }
  }

  /**
   * Get Content Filters
   * GET /api/v1/students/content/filters
   */
  static async getContentFilters(yearLevel?: string): Promise<ApiResponse<ContentFilters>> {
    try {
      const queryParams = new URLSearchParams();
      if (yearLevel) {
        queryParams.append('yearLevel', yearLevel);
      }
      const url = queryParams.toString()
        ? `/students/content/filters?${queryParams.toString()}`
        : '/students/content/filters';

      console.log('🌐 [NewApiService] Getting content filters:', { yearLevel });

      const response = await apiClient.get<ContentFilters>(url);

      // Handle potential nested response structure
      if (response.success && response.data) {
        const data = (response.data as any).data || response.data;
        console.log('📥 [NewApiService] Content filters response:', {
          success: response.success,
          unites: data.unites?.length || 0,
          independentModules: data.independentModules?.length || 0
        });
        return {
          ...response,
          data: data
        };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get content filters error:', error);
      handleApiError(error, 'get content filters');
    }
  }

  /**
   * Get Quiz Session Filters
   * Uses /students/content/filters endpoint and transforms the response
   * @deprecated Consider using getContentFilters directly for hierarchical module/course data
   */
  /**
   * Get Quiz Session Filters
   * Uses /quizzes/session-filters endpoint - Canonical Source of Truth
   */
  static async getQuizSessionFilters(options?: {
    uniteId?: number;
    moduleId?: number;
  }): Promise<ApiResponse<ExamSessionFilters>> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.uniteId) queryParams.append('uniteId', options.uniteId.toString());
      if (options?.moduleId) queryParams.append('moduleId', options.moduleId.toString());

      const url = queryParams.toString()
        ? `/quizzes/session-filters?${queryParams.toString()}`
        : '/quizzes/session-filters';

      console.log('🌐 [NewApiService] Getting quiz session filters:', options);

      const response = await apiClient.get<ExamSessionFilters>(url);

      // Handle potential nested response structure (e.g. { data: { ... } })
      if (response.success && response.data) {
        // Check if data is nested inside data property (common pattern in this codebase)
        const info = (response.data as any).data || response.data;

        console.log('📥 [NewApiService] Quiz session filters response:', {
          success: response.success,
          universitiesCount: info.universities?.length || 0,
          sourcesCount: info.questionSources?.length || 0,
          yearsCount: info.examYears?.length || 0
        });

        return {
          ...response,
          data: info
        };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get quiz session filters error:', error);
      handleApiError(error, 'get quiz session filters');
    }
  }

  /**
   * Get Question Count
   * POST /api/v1/quizzes/question-count
   */
  static async getQuestionCount(
    filters: {
      courseIds: number[];
      questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'>;
      years?: number[];
      rotations?: Array<'R1' | 'R2' | 'R3' | 'R4'>;
      universityIds?: number[];
      questionSourceIds?: number[];
      repetitionCountMin?: number;
    },
    options?: { signal?: AbortSignal }
  ): Promise<ApiResponse<{ totalQuestionCount: number; accessibleQuestionCount: number }>> {
    try {
      console.log('🌐 [NewApiService] Getting question count:', filters);

      const response = await apiClient.post<{ totalQuestionCount: number; accessibleQuestionCount: number }>(
        '/quizzes/question-count',
        filters,
        options
      );

      // Handle potential nested response structure
      if (response.success && response.data) {
        const data = (response.data as any).data || response.data;
        console.log('📥 [NewApiService] Question count response:', {
          success: response.success,
          totalQuestionCount: data.totalQuestionCount,
          accessibleQuestionCount: data.accessibleQuestionCount
        });
        return {
          ...response,
          data: data
        };
      }

      return response;
    } catch (error: any) {
      // If aborted, don't log as error
      if (error?.name === 'AbortError' || options?.signal?.aborted) {
        console.log('⏸️ [NewApiService] Question count request was aborted');
        throw error;
      }
      console.error('💥 [NewApiService] Get question count error:', error);
      handleApiError(error, 'get question count');
    }
  }

  /**
   * Get Session Filters (for practice/exam sessions)
   * GET /api/v1/students/sessions/filters
   */
  static async getSessionFilters(sessionType: 'PRACTICE' | 'EXAM'): Promise<ApiResponse<SessionFilters>> {
    try {
      const url = `/students/sessions/filters?sessionType=${sessionType}`;
      console.log('🌐 [NewApiService] Getting session filters:', { sessionType });

      const response = await apiClient.get<SessionFilters>(url);

      // Handle potential nested response structure
      if (response.success && response.data) {
        const data = (response.data as any).data || response.data;
        console.log('📥 [NewApiService] Session filters response:', {
          success: response.success,
          sessionType,
          unites: data.unites?.length || 0,
          independentModules: data.independentModules?.length || 0
        });
        return {
          ...response,
          data: data
        };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get session filters error:', error);
      handleApiError(error, 'get session filters');
    }
  }

  /**
   * Get Residency Session Filters
   * GET /api/v1/quizzes/session-residency-filters
   * Returns only: { universities: Array<{ id, name, examYears }> }
   */
  static async getResidencyFilters(): Promise<ApiResponse<any>> {
    try {
      const url = '/quizzes/session-residency-filters';
      console.log('🌐 [NewApiService] Getting residency session filters');

      const response = await apiClient.get<any>(url);

      // Handle potential nested response structure
      if (response.success && response.data) {
        const data = (response.data as any).data || response.data;
        console.log('📥 [NewApiService] Residency filters response:', {
          success: response.success,
          universitiesCount: data.universities?.length || 0,
        });
        return {
          ...response,
          data: data
        };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get residency filters error:', error);
      handleApiError(error, 'get residency filters');
    }
  }

  /**
   * Get Residency Available Parts
   * GET /api/v1/quizzes/residency-available-parts?universityId=X&examYear=Y
   * Returns: { parts: string[], questionCount: number }
   */
  static async getResidencyAvailableParts(universityId: number, examYear: number): Promise<ApiResponse<any>> {
    try {
      const url = `/quizzes/residency-available-parts?universityId=${universityId}&examYear=${examYear}`;
      console.log('🌐 [NewApiService] Getting residency available parts:', { universityId, examYear });

      const response = await apiClient.get<any>(url);

      if (response.success && response.data) {
        const data = (response.data as any).data || response.data;
        console.log('📥 [NewApiService] Residency available parts:', data);
        return {
          ...response,
          data: data
        };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get residency available parts error:', error);
      handleApiError(error, 'get residency available parts');
    }
  }

  /**
   * Get Residency Sessions (summary only)
   * GET /api/v1/quizzes/residency-sessions-only
   */
  static async getResidencySessionsOnly(): Promise<ApiResponse<any>> {
    try {
      const url = '/quizzes/residency-sessions-only';
      console.log('🌐 [NewApiService] Getting residency sessions (summary only)');

      const response = await apiClient.get<any>(url);

      // Handle potential nested response structure (e.g. { data: { sessions: [...] } })
      if (response.success && response.data) {
        const data = (response.data as any).data || response.data;
        console.log('📥 [NewApiService] Residency sessions response:', {
          success: response.success,
          sessionsCount: Array.isArray(data.sessions) ? data.sessions.length : 0,
          hasNestedData: !!(response as any).data?.data
        });

        return {
          ...response,
          data
        };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Get residency sessions only error:', error);
      handleApiError(error, 'get residency sessions only');
    }
  }

  /**
   * Create Residency Session
   * POST /api/v1/quizzes/residency-sessions
   */
  static async createResidencySession(payload: {
    title: string;
    examYear: number;
    universityId: number;
    parts?: string[];
  }): Promise<ApiResponse<any>> {
    try {
      const url = '/quizzes/residency-sessions';
      console.log('🌐 [NewApiService] Creating residency session:', payload);

      const response = await apiClient.post<any>(url, payload);

      if (response.success) {
        console.log('📥 [NewApiService] Residency session created');
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Create residency session error:', error);
      handleApiError(error, 'create residency session');
    }
  }

  /**
   * Create Quiz Session
   * POST /api/v1/quizzes/sessions (Canonical spec)
   */
  static async createQuizSession(payload: {
    title: string;
    courseIds: number[];
    sessionType: 'PRACTICE' | 'EXAM';
    questionCount?: number;
    questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'>;
    years?: number[];
    rotations?: string[];
    universityIds?: number[];
    questionSourceIds?: number[];
    repetitionCountMin?: number;
    repetitionYears?: number[];
  }): Promise<ApiResponse<any>> {
    try {
      console.log('🌐 [NewApiService] Creating quiz session:', payload);

      const response = await apiClient.post<any>('/quizzes/sessions', payload);

      // Handle potential nested response structure
      if (response && response.success && response.data) {
        const data = (response.data as any).data || response.data;
        console.log('📥 [NewApiService] Quiz session created:', {
          sessionId: data.sessionId,
          success: true
        });
        return {
          ...response,
          data: data
        };
      }

      return response;
    } catch (error) {
      console.error('💥 [NewApiService] Create quiz session error:', error);
      handleApiError(error, 'create quiz session');
    }
  }
}
