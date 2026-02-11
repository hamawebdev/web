// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AuthAPI from '@/lib/auth-api';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Globe3D from '@/components/mvpblocks/3dglobe';
import { Feature } from "@/components/ui/feature-with-advantages";
import DesignerPricing from '@/components/mvpblocks/designer-pricing';
import Faq1 from '@/components/mvpblocks/faq-1';
import CTA2 from '@/components/mvpblocks/cta';
import { JsonLd } from '@/components/json-ld';

import LandingStats from '@/components/mvpblocks/landing-stats';

export default function Home() {
  const { isAuthenticated, user, initializeAuth, loading } = useAuth();
  const router = useRouter();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize auth check
  useEffect(() => {
    initializeAuth().finally(() => setHasInitialized(true));
  }, [initializeAuth]);

  // Redirect authenticated users straight to the student dashboard
  useEffect(() => {
    if (hasInitialized && !loading && isAuthenticated && user) {
      router.push('/student/dashboard');
    }
  }, [hasInitialized, loading, isAuthenticated, user, router]);

  // Force light mode for homepage
  useEffect(() => {
    // Force light mode by setting data-theme and class
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    // Also set the theme in localStorage to override next-themes
    localStorage.setItem('theme', 'light');

    return () => {
      // Cleanup: restore system theme preference when leaving homepage
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    };
  }, []);


  return (
    <div className="min-h-screen relative overflow-hidden force-light-mode">
      <JsonLd />
      <Header />
      <div>
        <Globe3D />
        <LandingStats />

        <Feature />

        <DesignerPricing />

        <Faq1 />

        <section className="py-20 bg-background">
          <div className="container mx-auto flex justify-center px-4">
            <CTA2 />
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
