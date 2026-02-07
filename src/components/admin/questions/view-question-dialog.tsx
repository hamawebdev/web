'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, CheckCircle, XCircle, FileText, Calendar, School, BookOpen } from 'lucide-react';
import { AdminQuestion } from '@/types/api';

interface ViewQuestionDialogProps {
  question: AdminQuestion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewQuestionDialog({
  question,
  open,
  onOpenChange,
}: ViewQuestionDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Question Details
          </DialogTitle>
          <DialogDescription>
            View complete question information, answers, and metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getQuestionTypeBadgeVariant(question.questionType)}>
                {question.questionType === 'SINGLE_CHOICE' ? 'Single Choice' : 'Multiple Choice'}
              </Badge>
              <Badge variant={getStatusBadgeVariant(question.isActive)}>
                {question.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">
                ID: {question.id}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Created: {new Date(question.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Updated: {new Date(question.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="space-y-2">
                {question.examYear && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Exam Year: {question.examYear}
                  </div>
                )}
                {question.yearLevel && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <School className="h-4 w-4" />
                    Year Level: {question.yearLevel}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Question Text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {question.questionText}
              </p>
            </CardContent>
          </Card>

          {/* Question Images */}
          {question.questionImages && question.questionImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Question Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {question.questionImages.map((image, index) => (
                    <div key={image.id} className="space-y-2">
                      <img
                        src={image.imagePath}
                        alt={image.altText || `Question image ${index + 1}`}
                        className="w-full h-auto rounded-lg border"
                      />
                      {image.altText && (
                        <p className="text-xs text-muted-foreground">{image.altText}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Answers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Answers</CardTitle>
              <CardDescription>
                {question.answers.filter(a => a.isCorrect).length} correct answer(s) out of {question.answers.length} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {question.answers.map((answer, index) => (
                  <div
                    key={answer.id || index}
                    className={`border rounded-lg p-4 ${
                      answer.isCorrect 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {answer.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Answer {index + 1}</span>
                          {answer.isCorrect && (
                            <Badge variant="default" className="text-xs">
                              Correct
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">
                          {answer.answerText}
                        </p>
                        {answer.explanation && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-muted-foreground">
                              <strong>Explanation:</strong> {answer.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question Explanation */}
          {question.explanation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Question Explanation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {question.explanation}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Course</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{question.course?.name || 'N/A'}</span>
                    </div>
                    {question.course?.module && (
                      <div className="text-xs text-muted-foreground ml-6">
                        Module: {question.course.module.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">University</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{question.university?.name || 'N/A'}</span>
                    </div>
                    {question.university?.country && (
                      <div className="text-xs text-muted-foreground ml-6">
                        {question.university.country}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {question.exam && (
                    <div>
                      <Label className="text-sm font-medium">Exam</Label>
                      <div className="text-sm mt-1">{question.exam.title}</div>
                    </div>
                  )}

                  {question._count && (
                    <div>
                      <Label className="text-sm font-medium">Statistics</Label>
                      <div className="text-sm mt-1 space-y-1">
                        {question._count.reports !== undefined && (
                          <div>Reports: {question._count.reports}</div>
                        )}
                        {question._count.sessions !== undefined && (
                          <div>Sessions: {question._count.sessions}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for labels
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`font-medium ${className}`}>
      {children}
    </div>
  );
}
