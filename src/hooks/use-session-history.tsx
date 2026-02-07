'use client';

import { useState, useEffect, useCallback } from 'react';
import { NewApiService } from '@/lib/api/new-api-services';
import { toast } from 'sonner';

export interface SessionHistoryItem {
    id: number;
    title: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    type: 'PRACTICE' | 'EXAM';
    createdAt: string;
    completedAt: string | null;
    score: number | null;
    percentage?: number;
    questionsCount?: number;
    answersCount?: number;
    timeSpent?: number;
    stats?: {
        averagePerQuestion: number;
        totalQuestions: number;
        answeredCorrect: number;
        answeredWrong: number;
        consulted: number;
        accuracy: string;
    };
}

export interface SessionHistoryState {
    sessions: SessionHistoryItem[] | null;
    loading: boolean;
    error: string | null;
    summary: {
        totalSessions: number;
        completedSessions: number;
        inProgressSessions: number;
        notStartedSessions: number;
        averageScore: number;
    } | null;
    pagination: {
        page: number;
        totalPages: number;
        total: number;
        limit: number;
    } | null;
}

export interface UseSessionHistoryResult extends SessionHistoryState {
    refetch: () => Promise<void>;
    setPage: (page: number) => void;
}

/**
 * Hook to fetch and manage session history for practice/exam sessions
 * Fetches all sessions without requiring unit/module filtering
 */
export function useSessionHistory(
    sessionType: 'PRACTICE' | 'EXAM'
): UseSessionHistoryResult {
    const [state, setState] = useState<SessionHistoryState>({
        sessions: null,
        loading: true,
        error: null,
        summary: null,
        pagination: null
    });
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch sessions
    const fetchSessions = useCallback(async (page: number = 1) => {
        try {
            setState(prev => ({
                ...prev,
                loading: true,
                error: null
            }));

            console.log(`📚 [useSessionHistory] Fetching ${sessionType} sessions, page ${page}...`);

            const response = await NewApiService.getAllSessionsByType(sessionType, page, 10);

            if (!response.success) {
                throw new Error(response.error || `Failed to fetch ${sessionType.toLowerCase()} sessions`);
            }

            // Extract sessions from response - handle nested structure
            let sessionsData = response.data;
            if (response.data?.data && typeof response.data.data === 'object') {
                sessionsData = response.data.data;
            }

            const sessions: SessionHistoryItem[] = sessionsData?.items || sessionsData?.sessions || [];
            const paginationData = sessionsData?.pagination || {
                page: sessionsData?.page || page,
                totalPages: sessionsData?.totalPages || 1,
                total: sessionsData?.total || sessions.length,
                limit: sessionsData?.limit || 10
            };

            console.log(`📚 [useSessionHistory] Sessions fetched:`, {
                count: sessions.length,
                pagination: paginationData,
                type: sessionType
            });

            // Calculate summary statistics
            const summary = {
                totalSessions: paginationData.total || sessions.length,
                completedSessions: sessions.filter((s) => s.status === 'COMPLETED').length,
                inProgressSessions: sessions.filter((s) => s.status === 'IN_PROGRESS').length,
                notStartedSessions: sessions.filter((s) => s.status === 'NOT_STARTED').length,
                averageScore: sessions.length > 0
                    ? Math.round(
                        sessions
                            .filter((s) => s.score !== null)
                            .reduce((sum, s) => sum + (s.score || 0), 0) /
                        Math.max(sessions.filter((s) => s.score !== null).length, 1)
                    )
                    : 0
            };

            setState({
                sessions,
                loading: false,
                error: null,
                summary,
                pagination: paginationData
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `Failed to fetch ${sessionType.toLowerCase()} sessions`;
            console.error(`💥 [useSessionHistory] Error:`, errorMessage);

            setState({
                sessions: null,
                loading: false,
                error: errorMessage,
                summary: null,
                pagination: null
            });

            toast.error(errorMessage);
        }
    }, [sessionType]);

    // Set page and refetch
    const setPage = useCallback((page: number) => {
        setCurrentPage(page);
        fetchSessions(page);
    }, [fetchSessions]);

    // Initial load
    useEffect(() => {
        fetchSessions(currentPage);
    }, [fetchSessions, currentPage]);

    // Refetch current page
    const refetch = useCallback(async () => {
        await fetchSessions(currentPage);
    }, [fetchSessions, currentPage]);

    return {
        ...state,
        refetch,
        setPage
    };
}
