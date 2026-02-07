'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  FileText,
  Calendar,
  BookOpen,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { BulkFileUpload } from './bulk-file-upload';
import { useQuestionSources } from '@/hooks/admin/use-question-sources';
import { 
  BulkImportFile, 
  BulkImportMetadata, 
  SelectionState, 
  BulkImportComponentProps,
  BulkImportResponse
} from '@/types/question-import';
import {
  validateAllFiles,
  areAllFilesValid,
  getValidationSummary
} from '@/utils/bulk-import-validation';
import { UniversityService } from '@/lib/api-services';
import { toast } from 'sonner';

export function BulkImportWizard({ selection, onImportComplete, onCancel }: BulkImportComponentProps) {
  const [files, setFiles] = useState<BulkImportFile[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);

  // Use question sources hook
  const {
    questionSources,
    loading: sourcesLoading,
    error: sourcesError
  } = useQuestionSources();

  // Validate files when they change
  useEffect(() => {
    if (files.length > 0 && files.some(f => f.status === 'pending')) {
      setIsValidating(true);
      validateAllFiles(files).then(validatedFiles => {
        setFiles(validatedFiles);
        setIsValidating(false);
      });
    }
  }, [files]);

  // Handle file changes
  const handleFilesChange = useCallback((newFiles: BulkImportFile[]) => {
    setFiles(newFiles);
  }, []);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!areAllFilesValid(files)) {
      toast.error('Please fix all validation errors before importing');
      return;
    }

    // Check that all files have required metadata
    const filesWithoutYear = files.filter(f => !f.examYear);
    const filesWithoutSource = files.filter(f => !f.sourceId);

    if (filesWithoutYear.length > 0) {
      toast.error(`${filesWithoutYear.length} file(s) missing exam year. Please set them before importing.`);
      return;
    }

    if (filesWithoutSource.length > 0) {
      toast.error(`${filesWithoutSource.length} file(s) missing question source. Please set them before importing.`);
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setCompletedFiles(0);

    const results: BulkImportResponse[] = [];
    const totalFiles = files.length;

    try {
      // Import each file separately
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Update file status to uploading
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'uploading' } : f
        ));

        try {
          // Prepare request payload with per-file metadata
          const payload = {
            metadata: {
              courseId: selection.course!.id,
              universityId: selection.university?.id,
              examYear: file.examYear!,
              sourceId: file.sourceId!,
              rotation: file.rotation
            },
            questions: file.parsedQuestions!
          };

          // Make API call using the existing API service
          const result = await UniversityService.bulkImportQuestions(payload);

          // Check if the API call was successful
          if (result.success) {
            // Update file status to success
            setFiles(prev => prev.map(f =>
              f.id === file.id ? { ...f, status: 'success' } : f
            ));

            results.push({
              fileId: file.id,
              success: true,
              data: result.data
            });
          } else {
            throw new Error('API returned unsuccessful response');
          }

        } catch (error) {
          // Update file status to error
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Import failed'
            } : f
          ));

          results.push({
            fileId: file.id,
            success: false,
            error: error instanceof Error ? error.message : 'Import failed'
          });
        }

        // Update progress
        const completed = i + 1;
        setCompletedFiles(completed);
        setImportProgress((completed / totalFiles) * 100);
      }

      // Show detailed results
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      const totalQuestions = results
        .filter(r => r.success && r.data)
        .reduce((sum, r) => sum + (r.data?.totalCreated || 0), 0);

      if (successCount > 0) {
        toast.success(
          `Successfully imported ${successCount} file(s) with ${totalQuestions} questions`,
          { duration: 5000 }
        );
      }
      if (errorCount > 0) {
        const errorFiles = results
          .filter(r => !r.success)
          .map(r => files.find(f => f.id === r.fileId)?.filename)
          .filter(Boolean)
          .join(', ');

        toast.error(
          `Failed to import ${errorCount} file(s): ${errorFiles}`,
          { duration: 8000 }
        );
      }

      // Call completion callback
      if (onImportComplete) {
        onImportComplete(results);
      }

    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error('Bulk import failed');
    } finally {
      setIsImporting(false);
    }
  }, [files, selection, onImportComplete]);

  // Get validation summary
  const validationSummary = getValidationSummary(files);
  const allFilesHaveMetadata = files.every(f => f.examYear && f.sourceId);
  const canImport = areAllFilesValid(files) && allFilesHaveMetadata && !isImporting && !isValidating;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Import Questions</h2>
          <p className="text-muted-foreground">
            Import multiple JSON files with automatic detection of exam year, source, and rotation from filenames
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Import Context</CardTitle>
          <CardDescription>
            Questions will be imported with the following context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">University:</span>
                <Badge variant="secondary">{selection.university?.name}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Study Pack:</span>
                <Badge variant="secondary">{selection.studyPack?.name}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Course:</span>
                <Badge variant="secondary">{selection.course?.name}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload with Auto-Detection */}
      <Card>
        <CardHeader>
          <CardTitle>Upload & Configure Files</CardTitle>
          <CardDescription>
            Upload JSON files. Exam year, rotation, and source will be auto-detected from filenames and can be edited per file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkFileUpload
            files={files}
            onFilesChange={handleFilesChange}
            disabled={isImporting}
            questionSources={questionSources}
            sourcesLoading={sourcesLoading}
          />

          {sourcesError && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Error loading question sources: {sourcesError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{validationSummary.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{validationSummary.validFiles}</div>
                <div className="text-sm text-muted-foreground">Valid Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{validationSummary.invalidFiles}</div>
                <div className="text-sm text-muted-foreground">Invalid Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{validationSummary.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </div>
            </div>

            {/* Warnings for missing metadata */}
            {(validationSummary.filesWithoutYear > 0 || files.some(f => !f.sourceId)) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationSummary.filesWithoutYear > 0 && (
                      <p>• {validationSummary.filesWithoutYear} file(s) missing exam year</p>
                    )}
                    {files.filter(f => !f.sourceId).length > 0 && (
                      <p>• {files.filter(f => !f.sourceId).length} file(s) missing question source</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {validationSummary.invalidFiles > 0 && (
              <Alert className="mt-2">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationSummary.invalidFiles} file(s) have validation errors. Fix or remove them before importing.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      {isImporting && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing files...</span>
                <span>{completedFiles} / {files.length}</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleImport}
          disabled={!canImport}
          size="lg"
          className="min-w-[200px]"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Start Import ({validationSummary.validFiles} files)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
