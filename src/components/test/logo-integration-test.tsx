'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoDisplay } from '@/components/ui/logo-display';
import { UnitCard } from '@/components/student/course-resources/unit-card';
import { ModuleCard } from '@/components/student/course-resources/module-card';
import { UnitModuleCard } from '@/components/student/shared/unit-module-card';
import { GraduationCap, BookOpen, Users } from 'lucide-react';

/**
 * Test component to verify logo integration functionality
 * This component demonstrates:
 * 1. LogoDisplay component with and without logos
 * 2. Updated UnitCard and ModuleCard components
 * 3. UnitModuleCard component with logo support
 */
export function LogoIntegrationTest() {
  // Test data with and without logos
  const testUnit = {
    id: 1,
    name: 'Cardiology',
    logoUrl: '/api/media/logos/test-cardiology-logo.png',
    modules: [
      {
        id: 1,
        name: 'Basic Cardiology',
        description: 'Introduction to cardiovascular system',
        logoUrl: '/api/media/logos/test-module-logo.png'
      }
    ]
  };

  const testUnitWithoutLogo = {
    id: 2,
    name: 'Neurology',
    modules: [
      {
        id: 2,
        name: 'Brain Anatomy',
        description: 'Study of brain structure'
      }
    ]
  };

  const testModule = {
    id: 3,
    name: 'Anatomy',
    description: 'Basic anatomy concepts',
    logoUrl: '/api/media/logos/test-anatomy-logo.png'
  };

  const testModuleWithoutLogo = {
    id: 4,
    name: 'Physiology',
    description: 'Body functions and processes'
  };

  const testUnitModuleItems = [
    {
      id: 1,
      name: 'Cardiology Unit',
      description: 'Cardiovascular system studies',
      logoUrl: '/api/media/logos/test-cardiology-logo.png',
      type: 'unite' as const,
      moduleCount: 5
    },
    {
      id: 2,
      name: 'Independent Anatomy',
      description: 'Standalone anatomy module',
      logoUrl: '/api/media/logos/test-anatomy-logo.png',
      type: 'module' as const,
      isIndependent: true
    },
    {
      id: 3,
      name: 'Neurology Unit',
      description: 'Brain and nervous system',
      type: 'unite' as const,
      moduleCount: 3
    }
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Logo Integration Test</h1>
        <p className="text-muted-foreground mb-6">
          This page tests the logo integration functionality across different components.
        </p>
      </div>

      {/* LogoDisplay Component Tests */}
      <Card>
        <CardHeader>
          <CardTitle>LogoDisplay Component Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <LogoDisplay
                logoUrl="/api/media/logos/test-logo.png"
                fallbackIcon={GraduationCap}
                alt="Test logo"
                size="sm"
                variant="rounded"
              />
              <p className="text-xs mt-2">Small with logo</p>
            </div>
            <div className="text-center">
              <LogoDisplay
                fallbackIcon={BookOpen}
                alt="Fallback icon"
                size="md"
                variant="rounded"
              />
              <p className="text-xs mt-2">Medium fallback</p>
            </div>
            <div className="text-center">
              <LogoDisplay
                logoUrl="/api/media/logos/nonexistent.png"
                fallbackIcon={Users}
                alt="Error fallback"
                size="lg"
                variant="circle"
              />
              <p className="text-xs mt-2">Large error fallback</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UnitCard Tests */}
      <Card>
        <CardHeader>
          <CardTitle>UnitCard Component Tests</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UnitCard
            unit={testUnit}
            onClick={() => console.log('Unit with logo clicked')}
          />
          <UnitCard
            unit={testUnitWithoutLogo}
            onClick={() => console.log('Unit without logo clicked')}
          />
        </CardContent>
      </Card>

      {/* ModuleCard Tests */}
      <Card>
        <CardHeader>
          <CardTitle>ModuleCard Component Tests</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModuleCard
            module={testModule}
            onClick={() => console.log('Module with logo clicked')}
          />
          <ModuleCard
            module={testModuleWithoutLogo}
            isIndependent={true}
            onClick={() => console.log('Independent module without logo clicked')}
          />
        </CardContent>
      </Card>

      {/* UnitModuleCard Tests */}
      <Card>
        <CardHeader>
          <CardTitle>UnitModuleCard Component Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {testUnitModuleItems.map((item) => (
            <UnitModuleCard
              key={item.id}
              item={item}
              onClick={(item) => console.log('UnitModuleCard clicked:', item)}
              variant="practice"
            />
          ))}
        </CardContent>
      </Card>

      {/* API Response Format Example */}
      <Card>
        <CardHeader>
          <CardTitle>Expected API Response Format</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "data": {
      "studyPacks": [
        {
          "id": 1,
          "name": "Medicine Year 1",
          "unites": [
            {
              "id": 30,
              "name": "Cardiology",
              "logoUrl": "/api/media/logos/logos_1757197057726-149496225.png",
              "modules": [
                {
                  "id": 101,
                  "name": "Anatomy",
                  "logoUrl": "/api/media/logos/logos_1757197057763-370257331.png"
                }
              ]
            }
          ]
        }
      ]
    }
  }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
