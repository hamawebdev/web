// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudentService } from '@/lib/api-services';
import { PaginationParams, EnhancedNotesResponse, NotesFilterParams, ContentFiltersResponse, ModuleNavigationItem } from '@/types/api';
import { toast } from 'sonner';
import { logger, logHookOperation } from '@/lib/logger';

// Types for organization tools
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

// New types for grouped notes response
export interface ModuleGroup {
  module: {
    id: number;
    name: string;
    description: string;
  };
  notes: Note[];
}

export interface GroupedNotesResponse {
  groupedByModule: ModuleGroup[];
  totalNotes: number;
  totalModules: number;
}

export interface Label {
  id: number;
  name: string;
  statistics: {
    quizzesCount: number;
    questionsCount: number;
    quizSessionsCount: number;
    totalItems: number;
  };
  questionIds: number[]; // New: Array of associated question IDs
  questions: LabelQuestion[]; // New: Array of associated questions with details
  createdAt: string;
}

// New interface for questions in labels
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

export interface Todo {
  id: number;
  title: string;
  description?: string;
  type: 'READING' | 'SESSION' | 'EXAM' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
  completedAt?: string;
  course?: any;
  quiz?: any;
  exam?: any;
  quizSession?: any;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notes Management Hook
export function useNotes(params: PaginationParams & {
  search?: string;
  questionId?: number;
  quizId?: number; // Changed from sessionId to quizId to match API docs
  labelIds?: number[];
} = {}) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [groupedNotes, setGroupedNotes] = useState<ModuleGroup[] | null>(null);
  const [totalNotes, setTotalNotes] = useState<number>(0);
  const [totalModules, setTotalModules] = useState<number>(0);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    // Use centralized logging with throttling
    logHookOperation('useNotes', 'Starting to fetch notes', { params });
    setLoading(true);
    setError(null);

    try {
      const response = await StudentService.getNotes(params);

      if (response.success) {
        // Handle new grouped response format from API documentation
        const responseData = response.data?.data || response.data;

        if (responseData?.groupedByModule) {
          // New grouped format
          setGroupedNotes(responseData.groupedByModule);
          setTotalNotes(responseData.totalNotes || 0);
          setTotalModules(responseData.totalModules || 0);

          // Flatten notes for backward compatibility
          const flatNotes = responseData.groupedByModule.reduce((acc: Note[], group: ModuleGroup) => {
            return acc.concat(group.notes);
          }, []);
          setNotes(flatNotes);

          // No pagination in grouped format
          setPagination(null);
        } else {
          // Fallback to old paginated format
          const notesData = responseData?.data || responseData || [];
          const notesArray = Array.isArray(notesData) ? notesData : [];

          setNotes(notesArray);
          setGroupedNotes(null);
          setTotalNotes(notesArray.length);
          setTotalModules(0);
          setPagination(responseData?.pagination || null);
        }
      } else {
        logger.error('📝 useNotes: API returned error', response.error);
        throw new Error(response.error || 'Failed to fetch notes');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notes';
      logger.error('📝 useNotes: Fetch error caught', {
        error,
        errorMessage,
        errorType: typeof error,
        isApiError: error && typeof error === 'object' && 'statusCode' in error
      });

      setError(errorMessage);
      setNotes([]); // Set empty array on error
      setGroupedNotes(null);
      setTotalNotes(0);
      setTotalModules(0);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.limit, params.search, params.questionId, params.quizId, params.labelIds]);

