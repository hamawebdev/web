// @ts-nocheck
import {
  StudentDashboardPerformance,
  SubjectPerformance,
  WeeklyPerformanceData,
  RecentActivity,
  RecentSession
} from '@/types/api';

// Types for processed analytics data
export interface ProcessedWeakArea {
  subject: string;
  accuracy: number;
  questionsAttempted: number;
  averageTime: number;
  improvementNeeded: number;
  priority: 'high' | 'medium' | 'low';
  recommendations: string[];
  trend: 'improving' | 'declining' | 'stable';
}

export interface StudyRecommendation {
  type: 'focus_area' | 'time_management' | 'consistency' | 'difficulty_adjustment';
  title: string;
  description: string;
  actionItems: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number; // 1-10 scale
}

export interface PerformanceTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // percentage change
  significance: 'high' | 'medium' | 'low';
  timeframe: string;
}

export interface LearningInsight {
  category: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  description: string;
  confidence: number; // 0-1 scale
  actionable: boolean;
}

/**
 * Analyze weak areas from subject performance data
 */
export function analyzeWeakAreas(
  subjectPerformance: SubjectPerformance[],
  recentActivity: RecentActivity[] = []
): ProcessedWeakArea[] {
  return subjectPerformance
    .map(subject => {
      const accuracy = subject.averageScore;
      const questionsAttempted = subject.totalSessions * 10; // Estimate questions per session
      const averageTime = 300; // Default 5 minutes per session since API doesn't provide this

      // Calculate improvement needed (target is 80%)
      const improvementNeeded = Math.max(0, 80 - accuracy);

      // Determine priority based on accuracy and session count
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (accuracy < 60 && subject.totalSessions > 2) priority = 'high';
      else if (accuracy < 70 && subject.totalSessions > 1) priority = 'medium';
      else if (accuracy < 80) priority = 'low';

      // Analyze trend from recent activity
      const subjectActivities = recentActivity.filter(activity =>
        activity.subject?.toLowerCase().includes(subject.subject.toLowerCase())
      );

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (subjectActivities.length >= 2) {
        const recentScore = subjectActivities[0]?.score || 0;
        const olderScore = subjectActivities[subjectActivities.length - 1]?.score || 0;

        if (recentScore > olderScore + 5) trend = 'improving';
        else if (recentScore < olderScore - 5) trend = 'declining';
      }

      // Generate recommendations
      const recommendations = generateSubjectRecommendations(subject, trend);

      return {
        subject: subject.subject,
        accuracy,
        questionsAttempted,
        averageTime,
        improvementNeeded,
        priority,
        recommendations,
        trend
      };
    })
    .filter(area => area.accuracy < 80) // Only include areas that need improvement
    .sort((a, b) => {
      // Sort by priority, then by improvement needed
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.improvementNeeded - a.improvementNeeded;
    });
}

/**
 * Generate study recommendations based on performance data
 */
export function generateStudyRecommendations(
  performance: StudentDashboardPerformance,
  subjectPerformance: SubjectPerformance[]
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];

  // Focus area recommendations
  const weakSubjects = subjectPerformance.filter(s => s.accuracy < 70);
  if (weakSubjects.length > 0) {
    recommendations.push({
      type: 'focus_area',
      title: 'Focus on Weak Subjects',
      description: `You have ${weakSubjects.length} subjects with accuracy below 70%. Prioritizing these will have the biggest impact.`,
      actionItems: [
        `Review fundamentals in ${weakSubjects[0]?.subjectName}`,
        'Practice 10-15 questions daily in weak areas',
        'Create summary notes for difficult concepts',
        'Seek help from instructors or peers'
      ],
      priority: 'high',
      estimatedImpact: 8
    });
  }

  // Time management recommendations
  const slowSubjects = subjectPerformance.filter(s => s.averageTime > 120);
  if (slowSubjects.length > 0) {
    recommendations.push({
      type: 'time_management',
      title: 'Improve Time Management',
      description: `You're spending too much time on questions in ${slowSubjects.length} subjects. Work on speed and efficiency.`,
      actionItems: [
        'Set time limits for practice questions',
        'Practice quick elimination techniques',
        'Review time-saving strategies',
        'Focus on pattern recognition'
      ],
      priority: 'medium',
      estimatedImpact: 6
    });
  }

  // Consistency recommendations
  if (performance.studyStreak < 7) {
    recommendations.push({
      type: 'consistency',
      title: 'Build Study Consistency',
      description: 'Regular study habits will improve retention and performance. Aim for daily practice.',
      actionItems: [
        'Set a daily study schedule',
        'Start with 15-20 minutes daily',
        'Use reminders and habit tracking',
        'Reward yourself for maintaining streaks'
      ],
      priority: performance.studyStreak < 3 ? 'high' : 'medium',
      estimatedImpact: 7
    });
  }

  // Difficulty adjustment recommendations
  const averageAccuracy = subjectPerformance.length > 0
    ? subjectPerformance.reduce((sum, s) => sum + s.accuracy, 0) / subjectPerformance.length
    : 0;
  if (averageAccuracy > 90) {
    recommendations.push({
      type: 'difficulty_adjustment',
      title: 'Challenge Yourself More',
      description: 'Your high accuracy suggests you might benefit from more challenging material.',
      actionItems: [
        'Try advanced-level questions',
        'Explore complex case studies',
        'Set higher accuracy targets',
        'Help peers with difficult concepts'
      ],
      priority: 'low',
      estimatedImpact: 5
    });
  } else if (averageAccuracy < 60) {
    recommendations.push({
      type: 'difficulty_adjustment',
      title: 'Start with Basics',
      description: 'Focus on fundamental concepts before moving to advanced topics.',
      actionItems: [
        'Review basic concepts thoroughly',
        'Practice easier questions first',
        'Build confidence gradually',
        'Ensure strong foundation before advancing'
      ],
      priority: 'high',
      estimatedImpact: 9
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.estimatedImpact - a.estimatedImpact;
  });
}

