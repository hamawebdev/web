// @ts-nocheck
'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Clock, Target, BookOpen, Eye, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnalyticsSession, CourseStats } from '@/types/api';

interface AnalyticsSessionsTableProps {
  sessions: AnalyticsSession[];
  loading?: boolean;
  className?: string;
}

interface ExpandedRowsState {
  [sessionId: number]: boolean;
}

export function AnalyticsSessionsTable({
  sessions = [],
  loading = false,
  className
}: AnalyticsSessionsTableProps) {
  const [expandedRows, setExpandedRows] = useState<ExpandedRowsState>({});

  const toggleRow = useCallback((sessionId: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  }, []);

  const formatTime = useCallback((averagePerQuestion: number, totalQuestions: number) => {
    if (!averagePerQuestion || !totalQuestions) return '0min';
    const totalMinutes = Math.round((averagePerQuestion * totalQuestions) / 60);
    if (totalMinutes < 60) {
      return `${totalMinutes}min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  }, []);

  const getAccuracyColor = useCallback((accuracy: string) => {
    if (!accuracy) return 'text-gray-600 bg-gray-50';
    const numAccuracy = parseInt(accuracy.replace('%', ''));
    if (numAccuracy >= 80) return 'text-green-600 bg-green-50';
    if (numAccuracy >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  if (loading) {
    return (
      <Card className={cn("border-border/50 shadow-sm", className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className={cn("border-border/50 shadow-sm", className)}>
        <CardContent className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucune session disponible
          </h3>
          <p className="text-muted-foreground">
            Aucune session trouvée pour le type sélectionné.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="border-b border-border/50 bg-muted/30 px-4 sm:px-6 py-3 sm:py-4">
          <div className="hidden lg:grid lg:grid-cols-8 gap-4 text-sm font-medium text-muted-foreground">
            <div className="col-span-2">Titre Session</div>
            <div className="text-center">Moyen par question</div>
            <div className="text-center">Total de questions</div>
            <div className="text-center">Répondue Juste</div>
            <div className="text-center">Répondue fausse</div>
            <div className="text-center">Consulté</div>
            <div className="text-center">Précision</div>
          </div>
          <div className="lg:hidden text-sm font-medium text-muted-foreground">
            Sessions {sessions.length > 0 && `(${sessions.length})`}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/50">
          {sessions.map((session) => {
            if (!session || !session.id) return null;
            return (
            <div key={session.id} className="relative transition-colors hover:bg-muted/20">
              {/* Main Row */}
              <div
                className="px-4 sm:px-6 py-3 sm:py-4 cursor-pointer"
                onClick={() => toggleRow(session.id)}
              >
                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-8 gap-4 items-center">
                  {/* Title */}
                  <div className="col-span-2 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted flex-shrink-0"
                    >
                      {expandedRows[session.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate text-sm">
                        {session.title || 'Untitled Session'}
                      </p>
                      <Badge
                        variant="secondary"
                        className="mt-1 text-xs"
                      >
                        {session.type || 'PRACTICE'}
                      </Badge>
                    </div>
                  </div>

                  {/* Average per Question */}
                  <div className="text-center">
                    <span className="font-medium text-foreground text-sm">
                      {session.stats?.averagePerQuestion || 0}s
                    </span>
                  </div>

                  {/* Total Questions */}
                  <div className="text-center">
                    <span className="font-medium text-foreground text-sm">
                      {session.stats?.totalQuestions || 0}
                    </span>
                  </div>

                  {/* Correct Answers */}
                  <div className="text-center">
                    <span className="font-medium text-green-600 text-sm">
                      {session.stats?.answeredCorrect || 0}
                    </span>
                  </div>

                  {/* Wrong Answers */}
                  <div className="text-center">
                    <span className="font-medium text-red-600 text-sm">
                      {session.stats?.answeredWrong || 0}
                    </span>
                  </div>

                  {/* Consulted */}
                  <div className="text-center">
                    <span className="font-medium text-blue-600 text-sm">
                      {session.stats?.consulted || 0}
                    </span>
                  </div>

                  {/* Accuracy */}
                  <div className="text-center">
                    <Badge
                      className={cn("text-xs font-medium", getAccuracyColor(session.stats?.accuracy || '0%'))}
                    >
                      {session.stats?.accuracy || '0%'}
                    </Badge>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden">
                  <div className="flex items-start gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted flex-shrink-0 mt-1"
                    >
                      {expandedRows[session.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground text-sm leading-tight">
                            {session.title || 'Untitled Session'}
                          </p>
                          <Badge
                            variant="secondary"
                            className="mt-1 text-xs"
                          >
                            {session.type || 'PRACTICE'}
                          </Badge>
                        </div>
                        <Badge
                          className={cn("text-xs font-medium flex-shrink-0", getAccuracyColor(session.stats?.accuracy || '0%'))}
                        >
                          {session.stats?.accuracy || '0%'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Temps moyen:</span>
                            <span className="font-medium">{session.stats?.averagePerQuestion || 0}s</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Questions:</span>
                            <span className="font-medium">{session.stats?.totalQuestions || 0}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Correct:</span>
                            <span className="font-medium text-green-600">{session.stats?.answeredCorrect || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Incorrect:</span>
                            <span className="font-medium text-red-600">{session.stats?.answeredWrong || 0}</span>
                          </div>
                        </div>
                      </div>

                      {(session.stats?.consulted || 0) > 0 && (
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Consulté:</span>
                          <span className="font-medium text-blue-600">{session.stats?.consulted || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Course Details */}
              {expandedRows[session.id] && (
                <div className="px-4 sm:px-6 pb-4 bg-muted/10">
                  <div className="border-t border-border/30 pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Détails par cours
                    </h4>

                    {session.courses && session.courses.length > 0 ? (
                      <div className="space-y-3">
                        {session.courses.map((course, index) => (
                          <CourseStatsRow key={index} course={course} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Aucun détail de cours disponible
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface CourseStatsRowProps {
  course: CourseStats;
}

function CourseStatsRow({ course }: CourseStatsRowProps) {
  const getAccuracyColor = (accuracy: string) => {
    const numAccuracy = parseInt(accuracy.replace('%', ''));
    if (numAccuracy >= 80) return 'text-green-600 bg-green-50';
    if (numAccuracy >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-background rounded-lg border border-border/30 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Course Name */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{course.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="font-medium text-sm">{course.totalQuestions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Correct</p>
              <p className="font-medium text-green-600 text-sm">{course.answeredCorrect}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Incorrect</p>
              <p className="font-medium text-red-600 text-sm">{course.answeredWrong}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Consulté</p>
              <p className="font-medium text-blue-600 text-sm">{course.consulted}</p>
            </div>
          </div>
        </div>

        {/* Accuracy Badge */}
        <div className="flex justify-center sm:justify-end">
          <Badge
            className={cn("text-xs font-medium", getAccuracyColor(course.accuracy))}
          >
            {course.accuracy}
          </Badge>
        </div>
      </div>
    </div>
  );
}
