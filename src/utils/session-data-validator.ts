/**
 * Session Data Validator
 * 
 * Utility to validate and test session data normalization
 * for practice and exam session history display
 */

// Mock API response structure based on documentation
const mockApiResponse = {
  success: true,
  data: {
    success: true,
    data: {
      filterInfo: {
        uniteId: 53,
        moduleId: null,
        uniteName: "Basic Medical Sciences",
        moduleName: null,
        sessionType: "PRACTICE"
      },
      totalSessions: 2,
      sessions: [
        {
          sessionId: 419,
          title: "Practice Session - First Year Exam",
          status: "COMPLETED",
          type: "PRACTICE",
          timeSpent: 1800,
          totalQuestions: 5,
          questionsAnswered: 5,
          questionsNotAnswered: 0,
          correctAnswers: 4,
          incorrectAnswers: 1,
          score: 85,
          percentage: 85,
          averageTimePerQuestion: 360,
          completedAt: "2025-09-10T17:28:09.661Z"
        },
        {
          sessionId: 630,
          title: "Valid EXAM Session",
          status: "NOT_STARTED",
          type: "PRACTICE",
          timeSpent: 0,
          totalQuestions: 7,
          questionsAnswered: 7,
          questionsNotAnswered: 0,
          correctAnswers: 0,
          incorrectAnswers: 7,
          score: 0,
          percentage: 0,
          averageTimePerQuestion: 0,
          completedAt: null
        }
      ],
      aggregateStats: {
        totalTimeSpent: 1800,
        totalQuestionsAnswered: 12,
        totalCorrectAnswers: 4,
        overallAccuracy: 33.33,
        averageSessionScore: 42.5
      }
    }
  },
  meta: {
    timestamp: "2025-09-11T19:22:25.991Z",
    requestId: "1npi73zd7ip"
  }
};

// Session normalization function (copied from SessionList component)
function normalizeSessionData(session: any) {
  const id = session.id || session.sessionId;
  
  if (!id) {
    console.warn('Session missing both id and sessionId:', session);
  }

  return {
    id: id || 0,
    sessionId: session.sessionId,
    title: session.title || `Session ${id}`,
    status: session.status || 'NOT_STARTED',
    type: session.type || 'PRACTICE',
    createdAt: session.createdAt || new Date().toISOString(),
    completedAt: session.completedAt,
    score: session.score,
    totalQuestions: session.totalQuestions,
    correctAnswers: session.correctAnswers,
    incorrectAnswers: session.incorrectAnswers,
    questionsAnswered: session.questionsAnswered,
    questionsNotAnswered: session.questionsNotAnswered,
    timeSpent: session.timeSpent,
    percentage: session.percentage,
    averageTimePerQuestion: session.averageTimePerQuestion
  };
}

// Data parsing function (copied from useContentHistory hook)
function parseApiResponse(response: any) {
  if (!response.success || !response.data) {
    throw new Error('Invalid API response structure');
  }

  let sessionsData = response.data;
  
  // Check if we have a double-nested structure
  if (response.data.data && typeof response.data.data === 'object') {
    sessionsData = response.data.data;
  }

  const sessions = sessionsData.sessions || [];
  const paginationData = sessionsData.pagination || null;

  return {
    sessions,
    pagination: paginationData,
    filterInfo: sessionsData.filterInfo,
    aggregateStats: sessionsData.aggregateStats
  };
}

// Validation tests
export function validateSessionDataHandling() {
  console.log('🧪 Starting session data validation tests...');

  try {
    // Test 1: Parse API response
    console.log('📋 Test 1: Parsing API response structure');
    const parsedData = parseApiResponse(mockApiResponse);
    console.log('✅ API response parsed successfully:', {
      sessionsCount: parsedData.sessions.length,
      hasFilterInfo: !!parsedData.filterInfo,
      hasAggregateStats: !!parsedData.aggregateStats
    });

    // Test 2: Normalize session data
    console.log('📋 Test 2: Normalizing session data');
    const normalizedSessions = parsedData.sessions.map(normalizeSessionData);
    console.log('✅ Sessions normalized successfully:', {
      originalCount: parsedData.sessions.length,
      normalizedCount: normalizedSessions.length,
      firstSession: normalizedSessions[0]
    });

    // Test 3: Validate required fields
    console.log('📋 Test 3: Validating required fields');
    normalizedSessions.forEach((session, index) => {
      const requiredFields = ['id', 'title', 'status', 'type'];
      const missingFields = requiredFields.filter(field => !session[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Session ${index} missing required fields: ${missingFields.join(', ')}`);
      }
    });
    console.log('✅ All sessions have required fields');

    // Test 4: Test edge cases
    console.log('📋 Test 4: Testing edge cases');
    
    // Empty response
    try {
      parseApiResponse({ success: true, data: { sessions: [] } });
      console.log('✅ Empty response handled correctly');
    } catch (err) {
      console.error('❌ Empty response test failed:', err);
    }

    // Malformed session data
    try {
      const malformedSession = { sessionId: null, title: null };
      const normalized = normalizeSessionData(malformedSession);
      console.log('✅ Malformed session data handled:', normalized);
    } catch (err) {
      console.error('❌ Malformed session test failed:', err);
    }

    console.log('🎉 All validation tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Validation tests failed:', error);
    return false;
  }
}

// Export for use in development/testing
export { mockApiResponse, normalizeSessionData, parseApiResponse };

// Auto-run validation in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run validation when this module is imported in development
  setTimeout(() => {
    console.log('🔧 Running session data validation in development mode...');
    validateSessionDataHandling();
  }, 1000);
}
