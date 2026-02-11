// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { AuthAPI } from "@/lib/auth-api";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";



export function ModernRegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);




  // Memoized window size for better performance
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1000, height: 800 };
  });

  // Debounced resize handler to improve performance
  const updateWindowSize = useCallback(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    updateWindowSize();

    // Throttled resize listener for better performance
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateWindowSize, 100);
    };

    window.addEventListener('resize', throttledResize);
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, [updateWindowSize]);



  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange', // Changed to onChange for real-time validation
  });

  // Watch all form fields for validation
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');


  // Real-time validation functions
  const validateNameField = useCallback(async (fieldName: 'firstName' | 'lastName', value: string) => {
    if (value && value.length > 0) {
      await trigger(fieldName);
    }
  }, [trigger]);

  // Validate names on input change
  useEffect(() => {
    if (firstName !== undefined) {
      validateNameField('firstName', firstName);
    }
  }, [firstName, validateNameField]);

  useEffect(() => {
    if (lastName !== undefined) {
      validateNameField('lastName', lastName);
    }
  }, [lastName, validateNameField]);

  // Real-time password matching validation
  useEffect(() => {
    if (password !== undefined && confirmPassword !== undefined) {
      // Trigger validation for both password fields when either changes
      trigger(['password', 'confirmPassword']);
    }
  }, [password, confirmPassword, trigger]);

  // Check if all fields are valid and filled
  const isFormValid = useMemo(() => {
    const hasAllRequiredFields = !!(
      firstName?.trim() &&
      lastName?.trim() &&
      email?.trim() &&
      password?.trim() &&
      confirmPassword?.trim()
    );

    const hasNoErrors = !(
      errors.firstName ||
      errors.lastName ||
      errors.email ||
      errors.password ||
      errors.confirmPassword
    );

    return hasAllRequiredFields && hasNoErrors;
  }, [
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    errors.firstName,
    errors.lastName,
    errors.email,
    errors.password,
    errors.confirmPassword,
  ]);



  // Optimized submit handler with better error handling
  const onSubmit = useCallback(async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Combine first and last name into fullName for API
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

      const result = await AuthAPI.register({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        fullName: fullName,
      });

      // Show success toast
      toast.success('Votre compte a été créé avec succès !');

      // Auto-login: redirect to dashboard based on user role
      const redirectPath = AuthAPI.getRedirectPath(result.user.role);
      router.push(redirectPath);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Échec de l\'inscription';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Memoized background gradient for better performance - using hero gradient
  const backgroundGradient = useMemo(() => (
    <div className="absolute inset-0 section-bg bg-grid-pattern">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, var(--gradient-left), var(--gradient-center), var(--gradient-right))`
        }}
      />
    </div>
  ), []);

  // Memoized floating elements for better performance
  const floatingElements = useMemo(() => {
    if (!mounted) return null;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }, (_, i) => ( // Reduced from 8 to 6 for better performance
          <motion.div
            key={i}
            className="absolute w-2 h-2 gradient-bg-primary rounded-full opacity-60"
            initial={{
              x: Math.random() * windowSize.width,
              y: Math.random() * windowSize.height,
            }}
            animate={{
              x: Math.random() * windowSize.width,
              y: Math.random() * windowSize.height,
            }}
            transition={{
              duration: Math.random() * 20 + 20, // Slightly faster animation
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
    );
  }, [mounted, windowSize]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-8 relative force-light-mode">
      {/* Optimized animated background */}
      {backgroundGradient}

      {/* Optimized floating elements */}
      {floatingElements}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="glass shadow-2xl border-border/20 card-hover-lift animate-fade-in-up">
          <CardHeader className="text-center space-y-6 px-6 md:px-8 pt-8 pb-6 animate-delay-100">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="Med-ADN Logo"
                className="h-24 w-24 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Title */}
            <CardTitle className="!text-3xl !font-semibold !tracking-tight !text-emerald-400 !text-center !flex !justify-center !items-center !transition-none !group-hover:!text-emerald-400 !leading-tight">
              Rejoindre Med-ADN
            </CardTitle>

            {/* Description */}
            <CardDescription className="text-lg max-w-md mx-auto text-muted-foreground">
              Commencez votre parcours d&apos;éducation médicale aujourd&apos;hui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-6 md:px-8 pb-8 animate-delay-200">

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-8"
            >
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="firstName">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Entrez votre prénom"
                      className={cn(
                        "pl-10 h-10 border",
                        errors.firstName
                          ? "border-destructive focus:border-destructive focus:ring-destructive"
                          : "border-border"
                      )}
                      {...register("firstName")}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-destructive text-sm">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="lastName">Nom de famille</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Entrez votre nom de famille"
                      className={cn(
                        "pl-10 h-10 border",
                        errors.lastName
                          ? "border-destructive focus:border-destructive focus:ring-destructive"
                          : "border-border"
                      )}
                      {...register("lastName")}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-destructive text-sm">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-3">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Entrez votre e-mail"
                    className="pl-10 h-10 border border-border"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email.message}</p>
                )}
              </div>


              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative password-input-container">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Créer un mot de passe"
                      className="pl-10 pr-10 h-10 border border-border"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-sm">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative password-input-container">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmer le mot de passe"
                      className="pl-10 pr-10 h-10 border border-border"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="size-4 text-primary focus:ring-primary border border-border rounded mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  J&apos;accepte les{" "}
                  <Link href="/terms" className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
                    Conditions d&apos;utilisation
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
                    Politique de confidentialité
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <div className="space-y-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading || !isFormValid}
                  className="w-full h-10 btn-modern btn-interactive group"
                >
                  {isSubmitting || isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Création du compte...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Créer un compte
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
                {!isFormValid && !isSubmitting && !isLoading && (
                  <p className="text-xs text-muted-foreground text-center">
                    Veuillez remplir tous les champs correctement pour continuer
                  </p>
                )}
              </div>
            </motion.form>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors underline underline-offset-4"
                >
                  Se connecter ici
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 