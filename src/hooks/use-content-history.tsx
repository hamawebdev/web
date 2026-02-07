'use client';

import { useState, useEffect, useCallback } from 'react';
import { NewApiService, ContentFilters } from '@/lib/api/new-api-services';
import { UnitModuleItem } from '@/components/student/shared/unit-module-card';
import { toast } from 'sonner';

export interface ContentHistoryState {
  contentFilters: ContentFilters | null;
  loading: boolean;
  error: string | null;
  selectedItem: UnitModuleItem | null;
  sessions: any[] | null;
  sessionsLoading: boolean;
  sessionsError: string | null;
  pagination: {
    page: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    total?: number;
  } | null;
}

export interface UseContentHistoryResult extends ContentHistoryState {
  selectItem: (item: UnitModuleItem) => void;
  clearSelection: () => void;
  refetchContent: () => Promise<void>;
  refetchSessions: () => Promise<void>;
  setPage: (page: number) => void;
}

export interface UseContentHistoryOptions {
  yearLevel?: string;
}

export function useContentHistory(
  sessionType: 'PRACTICE' | 'EXAM',
  options?: UseContentHistoryOptions
): UseContentHistoryResult {
  const { yearLevel } = options || {};
  const [state, setState] = useState<ContentHistoryState>({
    contentFilters: null,
    loading: true,
    error: null,
    selectedItem: null,
    sessions: null,
    sessionsLoading: false,
    sessionsError: null,
    pagination: null
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch content filters
  const fetchContentFilters = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🌐 [useContentHistory] Fetching content filters...', { yearLevel });
      const response = await NewApiService.getContentFilters(yearLevel);

      if (response.success && response.data) {
        console.log('🌐 [useContentHistory] Content filters loaded successfully:', {
          unites: response.data.unites?.length || 0,
          independentModules: response.data.independentModules?.length || 0,
          unitesData: response.data.unites,
          independentModulesData: response.data.independentModules
        });

        setState(prev => ({
          ...prev,
          contentFilters: response.data,
          loading: false,
          error: null
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch content filters');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch content filters';
      console.error('🌐 [useContentHistory] Error:', err);

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        contentFilters: null
      }));

      toast.error(errorMessage);
    }
  }, [yearLevel]);

  // Fetch sessions for selected item
  const fetchSessions = useCallback(async (item: UnitModuleItem, page: number = 1) => {
    try {
      setState(prev => ({
        ...prev,
        sessionsLoading: true,
        sessionsError: null,
        sessions: page === 1 ? null : prev.sessions // Keep existing sessions when loading new page
      }));

      console.log(`🎯 [useContentHistory] Fetching ${sessionType} sessions for:`, {
        type: item.type,
        id: item.id,
        name: item.name,
        page
      });

      const params = {
        sessionType,
        page,
        limit: 10,
        ...(item.type === 'unite' ? { uniteId: item.id } : { moduleId: item.id })
      };

      const response = await NewApiService.getPracticeSessions(params);

      if (response.success && response.data) {
        // Handle nested response structure as per documentation
        // API returns: { success: true, data: { success: true, data: { sessions: [...], ... } } }
        let sessionsData = response.data;

        // Check if we have a double-nested structure
        if (response.data.data && typeof response.data.data === 'object') {
          sessionsData = response.data.data;
        }

        const sessions = sessionsData.sessions || [];
        const paginationData = sessionsData.pagination || null;

        // Enrich sessions with unit/module logo information
        const enrichedSessions = sessions.map((session: any) => {
          const enrichedSession = { ...session };

          // Add unit information with logo if this is a unit-based session
          if (item.type === 'unite') {
            enrichedSession.unit = {
              id: item.id,
              name: item.name,
              logoUrl: item.logoUrl
            };
          }

          // Add module information with logo if this is a module-based session
          if (item.type === 'module') {
            enrichedSession.module = {
              id: item.id,
              name: item.name,
              logoUrl: item.logoUrl
            };
          }

          return enrichedSession;
        });

        console.log(`🎯 [useContentHistory] Sessions loaded successfully:`, {
          sessionsCount: sessions.length,
          enrichedSessionsCount: enrichedSessions.length,
          pagination: paginationData,
          logoInfo: {
            itemType: item.type,
            itemName: item.name,
            hasLogo: !!item.logoUrl,
            logoUrl: item.logoUrl
          },
          rawResponseStructure: {
            hasNestedData: !!response.data.data,
            dataKeys: Object.keys(response.data),
            sessionsDataKeys: Object.keys(sessionsData)
          }
        });

        setState(prev => ({
          ...prev,
          sessions: enrichedSessions,
          pagination: paginationData,
          sessionsLoading: false,
          sessionsError: null
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch sessions');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch sessions';
      console.error('🎯 [useContentHistory] Sessions error:', {
        error: err,
        errorMessage,
        params,
        item: {
          type: item.type,
          id: item.id,
          name: item.name
        }
      });

      // Handle specific error cases
      let finalErrorMessage = errorMessage;
      let shouldShowToast = true;

      // Check for empty results (not really an error)
      if (errorMessage.toLowerCase().includes('no sessions') ||
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('empty')) {
        finalErrorMessage = `No ${sessionType.toLowerCase()} sessions found for ${item.name}`;
        shouldShowToast = false;
      }

      // Check for API errors
      if (err?.response?.status === 404) {
        finalErrorMessage = `No ${sessionType.toLowerCase()} sessions available for ${item.name}`;
        shouldShowToast = false;
      } else if (err?.response?.status === 403) {
        finalErrorMessage = `Access denied to ${sessionType.toLowerCase()} sessions for ${item.name}`;
      } else if (err?.response?.status >= 500) {
        finalErrorMessage = 'Server error occurred while loading sessions. Please try again.';
      }

      setState(prev => ({
        ...prev,
        sessionsLoading: false,
        sessionsError: finalErrorMessage,
        sessions: [], // Set empty array instead of null for better UX
        pagination: null
      }));

      // Only show toast for actual errors, not empty results
      if (shouldShowToast) {
        toast.error(finalErrorMessage);
      }
    }
  }, [sessionType]);

  // Select an item and fetch its sessions
  const selectItem = useCallback((item: UnitModuleItem) => {
    // Log the user's selection for debugging
    console.log(`🎯 [${sessionType} Page] Unit/Module selected:`, {
      item,
      type: item.type,
      id: item.id,
      name: item.name,
      isIndependent: item.isIndependent,
      moduleCount: item.moduleCount,
      sessionCount: item.sessionCount,
      sessionType,
      timestamp: new Date().toISOString()
    });

    setState(prev => ({ ...prev, selectedItem: item }));
    setCurrentPage(1);
    fetchSessions(item, 1);
  }, [fetchSessions, sessionType]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItem: null,
      sessions: null,
      sessionsLoading: false,
      sessionsError: null,
      pagination: null
    }));
    setCurrentPage(1);
  }, []);

  // Set page and fetch sessions
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    if (state.selectedItem) {
      fetchSessions(state.selectedItem, page);
    }
  }, [state.selectedItem, fetchSessions]);

  // Refetch sessions for current selection
  const refetchSessions = useCallback(async () => {
    if (state.selectedItem) {
      await fetchSessions(state.selectedItem, currentPage);
    }
  }, [state.selectedItem, currentPage, fetchSessions]);

  // Initial load
  useEffect(() => {
    fetchContentFilters();
  }, [fetchContentFilters]);

  return {
    ...state,
    selectItem,
    clearSelection,
    refetchContent: fetchContentFilters,
    refetchSessions,
    setPage
  };
}
