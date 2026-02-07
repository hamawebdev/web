// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Loader2, ArrowRight } from 'lucide-react';
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

// Validation schema for reset password form
const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse e-mail est requise')
    .email('Veuillez entrer une adresse e-mail valide'),
  code: z
    .string()
    .length(6, 'Le code de vérification doit comporter 6 caractères')
    .toUpperCase(),
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

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

/**
 * ResetPasswordForm Component
 * 
 * Handles the second step of the password reset workflow:
 * - User enters their email address
 * - User enters the 6-character verification code from their email
 * - User enters and confirms their new password (minimum 8 characters)
 * - System validates the code and updates the password
 */
export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      console.log('🔐 ResetPasswordForm: Submitting password reset', {
        email: data.email,
        codeLength: data.code.length
      });

      await AuthAPI.resetPassword(data.email, data.code, data.newPassword);

      console.log('🔐 ResetPasswordForm: Réinitialisation réussie');
      toast.success('Mot de passe réinitialisé avec succès ! Veuillez vous connecter avec votre nouveau mot de passe.');

      if (onSuccess) {
        onSuccess();
      }

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error: any) {
      console.error('🔐 ResetPasswordForm: Erreur', error);
      const errorMessage = error.message || 'Échec de la réinitialisation du mot de passe';
      toast.error(errorMessage);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Réinitialisez votre mot de passe</CardTitle>
        <CardDescription>
          Entrez le code de vérification reçu par e-mail et créez un nouveau mot de passe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Verification Code Field */}
          <div className="space-y-2">
            <Label htmlFor="code">Code de vérification</Label>
            <Input
              id="code"
              type="text"
              placeholder="ABC123"
              maxLength={6}
              className="uppercase"
              {...register('code')}
              disabled={isSubmitting}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Entrez le code à 6 caractères reçu par e-mail
            </p>
          </div>

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Entrez le nouveau mot de passe"
                className="pl-10 pr-10"
                {...register('newPassword')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum 4 caractères
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmez le nouveau mot de passe"
                className="pl-10 pr-10"
                {...register('confirmPassword')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                disabled={isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !newPassword || !confirmPassword}
          >
            {isSubmitting ? (
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

