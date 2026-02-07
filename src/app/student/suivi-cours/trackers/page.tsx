// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic';;

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner, FullPageLoading } from '@/components/loading-states';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  ArrowLeft,
  Plus,
  Eye,
  Trash2,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  MoreVertical,
  Edit
} from 'lucide-react';
import { NewApiService } from '@/lib/api/new-api-services';
import { StudyCard, CardProgressResponse } from '@/types/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { suiviCoursStorage } from '@/lib/suivi-cours-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TrackerCardProps {
  tracker: StudyCard;
  progress?: CardProgressResponse;
  onView: () => void;
  onDelete: () => void;
  onEdit: (updatedTracker: StudyCard) => void;
}

function TrackerCard({ tracker, progress, onView, onDelete, onEdit }: TrackerCardProps) {
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const courseCount = tracker.cardCourses?.length || 0;
  const progressPercentage = progress?.cardProgressPercentage || 0;

  // Calculate layer progress breakdown
  const layerBreakdown = progress?.courseProgress?.reduce((acc, course) => {
    if (course.layerProgress.layer1) acc.c1++;
    if (course.layerProgress.layer2) acc.c2++;
    if (course.layerProgress.layer3) acc.c3++;
    if (course.layerProgress.qcmLayer) acc.qcm++;
    return acc;
  }, { c1: 0, c2: 0, c3: 0, qcm: 0 }) || { c1: 0, c2: 0, c3: 0, qcm: 0 };

  const totalCourses = progress?.totalCourses || courseCount;

  const handleEdit = () => {
    setEditTitle(tracker.title || '');
    setEditDescription(tracker.description || '');
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    const trimmedTitle = (editTitle || '').trim();
    const trimmedDescription = (editDescription || '').trim();

    if (!trimmedTitle) {
      toast.error('Le titre est requis');
      return;
    }

    try {
      setEditLoading(true);

      const response = await NewApiService.updateCard(tracker.id, {
        title: trimmedTitle,
        description: trimmedDescription || undefined
      });

      if (response.success) {
        // Update the tracker with new data
        const updatedTracker = {
          ...tracker,
          title: trimmedTitle,
          description: trimmedDescription || undefined
        };

        onEdit(updatedTracker);
        setEditDialogOpen(false);
        toast.success('Suivi mis à jour avec succès');
      } else {
        throw new Error(response.error || 'Failed to update tracker');
      }
    } catch (err) {
      console.error('Error updating tracker:', err);
      toast.error('Erreur lors de la mise à jour du suivi');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditTitle('');
    setEditDescription('');
  };

  return (
    <Card className="group transition-all duration-200 hover:shadow-lg border-border/50 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors break-words">
              {tracker.title}
            </CardTitle>
            {tracker.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2 break-words">
                {tracker.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                Voir la liste des cours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Course Count and Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {courseCount} cours
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Layer Progress Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">C1</div>
            <div className="text-sm font-medium">
              {layerBreakdown.c1}/{totalCourses}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalCourses > 0 ? Math.round((layerBreakdown.c1 / totalCourses) * 100) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">C2</div>
            <div className="text-sm font-medium">
              {layerBreakdown.c2}/{totalCourses}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalCourses > 0 ? Math.round((layerBreakdown.c2 / totalCourses) * 100) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">C3</div>
            <div className="text-sm font-medium">
              {layerBreakdown.c3}/{totalCourses}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalCourses > 0 ? Math.round((layerBreakdown.c3 / totalCourses) * 100) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">QCM</div>
            <div className="text-sm font-medium">
              {layerBreakdown.qcm}/{totalCourses}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalCourses > 0 ? Math.round((layerBreakdown.qcm / totalCourses) * 100) : 0}%
            </div>
          </div>
        </div>

        <Separator />

        {/* Timestamps and Actions */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Créé: {formatDate(tracker.createdAt)}</span>
            </div>
            {tracker.updatedAt !== tracker.createdAt && (
              <div className="flex items-center space-x-1">
                <span>Modifié: {formatDate(tracker.updatedAt)}</span>
              </div>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={onView}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Voir la liste des cours</span>
            <span className="sm:hidden">Voir les cours</span>
          </Button>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le suivi</DialogTitle>
            <DialogDescription>
              Modifiez le titre et la description de votre suivi de cours.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Entrez le titre du suivi"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Entrez une description (optionnel)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleEditCancel}
              disabled={editLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={editLoading || !(editTitle || '').trim()}
            >
              {editLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TrackersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const type = searchParams.get('type') as 'unite' | 'module';
  const id = searchParams.get('id');
  const name = searchParams.get('name');
  const uniteId = searchParams.get('uniteId');
  const uniteName = searchParams.get('uniteName');

  const [trackers, setTrackers] = useState<StudyCard[]>([]);
  const [trackerProgress, setTrackerProgress] = useState<Record<number, CardProgressResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackerToDelete, setTrackerToDelete] = useState<StudyCard | null>(null);

  // Fetch trackers for the selected unit or module
  const fetchTrackers = async () => {
    if (!type || !id) {
      setError('Invalid parameters');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = type === 'unite' 
        ? { uniteId: parseInt(id) }
        : { moduleId: parseInt(id) };

      const response = await NewApiService.getCardsByUnitOrModule(params);

      console.log('📋 [TrackersPage] Cards response:', {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        hasNestedData: !!response.data?.data,
        nestedDataType: typeof response.data?.data,
        isNestedArray: Array.isArray(response.data?.data),
        fullResponse: response
      });

      if (response.success && response.data) {
        // Handle both possible response structures: response.data or response.data.data
        const actualData = Array.isArray(response.data) ? response.data : response.data.data;

        if (!Array.isArray(actualData)) {
          console.error('❌ [TrackersPage] Expected array but got:', {
            actualData,
            dataType: typeof actualData,
            responseStructure: response.data
          });
          throw new Error('Invalid response structure: expected array of trackers');
        }

        setTrackers(actualData);

        // Fetch progress for each tracker
        const progressPromises = actualData.map(async (tracker: StudyCard) => {
          try {
            const progressResponse = await NewApiService.getCardProgress(tracker.id);
            if (progressResponse.success && progressResponse.data) {
              return { id: tracker.id, progress: progressResponse.data };
            }
          } catch (err) {
            console.warn(`Failed to fetch progress for tracker ${tracker.id}:`, err);
          }
          return null;
        });

        const progressResults = await Promise.all(progressPromises);
        const progressMap: Record<number, CardProgressResponse> = {};
        
        progressResults.forEach((result) => {
          if (result) {
            progressMap[result.id] = result.progress;
          }
        });

        setTrackerProgress(progressMap);

        // Sync localStorage with actual tracker data
        try {
          const trackersForSync = trackers.map(tracker => ({
            id: tracker.id,
            title: tracker.title,
            courses: tracker.courses || []
          }));
          await suiviCoursStorage.syncWithTrackers(trackersForSync);
        } catch (error) {
          console.error('Failed to sync tracked courses with localStorage:', error);
          // Don't block the main flow for localStorage sync errors
        }
      } else {
        throw new Error(response.error || 'Failed to fetch trackers');
      }
    } catch (err) {
      console.error('Error fetching trackers:', err);
      setError('Failed to load trackers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackers();
  }, [type, id]);

  const handleBack = () => {
    router.push('/student/suivi-cours');
  };

  const handleCreateTracker = () => {
    router.push('/student/suivi-cours/create-tracker');
  };

  const handleViewTracker = (tracker: StudyCard) => {
    router.push(`/student/suivi-cours/tracker/${tracker.id}`);
  };

  const handleDeleteTracker = (tracker: StudyCard) => {
    setTrackerToDelete(tracker);
    setDeleteDialogOpen(true);
  };

  const handleEditTracker = (updatedTracker: StudyCard) => {
    // Update the tracker in the local state
    setTrackers(prevTrackers =>
      prevTrackers.map(tracker =>
        tracker.id === updatedTracker.id ? updatedTracker : tracker
      )
    );
  };

  const confirmDelete = async () => {
    if (!trackerToDelete) return;

    try {
      const response = await NewApiService.deleteCard(trackerToDelete.id);
      
      if (response.success) {
        // Remove tracked courses from localStorage
        try {
          suiviCoursStorage.removeTrackedCourses(trackerToDelete.id);
        } catch (error) {
          console.error('Failed to remove tracked courses from localStorage:', error);
          // Don't block the success flow for localStorage errors
        }

        toast.success('Suivi de cours supprimé avec succès');
        setTrackers(prev => prev.filter(t => t.id !== trackerToDelete.id));
        setTrackerProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[trackerToDelete.id];
          return newProgress;
        });
      } else {
        throw new Error(response.error || 'Failed to delete tracker');
      }
    } catch (err) {
      console.error('Error deleting tracker:', err);
      toast.error('Erreur lors de la suppression du suivi');
    } finally {
      setDeleteDialogOpen(false);
      setTrackerToDelete(null);
    }
  };

  if (loading) {
    return <FullPageLoading message="Chargement des suivis de cours..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = name || 'Unité/Module';
  const trackerCount = trackers.length;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground w-fit"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retourner
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
                  La liste de suivi de cours : {trackerCount}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base break-words">
                  {type === 'unite' ? 'Unité' : 'Module'}: {displayName}
                  {uniteName && type === 'module' && (
                    <span className="ml-2 text-sm">({uniteName})</span>
                  )}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleCreateTracker}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Créer un nouveau suivi de cours</span>
              <span className="sm:hidden">Créer un suivi</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Trackers Grid */}
        {trackerCount === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Aucun suivi de cours trouvé pour cette {type === 'unite' ? 'unité' : 'module'}.
                </p>
                <Button onClick={handleCreateTracker}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier suivi
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trackers.map((tracker) => (
              <TrackerCard
                key={tracker.id}
                tracker={tracker}
                progress={trackerProgress[tracker.id]}
                onView={() => handleViewTracker(tracker)}
                onDelete={() => handleDeleteTracker(tracker)}
                onEdit={handleEditTracker}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le suivi de cours</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le suivi "{trackerToDelete?.title}" ? 
                Cette action est irréversible et supprimera tous les progrès associés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


      </div>
    </ErrorBoundary>
  );
}

export default function TrackersPage() {
  return (
    <Suspense fallback={<FullPageLoading message="Chargement des suivis de cours..." />}>
      <TrackersPageContent />
    </Suspense>
  );
}
