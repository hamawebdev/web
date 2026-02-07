'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { QuizCreationWizard } from '@/components/student/quiz-creation';
import { useAuth } from '@/hooks/use-auth';

function CreateQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Get mode from URL parameters (practice is default)
  const mode = searchParams.get('mode') || 'practice';

  // Handle successful quiz creation
  const handleQuizCreated = (quizSession: any) => {
    console.log('handleQuizCreated called with:', quizSession);

    toast.success('Quiz created successfully!');

    // Navigate to the practice session route - session data is now at root level
    const sessionId = quizSession?.id;
    if (sessionId) {
      console.log(`Navigating to practice session: ${sessionId}`);
      router.push(`/session/${sessionId}`);
    } else {
      console.warn('No sessionId found in quiz session data, redirecting to practice page');
      console.log('Quiz session data:', quizSession);
      // Fallback to practice page
      router.push('/student/practice');
    }
  };

  // Handle cancellation
  const handleCancel = () => {
    router.push('/student/practice');
  };

  // Get user profile data
  const userProfile = {
    yearLevel: user?.currentYear || 'ONE', // Default to first year if not available
    subscription: user?.subscription
  };

  return (
    <div className="min-h-screen bg-background practice-theme">
      <div className="container mx-auto py-8">
        <QuizCreationWizard
          onQuizCreated={handleQuizCreated}
          onCancel={handleCancel}
          userProfile={userProfile}
          initialConfig={{ type: 'PRACTICE' }} // Force practice mode for this route
        />
      </div>
    </div>
  );
}

export default function CreateQuizPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateQuizContent />
    </Suspense>
  );
}