/**
 * Analyze performance trends
 */
export function analyzePerformanceTrends(
  weeklyPerformance: WeeklyPerformanceData[]
): PerformanceTrend[] {
  if (!weeklyPerformance || weeklyPerformance.length < 2) return [];

  const trends: PerformanceTrend[] = [];

  // Accuracy trend
  const recentAccuracy = weeklyPerformance.slice(-2).reduce((sum, w) => sum + (w.accuracy || 0), 0) / 2;
  const olderAccuracy = weeklyPerformance.slice(0, 2).reduce((sum, w) => sum + (w.accuracy || 0), 0) / 2;
  const accuracyChange = olderAccuracy > 0 ? ((recentAccuracy - olderAccuracy) / olderAccuracy) * 100 : 0;

  trends.push({
    metric: 'Accuracy',
    direction: accuracyChange > 2 ? 'up' : accuracyChange < -2 ? 'down' : 'stable',
    magnitude: Math.abs(accuracyChange),
    significance: Math.abs(accuracyChange) > 10 ? 'high' : Math.abs(accuracyChange) > 5 ? 'medium' : 'low',
    timeframe: 'Last 2 weeks'
  });

  // Questions answered trend
  const recentQuestions = weeklyPerformance.slice(-2).reduce((sum, w) => sum + (w.questionsAnswered || 0), 0) / 2;
  const olderQuestions = weeklyPerformance.slice(0, 2).reduce((sum, w) => sum + (w.questionsAnswered || 0), 0) / 2;
  const questionsChange = olderQuestions > 0 ? ((recentQuestions - olderQuestions) / olderQuestions) * 100 : 0;

  trends.push({
    metric: 'Activity Level',
    direction: questionsChange > 5 ? 'up' : questionsChange < -5 ? 'down' : 'stable',
    magnitude: Math.abs(questionsChange),
    significance: Math.abs(questionsChange) > 20 ? 'high' : Math.abs(questionsChange) > 10 ? 'medium' : 'low',
    timeframe: 'Last 2 weeks'
  });

  return trends;
}

/**
 * Generate learning insights
 */
export function generateLearningInsights(
  performance: StudentDashboardPerformance,
  subjectPerformance: SubjectPerformance[],
  trends: PerformanceTrend[]
): LearningInsight[] {
  const insights: LearningInsight[] = [];

  // Strength insights
  const strongSubjects = subjectPerformance.filter(s => s.accuracy >= 80);
  if (strongSubjects.length > 0) {
    insights.push({
      category: 'strength',
      title: 'Strong Subject Performance',
      description: `You excel in ${strongSubjects.length} subjects with 80%+ accuracy. These are your strengths.`,
      confidence: 0.9,
      actionable: true
    });
  }

  // Weakness insights
  const weakSubjects = subjectPerformance.filter(s => s.accuracy < 60);
  if (weakSubjects.length > 0) {
    insights.push({
      category: 'weakness',
      title: 'Areas Needing Attention',
      description: `${weakSubjects.length} subjects require immediate focus with accuracy below 60%.`,
      confidence: 0.95,
      actionable: true
    });
  }

  // Opportunity insights
  if (performance.studyStreak >= 7) {
    insights.push({
      category: 'opportunity',
      title: 'Consistent Study Habit',
      description: 'Your study streak shows great consistency. This is a strong foundation for improvement.',
      confidence: 0.8,
      actionable: true
    });
  }

  // Trend-based insights
  const improvingTrend = trends.find(t => t.metric === 'Accuracy' && t.direction === 'up');
  if (improvingTrend && improvingTrend.significance === 'high') {
    insights.push({
      category: 'opportunity',
      title: 'Improving Performance Trend',
      description: 'Your accuracy has been improving significantly. Keep up the momentum!',
      confidence: 0.85,
      actionable: true
    });
  }

  return insights;
}

/**
 * Helper function to generate subject-specific recommendations
 */
function generateSubjectRecommendations(
  subject: SubjectPerformance,
  trend: 'improving' | 'declining' | 'stable'
): string[] {
  const recommendations = [];

  if (subject.averageScore < 60) {
    recommendations.push('Review fundamental concepts');
    recommendations.push('Practice basic questions first');
    recommendations.push('Seek additional help or tutoring');
  }

  // Since we don't have averageTime in the new structure, use session count as a proxy
  if (subject.totalSessions < 3) {
    recommendations.push('Increase practice frequency');
    recommendations.push('Build consistent study habits');
  }

  if (subject.totalSessions < 5) {
    recommendations.push('Attempt more practice sessions');
    recommendations.push('Increase daily practice volume');
  }

  if (trend === 'declining') {
    recommendations.push('Identify what changed recently');
    recommendations.push('Review recent mistakes carefully');
    recommendations.push('Consider adjusting study approach');
  }

  if (subject.averageScore >= 60 && subject.averageScore < 80) {
    recommendations.push('Focus on understanding explanations');
    recommendations.push('Create summary notes');
    recommendations.push('Practice similar question types');
  }

  // Add recommendations based on score variance
  const scoreVariance = subject.bestScore - subject.worstScore;
  if (scoreVariance > 30) {
    recommendations.push('Work on consistency');
    recommendations.push('Review topics where performance varies');
  }

  return recommendations;
}
