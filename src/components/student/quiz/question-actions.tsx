// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  MessageSquare,
  Star,
  Flag,
  AlertTriangle,
  BookOpen,
  Check
} from 'lucide-react';
import { PenNewSquare, DangerCircle, Bookmark } from '@solar-icons/react';
import { Button } from '@/components/ui/button';
import { MarkdownNoteEditor } from '@/components/ui/markdown-editor';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label as UILabel } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toPlainText } from '@/lib/question-localization';
import { useQuiz } from './quiz-api-context';
import { QuestionReportDialog } from '@/components/student/session-analysis/question-report-dialog';
import { useLabels } from '@/hooks/use-student-organization';
import { toast } from 'sonner';

interface QuestionActionsProps {
  onEditNote?: () => void;
}

export function QuestionActions({ onEditNote }: QuestionActionsProps) {
  const { state, revealAnswer, toggleExplanation, bookmarkQuestion, addNote, flagQuestion } = useQuiz();
  const { session, currentQuestion, isAnswerRevealed, showExplanation } = state;

  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const { labels, refresh: refreshLabels } = useLabels();

  const [questionNotes, setQuestionNotes] = useState<Array<{ id: number; noteText: string; createdAt?: string }>>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Fetch notes for current question
  useEffect(() => {
    let cancelled = false;
    const fetchNotes = async () => {
      if (!currentQuestion?.id) return;
      try {
        setLoadingNotes(true);
        const { StudentService } = await import('@/lib/api-services');
        const res = await StudentService.getQuestionNotes(Number(currentQuestion.id));
        // The endpoint replies with the raw notes array (the service wraps it as { success, data })
        const notesArr = (Array.isArray(res) ? res : (res?.data?.data?.notes || res?.data?.notes || res?.data || [])) as any[];
        if (!cancelled) setQuestionNotes(Array.isArray(notesArr) ? notesArr : []);
      } catch (e) {
        if (!cancelled) setQuestionNotes([]);
      } finally {
        if (!cancelled) setLoadingNotes(false);
      }
    };
    fetchNotes();
    return () => { cancelled = true; };
  }, [currentQuestion?.id]);

  if (!currentQuestion) {
    return null;
  }

  const questionId = currentQuestion.id;
  const userAnswer = session?.userAnswers?.[questionId];
  const isBookmarked = userAnswer?.isBookmarked || false;
  const flags = userAnswer?.flags || [];
  const existingNote = userAnswer?.notes || '';

  // NOTE: handling note saving is now done in InlineNoteEditor
  // We just keep the triggering logic here


  return (
    <div className="space-y-3">
      {/* Primary Actions */}
      <div className="flex items-center gap-1">
        {/* Add Note */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditNote || (() => { })}
          className={cn(
            "gap-1",
            existingNote && "text-blue-600"
          )}
        >
          <PenNewSquare className="h-5 w-5" />
          <span className="hidden sm:inline">Note</span>
        </Button>



        {/* Report Question */}
        <QuestionReportDialog
          questionId={parseInt(currentQuestion.id)}
          questionText={toPlainText(currentQuestion.title || currentQuestion.content || currentQuestion.questionText) || `Question ${currentQuestion.id}`}
          questionType={currentQuestion.type}
          onReportSubmitted={() => flagQuestion(currentQuestion.id, 'report_error')}
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1",
              flags.includes('report_error') && "text-orange-600"
            )}
          >
            <DangerCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Report</span>
          </Button>
        </QuestionReportDialog>

        {/* Add Question to Label */}
        <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Label</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Question to Label</DialogTitle>
              <DialogDescription>Select a label to associate with this question</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Your labels</div>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-auto">
                {(labels || []).map(l => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLabelId(l.id)}
                    className={cn(
                      'text-left px-3 py-2 rounded-md border hover:bg-muted',
                      selectedLabelId === l.id && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="font-medium text-sm">{l.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.statistics?.questionsCount || 0} questions
                      {l.statistics?.totalItems !== undefined && l.statistics.totalItems !== l.statistics?.questionsCount &&
                        ` • ${l.statistics.totalItems} total items`
                      }
                    </div>
                  </button>
                ))}
                {(labels || []).length === 0 && (
                  <div className="text-sm text-muted-foreground">No labels yet. Create one on the Labels page.</div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLabelDialog(false)}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  const questionId = currentQuestion?.id;
                  if (!questionId || !selectedLabelId) {
                    toast.error('Please select a label');
                    return;
                  }
                  const { StudentService } = await import('@/lib/api-services');
                  const res = await StudentService.addQuestionToLabel(Number(questionId), Number(selectedLabelId));
                  if (res?.success !== false && !res?.error) {
                    toast.success(res?.message || 'Question added to label successfully');
                    await refreshLabels();
                    setShowLabelDialog(false);
                    setSelectedLabelId(null);
                  } else {
                    throw new Error(res?.error || 'Failed to add question to label');
                  }
                } catch (e) {
                  console.error(e);
                  toast.error('Could not add the question to label');
                }
              }}>Add Question</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notes for this question (supports multiple) */}
      {questionNotes.length > 0 && (
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="pt-4 space-y-3">
            {questionNotes.map((n) => (
              <div key={n.id} className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{n.noteText}</p>
                  {n.createdAt && (
                    <div className="text-[11px] text-blue-700/80 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Flags Display */}
      {flags.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Marqueurs :</span>
          {flags.includes('report_error') && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              <span>Erreur signalée</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
