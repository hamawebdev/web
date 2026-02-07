// @ts-nocheck
'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

/**
 * Reset Password Page
 *
 * Second step of the password reset workflow:
 * - User enters their email address
 * - User enters the 6-character verification code from their email
 * - User enters and confirms their new password (minimum 8 characters)
 * - System validates the code and updates the password
 */
function ResetPasswordContent() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <ResetPasswordForm />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}