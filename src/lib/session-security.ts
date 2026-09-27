// @ts-nocheck
/**
 * Session Security Utilities
 * 
 * Provides additional security measures for quiz sessions and other sensitive operations
 */

import { User } from '@/types/auth';
import AuthAPI from '@/lib/auth-api';

export interface SessionValidationResult {
  isValid: boolean;
  reason?: string;
  shouldRedirect?: boolean;
  redirectPath?: string;
}

export interface QuizSessionAccess {
  sessionId: string;
  userId: string;
  userRole: string;
  timestamp: number;
}

/**
 * Validates if a user has access to a specific quiz session
 */
export async function validateQuizSessionAccess(
  sessionId: string,
  user: User
): Promise<SessionValidationResult> {
  try {
    // Basic validation
    if (!sessionId || !user) {
      return {
        isValid: false,
        reason: 'Missing session ID or user information',
        shouldRedirect: true,
        redirectPath: '/student/practice'
      };
    }

    // Validate session ID format
    const sessionIdNum = parseInt(sessionId);
    if (isNaN(sessionIdNum) || sessionIdNum <= 0) {
      return {
        isValid: false,
        reason: 'Invalid session ID format',
        shouldRedirect: true,
        redirectPath: '/student/practice'
      };
    }

    // Check user role
    if (user.role !== 'STUDENT') {
      return {
        isValid: false,
        reason: 'Only students can access quiz sessions',
        shouldRedirect: true,
        redirectPath: user.role === 'ADMIN' ? '/admin/content/' :
                     user.role === 'EMPLOYEE' ? '/admin/question-sources' : '/'
      };
    }

    // Additional session-specific validation could be added here
    // For example:
    // - Check if the session belongs to the user
    // - Verify session is not expired
    // - Check if user has permission for this specific session type

    return {
      isValid: true
    };

  } catch (error) {
    console.error('🔐 Session validation error:', error);
    return {
      isValid: false,
      reason: 'Session validation failed',
      shouldRedirect: true,
      redirectPath: '/student/practice'
    };
  }
}

/**
 * Validates authentication token freshness
 */
export function validateTokenFreshness(): SessionValidationResult {
  try {
    if (!AuthAPI.isAuthenticated()) {
      return {
        isValid: false,
        reason: 'No valid authentication token',
        shouldRedirect: true,
        redirectPath: '/login'
      };
    }

    // Additional token validation logic could be added here
    // For example:
    // - Check token expiration
    // - Validate token signature
    // - Check for token blacklisting

    return {
      isValid: true
    };

  } catch (error) {
    console.error('🔐 Token validation error:', error);
    return {
      isValid: false,
      reason: 'Token validation failed',
      shouldRedirect: true,
      redirectPath: '/login'
    };
  }
}

/**
 * Logs security events for monitoring
 */
export function logSecurityEvent(
  event: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'SESSION_ACCESS' | 'UNAUTHORIZED_ACCESS',
  details: {
    userId?: string;
    sessionId?: string;
    userRole?: string;
    reason?: string;
    timestamp?: number;
  }
) {
  const logEntry = {
    event,
    ...details,
    timestamp: details.timestamp || Date.now(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Security Event:', logEntry);
  }

  // In production, this would send to a security monitoring service
  // Example:
  // securityMonitoringService.log(logEntry);
}

/**
 * Checks for suspicious activity patterns
 */
export function detectSuspiciousActivity(user: User, sessionId?: string): boolean {
  try {
    // Basic suspicious activity detection
    // This is a simplified example - real implementation would be more sophisticated

    const now = Date.now();
    const storageKey = `security_check_${user.id}`;
    
    if (typeof window !== 'undefined') {
      const lastCheck = localStorage.getItem(storageKey);
      const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;
      
      // Check if user is making too many requests too quickly
      const timeDiff = now - lastCheckTime;
      if (timeDiff < 1000) { // Less than 1 second between requests
        logSecurityEvent('UNAUTHORIZED_ACCESS', {
          userId: user.id,
          sessionId,
          userRole: user.role,
          reason: 'Rapid successive requests detected'
        });
        return true;
      }

      // Update last check time
      localStorage.setItem(storageKey, now.toString());
    }

    return false;

  } catch (error) {
    console.error('🔐 Suspicious activity detection error:', error);
    return false;
  }
}

/**
 * Comprehensive security check for quiz sessions
 */
export async function performSecurityCheck(
  sessionId: string,
  user: User
): Promise<SessionValidationResult> {
  try {
    // Check token freshness
    const tokenCheck = validateTokenFreshness();
    if (!tokenCheck.isValid) {
      logSecurityEvent('AUTH_FAILURE', {
        userId: user.id,
        sessionId,
        reason: tokenCheck.reason
      });
      return tokenCheck;
    }

    // Validate session access
    const sessionCheck = await validateQuizSessionAccess(sessionId, user);
    if (!sessionCheck.isValid) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', {
        userId: user.id,
        sessionId,
        userRole: user.role,
        reason: sessionCheck.reason
      });
      return sessionCheck;
    }

    // Check for suspicious activity
    if (detectSuspiciousActivity(user, sessionId)) {
      return {
        isValid: false,
        reason: 'Suspicious activity detected',
        shouldRedirect: true,
        redirectPath: '/student/practice'
      };
    }

    // Log successful access
    logSecurityEvent('SESSION_ACCESS', {
      userId: user.id,
      sessionId,
      userRole: user.role
    });

    return {
      isValid: true
    };

  } catch (error) {
    console.error('🔐 Security check error:', error);
    logSecurityEvent('AUTH_FAILURE', {
      userId: user.id,
      sessionId,
      reason: 'Security check failed'
    });
    
    return {
      isValid: false,
      reason: 'Security check failed',
      shouldRedirect: true,
      redirectPath: '/student/practice'
    };
  }
}

/**
 * Clears security-related data on logout
 */
export function clearSecurityData(userId?: string) {
  if (typeof window !== 'undefined' && userId) {
    const keysToRemove = [
      `security_check_${userId}`,
      `session_access_${userId}`
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