  const createNote = useCallback(async (noteData: {
    noteText: string;
    questionId?: number;
    quizId?: number; // Changed from sessionId to quizId
    labelIds?: number[];
  }) => {
    try {
      const response = await StudentService.createNote(noteData);

      if (response.success) {
        toast.success('Note created successfully');
        fetchNotes(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create note');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create note';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchNotes]);

  const updateNote = useCallback(async (noteId: number, noteData: {
    noteText?: string;
    labelIds?: number[];
  }) => {
    try {
      const response = await StudentService.updateNote(noteId, noteData);

      if (response.success) {
        toast.success('Note updated successfully');
        fetchNotes(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update note');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update note';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchNotes]);

  const deleteNote = useCallback(async (noteId: number) => {
    try {
      const response = await StudentService.deleteNote(noteId);

      if (response.success) {
        toast.success('Note deleted successfully');
        fetchNotes(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to delete note');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchNotes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    groupedNotes,
    totalNotes,
    totalModules,
    pagination,
    loading,
    error,
    refresh: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}

// Enhanced Notes Management Hook with Unite/Module Filtering
export function useNotesByModule(params: NotesFilterParams | null) {
  const [notesData, setNotesData] = useState<EnhancedNotesResponse | null>(null);
  const [loading, setLoading] = useState(false); // Start with false when no params
  const [error, setError] = useState<string | null>(null);

  const fetchNotesByModule = useCallback(async () => {
    if (!params || (!params.moduleId && !params.uniteId)) {
      // Don't set error when params is null - this is expected when no module is selected
      if (params && !params.moduleId && !params.uniteId) {
        setError('Either moduleId or uniteId must be provided');
      } else {
        setError(null);
      }
      setLoading(false);
      return;
    }

    // Use centralized logging with throttling
    logHookOperation('useNotesByModule', 'Starting to fetch notes by module', { params });
    setLoading(true);
    setError(null);

    try {
      const response = await StudentService.getNotesByModule(params);

      if (response.success) {
        const responseData = response.data?.data || response.data;
        setNotesData(responseData);
      } else {
        logger.error('📝 useNotesByModule: API returned error', response.error);
        throw new Error(response.error || 'Failed to fetch notes by module');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notes by module';
      logger.error('📝 useNotesByModule: Fetch error caught', {
        error,
        errorMessage,
        errorType: typeof error,
        isApiError: error && typeof error === 'object' && 'statusCode' in error
      });

      setError(errorMessage);
      setNotesData(null);
    } finally {
      setLoading(false);
    }
  }, [params?.moduleId, params?.uniteId]);

  useEffect(() => {
    fetchNotesByModule();
  }, [fetchNotesByModule]);

  return {
    notesData,
    loading,
    error,
    refresh: fetchNotesByModule,
    filterInfo: notesData?.filterInfo || null,
    courseGroups: notesData?.courseGroups || [],
    ungroupedNotes: notesData?.ungroupedNotes || [],
    totalNotes: notesData?.totalNotes || 0,
  };
}

// Legacy Module Notes Hook (for backward compatibility)
export function useModuleNotes(moduleId: number) {
  const [moduleNotesData, setModuleNotesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModuleNotes = useCallback(async () => {
    if (!moduleId) {
      setError('Module ID is required');
      setLoading(false);
      return;
    }

    // Use centralized logging with throttling
    logHookOperation('useModuleNotes', 'Starting to fetch module notes', { moduleId });
    setLoading(true);
    setError(null);

    try {
      const response = await StudentService.getModuleNotes(moduleId);

      if (response.success) {
        const responseData = response.data?.data || response.data;
        setModuleNotesData(responseData);
      } else {
        logger.error('📝 useModuleNotes: API returned error', response.error);
        throw new Error(response.error || 'Failed to fetch module notes');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch module notes';
      logger.error('📝 useModuleNotes: Fetch error caught', {
        error,
        errorMessage,
        errorType: typeof error,
        isApiError: error && typeof error === 'object' && 'statusCode' in error
      });

      setError(errorMessage);
      setModuleNotesData(null);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModuleNotes();
  }, [fetchModuleNotes]);

  return {
    moduleNotesData,
    loading,
    error,
    refresh: fetchModuleNotes,
    moduleId: moduleNotesData?.moduleId || null,
    courseGroups: moduleNotesData?.courseGroups || [],
    ungroupedNotes: moduleNotesData?.ungroupedNotes || [],
    totalNotes: moduleNotesData?.totalNotes || 0,
  };
}

// Labels Management Hook
export function useLabels(filterParams?: { moduleId?: number; uniteId?: number }) {
  const [labels, setLabels] = useState<Label[] | null>(null);
  const [filterInfo, setFilterInfo] = useState<{
    uniteId: number | null;
    moduleId: number | null;
    uniteName: string | null;
    moduleName: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await StudentService.getLabels();

      // Determine the labels array from various possible response structures
      // 1. Direct data array (observed format): {"data": [...]}
      // 2. Nested data array (legacy format): {"data": {"data": [...]}} or {"success": true, "data": [...]}
      let labelsData: any[] | null = null;

      if (Array.isArray(response.data)) {
        labelsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        labelsData = response.data.data;
      }

      if (labelsData !== null) {
        setLabels(labelsData);
        setFilterInfo(null); // No filter context needed for direct label fetching
      } else if (response.success) {
        // Success flag present but no array found, assume empty (safe fallback)
        setLabels([]);
        setFilterInfo(null);
      } else {
        throw new Error(response.error || 'Failed to fetch labels');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch labels';
      setError(errorMessage);
      setLabels([]); // Set empty array on error
      console.error('Labels fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Remove dependency on filterParams since we're fetching all labels directly

  const createLabel = useCallback(async (labelData: {
    name: string;
  }) => {
    try {
      const response = await StudentService.createLabel(labelData);

      if (response.success) {
        toast.success('Label created successfully');
        fetchLabels(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create label');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create label';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchLabels]);

  const updateLabel = useCallback(async (labelId: number, labelData: {
    name?: string;
  }) => {
    try {
      const response = await StudentService.updateLabel(labelId, labelData);

      if (response.success) {
        toast.success('Label updated successfully');
        fetchLabels(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update label');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update label';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchLabels]);

  const deleteLabel = useCallback(async (labelId: number) => {
    try {
      const response = await StudentService.deleteLabel(labelId);

      if (response.success) {
        toast.success('Label deleted successfully');
        fetchLabels(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to delete label');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete label';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchLabels]);

  // New methods for question-label associations
  const addQuestionToLabel = useCallback(async (questionId: number, labelId: number) => {
    try {
      const response = await StudentService.addQuestionToLabel(questionId, labelId);

      // Handle response: API returns {"message": "..."} without success flag
      // Check for message field or success flag
      const message = response.message || response.data?.message;
      const isSuccess = response.success || message;

      if (isSuccess) {
        // Show appropriate toast based on the message
        if (message?.includes('already')) {
          toast.info(message || 'Question already in label');
        } else {
          toast.success(message || 'Question added to label successfully');
        }
        fetchLabels(); // Refresh the list to show updated associations
        return response.data || response;
      } else {
        throw new Error(response.error || 'Failed to add question to label');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add question to label';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchLabels]);

  const removeQuestionFromLabel = useCallback(async (questionId: number, labelId: number) => {
    try {
      const response = await StudentService.removeQuestionFromLabel(questionId, labelId);

      // Handle response: API returns {"message": "..."} without success flag
      // Check for message field or success flag
      const message = response.message || response.data?.message;
      const isSuccess = response.success || message;

      if (isSuccess) {
        toast.success(message || 'Question removed from label successfully');
        fetchLabels(); // Refresh the list to show updated associations
        return response.data || response;
      } else {
        throw new Error(response.error || 'Failed to remove question from label');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove question from label';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchLabels]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  return {
    labels,
    filterInfo,
    loading,
    error,
    refresh: fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel,
    addQuestionToLabel,
    removeQuestionFromLabel,
  };
}

// Todos Management Hook
export function useTodos(params: PaginationParams & {
  includeCompleted?: boolean;
  status?: 'pending' | 'completed' | 'all';
  priority?: 'low' | 'medium' | 'high' | 'all';
  type?: 'reading' | 'session' | 'exam' | 'other' | 'all';
  dueDate?: string;
} = {}) {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await StudentService.getTodos(params);

      if (response.success) {
        // Handle nested API response structure: response.data.data.todos
        const todosData = response.data?.data?.todos || response.data?.data?.data?.todos || response.data?.data || response.data || [];
        setTodos(Array.isArray(todosData) ? todosData : []);
        setPagination(response.data?.data?.pagination || response.data?.data?.data?.pagination || response.data?.pagination || null);
      } else {
        throw new Error(response.error || 'Failed to fetch todos');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch todos';
      setError(errorMessage);
      setTodos([]); // Set empty array on error
      console.error('Todos fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.limit, params.status, params.priority, params.dueDate, params.search]);

  const createTodo = useCallback(async (todoData: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    type?: 'READING' | 'SESSION' | 'EXAM' | 'OTHER';
    courseIds?: number[];
    quizId?: number;
  }) => {
    try {
      const response = await StudentService.createTodo(todoData);

      if (response.success) {
        toast.success('Todo created successfully');

        // Refresh the todos list
        await fetchTodos();

        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create todo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create todo';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchTodos]);

  const updateTodo = useCallback(async (todoId: number, todoData: {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }) => {
    try {
      const response = await StudentService.updateTodo(todoId, todoData);

      if (response.success) {
        toast.success('Todo updated successfully');
        fetchTodos(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update todo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update todo';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchTodos]);

  const completeTodo = useCallback(async (todoId: number) => {
    try {
      const response = await StudentService.completeTodo(todoId);

      if (response.success) {
        toast.success('Todo completed!');
        fetchTodos(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to complete todo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete todo';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchTodos]);

  const deleteTodo = useCallback(async (todoId: number) => {
    try {
      const response = await StudentService.deleteTodo(todoId);

      if (response.success) {
        toast.success('Todo deleted successfully');
        fetchTodos(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to delete todo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete todo';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchTodos]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return {
    todos,
    pagination,
    loading,
    error,
    refresh: fetchTodos,
    createTodo,
    updateTodo,
    completeTodo,
    deleteTodo,
  };
}

// Question Notes Hook (for specific question notes)
export function useQuestionNotes(questionId: number | null) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestionNotes = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await StudentService.getQuestionNotes(id);

      if (response.success) {
        setNotes(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch question notes');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch question notes';
      setError(errorMessage);
      console.error('Question notes fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (questionId) {
      fetchQuestionNotes(questionId);
    } else {
      setNotes(null);
      setLoading(false);
      setError(null);
    }
  }, [questionId, fetchQuestionNotes]);

  return {
    notes,
    loading,
    error,
    refresh: questionId ? () => fetchQuestionNotes(questionId) : undefined,
  };
}

// Content Filters Hook for Navigation
export function useContentFilters() {
  const [contentFilters, setContentFilters] = useState<ContentFiltersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContentFilters = useCallback(async () => {
    // Use centralized logging with throttling
    logHookOperation('useContentFilters', 'Starting to fetch content filters');
    setLoading(true);
    setError(null);

    try {
      const response = await StudentService.getContentFilters();

      if (response.success) {
        const responseData = response.data?.data || response.data;
        setContentFilters(responseData);
      } else {
        logger.error('📂 useContentFilters: API returned error', response.error);
        throw new Error(response.error || 'Failed to fetch content filters');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch content filters';
      logger.error('📂 useContentFilters: Fetch error caught', {
        error,
        errorMessage,
        errorType: typeof error,
        isApiError: error && typeof error === 'object' && 'statusCode' in error
      });

      setError(errorMessage);
      setContentFilters(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Transform content filters into navigation items
  const navigationItems = useMemo((): ModuleNavigationItem[] => {
    if (!contentFilters) return [];

    const items: ModuleNavigationItem[] = [];

    // Add unites as navigation items (with null checks)
    (contentFilters.unites || []).forEach(unite => {
      items.push({
        id: unite.id,
        name: unite.name,
        type: 'unite',
      });

      // Add modules within unites (with null checks)
      (unite.modules || []).forEach(module => {
        items.push({
          id: module.id,
          name: module.name,
          type: 'module',
          uniteId: unite.id,
          uniteName: unite.name,
        });
      });
    });

    // Add independent modules (with null checks)
    (contentFilters.independentModules || []).forEach(module => {
      items.push({
        id: module.id,
        name: module.name,
        type: 'module',
      });
    });

    return items;
  }, [contentFilters]);

  useEffect(() => {
    fetchContentFilters();
  }, [fetchContentFilters]);

  return {
    contentFilters,
    navigationItems,
    loading,
    error,
    refresh: fetchContentFilters,
  };
}
