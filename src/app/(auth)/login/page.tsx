// @ts-nocheck
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginForm1 from '@/components/mvpblocks/login-form1';

export const metadata: Metadata = {
  title: 'Login to Med-ADN',
  description: 'Access your account on the largest medical education platform in Algeria.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm1 />
    </Suspense>
  );
}