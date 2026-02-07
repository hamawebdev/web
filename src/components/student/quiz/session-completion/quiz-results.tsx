// @ts-nocheck
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
  Home,
  BookOpen,
  Star,
  TrendingUp,
  Award,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useQuiz } from '../quiz-api-context';
import { cn } from '@/lib/utils';

export function QuizResults() {
  const router = useRouter();
  const { state } = useQuiz();
  const { session, timer } = state;

  // Calculate results (client-side, exact set match)
  const totalQuestions = session.totalQuestions || session.questions?.length || 0;

  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unanswered = 0;

  const questionsArr = Array.isArray(session.questions) ? session.questions : [];
  questionsArr.forEach((question: any) => {
    const ua = (session.userAnswers || {})[String(question.id)] || {};

    const arrIds = Array.isArray(ua.selectedAnswerIds)
      ? ua.selectedAnswerIds
      : (Array.isArray(ua.userAnswerIds) ? ua.userAnswerIds : []);

    const selectedIds: string[] = arrIds.length > 0
      ? arrIds.map((id: any) => String(id))
      : (ua.selectedAnswerId !== undefined && ua.selectedAnswerId !== null
          ? [String(ua.selectedAnswerId)]
          : []);

    const answers = question.questionAnswers || question.answers || question.options || [];
    const correctIds = answers.filter((a: any) => a?.isCorrect).map((a: any) => String(a.id));

    if (selectedIds.length === 0) {
      unanswered++;
      return;
    }

    if (correctIds.length > 0) {
      const sel = new Set(selectedIds);
      const cor = new Set(correctIds);
      const isExact = sel.size === cor.size && [...sel].every(id => cor.has(id));
      if (isExact) correctAnswers++;
      else incorrectAnswers++;
    }
  });

  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Aggregate time from answers if available; fallback to client timer
  const userAnswersObj = session.userAnswers || {};
  const answersArray = Object.values(userAnswersObj);
  const summedTime = answersArray.reduce((sum: number, a: any) => sum + (typeof a?.timeSpent === 'number' ? a.timeSpent : 0), 0);
  const totalTimeSec = summedTime > 0 ? summedTime : (timer?.totalTime || 0);
  const avgTimePerQSec = totalQuestions > 0 ? Math.round(totalTimeSec / totalQuestions) : 0;

  // Format time like "2m 30s" or "1h 02m 05s"
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  // Get performance level
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-chart-5', icon: Award };
    if (percentage >= 80) return { level: 'Very Good', color: 'text-chart-2', icon: Trophy };
    if (percentage >= 70) return { level: 'Good', color: 'text-chart-1', icon: Star };
    if (percentage >= 60) return { level: 'Fair', color: 'text-chart-4', icon: Target };
    return { level: 'Needs Improvement', color: 'text-destructive', icon: TrendingUp };
  };

  const performance = getPerformanceLevel(percentage);
  const PerformanceIcon = performance.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-muted-foreground">
            {session.title} • {session.subject || 'Practice Session'}
          </p>
        </div>

        {/* Main Results Card */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PerformanceIcon className={cn("h-6 w-6", performance.color)} />
              <CardTitle className="text-2xl">{performance.level}</CardTitle>
            </div>
            <CardDescription>
              You scored {correctAnswers} out of {totalQuestions} questions correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-primary mb-2">{percentage}%</div>
              <Progress value={percentage} className="h-3 mb-4" />
              <p className="text-sm text-muted-foreground">
                Overall Performance Score
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#00B05020', border: '1px solid #00B05040' }}>
                <CheckCircle className="h-8 w-8 mx-auto mb-2" style={{ color: '#00B050' }} />
                <div className="text-2xl font-bold" style={{ color: '#00B050' }}>{correctAnswers}</div>
                <div className="text-sm font-medium" style={{ color: '#00B050' }}>Justes</div>
              </div>
              
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#FF000020', border: '1px solid #FF000040' }}>
                <XCircle className="h-8 w-8 mx-auto mb-2" style={{ color: '#FF0000' }} />
                <div className="text-2xl font-bold" style={{ color: '#FF0000' }}>{incorrectAnswers}</div>
                <div className="text-sm font-medium" style={{ color: '#FF0000' }}>Fausses</div>
              </div>
              
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#BFBFBF20', border: '1px solid #BFBFBF40' }}>
                <Target className="h-8 w-8 mx-auto mb-2" style={{ color: '#BFBFBF' }} />
                <div className="text-2xl font-bold" style={{ color: '#BFBFBF' }}>{totalQuestions}</div>
                <div className="text-sm font-medium" style={{ color: '#BFBFBF' }}>Consultées</div>
              </div>

              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <Clock className="h-8 w-8 text-accent-foreground mx-auto mb-2" />
                <div className="text-2xl font-bold text-accent-foreground">{formatTime(totalTimeSec)}</div>
                <div className="text-sm text-accent-foreground/80">Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Session Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session Type:</span>
                    <Badge variant="outline">{session.type || 'PRACTICE'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subject:</span>
                    <span>{session.subject || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions:</span>
                    <span>{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion:</span>
                    <span>{Math.round((answeredQuestions / totalQuestions) * 100)}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accuracy:</span>
                    <span className={cn(
                      "font-medium",
                      percentage >= 80 ? "text-green-600" : 
                      percentage >= 60 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Time:</span>
                    <span>{formatTime(totalTimeSec)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. per Question:</span>
                    <span>{formatTime(avgTimePerQSec)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={session.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {session.status || 'COMPLETED'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Review */}
          <Button
            onClick={() => router.push(`/session/${session.id || session.sessionId}/results`)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Review Results
          </Button>

          {/* Review: detailed review of answers and explanations */}
          <Button
            onClick={() => router.push(`/session/${session.id || session.sessionId}/review`)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Review Answers
          </Button>

          {/* Practice more / Exam create: dynamic by type */}
          <Button
            onClick={() => {
              const t = (session?.type || session?.sessionType || '').toString().toUpperCase();
              if (t === 'EXAM') router.push('/student/exams/create');
              else router.push('/student/practice/create');
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {((session?.type || session?.sessionType || '').toString().toUpperCase() === 'EXAM') ? 'New Exam' : 'Practice More'}
          </Button>

          {/* View all sessions per type */}
          <Button
            variant="outline"
            onClick={() => {
              const t = (session?.type || session?.sessionType || '').toString().toUpperCase();
              if (t === 'EXAM') router.push('/student/exams');
              else router.push('/student/practice');
            }}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            View All Sessions
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/student/dashboard')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
