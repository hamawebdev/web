// @ts-nocheck
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionWizard, PracticeSessionPayload } from '@/components/student/practice/session-wizard';
import { QuizService } from '@/lib/api-services';
import { toast } from 'sonner';

export default function PracticeCreatePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = useCallback(async (payload: PracticeSessionPayload & { questionCount?: number; courseIds?: number[]; sessionFilters?: any }) => {
    // Prevent duplicate submissions
    if (isCreating) {
      console.log('⚠️ [Practice/Create] Session creation already in progress, ignoring duplicate request');
      return;
    }

    setIsCreating(true);
    try {
      // Enhanced validation for required fields
      if (!payload.title || payload.title.trim().length < 3 || payload.title.trim().length > 100) {
        toast.error('Session title must be between 3 and 100 characters.');
        return;
      }

      if (!payload.questionCount || payload.questionCount < 1) {
        toast.error('Question count must be at least 1.');
        return;
      }

      if (!payload.courseIds || payload.courseIds.length === 0) {
        toast.error('Please select at least 1 course.');
        return;
      }

      // Validate enum values for questionTypes
      const validQuestionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'QROC'];
      if (payload.sessionFilters?.questionTypes?.length > 0) {
        const invalidTypes = payload.sessionFilters.questionTypes.filter((type: string) => !validQuestionTypes.includes(type));
        if (invalidTypes.length > 0) {
          toast.error(`Invalid question types: ${invalidTypes.join(', ')}. Must be SINGLE_CHOICE, MULTIPLE_CHOICE, or QROC.`);
          return;
        }
      }

      // Rotations removed from practice creation - always send empty array

      // Create session using the documented endpoint with proper filter structure
      const sessionData = {
        title: payload.title.trim(),
        questionCount: payload.questionCount,
        courseIds: payload.courseIds,
        sessionType: 'PRACTISE' as const,
        // Include all optional filters from sessionFilters if they exist
        ...(payload.sessionFilters?.questionTypes?.length > 0 && {
          questionTypes: payload.sessionFilters.questionTypes
        }),
        ...(payload.sessionFilters?.years?.length > 0 && {
          years: payload.sessionFilters.years
        }),
        ...(payload.sessionFilters?.questionSourceIds?.length > 0 && {
          questionSourceIds: payload.sessionFilters.questionSourceIds
        }),
        ...(payload.sessionFilters?.universityIds?.length > 0 && {
          universityIds: payload.sessionFilters.universityIds
        }),
        rotations: [], // Always empty for practice sessions
      };

      console.log('🚀 [Practice/Create] Creating session with payload:', {
        endpoint: 'POST /quizzes/sessions',
        requestBody: sessionData
      });

      const created = await QuizService.createSession(sessionData);

      console.log('📋 [Practice/Create] Session creation response:', {
        success: created.success,
        data: created.data,
        error: created.error
      });

      if (created.success && created.data?.sessionId) {
        const sessionId = created.data.sessionId;

        console.log('✅ [Practice/Create] Session created successfully, sessionId:', sessionId);

        // MANDATORY: Immediately fetch session questions using documented endpoint
        console.log('🔄 [Practice/Create] Fetching session questions...');
        const sessionResponse = await QuizService.getQuizSession(sessionId);

        console.log('📋 [Practice/Create] Session fetch response:', {
          success: sessionResponse.success,
          hasData: !!sessionResponse.data,
          questionsCount: sessionResponse.data?.questions?.length || 0
        });

        if (sessionResponse.success && sessionResponse.data?.questions) {
          console.log('✅ [Practice/Create] Session questions validated, redirecting...');
          toast.success('Practice session created successfully');
          router.push(`/session/${sessionId}`);
        } else {
          console.error('❌ [Practice/Create] Session created but questions fetch failed:', sessionResponse);
          toast.error('Session created but failed to load questions. Please try again.');
          return;
        }
      } else {
        console.error('❌ [Practice/Create] Session creation failed:', {
          success: created.success,
          error: created.error,
          data: created.data
        });

        if (!created.data?.sessionId) {
          toast.error('Session created but sessionId missing. Please contact support.');
        } else {
          toast.error(created.error || 'Failed to create practice session');
        }
      }
    } catch (e: any) {
      console.error('❌ [Practice/Create] Unexpected error:', {
        message: e?.message,
        statusCode: e?.statusCode,
        error: e
      });
      toast.error(e?.message || 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6">


        {/* Main Content */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <SessionWizard
              onCreate={(p) => handleCreateSession(p as any)}
              onCancel={() => router.push('/student/practice')}
              isCreating={isCreating}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

