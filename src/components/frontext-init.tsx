'use client';

import { useEffect } from 'react';

export function FrontextInit() {
  useEffect(() => {
    // Only initialize in development mode
    if (process.env.NODE_ENV === 'development') {
      // Dynamic import to avoid SSR issues
      import('@frontextai/toolbar').then(({ initToolbar }) => {
        const frontextConfig = {
          plugins: [],
        };
        
        initToolbar(frontextConfig);
      }).catch((error) => {
        console.warn('Failed to initialize frontext toolbar:', error);
      });
    }
  }, []);

  return null; // This component doesn't render anything
}