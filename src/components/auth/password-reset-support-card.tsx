'use client';

import Link from 'next/link';
import { Facebook, Instagram } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FACEBOOK_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/support-contacts';

/**
 * Shown on /forgot-password and /reset-password while password reset by e-mail
 * is unavailable (see PASSWORD_RESET_BY_EMAIL_ENABLED): the student contacts
 * MedADN and an admin resets the password from the Users table.
 */
export function PasswordResetSupportCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Mot de passe oublié ?</CardTitle>
        <CardDescription>
          La réinitialisation du mot de passe par e-mail n&apos;est pas encore disponible.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Contactez MedADN sur Instagram ({INSTAGRAM_HANDLE}) ou sur Facebook en indiquant
          l&apos;adresse e-mail de votre compte. Un administrateur réinitialisera votre mot de passe
          et vous enverra un mot de passe temporaire, que vous pourrez ensuite changer dans les
          paramètres de votre compte.
        </p>
        <p className="text-xs text-muted-foreground">
          Vous vous êtes inscrit avec Google ? Utilisez « Continue with Google » sur la page de
          connexion : aucun mot de passe n&apos;est nécessaire.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            asChild
            className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] hover:opacity-90 text-white transition-all duration-300"
          >
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Instagram className="h-4 w-4 mr-2" />
              Instagram
            </a>
          </Button>
          <Button asChild className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white">
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </a>
          </Button>
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Vous vous souvenez de votre mot de passe ? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
