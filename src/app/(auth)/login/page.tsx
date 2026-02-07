// @ts-nocheck
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import LoginForm1 from '@/components/mvpblocks/login-form1';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm1 />
    </Suspense>
  );
}