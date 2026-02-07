// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic';;

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target } from 'lucide-react';
import { UnitModuleSelector } from '@/components/student/shared/unit-module-selector';
import { TrackerCreateDialog } from '@/components/student/course-tracking/tracker-create-dialog';
import { UnitModuleSelection } from '@/types/api';
import { ErrorBoundary } from '@/components/error-boundary';

function CreateTrackerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get pre-selected unit/module from URL params
  const preSelectedType = searchParams.get('type') as 'unite' | 'module' | null;
  const preSelectedId = searchParams.get('id');
  const preSelectedName = searchParams.get('name');
  const preSelectedUniteId = searchParams.get('uniteId');
  const preSelectedUniteName = searchParams.get('uniteName');

  const [selectedUnitModule, setSelectedUnitModule] = useState<UnitModuleSelection | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Set pre-selected unit/module if provided in URL
  useEffect(() => {
    if (preSelectedType && preSelectedId && preSelectedName) {
      const selection: UnitModuleSelection = {
        type: preSelectedType,
        id: parseInt(preSelectedId),
        name: preSelectedName,
        uniteId: preSelectedUniteId ? parseInt(preSelectedUniteId) : undefined,
        uniteName: preSelectedUniteName || undefined
      };
      setSelectedUnitModule(selection);
      setCreateDialogOpen(true);
    }
  }, [preSelectedType, preSelectedId, preSelectedName, preSelectedUniteId, preSelectedUniteName]);

  const handleBack = () => {
    router.push('/student/suivi-cours');
  };

  const handleUnitModuleSelection = (selection: UnitModuleSelection) => {
    setSelectedUnitModule(selection);
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = (trackerId?: number) => {
    // The TrackerCreateDialog now handles redirection to the tracker page
    // This callback is kept for any additional handling if needed in the future
    console.log('Tracker created successfully with ID:', trackerId);
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    
    // If we came from a pre-selected unit/module, go back to its tracker list
    if (preSelectedType && preSelectedId && preSelectedName) {
      const params = new URLSearchParams({
        type: preSelectedType,
        id: preSelectedId,
        name: preSelectedName
      });
      
      if (preSelectedUniteId) {
        params.append('uniteId', preSelectedUniteId);
      }
      if (preSelectedUniteName) {
        params.append('uniteName', preSelectedUniteName);
      }
      
      router.push(`/student/suivi-cours/trackers?${params.toString()}`);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retourner
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Créer un nouveau suivi de cours
              </h1>
              <p className="text-muted-foreground mt-2">
                Sélectionnez une unité ou un module pour créer un suivi de cours
              </p>
            </div>
          </div>
        </div>

        {/* Unit/Module Selection */}
        {!selectedUnitModule && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Étape 1: Sélection de l'unité ou du module</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UnitModuleSelector
                onSelection={handleUnitModuleSelection}
                title="Choisir une unité ou un module"
                description="Sélectionnez l'unité ou le module pour lequel vous souhaitez créer un suivi de cours"
              />
            </CardContent>
          </Card>
        )}

        {/* Selected Unit/Module Display */}
        {selectedUnitModule && !createDialogOpen && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Unité/Module sélectionné</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {selectedUnitModule.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUnitModule.type === 'unite' ? 'Unité' : 'Module'}
                    {selectedUnitModule.uniteName && selectedUnitModule.type === 'module' && (
                      <span className="ml-2">({selectedUnitModule.uniteName})</span>
                    )}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUnitModule(null)}
                  >
                    Changer
                  </Button>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Tracker Dialog */}
        <TrackerCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          unitSelection={selectedUnitModule || undefined}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </ErrorBoundary>
  );
}

export default function CreateTrackerPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retourner
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Créer un nouveau suivi de cours
              </h1>
              <p className="text-muted-foreground mt-2">
                Chargement...
              </p>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <CreateTrackerContent />
    </Suspense>
  );
}
