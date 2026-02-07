// @ts-nocheck
import {
  StudentDashboardPerformance,
  UserSubscription,
  WeeklyPerformanceData,
  WeeklyStats,
  RecentActivity,
  RecentSession,
  SubjectPerformance
} from '@/types/api';
import { 
  StudentMetrics, 
  Subscription, 
  LastSession, 
  WeeklyPerformance,
  StudentDashboardData,
  QuickAction,
  TodoItem 
} from '@/types/student';

/**
 * Convert API StudentDashboardPerformance to legacy StudentMetrics format
 */
export function adaptStudentMetrics(apiData: StudentDashboardPerformance | null): StudentMetrics {
  if (!apiData || typeof apiData !== 'object') {
    return {
      totalQuestions: 0,
      totalExams: 0,
      totalUnitsModules: 0,
      weeklyPerformance: [],
    };
  }

  // Calculate total sessions from weekly stats
  const totalSessions = apiData.weeklyStats?.reduce((sum, week) => sum + week.sessionsCompleted, 0) || 0;

  // Calculate average score from weekly stats
  const weeklyScores = apiData.weeklyStats?.filter(week => week.averageScore > 0) || [];
  const averageScore = weeklyScores.length > 0
    ? weeklyScores.reduce((sum, week) => sum + week.averageScore, 0) / weeklyScores.length
    : 0;

  return {
    totalQuestions: totalSessions * 10, // Estimate 10 questions per session
    totalExams: totalSessions, // Use total sessions as exams
    totalUnitsModules: apiData.subjectPerformance?.length || 0,
    weeklyPerformance: adaptWeeklyStatsToPerformance(apiData.weeklyStats || []),
  };
}

/**
 * Convert API WeeklyStats to legacy WeeklyPerformance format
 */
export function adaptWeeklyStatsToPerformance(apiData: WeeklyStats[]): WeeklyPerformance[] {
  if (!apiData || apiData.length === 0) {
    return [];
  }

  return apiData.map((week, index) => {
    // Calculate actual date for each week based on current date
    const currentDate = new Date();
    const weekStartDate = new Date(currentDate);
    // Go back to the start of current week (Sunday) then subtract weeks
    weekStartDate.setDate(currentDate.getDate() - currentDate.getDay() - (7 * (apiData.length - 1 - index)));

    const totalQuestions = week.sessionsCompleted * 10; // Estimate 10 questions per session
    const correctAnswers = Math.round((totalQuestions * week.averageScore) / 100);
    const incorrectAnswers = totalQuestions - correctAnswers;

    return {
      date: weekStartDate.toISOString().split('T')[0], // Use actual calculated date
      correct: correctAnswers,
      incorrect: incorrectAnswers,
      viewed: totalQuestions,
    };
  });
}

/**
 * Convert API WeeklyPerformanceData to legacy WeeklyPerformance format (legacy function)
 */
export function adaptWeeklyPerformance(apiData: WeeklyPerformanceData[]): WeeklyPerformance[] {
  if (!apiData || apiData.length === 0) {
    return [];
  }

  return apiData.map(day => ({
    date: day.date,
    correct: Math.round(day.questionsAnswered * (day.accuracy / 100)),
    incorrect: Math.round(day.questionsAnswered * (1 - day.accuracy / 100)),
    viewed: day.questionsAnswered, // Total questions as viewed
  }));
}

/**
 * Convert API UserSubscription to legacy Subscription format
 */
