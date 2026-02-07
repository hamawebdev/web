'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  AlertCircle,
  Plus,
  Stethoscope,
  Search,
  Filter,
} from 'lucide-react';
import { useSpecialtyManagement } from '@/hooks/admin/use-specialty-management';
import { SpecialtyTable } from './specialty-table';
import { SpecialtyFiltersComponent } from './specialty-filters';
import { CreateSpecialtyDialog } from './create-specialty-dialog';

/**
 * Specialty Management Section Component
 *
 * Comprehensive specialty management interface with filtering,
 * search, pagination, and CRUD operations.
 */
export function SpecialtyManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    specialties,
    totalSpecialties,
    currentPage,
    totalPages,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    goToPage,
    hasSpecialties,
    hasError,
    hasFilters,
  } = useSpecialtyManagement();

  const handleCreateSpecialty = async (specialtyData: { name: string }) => {
    try {
      await createSpecialty(specialtyData);
      setShowCreateDialog(false);
    } catch (error) {
      // Error is handled in the hook
      console.error('Failed to create specialty:', error);
    }
  };

  const handleRefresh = () => {
    // Trigger a refresh by going to the current page
    goToPage(currentPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Specialty Management</h2>
          <p className="text-muted-foreground">
            Manage medical specialties available for user registration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                !
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Specialty
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Failed to load specialties: {error}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <SpecialtyFiltersComponent
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        isVisible={showFilters}
      />

      {/* Specialties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Specialties
            {hasFilters && (
              <Badge variant="outline" className="ml-2">
                Filtered
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {loading ? (
              'Loading specialties...'
            ) : hasSpecialties ? (
              `Showing ${specialties.length} of ${totalSpecialties} specialties (Page ${currentPage} of ${totalPages})`
            ) : (
              'No specialties found'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpecialtyTable
            specialties={specialties}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            onUpdateSpecialty={updateSpecialty}
            onDeleteSpecialty={deleteSpecialty}
          />
        </CardContent>
      </Card>

      {/* Create Specialty Dialog */}
      <CreateSpecialtyDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateSpecialty}
      />
    </div>
  );
}
