// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Temporary compatibility route: redirect old practice path to canonical student session route
export default function PracticeSessionCompatibilityRedirect() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Array.isArray(params.id) ? parseInt(params.id[0]) : parseInt(params.id as string);

  useEffect(() => {
    if (!Number.isNaN(sessionId)) {
      router.replace(`/session/${sessionId}`);
    } else {
      router.replace('/student/practice');
    }
  }, [sessionId, router]);

  return null;
}
