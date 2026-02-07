import { renderHook, waitFor } from '@testing-library/react';
import { useResidencyHistory } from '../use-residency-history';
import { NewApiService } from '@/lib/api/new-api-services';

// Mock the NewApiService
jest.mock('@/lib/api/new-api-services', () => ({
  NewApiService: {
    getResidencySessionsOnly: jest.fn()
  }
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}));

describe('useResidencyHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch residency sessions on mount', async () => {
    const mockSessions = [
      {
        id: 1,
        type: 'RESIDENCY',
        title: 'Session 1',
        status: 'COMPLETED',
        score: 85,
        percentage: 85,
        questionsCount: 10,
        answersCount: 10,
        startedAt: '2025-01-01T10:00:00Z',
        completedAt: '2025-01-01T11:00:00Z',
        timeSpent: 3600,
        createdAt: '2025-01-01T10:00:00Z',
        stats: {
          averagePerQuestion: 8.5,
          totalQuestions: 10,
          answeredCorrect: 8,
          answeredWrong: 2,
          consulted: 0,
          accuracy: '80%'
        }
      }
    ];

    (NewApiService.getResidencySessionsOnly as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        data: {
          sessions: mockSessions
        }
      }
    });

    const { result } = renderHook(() => useResidencyHistory());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.sessions).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify sessions are loaded
    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.error).toBeNull();
  });

  it('should calculate summary statistics correctly', async () => {
    const mockSessions = [
      {
        id: 1,
        type: 'RESIDENCY',
        title: 'Session 1',
        status: 'COMPLETED',
        percentage: 85,
        questionsCount: 10,
        answersCount: 10,
        startedAt: '2025-01-01T10:00:00Z',
        completedAt: '2025-01-01T11:00:00Z',
        timeSpent: 3600,
        createdAt: '2025-01-01T10:00:00Z',
        stats: {
          averagePerQuestion: 8.5,
          totalQuestions: 10,
          answeredCorrect: 8,
          answeredWrong: 2,
          consulted: 0,
          accuracy: '80%'
        }
      },
      {
        id: 2,
        type: 'RESIDENCY',
        title: 'Session 2',
        status: 'IN_PROGRESS',
        percentage: 60,
        questionsCount: 10,
        answersCount: 5,
        startedAt: '2025-01-02T10:00:00Z',
        completedAt: null,
        timeSpent: 1800,
        createdAt: '2025-01-02T10:00:00Z',
        stats: {
          averagePerQuestion: 6,
          totalQuestions: 10,
          answeredCorrect: 6,
          answeredWrong: 4,
          consulted: 0,
          accuracy: '60%'
        }
      }
    ];

    (NewApiService.getResidencySessionsOnly as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        data: {
          sessions: mockSessions
        }
      }
    });

    const { result } = renderHook(() => useResidencyHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary).toEqual({
      totalSessions: 2,
      completedSessions: 1,
      inProgressSessions: 1,
      notStartedSessions: 0,
      averageScore: 72 // (85 + 60) / 2 = 72.5, rounded to 72
    });
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch residency sessions';
    (NewApiService.getResidencySessionsOnly as jest.Mock).mockResolvedValue({
      success: false,
      error: errorMessage
    });

    const { result } = renderHook(() => useResidencyHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.sessions).toBeNull();
    expect(result.current.summary).toBeNull();
  });

  it('should provide refetch function', async () => {
    const mockSessions = [
      {
        id: 1,
        type: 'RESIDENCY',
        title: 'Session 1',
        status: 'COMPLETED',
        percentage: 85,
        questionsCount: 10,
        answersCount: 10,
        startedAt: '2025-01-01T10:00:00Z',
        completedAt: '2025-01-01T11:00:00Z',
        timeSpent: 3600,
        createdAt: '2025-01-01T10:00:00Z',
        stats: {
          averagePerQuestion: 8.5,
          totalQuestions: 10,
          answeredCorrect: 8,
          answeredWrong: 2,
          consulted: 0,
          accuracy: '80%'
        }
      }
    ];

    (NewApiService.getResidencySessionsOnly as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        data: {
          sessions: mockSessions
        }
      }
    });

    const { result } = renderHook(() => useResidencyHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call refetch
    await result.current.refetch();

    // Verify API was called again
    expect(NewApiService.getResidencySessionsOnly).toHaveBeenCalledTimes(2);
  });
});

