// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import AuthAPI from '@/lib/auth-api';
import { toast } from 'sonner';

// Validation schema for step 1: email submission
const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse e-mail est requise')
    .email('Veuillez entrer une adresse e-mail valide'),
});

// Validation schema for step 2: code and password reset
const resetSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse e-mail est requise')
    .email('Veuillez entrer une adresse e-mail valide'),
  code: z
    .string()
    .length(6, 'Le code doit comporter exactement 6 caractères')
    .regex(/^[A-Z0-9]+$/, 'Le code ne doit contenir que des lettres et des chiffres'),
  newPassword: z
    .string()
    .min(4, 'Le mot de passe doit contenir au moins 4 caractères'),
  confirmPassword: z
    .string()
    .min(4, 'Le mot de passe doit contenir au moins 4 caractères'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

// Helper function to extract error message from various error formats
function extractErrorMessage(error: any): string {
  // If error is a string, return it directly
  if (typeof error === 'string') {
    return error;
  }

  // If error has a message property, use it
  if (error?.message) {
    return error.message;
  }

  // If error is an object with response data (API error structure)
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  // If error has error.error.message (nested structure)
  if (error?.error?.message) {
    return error.error.message;
  }

  // Default fallback
  return 'Une erreur s\'est produite. Veuillez réessayer.';
}

/**
 * ForgotPasswordForm Component
 *
 * Complete password reset workflow on a single page:
 * Step 1: User enters email and receives verification code
 * Step 2: User enters code and new password to reset password
 * Step 3: Success message and redirect to login
 */
export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Step 2: Reset form
  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  // Auto-fill email in reset form when moving to step 2
  useEffect(() => {
    if (step === 'reset' && email) {
      resetForm.setValue('email', email);
    }
  }, [step, email, resetForm]);

  // Handle email submission (Step 1)
  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      console.log('🔐 ForgotPasswordForm: Submitting forgot password request', { email: data.email });

      await AuthAPI.forgotPassword(data.email);

      console.log('🔐 ForgotPasswordForm: Forgot password request successful');
      setEmail(data.email);
      setStep('reset');

      toast.success('Le code de vérification a été envoyé à votre adresse e-mail');
    } catch (error: any) {
      console.error('🔐 ForgotPasswordForm: Erreur', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  // Handle password reset submission (Step 2)
  const onResetSubmit = async (data: ResetFormData) => {
    try {
      console.log('🔐 ForgotPasswordForm: Submitting password reset', { email: data.email });

      // Convert code to uppercase for consistency
      const code = data.code.toUpperCase();

      await AuthAPI.resetPassword(data.email, code, data.newPassword);

      console.log('🔐 ForgotPasswordForm: Password reset successful');
      setSuccessMessage('Mot de passe réinitialisé avec succès ! Redirection vers la page de connexion...');
      setStep('success');

      toast.success('Mot de passe réinitialisé avec succès !');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('🔐 ForgotPasswordForm: Erreur', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  // Step 1: Email submission
  if (step === 'email') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mot de passe oublié ?</CardTitle>
          <CardDescription>
            Entrez votre adresse e-mail et nous vous enverrons un code de vérification pour réinitialiser votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  className="pl-10"
                  {...emailForm.register('email')}
                  disabled={emailForm.formState.isSubmitting}
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={emailForm.formState.isSubmitting}
            >
              {emailForm.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  Envoyer le code de vérification
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Vous vous souvenez de votre mot de passe ? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Retour à la connexion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Code and password reset
  if (step === 'reset') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Réinitialisez votre mot de passe</CardTitle>
          <CardDescription>
            Entrez le code de vérification reçu par e-mail et créez un nouveau mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Adresse e-mail</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Verification Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Code de vérification</Label>
              <Input
                id="code"
                type="text"
                placeholder="ABC123"
                maxLength={6}
                className="uppercase"
                {...resetForm.register('code')}
                disabled={resetForm.formState.isSubmitting}
              />
              {resetForm.formState.errors.code && (
                <p className="text-sm text-destructive">{resetForm.formState.errors.code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Entrez le code à 6 caractères reçu par e-mail
              </p>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Entrez le nouveau mot de passe"
                  {...resetForm.register('newPassword')}
                  disabled={resetForm.formState.isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={resetForm.formState.isSubmitting}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {resetForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmez le nouveau mot de passe"
                  {...resetForm.register('confirmPassword')}
                  disabled={resetForm.formState.isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={resetForm.formState.isSubmitting}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetForm.formState.isSubmitting}
            >
              {resetForm.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  Réinitialiser le mot de passe
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('email');
                  emailForm.reset();
                  resetForm.reset();
                }}
                disabled={resetForm.formState.isSubmitting}
              >
                Retour à l'e-mail
              </Button>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Vous vous souvenez de votre mot de passe ? </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Retour à la connexion
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Success message
  if (step === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-center">Réinitialisation réussie !</CardTitle>
          <CardDescription className="text-center">
            {successMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
            <p className="text-sm text-green-900 dark:text-green-100">
              Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion dans un instant.
            </p>
          </div>
          <Button
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Aller à la connexion
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }
}

