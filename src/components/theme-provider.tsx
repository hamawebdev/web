// @ts-nocheck
"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // The landing page is always light. forcedTheme shows it light without touching the
  // visitor's saved choice, which applies again as soon as they leave the page.
  const forcedTheme = usePathname() === "/" ? "light" : undefined

  // Enhanced mobile-safe theme initialization
  React.useEffect(() => {
    const root = document.documentElement;
    
    // Mobile device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Check if theme-ready is already set by the init script
    if (!root.classList.contains('theme-ready')) {
      if (isMobile) {
        // For mobile devices, apply immediately without delay
        root.classList.add('theme-ready');
        console.log('ThemeProvider: Applied theme-ready for mobile device');
      } else {
        // Small delay for desktop browsers to ensure CSS variables are properly applied
        const timer = setTimeout(() => {
          root.classList.add('theme-ready');
        }, 25);
        
        return () => clearTimeout(timer);
      }
    }
    
    // Mobile safety net - ensure visibility after 10 seconds regardless
    if (isMobile) {
      const safetyTimer = setTimeout(() => {
        if (root.style.visibility === 'hidden' || !root.classList.contains('theme-ready')) {
          root.classList.add('theme-ready');
          root.style.visibility = 'visible';
          root.style.setProperty('visibility', 'visible', 'important');
          console.warn('ThemeProvider: Mobile safety net activated - forced visibility');
        }
      }, 10000);
      
      return () => clearTimeout(safetyTimer);
    }
  }, []);

  return <NextThemesProvider {...props} forcedTheme={forcedTheme}>{children}</NextThemesProvider>
}