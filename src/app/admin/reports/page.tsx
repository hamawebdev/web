'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  AlertCircle,
  FileQuestion,
  Filter,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useQuestionReportsManagement } from '@/hooks/admin/use-question-reports-management';
import { AdminService } from '@/lib/api-services';
import { AdminQuestion, AdminQuestionReport, UpdateQuestionRequest } from '@/types/api';
import { toast } from 'sonner';
import { QuestionReportsTable } from '@/components/admin/question-reports/question-reports-table';
import { QuestionReportsFilters } from '@/components/admin/question-reports/question-reports-filters';
import { QuestionReportsStats } from '@/components/admin/question-reports/question-reports-stats';
import { ReviewReportDialog } from '@/components/admin/question-reports/review-report-dialog';
import { EditQuestionDialog } from '@/components/admin/questions/edit-question-dialog';

/**
 * Admin Question Reports Management Page
 *
 * Main page for managing question reports submitted by students,
 * with filtering, search, pagination, and review operations.
 */
export default function AdminQuestionReportsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [reviewingReport, setReviewingReport] = useState(null);
  const [updatingQuestion, setUpdatingQuestion] = useState<AdminQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  const {
    reports,
    totalReports,
    currentPage,
    totalPages,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    reviewReport,
    goToPage,
    hasReports,
    hasError,
    hasFilters,
    refresh,
    stats
  } = useQuestionReportsManagement();

  // Handle update question action
  const handleUpdateQuestion = async (report: AdminQuestionReport) => {
    if (!report.questionId) {
      toast.error('No question ID found for this report');
      return;
    }

    setLoadingQuestion(true);
    try {
      // Check if we already have question data in the report (more efficient)
      if (report.question && report.question.questionAnswers && report.question.questionAnswers.length > 0) {
        const normalizedQuestion: AdminQuestion = {
          ...report.question,
          // Map questionAnswers to answers field expected by AdminQuestion interface
          answers: report.question.questionAnswers,
          // Ensure required fields are present
          isActive: true, // Default value if not present
          // Ensure questionType matches AdminQuestion interface
          questionType: (report.question.questionType === 'TRUE_FALSE' || report.question.questionType === 'FILL_BLANK') 
            ? 'MULTIPLE_CHOICE' 
            : report.question.questionType as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE',
          // Ensure course structure matches AdminQuestion interface
          course: report.question.course ? {
            id: report.question.courseId,
            name: report.question.course.name,
          } : undefined,
        };

        setUpdatingQuestion(normalizedQuestion);
        setLoadingQuestion(false);
        return;
      }

      // Fallback: Fetch the full question data from API
      const response = await AdminService.getQuestion(report.questionId);
      if (response.success && response.data) {
        // Normalize the question data structure to ensure answers field exists
        const questionData = response.data as any;
        const normalizedQuestion: AdminQuestion = {
          ...response.data,
          // Handle both possible field names: questionAnswers (from reports) or answers (from direct API)
          answers: questionData.questionAnswers || questionData.answers || [],
          // Ensure required fields are present
          isActive: questionData.isActive !== undefined ? questionData.isActive : true,
          // Ensure questionType matches AdminQuestion interface
          questionType: (questionData.questionType === 'TRUE_FALSE' || questionData.questionType === 'FILL_BLANK') 
            ? 'MULTIPLE_CHOICE' 
            : questionData.questionType as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE',
        };

        // Validate that we have the required data
        if (!normalizedQuestion.answers || normalizedQuestion.answers.length === 0) {
          throw new Error('Question data is incomplete - no answers found. Please check the question in the Questions management page.');
        }

        setUpdatingQuestion(normalizedQuestion);
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : 'Failed to fetch question data';
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch question data';
      toast.error(errorMessage);
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Handle question update submission
  const handleQuestionUpdate = async (questionData: UpdateQuestionRequest) => {
    if (!updatingQuestion) return;

    try {
      const response = await AdminService.updateQuestion(updatingQuestion.id, questionData);
      if (response.success) {
        toast.success('Question updated successfully');
        setUpdatingQuestion(null);
        // Refresh the reports list to show updated question data
        refresh();
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : 'Failed to update question';
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update question';
      toast.error(errorMessage);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Reports Management</h1>
          <p className="text-muted-foreground">
            Review and respond to question reports submitted by students
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
              <Badge variant="secondary" className="ml-1">
                Active
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Failed to load question reports. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Question Reports Stats */}
      {stats && <QuestionReportsStats stats={stats} loading={loading} />}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter and search question reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionReportsFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
            />
          </CardContent>
        </Card>
      )}


      {/* Question Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Question Reports
            {hasFilters && (
              <Badge variant="outline" className="ml-2">
                Filtered
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {loading ? (
              'Loading question reports...'
            ) : hasReports ? (
              `Showing ${reports.length} of ${totalReports} reports (Page ${currentPage} of ${totalPages})`
            ) : (
              'No question reports found'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionReportsTable
            reports={reports}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            onReviewReport={(report) => setReviewingReport(report)}
            onUpdateQuestion={handleUpdateQuestion}
          />
        </CardContent>
      </Card>

      {/* Review Report Dialog */}
      {reviewingReport && (
        <ReviewReportDialog
          report={reviewingReport}
          open={!!reviewingReport}
          onOpenChange={(open) => !open && setReviewingReport(null)}
          onReviewReport={reviewReport}
        />
      )}

      {/* Update Question Dialog */}
      {updatingQuestion && (
        <EditQuestionDialog
          question={updatingQuestion}
          open={!!updatingQuestion}
          onOpenChange={(open) => !open && setUpdatingQuestion(null)}
          onUpdateQuestion={handleQuestionUpdate}
          loading={loadingQuestion}
        />
      )}
    </div>
  );
}
