'use client';

import React from 'react';
import { LogoDisplay } from '@/components/ui/logo-display';
import { Building2, BookOpen, GraduationCap } from 'lucide-react';

// Test data from the API response
const testData = [
  {
    id: 32,
    name: "Endocrinologie-Maladies Métabolique",
    logoUrl: "https://med-cortex.com/api/v1/media/logos/logos_1758301482502-236176390.png"
  },
  {
    id: 33,
    name: "Gynécologie-Obstétrique",
    logoUrl: "https://med-cortex.com/api/v1/media/logos/logos_1758301491749-937875837.jpg"
  },
  {
    id: 34,
    name: "Orthopédie-Rhumatologie",
    logoUrl: "https://med-cortex.com/api/v1/media/logos/logos_1758301512320-842192216.png"
  },
  {
    id: 35,
    name: "Psychiatrie",
    logoUrl: null
  },
  {
    id: 36,
    name: "Pédiatrie",
    logoUrl: "https://med-cortex.com/api/v1/media/logos/logos_1758301450260-236250820.png"
  },
  {
    id: 37,
    name: "Urologie-Néphrologie",
    logoUrl: null
  }
];

export function LogoTest() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Logo Display Test</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {testData.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-center">
              <LogoDisplay
                logoUrl={item.logoUrl}
                fallbackIcon={GraduationCap}
                alt={`${item.name} logo`}
                size="lg"
                variant="rounded"
                className="bg-transparent"
              />
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-sm">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Logo URL: {item.logoUrl ? 'Present' : 'Null'}
              </p>
              {item.logoUrl && (
                <p className="text-xs text-blue-600 break-all mt-1">
                  {item.logoUrl}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">Test Results:</h2>
        <ul className="text-sm space-y-1">
          <li>• Items with logoUrl should show actual images</li>
          <li>• Items with null logoUrl should show fallback icons</li>
          <li>• Check browser console for any image loading errors</li>
          <li>• Check network tab for failed image requests</li>
        </ul>
      </div>
    </div>
  );
}
