// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic';

/**
 * Student Notes Page - Flat View with Filter Sheet
 *
 * Redesigned to load all notes immediately and provide optional filtering.
 *
 * Workflow:
 * 1. Fetch all notes on mount using GET /students/notes
 * 2. Display notes in a flat grid/list view
 * 3. Optional: User opens filter sheet to refine by unit, module, or label
 * 4. Client-side filtering for instant feedback
 *
 * API Endpoints Used:
 * - GET /students/notes - Get all notes (flat array)
 * - GET /students/content/filters - Get units/modules for filter options
 * - GET /students/labels - Get labels for filter options
 * - PUT /students/notes/:noteId - Update note
 * - DELETE /students/notes/:noteId - Delete note
 */

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react'
import { Filter, DocumentText } from '@solar-icons/react'
import { LoadingSpinner } from '@/components/loading-states'
import { useStudentAuth } from '@/hooks/use-auth'
import { useNotesFilters } from '@/hooks/use-notes-filters'
import { NewApiService } from '@/lib/api/new-api-services'
import { StudentService } from '@/lib/api-services'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { StudentNote } from '@/types/notes'

// Import new flat view components
import { NotesList } from '@/components/student/notes/notes-list'
import { NotesFilterSheet } from '@/components/student/notes/notes-filter-sheet'
import { ActiveFilters } from '@/components/student/notes/active-filters'
import { MarkdownNoteEditor } from '@/components/ui/markdown-editor'