export function adaptSubscription(apiData: UserSubscription[] | any): Subscription {
  // Handle null, undefined, or non-array data
  if (!apiData) {
    return {
      pack: 'No Active Subscription',
      expiryDate: new Date(),
      isActive: false,
      type: 'year_pack',
    };
  }

  // If apiData is not an array, return default subscription
  if (!Array.isArray(apiData)) {
    return {
      pack: 'Free Plan',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: false,
      type: 'year_pack',
    };
  }

  if (apiData.length === 0) {
    return {
      pack: 'No Active Subscription',
      expiryDate: new Date(),
      isActive: false,
      type: 'year_pack',
    };
  }

  // Get the first active subscription or create a default one
  const activeSubscription = apiData.find(sub => sub && (sub.status === 'ACTIVE' || sub.status === 'active'));

  if (activeSubscription) {
    // Use studyPack name if available, otherwise fall back to type-based name
    const packName = activeSubscription.studyPack?.name || getSubscriptionPackName(activeSubscription.studyPack?.type || 'free');

    return {
      pack: packName,
      expiryDate: activeSubscription.endDate ? new Date(activeSubscription.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now if no end date
      isActive: activeSubscription.status === 'ACTIVE' || activeSubscription.status === 'active',
      type: activeSubscription.studyPack?.type === 'YEAR' ? 'year_pack' : 'year_pack',
    };
  }

  // Default subscription if none found
  return {
    pack: 'Free Plan',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: false,
    type: 'year_pack',
  };
}

/**
 * Convert API RecentActivity to legacy LastSession format
 */
export function adaptLastSession(apiData: any[] | any): LastSession | null {
  if (!apiData) {
    return null;
  }

  // Handle non-array data
  if (!Array.isArray(apiData)) {
    console.warn('Expected array for recent activity, received:', typeof apiData, apiData);
    return null;
  }

  if (apiData.length === 0) {
    return null;
  }

  const mostRecentActivity = apiData[0]; // Assuming the first one is the most recent

  // Validate activity data
  if (!mostRecentActivity || typeof mostRecentActivity !== 'object') {
    console.warn('Invalid activity data:', mostRecentActivity);
    return null;
  }

  // Generate a unique ID from the date and activity
  const activityId = mostRecentActivity.date ?
    new Date(mostRecentActivity.date).getTime().toString() :
    Date.now().toString();

  // Extract score/percentage - handle both score and percentage fields
  const score = mostRecentActivity.score || mostRecentActivity.percentage || 0;

  // Estimate questions based on activity type and score
  let estimatedQuestions = 10; // Default for practice sessions
  if (mostRecentActivity.type === 'EXAM') {
    estimatedQuestions = 50; // Exams typically have more questions
  }

  // Calculate answered questions based on score (assuming perfect score means all answered)
  const questionsAnswered = Math.round((score / 100) * estimatedQuestions);

  // Estimate duration based on question count (2-3 minutes per question)
  const estimatedDuration = estimatedQuestions * 150; // 2.5 minutes per question in seconds

  return {
    id: activityId,
    title: mostRecentActivity.activity || 'Recent Activity',
    subject: mostRecentActivity.subject || 'General',
    unit: mostRecentActivity.subject || 'General', // Using subject as unit
    timestamp: mostRecentActivity.date || new Date().toISOString(),
    questionsAnswered: questionsAnswered,
    totalQuestions: estimatedQuestions,
    percentage: Math.round(score),
    duration: estimatedDuration,
    isFavorited: false, // Keep for UI compatibility
    moodRating: getMoodFromAccuracy(score),
  };
}

/**
 * Generate quick actions based on API data
 */
export function generateQuickActions(apiData: StudentDashboardPerformance | null): QuickAction[] {
  const actions: QuickAction[] = [
    {
      id: 'start_session',
      title: 'Start New Session',
      description: 'Begin a new practice session',
      icon: 'BookOpen',
      action: '/student/sessions/create',
      variant: 'primary',
    },
    {
      id: 'continue_course',
      title: 'Continue Course',
      description: 'Resume your last course',
      icon: 'Play',
      action: '/student/courses/continue',
      variant: 'secondary',
    },
  ];

  // Add conditional actions based on performance (using actual API data)
  if (apiData && apiData.subjectPerformance && apiData.subjectPerformance.length > 0) {
    const averageScore = apiData.subjectPerformance.reduce((sum, subject) => sum + subject.averageScore, 0) / apiData.subjectPerformance.length;

    if (averageScore < 70) {
      actions.push({
        id: 'review_mistakes',
        title: 'Review Weak Areas',
        description: 'Focus on subjects that need improvement',
        icon: 'AlertCircle',
        action: '/student/analytics',
        variant: 'secondary',
      });
    }
  }

  if (apiData && typeof apiData.studyStreak === 'number' && apiData.studyStreak >= 7) {
    actions.push({
      id: 'streak_challenge',
      title: 'Streak Challenge',
      description: `Keep your ${apiData.studyStreak}-day streak going!`,
      icon: 'Flame',
      action: '/student/practice',
      variant: 'primary',
    });
  }

  return actions;
}

/**
 * Generate todo items based on API data
 */
export function generateTodoItems(apiData: StudentDashboardPerformance | null): TodoItem[] {
  const todos: TodoItem[] = [];

  // Safety check for API data
  if (!apiData) {
    return todos;
  }

  // Add subject-specific todos based on performance (using actual API properties)
  if (apiData.subjectPerformance && apiData.subjectPerformance.length > 0) {
    apiData.subjectPerformance
      .filter(subject => subject.averageScore < 70)
      .slice(0, 3) // Limit to top 3 subjects that need improvement
      .forEach((subject, index) => {
        todos.push({
          id: `improve_${subject.subject.toLowerCase().replace(/\s+/g, '_')}`,
          title: `Improve ${subject.subject} (${Math.round(subject.averageScore)}% average)`,
          type: 'course',
          priority: subject.averageScore < 50 ? 'high' : 'medium',
          completed: false,
        });
      });
  }

  // Add streak maintenance todo (using actual API property)
  if (apiData.studyStreak && apiData.studyStreak > 0) {
    todos.push({
      id: 'maintain_streak',
      title: `Maintain ${apiData.studyStreak}-day study streak`,
      type: 'quiz',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      priority: 'medium',
      completed: false,
    });
  }

  // Add weekly session goal based on recent activity
  const currentWeekSessions = apiData.weeklyStats && apiData.weeklyStats.length > 0
    ? apiData.weeklyStats[apiData.weeklyStats.length - 1].sessionsCompleted
    : 0;

  // Calculate dynamic weekly goal based on user's historical performance
  const averageWeeklySessions = apiData.weeklyStats && apiData.weeklyStats.length > 0
    ? Math.ceil(apiData.weeklyStats.reduce((sum, week) => sum + week.sessionsCompleted, 0) / apiData.weeklyStats.length)
    : 3; // Minimum baseline if no history
  const weeklyGoal = Math.max(averageWeeklySessions + 1, 3); // Always aim for at least 1 more than average, minimum 3

  if (currentWeekSessions < weeklyGoal) {
    todos.push({
      id: 'weekly_sessions',
      title: `Complete Weekly Sessions (${currentWeekSessions}/${weeklyGoal})`,
      type: 'quiz',
      dueDate: getEndOfWeek(),
      priority: currentWeekSessions === 0 ? 'high' : 'medium',
      completed: false,
    });
  }

  return todos;
}

/**
 * Combine all API data into legacy StudentDashboardData format
 */
export function adaptStudentDashboardData(
  performance: StudentDashboardPerformance | null,
  subscriptions: UserSubscription[] | any
): StudentDashboardData | null {
  // Return null if no performance data - let the UI handle the loading/error state
  if (!performance) {
    console.warn('Performance data is null');
    return null;
  }

  try {
    return {
      metrics: adaptStudentMetrics(performance),
      subscription: adaptSubscription(subscriptions),
      lastSession: adaptLastSession(performance.recentActivity || []),
      quickActions: generateQuickActions(performance),
      todoItems: generateTodoItems(performance),
    };
  } catch (error) {
    console.error('Error adapting dashboard data:', error);
    return null;
  }
}

// Helper functions

function getSubscriptionPackName(type: string): string {
  switch (type) {
    case 'YEAR':
      return 'Year Medical Pack';
    case 'RESIDENCY':
      return 'Residency Medical Pack';
    case 'premium':
      return 'Premium Medical Pack';
    case 'pro':
      return 'Professional Medical Pack';
    case 'free':
    default:
      return 'Free Plan';
  }
}

function getMoodFromAccuracy(accuracy: number): 'happy' | 'neutral' | 'sad' {
  if (accuracy >= 80) return 'happy';
  if (accuracy >= 60) return 'neutral';
  return 'sad';
}

function getEndOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = 7 - dayOfWeek;
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}


