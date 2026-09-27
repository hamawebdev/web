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
import { ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ResidencyQuestion } from '@/types/api';
import { ResidencyQuestionsService } from '@/lib/api-services';
import { ViewResidencyQuestionDialog } from './view-residency-question-dialog';
import { EditResidencyQuestionDialog } from './edit-residency-question-dialog';

interface ResidencyQuestionsTableProps {
  questions: ResidencyQuestion[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdateQuestion: (id: number, data: any) => Promise<any>;
  onDeleteQuestion: (id: number) => Promise<void>;
}

export function ResidencyQuestionsTable({
  questions,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onUpdateQuestion,
  onDeleteQuestion,
}: ResidencyQuestionsTableProps) {
  const [viewingQuestion, setViewingQuestion] = useState<ResidencyQuestion | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<ResidencyQuestion | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<ResidencyQuestion | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null);

  // GET /admin/residency-questions returns every row with empty questionAnswers and images,
  // so load the full question before opening View or Edit (otherwise the answers would
  // have to be re-typed from memory and would replace the stored answer key).
  const openWithDetails = async (
    row: ResidencyQuestion,
    open: (question: ResidencyQuestion) => void
  ) => {
    try {
      setLoadingDetailsId(row.id);
      const response = await ResidencyQuestionsService.getResidencyQuestion(row.id);
      const full: any = response?.data;
      if (!full || !Array.isArray(full.questionAnswers)) {
        throw new Error('Invalid residency question response');
      }
      open({
        ...row,
        part: full.part ?? row.part,
        examYear: full.examYear ?? row.examYear,
        universityId: full.universityId ?? row.universityId,
        metadata: full.metadata ?? row.metadata,
        university: full.university ?? row.university,
        question: {
          ...row.question,
          questionText: full.questionText ?? row.question.questionText,
          explanation: full.explanation ?? row.question.explanation,
          questionAnswers: full.questionAnswers,
          questionImages: full.questionImages ?? [],
          questionExplanationImages: full.questionExplanationImages ?? [],
        },
      });
    } catch (error) {
      console.error('Error loading residency question details:', error);
      toast.error('Error', {
        description: 'Failed to load the question details. Please try again.',
      });
    } finally {
      setLoadingDetailsId(null);
    }
  };

  const getPartLabel = (part: string) => {
    switch (part) {
      case 'Sciences fondamentales':
        return 'Sciences Fond.';
      case 'Dossier clinique':
        return 'Dossiers Clin.';
      case 'Pathologie medico-chirurgical':
        return 'Pathologies M/C';
      default:
        return part;
    }
  };

  const getPartColor = (part: string) => {
    switch (part) {
      case 'Sciences fondamentales':
        return 'bg-blue-100 text-blue-800';
      case 'Dossier clinique':
        return 'bg-green-100 text-green-800';
      case 'Pathologie medico-chirurgical':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestion) return;

    try {
      await onDeleteQuestion(deleteQuestion.id);
      setDeleteQuestion(null);
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading residency questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No residency questions found.</p>
        </div>
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
              <TableHead className="hidden sm:table-cell">Part</TableHead>
              <TableHead className="hidden md:table-cell">Year</TableHead>
              <TableHead className="hidden lg:table-cell">University</TableHead>
              <TableHead className="hidden sm:table-cell">Answers</TableHead>
              <TableHead className="hidden md:table-cell">Images</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>
                  <div className="max-w-md">
                    <p className="font-medium line-clamp-2">{question.question.questionText}</p>
                    {question.question.explanation && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {question.question.explanation}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={getPartColor(question.part)}>
                    {getPartLabel(question.part)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {question.examYear || '-'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {question.university?.name || '-'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{question.question.questionAnswers.length}</span>
                    <span className="text-xs text-muted-foreground">
                      ({question.question.questionAnswers.filter(a => a.isCorrect).length} correct)
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    {question.question.questionImages.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="h-3 w-3" />
                        <span>{question.question.questionImages.length}</span>
                      </div>
                    )}
                    {question.question.questionExplanationImages.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <ImageIcon className="h-3 w-3" />
                        <span>{question.question.questionExplanationImages.length}</span>
                      </div>
                    )}
                    {question.question.questionImages.length === 0 &&
                      question.question.questionExplanationImages.length === 0 && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={loadingDetailsId === question.id}
                      >
                        <span className="sr-only">Open menu</span>
                        {loadingDetailsId === question.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openWithDetails(question, setViewingQuestion)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openWithDetails(question, setEditingQuestion)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteQuestion(question)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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

      {/* View Dialog */}
      <ViewResidencyQuestionDialog
        question={viewingQuestion}
        open={!!viewingQuestion}
        onOpenChange={(open) => !open && setViewingQuestion(null)}
      />

      {/* Edit Dialog */}
      <EditResidencyQuestionDialog
        question={editingQuestion}
        open={!!editingQuestion}
        onOpenChange={(open) => !open && setEditingQuestion(null)}
        onSubmit={onUpdateQuestion}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={(open) => !open && setDeleteQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Residency Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this residency question? This action cannot be undone.
              All associated images will also be deleted.
              <br />
              <br />
              <strong>Question:</strong> {deleteQuestion?.question.questionText.substring(0, 100)}...
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

