// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/loading-states'
import { ArrowLeft, Calendar, FileText, BookOpen, Clock, Tags, BarChart3, Users, Target, Play, Loader2 } from 'lucide-react'
import { StudentService, QuizService } from '@/lib/api-services'
import { toast } from 'sonner'

export default function LabelDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [label, setLabel] = useState<any | null>(null)
  const [creatingSession, setCreatingSession] = useState(false)
  const [loadingSession, setLoadingSession] = useState(false)
  const [labelSessions, setLabelSessions] = useState<any[]>([])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await StudentService.getLabelDetails(id)
      const data = (res as any)?.data?.data || (res as any)?.data || res
      const labelData = Array.isArray(data) ? data[0] : data
      setLabel(labelData)

      // Load existing sessions for this label
      await loadLabelSessions()
    } catch (e: any) {
      setError(e?.message || 'Failed to load label details')
    } finally {
      setLoading(false)
    }
  }

  // REMOVED: Legacy label sessions loading
  // Labels now only support creating new sessions, not retrieving existing ones
  const loadLabelSessions = async () => {
    // No longer supported - labels are for creating new sessions only
    setLabelSessions([])
  }

  // Load an existing session using GET /quiz-sessions/{sessionId}
  const handleLoadSession = async (sessionId: number) => {
    try {
      setLoadingSession(true)

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
      setLoadingSession(false)
    }
  }

  useEffect(() => { if (!isNaN(id)) load() }, [id])

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

  // Create new practice session from label
  const handleStartPractice = async () => {
    if (!label?.questionIds || label.questionIds.length === 0) {
      toast.error('No questions available in this label')
      return
    }

    try {
      setCreatingSession(true)

      // Step 1: Create practice session by label
      console.log('🚀 Creating practice session for label:', id)
      const createResponse = await QuizService.createLabelSession(id)

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
      setCreatingSession(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground">Loading label details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !label) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Label Not Found</h3>
              <p className="text-muted-foreground mb-4">{error || 'The requested label could not be found.'}</p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={() => router.back()} className="min-h-[44px]">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
                <Button onClick={() => router.push('/student/labels')} className="min-h-[44px]">
                  View All Labels
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const stats = label.statistics || {}
  const questions = label.questions || []
  const questionIds = label.questionIds || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="min-h-[44px]">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Tags className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {label.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(label.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Existing Sessions - REMOVED: No longer supported */}

          {/* Start New Practice Session Button */}
          <Button
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white min-h-[44px]"
            onClick={handleStartPractice}
            disabled={!label?.questionIds || label.questionIds.length === 0 || creatingSession}
          >
            {creatingSession ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Session...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Practice Session ({label?.questionIds?.length || 0} questions)
              </>
            )}
          </Button>
        </div>

        {/* Statistics Overview */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription>Summary of questions and content associated with this label</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Questions</div>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.questionsCount ?? questionIds.length ?? 0}</div>
              </div>
              <div className="p-4 rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Total Items</div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalItems ?? 0}</div>
              </div>
              <div className="p-4 rounded-xl border bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Sessions</div>
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.quizSessionsCount ?? 0}</div>
              </div>
              <div className="p-4 rounded-xl border bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/50 dark:border-orange-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Quizzes</div>
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.quizzesCount ?? 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Associated Questions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Associated Questions
              {questions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {questions.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Questions tagged with this label</CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
                <p className="text-muted-foreground mb-2">No questions associated with this label yet.</p>
                <p className="text-sm text-muted-foreground">
                  Questions will appear here when you add them to this label during practice or exam sessions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question: any, index: number) => (
                  <Card key={question.id} className="border-border/30 hover:border-primary/20 transition-all duration-200 hover:shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Question #{question.id}
                              </Badge>
                            </div>
                            <div className="font-medium text-sm leading-relaxed mb-3">
                              {question.questionText}
                            </div>
                          </div>
                        </div>

                        {question.course && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="secondary" className="text-xs">
                                {question.course.module?.name || 'Module'}
                              </Badge>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">{question.course.name}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Added {new Date(question.createdAt).toLocaleDateString()}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            View Question
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

