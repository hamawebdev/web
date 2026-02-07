// @ts-nocheck
'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { TrackerCreatePage } from '@/components/student/course-tracking/tracker-create-page';
import { ErrorBoundary } from '@/components/error-boundary';

export default function CreateTrackerPageRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <TrackerCreatePage />
      </Suspense>
    </ErrorBoundary>
  );
}
