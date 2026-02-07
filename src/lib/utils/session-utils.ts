/**
 * Utility functions for handling quiz session operations
 */

import { ApiResponse } from '@/lib/api-client';

/**
 * Safely extract session ID from API response
 * Tries multiple possible locations where the session ID might be stored
 */
export function extractSessionId(response: ApiResponse<any>): number | null {
  if (!response.success || !response.data) {
    console.warn('⚠️ [SessionUtils] Invalid response structure:', response);
    return null;
  }

  // Try different possible locations for session ID
  const possibleIds = [
    response.data.sessionId,
    response.data.id,
    response.data.data?.sessionId,
    response.data.data?.id,
    // Some APIs might return it in a nested structure
    response.data.session?.id,
    response.data.session?.sessionId
  ];

  for (const id of possibleIds) {
    if (typeof id === 'number' && id > 0) {
      console.log('✅ [SessionUtils] Found session ID:', id);
      return id;
    }
  }

  console.error('❌ [SessionUtils] No valid session ID found in response:', {
    data: response.data,
    possibleIds,
    dataStructure: response.data ? Object.keys(response.data) : 'null'
  });

  return null;
}

/**
 * Validate retake parameters
 */
export function validateRetakeParams(params: {
  originalSessionId: number;
  retakeType: string;
  title?: string;
}): { isValid: boolean; error?: string } {
  if (!params.originalSessionId || params.originalSessionId <= 0) {
    return { isValid: false, error: 'Invalid original session ID' };
  }

  const validRetakeTypes = ['SAME', 'INCORRECT_ONLY', 'CORRECT_ONLY', 'NOT_RESPONDED'];
  if (!params.retakeType || !validRetakeTypes.includes(params.retakeType)) {
    return { isValid: false, error: 'Invalid retake type' };
  }

  if (params.title && (params.title.trim().length < 3 || params.title.trim().length > 100)) {
    return { isValid: false, error: 'Title must be between 3 and 100 characters' };
  }

  return { isValid: true };
}

/**
 * Generate default retake title based on session type and ID
 */
export function generateRetakeTitle(sessionType: string, sessionId: number, retakeType: string): string {
  const typeLabel = sessionType === 'EXAM' ? 'Exam' : 'Practice';
  const retakeLabel = retakeType === 'SAME' ? 'Retake' : 
                     retakeType === 'INCORRECT_ONLY' ? 'Incorrect Only' :
                     retakeType === 'CORRECT_ONLY' ? 'Correct Only' : 'Not Responded';
  
  return `${typeLabel} ${sessionId} - ${retakeLabel}`;
}
