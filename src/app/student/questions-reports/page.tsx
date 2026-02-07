// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Calendar, AlertTriangle, Eye, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/loading-states'
import { useStudentAuth } from '@/hooks/use-auth'
import { useQuestionReports } from '@/hooks/use-question-reports'

function QuestionReportsContent() {
  const { isAuthenticated, loading: authLoading } = useStudentAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1)
  const [limit] = useState<number>(Number(searchParams.get('limit')) || 12)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'all')

  const { reports, pagination, loading } = useQuestionReports({ page, limit, status: status as any })

  useEffect(() => {
    // Update URL for shareability without triggering a navigation on status change
    const params = new URLSearchParams()
    if (page) params.set('page', String(page))
    if (limit) params.set('limit', String(limit))
    if (searchQuery) params.set('q', searchQuery)
    // intentionally NOT syncing status to avoid a page navigation feel
    const qs = params.toString()
    // Only call replace if actually changed to avoid churn
    if (typeof window !== 'undefined' && (`?${qs}`) !== window.location.search) {
      router.replace(`?${qs}`)
    }
  }, [page, limit, searchQuery, router])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch { return '' }
  }

  const list = useMemo(() => {
    const arr = Array.isArray(reports) ? reports : []
    const q = searchQuery.toLowerCase().trim()
    if (!q) return arr
    return arr.filter(r => r.description?.toLowerCase().includes(q) || r.question?.questionText?.toLowerCase().includes(q))
  }, [reports, searchQuery])

  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }
  const handleViewReport = (id: string | number) => router.push(`/student/questions-reports/${id}`)


  // Client-side filtering only by q; server-side filtering via hook params happens in hook call

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-warning flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                  Question Reports
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Reports submitted about questions during your sessions
                </p>
              </div>
            </div>
          </div>
        </div>

      {/* Reports Content */}
      {list.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No Reports Found"
          description={searchQuery || (status && status !== 'all')
            ? "No reports match your current filters. Try adjusting your search or filters."
            : "You haven't reported any issues yet. Use the report button in a session question."
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="pl-10 h-10 border-border focus:border-primary/50"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px] border-border min-h-[40px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1.5 font-medium">
                {list.length} report{list.length !== 1 ? 's' : ''} found
              </Badge>
            </div>
          </div>

          {/* Table Container */}
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
              <div className="col-span-2">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  ID
                </span>
              </div>
              <div className="col-span-4">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  QUESTION
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  TYPE
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  STATUS
                </span>
              </div>
              <div className="col-span-1 text-right">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  ACTION
                </span>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {list.map((report) => (
              <div key={report.id} className="hover:bg-muted/20 transition-colors">
                {/* Desktop Layout */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-4">
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-primary border-border rounded focus:ring-primary/20"
                    />
                  </div>
                  
                  {/* ID */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-medium text-foreground">
                      #{report.id}
                    </span>
                  </div>
                  
                  {/* Question */}
                  <div className="col-span-4 flex items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground truncate">
                        {report.question?.questionText || 'Question not available'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Type */}
                  <div className="col-span-2 flex items-center justify-center">
                    <Badge variant="outline" className="capitalize text-xs">
                      {(report.reportType || report.type || '').toString().toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-2 flex items-center justify-center">
                    <Badge 
                      variant={report.status === 'RESOLVED' ? 'default' : 
                              report.status === 'PENDING' ? 'secondary' : 
                              report.status === 'REJECTED' ? 'destructive' : 'outline'}
                      className="capitalize text-xs"
                    >
                      {report.status.toLowerCase()}
                    </Badge>
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewReport(report.id)}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:border-primary/30"
                    >
                      <Eye className="h-4 w-4" />
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
                        <h3 className="text-sm font-medium text-foreground">Report #{report.id}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.question?.questionText || 'Question not available'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize text-xs">
                        {(report.reportType || report.type || '').toString().toLowerCase().replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={report.status === 'RESOLVED' ? 'default' : 
                                report.status === 'PENDING' ? 'secondary' : 
                                report.status === 'REJECTED' ? 'destructive' : 'outline'}
                        className="capitalize text-xs"
                      >
                        {report.status.toLowerCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Mobile Actions */}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewReport(report.id)}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:border-primary/30"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Card className="mt-8 border-border shadow-sm">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground font-medium">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reports
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="min-h-[36px]"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
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
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  className="min-h-[36px]"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}

export default function QuestionReportsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionReportsContent />
    </Suspense>
  );
}
