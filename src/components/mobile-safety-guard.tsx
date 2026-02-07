'use client';

import { useEffect } from 'react';

/**
 * Mobile Safety Guard Component
 * 
 * Provides additional safety measures for mobile devices to prevent
 * complete page disappearance and ensure critical functionality remains accessible.
 */
export function MobileSafetyGuard() {
  useEffect(() => {
    // Only run on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return;

    let safetyCheckCount = 0;
    const maxSafetyChecks = 3;

    const performSafetyCheck = () => {
      const root = document.documentElement;
      const body = document.body;
      
      // Check if page is completely hidden
      const isPageHidden = (
        root.style.visibility === 'hidden' ||
        body.style.visibility === 'hidden' ||
        root.style.display === 'none' ||
        body.style.display === 'none'
      );

      // Check if theme-ready class is missing after reasonable time
      const isThemeNotReady = !root.classList.contains('theme-ready');
      
      if (isPageHidden || isThemeNotReady) {
        console.warn(`Mobile Safety Guard: Detected potential visibility issue (check ${safetyCheckCount + 1}/${maxSafetyChecks})`);
        
        // Apply emergency fixes
        root.classList.add('theme-ready');
        root.style.visibility = 'visible';
        root.style.display = '';
        body.style.visibility = 'visible';
        body.style.display = '';
        
        // Force important visibility
        root.style.setProperty('visibility', 'visible', 'important');
        body.style.setProperty('visibility', 'visible', 'important');
        
        // Ensure critical elements are visible
        const criticalSelectors = ['main', 'nav', 'header', '[role="main"]', '.main-content'];
        criticalSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (element instanceof HTMLElement) {
              element.style.visibility = 'visible';
              element.style.display = '';
              element.style.setProperty('visibility', 'visible', 'important');
            }
          });
        });
        
        console.log('Mobile Safety Guard: Applied emergency visibility fixes');
      }
      
      safetyCheckCount++;
    };

    // Initial safety check after 8 seconds
    const initialTimer = setTimeout(performSafetyCheck, 8000);
    
    // Follow-up checks at 12 and 18 seconds
    const followUpTimer1 = setTimeout(() => {
      if (safetyCheckCount < maxSafetyChecks) {
        performSafetyCheck();
      }
    }, 12000);
    
    const followUpTimer2 = setTimeout(() => {
      if (safetyCheckCount < maxSafetyChecks) {
        performSafetyCheck();
      }
    }, 18000);

    // Cleanup function
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(followUpTimer1);
      clearTimeout(followUpTimer2);
    };
  }, []);

  // This component renders nothing but provides safety functionality
  return null;
}
