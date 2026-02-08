// @ts-nocheck
import RegisterForm from '@/components/mvpblocks/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Med-ADN | Create Account',
  description: 'Join the largest medical community in Algeria. Access 150k+ questions and 12k+ resources for your medical studies.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}