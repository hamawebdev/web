// @ts-nocheck
'use client'

/**
 * Student Labels Page - Direct Label Display
 *
 * Workflow:
 * 1. Fetch all student labels directly from the API
 * 2. Display labels with their associated questions
 * 3. Allow create, edit, delete operations
 * 4. Enable starting practice sessions from labels
 *
 * API Endpoints Used:
 * - GET /api/v1/students/labels - Get all labels with questions
 * - POST /api/v1/students/labels - Create new label
 * - PUT /api/v1/students/labels/{id} - Update label
 * - DELETE /api/v1/students/labels/{id} - Delete label
 * - POST /api/v1/quiz-sessions/practice/{labelId} - Create new practice session from label
 * - GET /api/v1/quiz-sessions/{sessionId} - Load session details
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { AddCircle, Filter, CloseCircle, Book, Notebook, PlayCircle, PenNewSquare, TrashBinTrash, Tag } from '@solar-icons/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label as UILabel } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/loading-states'
import { EmptyState } from '@/components/ui/empty-state'
import { useStudentAuth } from '@/hooks/use-auth'
import { StudentService, QuizService } from '@/lib/api-services'
import { toast } from 'sonner'


export default function LabelsPage() {
  const { isAuthenticated, loading: authLoading } = useStudentAuth()
  const router = useRouter()

  // Labels data state
  const [labelsData, setLabelsData] = useState<any[]>([])
  const [labelsLoading, setLabelsLoading] = useState(false)
  const [labelsError, setLabelsError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const limit = 12

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [creatingSessionId, setCreatingSessionId] = useState<number | null>(null)
  const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null)
  const [labelSessions, setLabelSessions] = useState<{ [labelId: number]: any[] }>({})

  const [newLabelName, setNewLabelName] = useState('')

  // Fetch all labels directly
  const fetchLabels = async () => {
    try {
      setLabelsLoading(true)
      setLabelsError(null)

      const response = await StudentService.getLabels()

      // Determine the labels array from various possible response structures
      // 1. Direct data array (observed format): {"data": [...]}
      // 2. Nested data array (legacy format): {"data": {"data": [...]}} or {"success": true, "data": [...]}
      let labels: any[] | null = null

      if (Array.isArray(response.data)) {
        labels = response.data
      } else if (response.data && Array.isArray(response.data.data)) {
        labels = response.data.data
      }

      if (labels) {
        setLabelsData(labels)
      } else if (response.success) {
        // Success flag present but no array found, assume empty (safe fallback)
        setLabelsData([])
      } else {
        throw new Error(response.error || 'Failed to fetch labels')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load labels'
      setLabelsError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLabelsLoading(false)
    }
  }

  const handleCreateLabel = async () => {
    const name = newLabelName.trim()
    if (!name) {
      toast.error('Label name is required')
      return
    }
    try {
      const response = await StudentService.createLabel({ name })

      // Handle response: API returns the created label object directly (e.g., { id: 5, name: "test", ... })
      // We also handle the wrapped case just in case ({ success: true, data: ... })
      const newLabel = response.id ? response : (response.data || null)

      if (newLabel && newLabel.id) {
        setShowCreateDialog(false)
        setNewLabelName('')
        toast.success('Label created successfully')
        // Add new label to list directly
        setLabelsData(prev => [newLabel, ...(Array.isArray(prev) ? prev : [])])
      } else {
        // Fallback if structure doesn't match expectation but didn't throw
        setShowCreateDialog(false)
        setNewLabelName('')
        fetchLabels()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create label'
      toast.error(errorMessage)
    }
  }

  const handleUpdateLabel = async (labelId: number, name: string) => {
    try {
      await StudentService.updateLabel(labelId, { name })
      setEditId(null)
      setEditName('')
      toast.success('Label updated successfully')
      // Refresh labels
      fetchLabels()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update label'
      toast.error(errorMessage)
    }
  }

  const handleDeleteLabel = async (labelId: number) => {
    try {
      await StudentService.deleteLabel(labelId)
      setDeletingId(null)
      toast.success('Label deleted successfully')
      // Refresh labels
      fetchLabels()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete label'
      toast.error(errorMessage)
    }
  }



  // Helper function to sanitize title for API compatibility
  const sanitizeTitle = (title: string): string => {
    return title
      // Replace common problematic characters
      .replace(/&/g, 'and')           // & -> and
      .replace(/[<>]/g, '')           // Remove < >
      .replace(/['"]/g, '')           // Remove quotes
      .replace(/[{}[\]]/g, '')        // Remove brackets
      .replace(/[|\\]/g, '')          // Remove pipes and backslashes
      .replace(/[^\w\s\-().,:]/g, '') // Keep only alphanumeric, spaces, hyphens, parentheses, periods, commas, colons
      .replace(/\s+/g, ' ')           // Normalize multiple spaces to single space
      .trim()                         // Remove leading/trailing whitespace
      .substring(0, 100);             // Limit length to 100 characters
  }

  // REMOVED: Legacy label sessions fetching
  // Labels now only support creating new sessions, not retrieving existing ones
  const fetchLabelSessions = async (labelId: number) => {
    // No longer supported - labels are for creating new sessions only
    return []
  }

  // Load an existing session using GET /quiz-sessions/{sessionId}
  const handleLoadSession = async (sessionId: number, labelId: number) => {
    try {
      setLoadingSessionId(labelId)

      const response = await QuizService.getQuizSession(sessionId)

      if (response.success && response.data) {
        toast.success('Session loaded successfully!')
        router.push(`/session/${sessionId}`)
      } else {
        throw new Error(response.error || 'Failed to load session')
      }
    } catch (error) {
      console.error('Error loading session:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session'
      toast.error(errorMessage)
    } finally {
      setLoadingSessionId(null)
    }
  }

  // Create new practice session from label
  const handleStartPractice = async (label: any) => {
    if (!label.questionIds || label.questionIds.length === 0) {
      toast.error('No questions available in this label')
      return
    }

    try {
      setCreatingSessionId(label.id)

      // Step 1: Create practice session by label
      console.log('🚀 Creating practice session for label:', label.id)
      const createResponse = await QuizService.createLabelSession(label.id)

      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.error || 'Unable to create label session')
      }

      const { sessionId, questionCount, title } = createResponse.data
      console.log('✅ Session created:', { sessionId, questionCount, title })

      // Step 2: Fetch the full session data
      console.log('📋 Fetching session details for sessionId:', sessionId)
      const sessionResponse = await QuizService.getQuizSession(sessionId)

      if (!sessionResponse.success || !sessionResponse.data) {
        throw new Error(sessionResponse.error || 'Session not found. Please try again.')
      }

      console.log('✅ Session data retrieved, redirecting to session...')
      toast.success(`Practice session created with ${questionCount} questions!`)

      // Step 3: Redirect to session
      router.push(`/session/${sessionId}`)
    } catch (error) {
      console.error('Error creating practice session:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create practice session'
      toast.error(errorMessage)
    } finally {
      setCreatingSessionId(null)
    }
  }

  // Filter and paginate labels
  const filteredLabels = labelsData ?
    labelsData.filter(l => l.name.toLowerCase().includes(q.toLowerCase())) : []
  const totalPages = Math.max(1, Math.ceil(filteredLabels.length / limit))
  const pageItems = filteredLabels.slice((page - 1) * limit, page * limit)

  const hasLabels = labelsData && labelsData.length > 0

  // REMOVED: Legacy label sessions loading
  // Labels now only support creating new sessions, not retrieving existing ones
  const loadAllLabelSessions = async () => {
    // No longer supported - labels are for creating new sessions only
    setLabelSessions({})
  }

  // Fetch labels on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchLabels()
    }
  }, [isAuthenticated])

  // Load sessions when labels are loaded
  useEffect(() => {
    if (labelsData && labelsData.length > 0) {
      loadAllLabelSessions()
    }
  }, [labelsData])

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
                <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  My Labels
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Organize and categorize your study content
                </p>
              </div>
            </div>

            {/* Create Label Button */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  <AddCircle className="mr-2 h-4 w-4" />
                  New Label
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Label</DialogTitle>
                  <DialogDescription>
                    Add a new label for your notes, questions, or sessions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <UILabel htmlFor="name">Name</UILabel>
                    <Input
                      id="name"
                      placeholder="e.g. Exam Prep"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLabel}>
                    Create Label
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Loading State */}
        {labelsLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {labelsError && (
          <Card className="border-destructive/50 bg-destructive/5">
            <div className="p-6">
              <div className="text-destructive text-center">
                <p className="font-medium">Failed to load labels</p>
                <p className="text-sm mt-1 text-destructive/80">{labelsError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fetchLabels()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Content */}
        {!labelsLoading && !labelsError && (
          <div className="space-y-6">
            {/* Search and Controls */}
            {hasLabels && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    placeholder="Search your labels..."
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1) }}
                    className="pl-10 h-10 border-border focus:border-primary/50"
                  />
                </div>

              </div>
            )}

            {!hasLabels ? (
              <EmptyState
                icon={Tag}
                title="No Labels Found"
                description="Create labels to organize your study content."
              />
            ) : pageItems.length === 0 ? (
              <EmptyState
                icon={Tag}
                title={q ? 'No matching labels' : 'No labels yet'}
                description={q ?
                  'Try adjusting your search criteria to find what you\'re looking for.' :
                  'Labels help you organize and categorize your study materials for easier access and better learning outcomes.'
                }
              />
            ) : (
              <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                {/* Table Header - Hidden on mobile */}
                <div className="bg-muted/30 border-b border-border hidden sm:block">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3">
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary border-border rounded focus:ring-primary/20"
                      />
                    </div>
                    <div className="col-span-5">
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        TITRE
                      </span>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        NOMBRE DE QUESTIONS
                      </span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        ACTION
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border">
                  {pageItems.map((l) => (
                    <div key={l.id} className="hover:bg-muted/20 transition-colors">
                      {/* Desktop Layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-4">
                        {/* Checkbox */}
                        <div className="col-span-1 flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary border-border rounded focus:ring-primary/20"
                          />
                        </div>

                        {/* Title */}
                        <div className="col-span-5 flex items-center">
                          <span className="text-sm font-medium text-foreground truncate">
                            {l.name}
                          </span>
                        </div>

                        {/* Question Count */}
                        <div className="col-span-3 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">
                            {l.questionIds?.length || 0}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-3 flex items-center justify-end gap-2">
                          {/* Play/Start Practice Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartPractice(l)}
                            disabled={!l.questionIds || l.questionIds.length === 0 || creatingSessionId === l.id}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:border-primary/30"
                          >
                            {creatingSessionId === l.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <PlayCircle className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditId(l.id); setEditName(l.name) }}
                            className="h-8 w-8 p-0 hover:bg-muted/50"
                          >
                            <PenNewSquare className="h-4 w-4" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingId(l.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 hover:border-destructive/30"
                          >
                            <TrashBinTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="sm:hidden p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-primary border-border rounded focus:ring-primary/20"
                            />
                            <div>
                              <h3 className="text-sm font-medium text-foreground">{l.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {l.questionIds?.length || 0} questions
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex items-center justify-end gap-2">
                          {/* Play/Start Practice Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartPractice(l)}
                            disabled={!l.questionIds || l.questionIds.length === 0 || creatingSessionId === l.id}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:border-primary/30"
                          >
                            {creatingSessionId === l.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <PlayCircle className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditId(l.id); setEditName(l.name) }}
                            className="h-8 w-8 p-0 hover:bg-muted/50"
                          >
                            <PenNewSquare className="h-4 w-4" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingId(l.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 hover:border-destructive/30"
                          >
                            <TrashBinTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {hasLabels && totalPages > 1 && (
          <Card className="mt-8 border-border shadow-sm">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground font-medium">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, filteredLabels.length)} of {filteredLabels.length} labels
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="min-h-[36px]"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="min-h-[36px] min-w-[36px]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="min-h-[36px]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Label Dialog */}
        <Dialog open={editId !== null} onOpenChange={(open) => { if (!open) { setEditId(null); setEditName('') } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Label</DialogTitle>
              <DialogDescription>Update the label name.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <UILabel htmlFor="editName">Name</UILabel>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditId(null); setEditName('') }}>Cancel</Button>
              <Button onClick={async () => {
                if (editId && editName.trim()) {
                  await handleUpdateLabel(editId, editName.trim());
                } else {
                  toast.error('Name is required');
                }
              }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Label</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                if (deletingId) {
                  await handleDeleteLabel(deletingId);
                }
              }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
