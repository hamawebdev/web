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
import { Eye, CheckCircle, XCircle, FileText, Calendar, School, BookOpen, Image as ImageIcon } from 'lucide-react';
import { ResidencyQuestion } from '@/types/api';
import { resolveApiAssetUrl } from '@/lib/image-loader';

interface ViewResidencyQuestionDialogProps {
  question: ResidencyQuestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewResidencyQuestionDialog({
  question,
  onOpenChange,
  open,
}: ViewResidencyQuestionDialogProps) {
  if (!question) return null;

  const getPartLabel = (part: string) => {
    switch (part) {
      case 'E_Sciences_Fondamentales':
        return 'Sciences Fondamentales';
      case 'E_Dossiers_Cliniques':
        return 'Dossiers Cliniques';
      case 'E_Pathologies_M_C':
        return 'Pathologies M/C';
      default:
        return part;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Residency Question Details
          </DialogTitle>
          <DialogDescription>
            View complete residency question information, answers, and images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Question Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Part</div>
                  <Badge variant="outline">{getPartLabel(question.part)}</Badge>
                </div>
                {question.examYear && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Exam Year</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{question.examYear}</span>
                    </div>
                  </div>
                )}
                {question.university && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">University</div>
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span>{question.university.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Question
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{question.question.questionText}</p>
            </CardContent>
          </Card>

          {/* Question Images */}
          {question.question.questionImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Question Images ({question.question.questionImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {question.question.questionImages.map((image, index) => (
                    <div key={image.id} className="border rounded-lg overflow-hidden">
                      <img
                        src={resolveApiAssetUrl(image.imagePath)}
                        alt={image.altText || `Question image ${index + 1}`}
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Answers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Answers ({question.question.questionAnswers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {question.question.questionAnswers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    {answer.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{answer.answerText}</p>
                      {answer.isCorrect && (
                        <Badge variant="default" className="mt-2 bg-green-600">
                          Correct Answer
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Explanation */}
          {question.question.explanation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {question.question.explanation}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Explanation Images */}
          {question.question.questionExplanationImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Explanation Images ({question.question.questionExplanationImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {question.question.questionExplanationImages.map((image, index) => (
                    <div key={image.id} className="border rounded-lg overflow-hidden">
                      <img
                        src={resolveApiAssetUrl(image.imagePath)}
                        alt={image.altText || `Explanation image ${index + 1}`}
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {question.metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                  {question.metadata}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

