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
  Filter,
  GraduationCap,
  FileQuestion,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { useResidencyManagement } from '@/hooks/admin/use-residency-management';
import { ResidencyQuestionsTable } from '@/components/admin/residency/residency-questions-table';
import { ResidencyQuestionsFilters } from '@/components/admin/residency/residency-questions-filters';
import { CreateResidencyQuestionDialog } from '@/components/admin/residency/create-residency-question-dialog';
import { BulkImportResidencyDialog } from '@/components/admin/residency/bulk-import-residency-dialog';

/**
 * Admin Residency Questions Management Page
 *
 * Main page for managing residency questions with filtering,
 * search, pagination, and CRUD operations.
 */
export default function AdminResidencyPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const {
    questions,
    totalQuestions,
    currentPage,
    totalPages,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    goToPage,
    hasQuestions,
    hasError,
    hasFilters,
    refreshQuestions,
  } = useResidencyManagement();

  // Calculate stats
  const totalAnswers = questions.reduce((sum, q) => sum + q.question.questionAnswers.length, 0);
  const totalImages = questions.reduce(
    (sum, q) => sum + q.question.questionImages.length + q.question.questionExplanationImages.length,
    0
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Residency Questions</h2>
          <p className="text-muted-foreground">
            Manage residency exam questions with images and explanations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
            {hasFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshQuestions}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import JSON
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Question
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {questions.length} on current page
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Answers</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnswers}</div>
            <p className="text-xs text-muted-foreground">
              Current page
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImages}</div>
            <p className="text-xs text-muted-foreground">
              Current page
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter residency questions by part, university, or exam year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResidencyQuestionsFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
            />
          </CardContent>
        </Card>
      )}

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Residency Questions
            {hasFilters && (
              <Badge variant="outline" className="ml-2">
                Filtered
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {loading ? (
              'Loading residency questions...'
            ) : hasQuestions ? (
              `Showing ${questions.length} of ${totalQuestions} questions (Page ${currentPage} of ${totalPages})`
            ) : hasFilters ? (
              'No residency questions found matching the current filters'
            ) : (
              'No residency questions found in the system'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && !hasQuestions && hasFilters ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No questions found for these filters</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filter criteria or clear all filters to see all residency questions.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <ResidencyQuestionsTable
              questions={questions}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              onUpdateQuestion={updateQuestion}
              onDeleteQuestion={deleteQuestion}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Question Dialog */}
      <CreateResidencyQuestionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={createQuestion}
      />

      {/* Bulk Import Dialog */}
      <BulkImportResidencyDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={refreshQuestions}
      />
    </div>
  );
}

