'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  AlertCircle,
  Plus,
  Search,
  FileQuestion
} from 'lucide-react';
import { useQuestionSourcesManagement } from '@/hooks/admin/use-question-sources-management';
import { QuestionSourcesTable } from '@/components/admin/question-sources/question-sources-table';
import { CreateQuestionSourceDialog } from '@/components/admin/question-sources/create-question-source-dialog';
import { EditQuestionSourceDialog } from '@/components/admin/question-sources/edit-question-source-dialog';
import { QuestionSource } from '@/types/api';

/**
 * Admin Question Sources Management Page
 *
 * Main page for managing question sources with CRUD operations,
 * search functionality, pagination, and proper error handling.
 */
export default function AdminQuestionSourcesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingQuestionSource, setEditingQuestionSource] = useState<QuestionSource | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    questionSources,
    totalQuestionSources,
    currentPage,
    totalPages,
    loading,
    error,
    filters,
    updateFilters,
    createQuestionSource,
    updateQuestionSource,
    deleteQuestionSource,
    goToPage,
    refreshQuestionSources,
    hasQuestionSources,
    hasError,
  } = useQuestionSourcesManagement();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateFilters({ search: value, page: 1 });
  };

  const handleCreateQuestionSource = async (data: any) => {
    await createQuestionSource(data);
    setShowCreateDialog(false);
  };

  const handleEditQuestionSource = (questionSource: QuestionSource) => {
    setEditingQuestionSource(questionSource);
  };

  const handleUpdateQuestionSource = async (id: number, data: any) => {
    await updateQuestionSource(id, data);
    setEditingQuestionSource(null);
  };

  const handleDeleteQuestionSource = async (id: number) => {
    await deleteQuestionSource(id);
  };

  const handleRefresh = () => {
    refreshQuestionSources();
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Sources</h1>
          <p className="text-muted-foreground">
            Manage question sources to categorize questions in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question Source
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5" />
                Question Sources
              </CardTitle>
              <CardDescription>
                {totalQuestionSources > 0 
                  ? `${totalQuestionSources} question source${totalQuestionSources === 1 ? '' : 's'} total`
                  : 'No question sources found'
                }
              </CardDescription>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search question sources..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <QuestionSourcesTable
            questionSources={questionSources}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalQuestionSources={totalQuestionSources}
            onEdit={handleEditQuestionSource}
            onDelete={handleDeleteQuestionSource}
            onPageChange={goToPage}
          />
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateQuestionSourceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateQuestionSource={handleCreateQuestionSource}
      />

      {/* Edit Dialog */}
      <EditQuestionSourceDialog
        open={!!editingQuestionSource}
        onOpenChange={(open) => !open && setEditingQuestionSource(null)}
        questionSource={editingQuestionSource}
        onUpdateQuestionSource={handleUpdateQuestionSource}
      />
    </div>
  );
}
