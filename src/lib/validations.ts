// @ts-nocheck
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse e-mail est requise')
    .email('Veuillez entrer une adresse e-mail valide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(4, 'Le mot de passe doit contenir au moins 4 caractères'),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Le nom complet est requis')
    .min(3, 'Le nom complet doit contenir au moins 3 caractères'),
  email: z
    .string()
    .min(1, 'L\'adresse e-mail est requise')
    .email('Veuillez entrer une adresse e-mail valide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(4, 'Le mot de passe doit contenir au moins 4 caractères'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;