/**
 * Offline Sessions Manager Component
 * 
 * Displays and manages quiz sessions that are stored locally
 * and waiting for submission to the server.
 */

'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Database,
  FileText,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOfflineQuiz } from '@/hooks/use-offline-quiz';
import { cn } from '@/lib/utils';

export function OfflineSessionsManager() {
  const {
    offlineSessions,
    stats,
    isSubmitting,
    lastSync,
    submitOfflineSession,
    submitAllOfflineSessions,
    deleteOfflineSession,
    clearAllOfflineSessions,
    hasPendingSessions,
  } = useOfflineQuiz();

  const [showClearDialog, setShowClearDialog] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: string, answersCount: number) => {
    if (status === 'COMPLETED') {
      return (
        <Badge variant="default" className="bg-chart-5/20 text-chart-5">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready to Submit
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      PRACTICE: 'default',
      EXAM: 'destructive',
      REMEDIAL: 'secondary',
    };
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {type}
      </Badge>
    );
  };

  if (!stats || offlineSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Quiz Sessions
          </CardTitle>
          <CardDescription>
            No quiz sessions stored locally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All your quiz sessions are up to date!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Quiz Sessions
          </CardTitle>
          <CardDescription>
            Quiz sessions stored locally on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedSessions}</div>
              <div className="text-sm text-muted-foreground">Ready to Submit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.inProgressSessions}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalAnswers}</div>
              <div className="text-sm text-muted-foreground">Total Answers</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {hasPendingSessions() && (
              <Button
                onClick={submitAllOfflineSessions}
                disabled={Object.values(isSubmitting).some(Boolean)}
                className="gap-2"
              >
                {Object.values(isSubmitting).some(Boolean) ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Submit All ({stats.completedSessions})
                  </>
                )}
              </Button>
            )}

            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Offline Sessions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all locally stored quiz sessions and their answers.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      clearAllOfflineSessions();
                      setShowClearDialog(false);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {lastSync && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last sync: {formatDate(lastSync)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Answers</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offlineSessions.map((session) => (
                <TableRow key={session.sessionId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{session.title}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {session.sessionId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(session.type)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(session.status, session.answersCount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {session.answersCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(session.lastUpdatedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {session.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          onClick={() => submitOfflineSession(session.sessionId)}
                          disabled={isSubmitting[session.sessionId]}
                          className="gap-1"
                        >
                          {isSubmitting[session.sessionId] ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Submitting
                            </>
                          ) : (
                            <>
                              <Upload className="h-3 w-3" />
                              Submit
                            </>
                          )}
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteOfflineSession(session.sessionId)}
                        disabled={isSubmitting[session.sessionId]}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
