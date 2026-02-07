'use client';

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStudentAuth } from '@/hooks/use-auth';
import { FullPageLoading } from '@/components/loading-states';
import { ExamSessionWizard } from '@/components/student/exams/session-wizard';
import { Card, CardContent } from '@/components/ui/card';

export default function CreateExamPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading, checkAndRedirect } = useStudentAuth();

  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  if (loading) {
    return <FullPageLoading message="Loading..." />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleExamCreated = (examSession: any) => {
    // Session data is now at root level with id field
    const sessionId = examSession?.id;
    if (sessionId) {
      toast.success('Exam session created');
      router.push(`/session/${sessionId}`);
    } else {
      toast.error('Session created but no sessionId returned');
      router.push('/student/exams');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 pb-6 sm:pb-8">


        {/* Main Content */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-0">
            <ExamSessionWizard
              onCancel={() => router.push('/student/exams')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

