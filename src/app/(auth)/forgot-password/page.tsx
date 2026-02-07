// @ts-nocheck
'use client';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

/**
 * Forgot Password Page
 *
 * Complete password reset workflow on a single page:
 *
 * Step 1: User enters email address
 *   - System sends verification code to email
 *   - User sees confirmation message
 *
 * Step 2: User enters verification code and new password
 *   - User can paste the 6-character code from email
 *   - User enters new password (minimum 8 characters)
 *   - User confirms password match
 *
 * Step 3: Success message and redirect
 *   - Shows success confirmation
 *   - Auto-redirects to login page after 2 seconds
 *   - User can manually click "Go to login" button
 */
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <ForgotPasswordForm />
    </div>
  );
}

