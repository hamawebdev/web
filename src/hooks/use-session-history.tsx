'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCachedResource } from '@/lib/cached-resource';
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

/** One page of the student's practice or exam sessions (throws on failure) */
async function fetchSessionHistoryPage(sessionType: 'PRACTICE' | 'EXAM', page: number) {
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
    const pagination = sessionsData?.pagination || {
        page: sessionsData?.page || page,
        totalPages: sessionsData?.totalPages || 1,
        total: sessionsData?.total || sessions.length,
        limit: sessionsData?.limit || 10
    };
    return { sessions, pagination };
}

/**
 * Hook to fetch and manage session history for practice/exam sessions.
 * The last page seen shows at once on later visits and is refreshed in the background.
 */
export function useSessionHistory(
    sessionType: 'PRACTICE' | 'EXAM'
): UseSessionHistoryResult {
    const [currentPage, setCurrentPage] = useState(1);
    const { data, loading, error, refresh } = useCachedResource(
        `session-history:${sessionType}:${currentPage}`,
        () => fetchSessionHistoryPage(sessionType, currentPage)
    );

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    const sessions = data?.sessions ?? null;
    const summary = useMemo(() => {
        if (!data) return null;
        const list = data.sessions;
        const scored = list.filter((s) => s.score !== null);
        return {
            totalSessions: data.pagination.total || list.length,
            completedSessions: list.filter((s) => s.status === 'COMPLETED').length,
            inProgressSessions: list.filter((s) => s.status === 'IN_PROGRESS').length,
            notStartedSessions: list.filter((s) => s.status === 'NOT_STARTED').length,
            averageScore: list.length > 0
                ? Math.round(scored.reduce((sum, s) => sum + (s.score || 0), 0) / Math.max(scored.length, 1))
                : 0
        };
    }, [data]);

    const setPage = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    return {
        sessions,
        loading,
        error: sessions ? null : error,
        summary,
        pagination: data?.pagination ?? null,
        refetch: refresh,
        setPage
    };
}
