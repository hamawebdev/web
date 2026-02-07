// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { suiviCoursStorage, TrackedCourse } from '@/lib/suivi-cours-storage';
import { Trash2, Plus, RefreshCw, Bug } from 'lucide-react';

export default function TestStoragePage() {
  const [trackedCourses, setTrackedCourses] = useState<TrackedCourse[]>([]);
  const [stats, setStats] = useState<any>({});
  const [newTrackerId, setNewTrackerId] = useState('');
  const [newTrackerTitle, setNewTrackerTitle] = useState('');
  const [newCourseIds, setNewCourseIds] = useState('');

  const refreshData = () => {
    setTrackedCourses(suiviCoursStorage.getTrackedCourses());
    setStats(suiviCoursStorage.getStorageStats());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddTracker = () => {
    if (!newTrackerId || !newTrackerTitle || !newCourseIds) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const courseIds = newCourseIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (courseIds.length === 0) {
        toast.error('Veuillez entrer des IDs de cours valides (séparés par des virgules)');
        return;
      }

      suiviCoursStorage.addTrackedCourses(
        parseInt(newTrackerId),
        newTrackerTitle,
        courseIds
      );

      setNewTrackerId('');
      setNewTrackerTitle('');
      setNewCourseIds('');
      refreshData();
      toast.success('Tracker ajouté avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du tracker');
      console.error(error);
    }
  };

  const handleRemoveTracker = (trackerId: number) => {
    try {
      suiviCoursStorage.removeTrackedCourses(trackerId);
      refreshData();
      toast.success('Tracker supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression du tracker');
      console.error(error);
    }
  };

  const handleClearAll = () => {
    try {
      suiviCoursStorage.clearAllTrackedCourses();
      refreshData();
      toast.success('Tous les trackers supprimés');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  };

  const handleDebugLog = () => {
    suiviCoursStorage.debugLogState();
    toast.info('État loggé dans la console');
  };

  const testCourseTracking = (courseId: number) => {
    const isTracked = suiviCoursStorage.isCourseTracked(courseId);
    const trackerInfo = suiviCoursStorage.getTrackerForCourse(courseId);
    
    toast.info(
      isTracked 
        ? `Cours ${courseId} est suivi dans "${trackerInfo?.trackerTitle}"`
        : `Cours ${courseId} n'est pas suivi`
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Test Suivi-Cours Storage</h1>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleDebugLog} variant="outline" size="sm">
            <Bug className="h-4 w-4 mr-2" />
            Debug Log
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalTrackedCourses || 0}</div>
              <div className="text-sm text-muted-foreground">Cours suivis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.uniqueTrackers || 0}</div>
              <div className="text-sm text-muted-foreground">Trackers uniques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.storageSize || 0}</div>
              <div className="text-sm text-muted-foreground">Taille (bytes)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Dernière MAJ</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Tracker de Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="trackerId">ID Tracker</Label>
              <Input
                id="trackerId"
                value={newTrackerId}
                onChange={(e) => setNewTrackerId(e.target.value)}
                placeholder="ex: 123"
              />
            </div>
            <div>
              <Label htmlFor="trackerTitle">Titre Tracker</Label>
              <Input
                id="trackerTitle"
                value={newTrackerTitle}
                onChange={(e) => setNewTrackerTitle(e.target.value)}
                placeholder="ex: Mon Tracker Test"
              />
            </div>
            <div>
              <Label htmlFor="courseIds">IDs Cours (séparés par virgules)</Label>
              <Input
                id="courseIds"
                value={newCourseIds}
                onChange={(e) => setNewCourseIds(e.target.value)}
                placeholder="ex: 1,2,3"
              />
            </div>
          </div>
          <Button onClick={handleAddTracker} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Tracker
          </Button>
        </CardContent>
      </Card>

      {/* Test Course Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Tester le Suivi de Cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 10, 15, 20].map(courseId => (
              <Button
                key={courseId}
                onClick={() => testCourseTracking(courseId)}
                variant="outline"
                size="sm"
              >
                Test Cours {courseId}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tracked Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cours Suivis ({trackedCourses.length})</CardTitle>
            <Button onClick={handleClearAll} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Tout Supprimer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {trackedCourses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun cours suivi</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                trackedCourses.reduce((acc, course) => {
                  if (!acc[course.trackerId]) {
                    acc[course.trackerId] = [];
                  }
                  acc[course.trackerId].push(course);
                  return acc;
                }, {} as Record<number, TrackedCourse[]>)
              ).map(([trackerId, courses]) => (
                <div key={trackerId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{courses[0].trackerTitle}</h3>
                      <p className="text-sm text-muted-foreground">Tracker ID: {trackerId}</p>
                    </div>
                    <Button
                      onClick={() => handleRemoveTracker(parseInt(trackerId))}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {courses.map(course => (
                      <Badge key={course.courseId} variant="secondary">
                        Cours {course.courseId}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
