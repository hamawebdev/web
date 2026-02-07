// @ts-nocheck
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/hooks/use-auth';
import AuthAPI from '@/lib/auth-api';


import { useState, useEffect } from 'react';

export function Header() {

  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [authInitialized, setAuthInitialized] = useState(false);
  const { isAuthenticated, user, loading, initializeAuth, logout } = useAuth();


  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      // Calculate scroll progress for smooth transitions (0 to 1)
      const maxScroll = 200; // Maximum scroll distance for full effect
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);

      // Update CSS custom properties for smooth transitions
      document.documentElement.style.setProperty('--scroll-progress', progress.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize authentication on component mount (only once)
  useEffect(() => {
    if (!authInitialized) {
      console.log('🔐 Header: Initializing auth...');
      initializeAuth().finally(() => {
        setAuthInitialized(true);
      });
    }
  }, [initializeAuth, authInitialized]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return '/student/dashboard';
    return AuthAPI.getRedirectPath(user.role);
  };



  return (
    <header
      className={`absolute top-0 left-0 right-0 z-50 w-full transition-all duration-300 bg-transparent ${isScrolled ? 'h-16' : 'h-20'
        }`}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo with MedCortex branding */}
        <Link href="/" className="group flex items-center transition-all duration-300 hover:scale-105 flex-shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MedCortex Logo"
              className={`object-contain transition-all duration-300 ${isScrolled ? 'h-8 w-8' : 'h-10 w-10'}`}
            />
            <span className={`font-bold text-foreground transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>
              MedADN
            </span>
          </div>
        </Link>

        {/* Right Section */}
        <div className="flex items-center flex-shrink-0 gap-4">
          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!loading && (
              <>
                {isAuthenticated && user ? (
                  // Authenticated user - show Dashboard
                  <Link href={getDashboardUrl()}>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium transition-all duration-300 shadow-sm"
                    >
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  // Not authenticated - show Login and Sign Up
                  <>
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground/90 hover:text-foreground hover:bg-foreground/10 rounded-2xl font-medium transition-all duration-300"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium transition-all duration-300 shadow-sm"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}