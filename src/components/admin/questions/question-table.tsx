'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import { AdminQuestion, UpdateQuestionRequest } from '@/types/api';
import { EditQuestionDialog } from './edit-question-dialog';
import { ViewQuestionDialog } from './view-question-dialog';
import { UpdateExplanationDialog } from './update-explanation-dialog';
import { UpdateQuestionImagesDialog } from './update-question-images-dialog';

interface QuestionTableProps {
  questions: AdminQuestion[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdateQuestion: (questionId: number, questionData: UpdateQuestionRequest) => Promise<AdminQuestion>;
  onDeleteQuestion: (questionId: number) => Promise<any>;
  onUpdateExplanation: (questionId: number, explanation: string, explanationImages?: File[]) => Promise<any>;
  onUpdateImages: (questionId: number, questionImages?: File[], explanationImages?: File[]) => Promise<any>;
}

export function QuestionTable({
  questions,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onUpdateQuestion,
  onDeleteQuestion,
  onUpdateExplanation,
  onUpdateImages,
}: QuestionTableProps) {
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<AdminQuestion | null>(null);
  const [updatingExplanation, setUpdatingExplanation] = useState<AdminQuestion | null>(null);
  const [updatingImages, setUpdatingImages] = useState<AdminQuestion | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<AdminQuestion | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const getQuestionTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'SINGLE_CHOICE':
        return 'default';
      case 'MULTIPLE_CHOICE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestion) return;

    try {
      setActionLoading(deleteQuestion.id);
      await onDeleteQuestion(deleteQuestion.id);
      setDeleteQuestion(null);
    } catch (error) {
      console.error('Failed to delete question:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateQuestion = async (questionData: UpdateQuestionRequest) => {
    if (!editingQuestion) return;

    try {
      setActionLoading(editingQuestion.id);
      await onUpdateQuestion(editingQuestion.id, questionData);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Failed to update question:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateExplanation = async (explanation: string, explanationImages?: File[]) => {
    if (!updatingExplanation) return;

    try {
      setActionLoading(updatingExplanation.id);
      await onUpdateExplanation(updatingExplanation.id, explanation, explanationImages);
      setUpdatingExplanation(null);
    } catch (error) {
      console.error('Failed to update explanation:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateImages = async (questionId: number, questionImages?: File[], explanationImages?: File[]) => {
    try {
      setActionLoading(questionId);
      await onUpdateImages(questionId, questionImages, explanationImages);
      setUpdatingImages(null);
    } catch (error) {
      console.error('Failed to update images:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading questions...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No questions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border data-table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[300px]">Question</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Course</TableHead>
              <TableHead className="hidden lg:table-cell">University</TableHead>
              <TableHead className="hidden sm:table-cell">Answers</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell className="min-w-[300px]">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {truncateText(question.questionText, 80)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {/* Mobile-visible info */}
                      <div className="sm:hidden flex items-center gap-2">
                        <Badge variant={getQuestionTypeBadgeVariant(question.questionType)} className="text-xs">
                          {question.questionType === 'SINGLE_CHOICE' ? 'Single' : 'Multiple'}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(question.isActive)} className="text-xs">
                          {question.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {/* Icons and metadata */}
                      <div className="flex items-center gap-3">
                        {question.explanation && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span className="hidden sm:inline">Has explanation</span>
                          </div>
                        )}
                        {question.questionImages && question.questionImages.length > 0 && (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              {question.questionImages.length} image{question.questionImages.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        <div className="sm:hidden text-xs">
                          {question.answers.length} answers
                        </div>
                      </div>
                      {/* Mobile course/university info */}
                      <div className="md:hidden text-xs">
                        {question.course?.name && (
                          <span>{question.course.name}</span>
                        )}
                        {question.university?.name && (
                          <span className="ml-2">• {question.university.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={getQuestionTypeBadgeVariant(question.questionType)}>
                    {question.questionType === 'SINGLE_CHOICE' ? 'Single' : 'Multiple'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm">
                    {question.course?.name || 'N/A'}
                  </div>
                  {question.course?.module && (
                    <div className="text-xs text-muted-foreground">
                      {question.course.module.name}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="text-sm">
                    {question.university?.name || 'N/A'}
                  </div>
                  {question.yearLevel && (
                    <div className="text-xs text-muted-foreground">
                      Year {question.yearLevel}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{question.answers.length}</span>
                    <div className="flex gap-1">
                      {question.answers.some(a => a.isCorrect) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={getStatusBadgeVariant(question.isActive)}>
                    {question.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="text-sm">
                    {new Date(question.createdAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={actionLoading === question.id}
                      >
                        {actionLoading === question.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setViewingQuestion(question)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingQuestion(question)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Question
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setUpdatingExplanation(question)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Update Explanation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setUpdatingImages(question)}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Update Images
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteQuestion(question)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Question
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Question Dialog */}
      {viewingQuestion && (
        <ViewQuestionDialog
          question={viewingQuestion}
          open={!!viewingQuestion}
          onOpenChange={(open) => !open && setViewingQuestion(null)}
        />
      )}

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <EditQuestionDialog
          question={editingQuestion}
          open={!!editingQuestion}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
          onUpdateQuestion={handleUpdateQuestion}
          loading={actionLoading === editingQuestion.id}
        />
      )}

      {/* Update Explanation Dialog */}
      {updatingExplanation && (
        <UpdateExplanationDialog
          question={updatingExplanation}
          open={!!updatingExplanation}
          onOpenChange={(open) => !open && setUpdatingExplanation(null)}
          onUpdateExplanation={handleUpdateExplanation}
          loading={actionLoading === updatingExplanation.id}
        />
      )}

      {/* Update Images Dialog */}
      {updatingImages && (
        <UpdateQuestionImagesDialog
          question={updatingImages}
          open={!!updatingImages}
          onOpenChange={(open) => !open && setUpdatingImages(null)}
          onUpdateImages={handleUpdateImages}
          loading={actionLoading === updatingImages.id}
        />
      )}

      {/* Delete Question Confirmation */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={(open) => !open && setDeleteQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
              <br />
              <br />
              <strong>Question:</strong> {deleteQuestion?.questionText.substring(0, 100)}...
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
