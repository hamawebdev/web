// @ts-nocheck
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/loading-states'
import { useStudentAuth } from '@/hooks/use-auth'
import { useReportDetails } from '@/hooks/use-question-reports'
import { Badge } from '@/components/ui/badge'

export default function ReportDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const reportId = Array.isArray(id) ? Number(id[0]) : Number(id)

  const { isAuthenticated, loading: authLoading } = useStudentAuth()
  const { report, loading, error, refresh } = useReportDetails(Number.isFinite(reportId) ? reportId : null)

  useEffect(() => {
    if (!Number.isFinite(reportId)) {
      router.replace('/student/questions-reports')
    }
  }, [reportId, router])

  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Report not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error || 'We could not load this report.'}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => router.back()} className="min-h-[44px]">Go Back</Button>
                <Button onClick={() => refresh && refresh()} className="min-h-[44px]">Retry</Button>
              </div>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Report Details</h2>
          <p className="text-muted-foreground">Report #{report.id}</p>
        </div>
        <Badge variant="outline" className="capitalize">{report.status?.toLowerCase?.()}</Badge>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{report.question?.questionText || `Question #${report.questionId}`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Report Type</div>
            <div className="capitalize">{(report.reportType || '').toLowerCase?.()}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Description</div>
            <div>{report.description}</div>
          </div>

          {report.adminResponse && (
            <div>
              <div className="text-sm text-muted-foreground">Admin Response</div>
              <div>{report.adminResponse}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>Created: {new Date(report.createdAt).toLocaleString()}</div>
            {report.updatedAt && <div>Updated: {new Date(report.updatedAt).toLocaleString()}</div>}
            {report.resolvedAt && <div>Resolved: {new Date(report.resolvedAt).toLocaleString()}</div>}
          </div>

          {report.reviewedBy && (
            <div className="text-sm">Reviewed by: <span className="font-medium">{report.reviewedBy.fullName}</span></div>
          )}

          <div className="pt-2">
            <Button variant="default" onClick={() => router.back()}>Back to list</Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