function NotesContent() {
  const { isAuthenticated, loading: authLoading } = useStudentAuth()

  // Notes data state
  const [allNotes, setAllNotes] = useState<StudentNote[]>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [notesError, setNotesError] = useState<string | null>(null)

  // Filter sheet state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  // Filter data for the sheet
  const [units, setUnits] = useState<{ id: number; name: string; modules?: { id: number; name: string }[] }[]>([])
  const [labels, setLabels] = useState<{ id: number; name: string }[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [labelsLoading, setLabelsLoading] = useState(false)

  // Use the notes filters hook
  const {
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    activeFilterCount,
    hasActiveFilters,
  } = useNotesFilters()

  // Edit/Delete state for notes
  const [editing, setEditing] = useState<StudentNote | null>(null)
  const [editText, setEditText] = useState('')
  const [localSaving, setLocalSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // Fetch all notes on mount
  const fetchAllNotes = useCallback(async () => {
    try {
      setNotesLoading(true)
      setNotesError(null)

      console.log('📝 [Notes Page] Fetching all notes...')

      const response = await NewApiService.getAllStudentNotes()

      console.log('📝 [Notes Page] All notes response:', {
        success: response.success,
        notesCount: Array.isArray(response.data) ? response.data.length : 0,
      })

      if (response.success && response.data) {
        const notes = Array.isArray(response.data) ? response.data : []
        setAllNotes(notes)
      } else {
        throw new Error(response.error || 'Failed to fetch notes')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notes'
      console.error('📝 [Notes Page] fetchAllNotes error:', error)
      setNotesError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setNotesLoading(false)
    }
  }, [])

  // Fetch filter options (units/modules and labels)
  const fetchFilterOptions = useCallback(async () => {
    // Fetch units and modules
    setUnitsLoading(true)
    try {
      const response = await NewApiService.getContentFilters()
      if (response.success && response.data) {
        const unitsData = response.data.unites?.map(unite => ({
          id: unite.id,
          name: unite.name,
          modules: unite.modules?.map(m => ({ id: m.id, name: m.name })) || []
        })) || []
        setUnits(unitsData)
      }
    } catch (error) {
      console.error('Failed to fetch units:', error)
    } finally {
      setUnitsLoading(false)
    }

    // Fetch labels
    setLabelsLoading(true)
    try {
      const response = await StudentService.getLabels()
      if (response.success && response.data) {
        const labelsData = Array.isArray(response.data.data)
          ? response.data.data.map(l => ({ id: l.id, name: l.name }))
          : []
        setLabels(labelsData)
      }
    } catch (error) {
      console.error('Failed to fetch labels:', error)
    } finally {
      setLabelsLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchAllNotes()
      fetchFilterOptions()
    }
  }, [isAuthenticated, authLoading, fetchAllNotes, fetchFilterOptions])

  // Apply filters to notes (memoized)
  const filteredNotes = useMemo(() => {
    return applyFilters(allNotes)
  }, [allNotes, applyFilters])

  // Build lookup maps for filter names
  const unitNames = useMemo(() => {
    const map = new Map<number, string>()
    units.forEach(u => map.set(u.id, u.name))
    return map
  }, [units])

  const moduleNames = useMemo(() => {
    const map = new Map<number, string>()
    units.forEach(u => {
      u.modules?.forEach(m => map.set(m.id, m.name))
    })
    return map
  }, [units])

  const labelNames = useMemo(() => {
    const map = new Map<number, string>()
    labels.forEach(l => map.set(l.id, l.name))
    return map
  }, [labels])

  // Handlers
  const handleSearchChange = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }))
  }, [setFilters])

  const handleSortChange = useCallback((sortBy: 'updatedAt' | 'createdAt' | 'alphabetical', sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }))
  }, [setFilters])

  const openEdit = (note: StudentNote) => {
    setEditing(note)
    setEditText(note.noteText || '')
  }

  const saveEdit = async () => {
    if (!editing) return
    try {
      const next = (editText || '').trim()
      const prev = (editing.noteText || '').trim()
      if (next === prev) {
        toast.info('No changes to save')
        setEditing(null)
        return
      }
      setLocalSaving(true)

      await StudentService.updateNote(editing.id, { noteText: editText })
      setEditing(null)
      toast.success('Note updated successfully')
      fetchAllNotes() // Refresh notes
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update note'
      toast.error(errorMessage)
    } finally {
      setLocalSaving(false)
    }
  }

  const requestDelete = (noteId: number) => setDeleteTarget(noteId)

  const confirmDelete = async () => {
    if (deleteTarget == null) return
    try {
      await StudentService.deleteNote(deleteTarget)
      setDeleteTarget(null)
      toast.success('Note deleted successfully')
      fetchAllNotes() // Refresh notes
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note'
      toast.error(errorMessage)
    }
  }

  // Remove individual filters
  const removeUnit = (unitId: number) => {
    setFilters(prev => ({
      ...prev,
      selectedUnits: prev.selectedUnits.filter(id => id !== unitId)
    }))
  }

  const removeModule = (moduleId: number) => {
    setFilters(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.filter(id => id !== moduleId)
    }))
  }

  const removeLabel = (labelId: number) => {
    setFilters(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels.filter(id => id !== labelId)
    }))
  }

  const clearSearch = () => {
    setFilters(prev => ({ ...prev, searchQuery: '' }))
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <DocumentText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  My Notes
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  All your notes in one place
                </p>
              </div>
            </div>

            {/* Filter Button */}
            <Button
              variant="outline"
              onClick={() => setFilterSheetOpen(true)}
              className="self-start sm:self-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filters Display */}
          <ActiveFilters
            filters={filters}
            onRemoveUnit={removeUnit}
            onRemoveModule={removeModule}
            onRemoveLabel={removeLabel}
            onClearSearch={clearSearch}
            onClearAll={resetFilters}
            unitNames={unitNames}
            moduleNames={moduleNames}
            labelNames={labelNames}
          />
        </div>

        {/* Loading State */}
        {notesLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {notesError && !notesLoading && (
          <div className="rounded-lg border border-destructive bg-destructive/5 p-6">
            <div className="text-destructive text-center">
              <p className="font-medium">Failed to load notes</p>
              <p className="text-sm mt-1 text-destructive/70">{notesError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={fetchAllNotes}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {!notesLoading && !notesError && (
          <NotesList
            notes={filteredNotes}
            loading={notesLoading}
            searchQuery={filters.searchQuery}
            onSearchChange={handleSearchChange}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortChange={handleSortChange}
            onEdit={openEdit}
            onDelete={requestDelete}
          />
        )}

        {/* Filter Sheet */}
        <NotesFilterSheet
          open={filterSheetOpen}
          onOpenChange={setFilterSheetOpen}
          filters={filters}
          onFiltersChange={setFilters}
          onApply={() => setFilterSheetOpen(false)}
          onClear={resetFilters}
          activeFilterCount={activeFilterCount}
          units={units}
          labels={labels}
          unitsLoading={unitsLoading}
          labelsLoading={labelsLoading}
        />

        {/* Edit Note Dialog */}
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
              <DialogDescription>Update your note content.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <MarkdownNoteEditor
                  value={editText}
                  onChange={setEditText}
                  placeholder="Enter your note..."
                />
                <div className="text-xs text-muted-foreground">
                  {editText.length}/5000 characters
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={localSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={saveEdit}
                disabled={localSaving || !editText.trim()}
                className="min-w-20"
              >
                {localSaving ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Saving...
                  </div>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this note?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your note.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotesContent />
    </Suspense>
  );
}