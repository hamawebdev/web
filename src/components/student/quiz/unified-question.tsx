// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle,
  Circle,
  Check,
  X,
  Lightbulb,
  Edit3,
  FileText,
  Stethoscope,
  User,
  Calendar,
  MapPin,
  Send,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafeMarkdown } from '@/components/ui/safe-markdown';
import { toPlainText } from '@/lib/question-localization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useQuiz } from './quiz-api-context';
import { QuizQuestion } from './quiz-context';
import { QuestionActions } from './question-actions';
import { QuestionMetadata } from './question-metadata';
import { ImageGallery } from './image-gallery';
import { EnglishUnavailableBadge } from './question-language-toggle';
import { choiceIsCorrect } from '@/lib/session-answers';

// Stable component overrides for SafeMarkdown (kept outside render so memoization holds)
const QUESTION_TEXT_COMPONENTS = {
  p: ({ node: _node, className, ...props }) => <p {...props} className={cn('mb-1 last:mb-0', className)} />,
};
const QROC_ANSWER_COMPONENTS = {
  p: ({ node: _node, className, ...props }) => <span {...props} className={cn('block', className)} />,
};

interface Props {
  question: QuizQuestion;
  type?: 'QCM' | 'QCS' | 'QROC' | 'CAS';
  onOpenAIChat?: () => void;
  onEditNote?: () => void;
}

interface ClinicalInfo {
  patientAge?: number;
  patientGender?: string;
  chiefComplaint?: string;
  history?: string;
  examination?: string;
  investigations?: string;
  diagnosis?: string;
  location?: string;
  date?: string;
}

interface ClinicalCase extends QuizQuestion {
  clinicalInfo?: ClinicalInfo;
}

export function UnifiedQuestion({ question, type, onOpenAIChat, onEditNote }: Props) {
  const { state, submitAnswer, updateAnswer, revealAnswer, clearAnswer } = useQuiz();
  const { session, isAnswerRevealed } = state;

  // Calculate question number (1-based index)
  const questionNumber = (session.currentQuestionIndex ?? 0) + 1;

  // Auto-detect type from question if not provided
  const questionType = type || question.type || 'QCS';
  const isMultipleChoice = questionType === 'QCM';
  const isTextQuestion = questionType === 'QROC';
  const isClinicalCase = questionType === 'CAS';

  // Unified state for all question types
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<string>>(new Set());

  // Load elimination state from sessionStorage on component mount
  useEffect(() => {
    const storageKey = `eliminated_options_${question.id}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEliminatedOptions(new Set(parsed));
      } catch (error) {
        console.warn('Failed to parse eliminated options from storage:', error);
      }
    }
  }, [question.id]);

  // Save elimination state to sessionStorage whenever it changes
  useEffect(() => {
    const storageKey = `eliminated_options_${question.id}`;
    sessionStorage.setItem(storageKey, JSON.stringify(Array.from(eliminatedOptions)));
  }, [eliminatedOptions, question.id]);

  const userAnswer = (state.localAnswers?.[Number(question.id)]) || session.userAnswers[String(question.id)];

  // Memoize arrays to prevent infinite re-renders
  const existingAnswer = useMemo(() =>
    userAnswer?.selectedOptions || [],
    [userAnswer?.selectedOptions]
  );

  const existingTextAnswer = useMemo(() =>
    userAnswer?.textAnswer || '',
    [userAnswer?.textAnswer]
  );

  // Initialize state based on question type and existing answers
  useEffect(() => {
    if (isTextQuestion) {
      if (existingTextAnswer) {
        setTextAnswer(prev => prev !== existingTextAnswer ? existingTextAnswer : prev);
        setHasSubmitted(prev => prev !== true ? true : prev);
      } else {
        setTextAnswer(prev => prev !== '' ? '' : prev);
        setHasSubmitted(prev => prev !== false ? false : prev);
      }
    } else {
      if (existingAnswer.length > 0) {
        setSelectedOptions(prev =>
          JSON.stringify(prev) !== JSON.stringify(existingAnswer) ? existingAnswer : prev
        );
        setHasSubmitted(prev => prev !== true ? true : prev);
      } else {
        setSelectedOptions(prev => prev.length !== 0 ? [] : prev);
        setHasSubmitted(prev => prev !== false ? false : prev);
      }
    }
    setEditMode(prev => prev !== false ? false : prev);
  }, [question.id, existingAnswer, existingTextAnswer, isTextQuestion]);

  // Memoize the current radio value to prevent unnecessary re-renders
  const currentRadioValue = useMemo(() =>
    selectedOptions[0] || '',
    [selectedOptions]
  );

  // Handle option selection for multiple choice questions
  const handleOptionToggle = useCallback((optionId: string) => {
    if (isMultipleChoice) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  }, [isMultipleChoice]);

  // Handle keyboard shortcuts for answer selection
  const handleKeyboardSelection = useCallback((key: string) => {
    if (hasSubmitted || isAnswerRevealed) return;

    const keyUpper = key.toUpperCase();
    const optionIndex = keyUpper.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.

    if (optionIndex >= 0 && optionIndex < (question.options?.length || 0)) {
      const option = question.options?.[optionIndex];
      if (option) {
        handleOptionToggle(option.id);
      }
    }
  }, [hasSubmitted, isAnswerRevealed, question.options, handleOptionToggle]);

  // Handle text answer submission for QROC questions
  const handleTextSubmit = useCallback(async () => {
    if (!textAnswer.trim() || isSubmitting || hasSubmitted) return;
    if (session.status === 'completed' || session.status === 'COMPLETED') {
      console.warn('Cannot submit answer: Quiz session is completed');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      // Validate text answer
      const trimmedAnswer = textAnswer.trim();
      if (trimmedAnswer.length === 0) {
        throw new Error('Answer cannot be empty');
      }

      if (trimmedAnswer.length > 1000) {
        throw new Error('Answer is too long (maximum 1000 characters)');
      }

      const isCorrect = checkAnswerCorrectness(trimmedAnswer, question.correctAnswers || []);
      await submitAnswer({
        textAnswer: trimmedAnswer,
        isCorrect,
      });
      setHasSubmitted(true);
      // Reveal immediately to match Enter/button behavior
      revealAnswer();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer';
      console.error('Text answer submission error:', error);
      setSubmissionError(errorMessage);
      // Don't set hasSubmitted to true on error, allow retry
    } finally {
      setIsSubmitting(false);
    }
  }, [textAnswer, isSubmitting, hasSubmitted, session.status, question.correctAnswers, submitAnswer, revealAnswer]);

  // Simple keyword matching for QROC scoring
  const checkAnswerCorrectness = useCallback((userText: string, correctAnswers: string[]): boolean => {
    const userTextLower = userText.toLowerCase().trim();
    return correctAnswers.some(correctAnswer => {
      const keywords = correctAnswer.toLowerCase().split(/[\s,;]+/);
      const matchedKeywords = keywords.filter(keyword =>
        keyword.length > 2 && userTextLower.includes(keyword)
      );
      return matchedKeywords.length >= Math.ceil(keywords.length * 0.6);
    });
  }, []);

  // Handle choice submission for multiple choice questions
  const handleChoiceSubmit = useCallback(async () => {
    if (selectedOptions.length === 0 || isSubmitting || hasSubmitted) return;
    if (session.status === 'completed' || session.status === 'COMPLETED') {
      console.warn('Cannot submit answer: Quiz session is completed');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      // Validate that we have valid options selected
      if (!question.options || question.options.length === 0) {
        throw new Error('No answer options available for this question');
      }

      // Normalize IDs to strings for reliable comparison
      const selectedIds = selectedOptions.map(String);

      // Validate that selected options exist in the question
      const validSelectedIds = selectedIds.filter(id =>
        question.options?.some(opt => String(opt.id) === id)
      );

      if (validSelectedIds.length === 0) {
        throw new Error('Selected options are not valid for this question');
      }

      // Same verdict as the backend: by answer id, exact set for multiple choice
      const isCorrect = choiceIsCorrect(question.options, validSelectedIds, isMultipleChoice);

      await submitAnswer({
        selectedOptions: validSelectedIds,
        isCorrect,
      });
      setHasSubmitted(true);
      // Reveal immediately to match Enter/button behavior
      revealAnswer();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer';
      console.error('Answer submission error:', error);
      setSubmissionError(errorMessage);
      // Don't set hasSubmitted to true on error, allow retry
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOptions, isSubmitting, hasSubmitted, session.status, question.options, isMultipleChoice, submitAnswer, revealAnswer]);

  const handleReset = useCallback(() => {
    if (isTextQuestion) {
      setTextAnswer('');
    } else {
      setSelectedOptions([]);
    }
    setHasSubmitted(false);

    // Clear the answer from the global state as well
    clearAnswer(question.id);
  }, [isTextQuestion, question.id, clearAnswer]);

  const handleOptionElimination = useCallback((optionId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setEliminatedOptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else {
        newSet.add(optionId);
      }
      return newSet;
    });
  }, []);

  // Add keyboard event listener for answer selection
  useEffect(() => {
    // Check if device has a physical keyboard (not mobile/touch device)
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts on mobile devices to avoid conflicts
      if (isMobileDevice) {
        return;
      }

      // Don't handle shortcuts if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Don't handle shortcuts if any modal/dialog is open
      if (document.querySelector('[role="dialog"]') || document.querySelector('.modal-open')) {
        return;
      }

      const key = event.key.toLowerCase();

      // Handle A, B, C, D, etc. for answer selection
      if (key >= 'a' && key <= 'z' && !isTextQuestion) {
        event.preventDefault();
        event.stopPropagation(); // Prevent global keyboard handler from also firing
        handleKeyboardSelection(key);
      }

      // Handle Enter for submit
      if (key === 'enter' && !isTextQuestion) {
        event.preventDefault();
        event.stopPropagation(); // Prevent global keyboard handler from also firing

        // Debug logging for Enter key behavior validation
        console.log('🔍 Enter key pressed:', {
          hasSubmitted,
          isSubmitting,
          selectedOptionsCount: selectedOptions.length,
          isAnswerRevealed,
          questionId: question.id
        });

        if (!hasSubmitted && !isSubmitting && selectedOptions.length > 0) {
          console.log('✅ Enter key triggering answer submission');
          handleChoiceSubmit();
        } else if (hasSubmitted && !isAnswerRevealed) {
          console.log('✅ Enter key triggering answer reveal');
          revealAnswer();
        } else {
          console.log('⚠️ Enter key ignored - conditions not met');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyboardSelection, hasSubmitted, isSubmitting, selectedOptions, isAnswerRevealed, isTextQuestion, handleChoiceSubmit, revealAnswer]);

  const getOptionStatus = useCallback((option: any) => {
    if (!isAnswerRevealed) return 'default';

    const isSelected = selectedOptions.includes(option.id);
    const isCorrect = option.isCorrect;

    if (isSelected && isCorrect) return 'correct-selected';
    if (!isSelected && isCorrect) return 'correct-unselected';
    if (isSelected && !isCorrect) return 'incorrect-selected';
    return 'default';
  }, [isAnswerRevealed, selectedOptions]);

  const getOptionStyles = useCallback((status: string) => {
    switch (status) {
      case 'correct-selected':
        return 'border-success bg-success';
      case 'correct-unselected':
        return 'border-success bg-success';
      case 'incorrect-selected':
        return 'border-destructive bg-destructive';
      default:
        return 'border-border bg-card';
    }
  }, []);

  const getOptionTextColors = useCallback((status: string, isSelected: boolean, isAnswerRevealed: boolean) => {
    // When answer is revealed, use white text for solid backgrounds
    if (isAnswerRevealed) {
      switch (status) {
        case 'correct-selected':
        case 'correct-unselected':
        case 'incorrect-selected':
          return 'text-white';
        default:
          return 'text-foreground';
      }
    }

    // When not revealed, use existing logic
    return isSelected ? "text-primary-foreground" : "text-foreground group-hover:text-foreground";
  }, []);

  const getOptionPrefixColors = useCallback((status: string, isSelected: boolean, isAnswerRevealed: boolean) => {
    // When answer is revealed, use white text for solid backgrounds
    if (isAnswerRevealed) {
      switch (status) {
        case 'correct-selected':
        case 'correct-unselected':
        case 'incorrect-selected':
          return 'border-white text-white';
        default:
          return 'border-muted-foreground text-muted-foreground group-hover:border-foreground group-hover:text-foreground';
      }
    }

    // When not revealed, use existing logic
    return isSelected ? "border-primary-foreground text-primary-foreground" : "border-muted-foreground text-muted-foreground group-hover:border-foreground group-hover:text-foreground";
  }, []);

  const correctCount = question.options?.filter(opt => opt.isCorrect).length || 0;
  const optionCount = question.options?.length || 0;

  // Dynamic sizing based on option count and content length - More aggressive for all cases
  // (length of the visible text: imported questions can carry HTML/Markdown markup)
  const contentLength = useMemo(() => toPlainText(question.content).length, [question.content]);
  const isCompactMode = optionCount >= 3 || contentLength > 100;
  const isUltraCompactMode = optionCount > 4 || contentLength > 200;
  const containerClass = isUltraCompactMode ? 'quiz-ultra-compact-mode' : isCompactMode ? 'quiz-compact-mode' : 'quiz-compact-mode';

  // Calculate dynamic spacing based on option count - Minimal space between question and answers
  const getSpacing = useMemo(() => {
    if (optionCount > 4) return 'space-y-0';
    if (optionCount >= 3) return 'space-y-0';
    return 'space-y-0';
  }, [optionCount]);

  // Get card padding and gap overrides to reduce vertical spacing - More aggressive
  const getCardSpacing = useMemo(() => {
    if (optionCount > 4) return 'py-0.5 gap-0.5';
    if (optionCount >= 3) return 'py-0.5 gap-0.5';
    return 'py-0.5 gap-0.5';
  }, [optionCount]);

  // Clinical case specific rendering
  const renderClinicalInfo = () => {
    if (!isClinicalCase) return null;

    const clinicalCase = question as ClinicalCase;
    const clinicalInfo = clinicalCase.clinicalInfo;

    if (!clinicalInfo) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg mb-4">
          <p className="text-red-600">
            ⚠️ Clinical case information not available from API. Please contact support.
          </p>
        </div>
      );
    }

    return (
      <Card className="mb-4 border-info/20 bg-gradient-to-br from-info/5 to-info/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-info">
            <Stethoscope className="h-5 w-5" />
            Clinical Case
          </CardTitle>
          <CardDescription className="text-info/80">
            Review the clinical information before answering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patient Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clinicalInfo.patientAge && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-info" />
                <span className="text-sm">
                  <strong>Age:</strong> {clinicalInfo.patientAge} years
                </span>
              </div>
            )}
            {clinicalInfo.patientGender && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-info" />
                <span className="text-sm">
                  <strong>Gender:</strong> {clinicalInfo.patientGender}
                </span>
              </div>
            )}
            {clinicalInfo.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-info" />
                <span className="text-sm">
                  <strong>Location:</strong> {clinicalInfo.location}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Clinical Information */}
          <div className="space-y-3">
            {clinicalInfo.chiefComplaint && (
              <div>
                <h4 className="font-semibold text-info mb-1">Chief Complaint</h4>
                <p className="text-sm text-foreground/80">{clinicalInfo.chiefComplaint}</p>
              </div>
            )}
            {clinicalInfo.history && (
              <div>
                <h4 className="font-semibold text-info mb-1">History</h4>
                <p className="text-sm text-foreground/80">{clinicalInfo.history}</p>
              </div>
            )}
            {clinicalInfo.examination && (
              <div>
                <h4 className="font-semibold text-info mb-1">Physical Examination</h4>
                <p className="text-sm text-foreground/80">{clinicalInfo.examination}</p>
              </div>
            )}
            {clinicalInfo.investigations && (
              <div>
                <h4 className="font-semibold text-info mb-1">Investigations</h4>
                <p className="text-sm text-foreground/80">{clinicalInfo.investigations}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn(
      "h-full flex flex-col quiz-space-optimized",
      getSpacing,
      containerClass
    )}>
      {/* Clinical Case Information (if applicable) */}
      {renderClinicalInfo()}

      {/* Question Content - Dynamically sized */}
      <Card className="border-primary/20 bg-gradient-to-br from-card via-primary/3 to-accent/5 transition-all duration-200 flex-shrink-0">
        <CardContent className={cn(
          "quiz-question-container",
          isUltraCompactMode ? "px-1 py-0" : isCompactMode ? "px-1 py-0" : "px-1.5 py-0.5"
        )}>
          <div className={cn(
            isUltraCompactMode ? "space-y-1" : isCompactMode ? "space-y-1.5" : "space-y-2"
          )}>
            <div className="flex items-center gap-0.5 mb-0">
              <div className="w-0.5 h-0.5 rounded-full bg-primary"></div>
              <h3 className="text-sm font-semibold text-question-gradient uppercase tracking-wide">Question {questionNumber}</h3>
              <div className="ml-auto"><QuestionActions onOpenAIChat={onOpenAIChat} onEditNote={onEditNote} /></div>
            </div>

            {/* Question Metadata */}
            <QuestionMetadata question={question} className={cn(
              isUltraCompactMode ? "mb-1.5" : isCompactMode ? "mb-2" : "mb-2.5"
            )} />

            {/* Question Images - Enhanced Display */}
            {(Array.isArray(question.questionImages) && question.questionImages.length > 0) && (
              <div className={cn(
                isUltraCompactMode ? "mb-1" : isCompactMode ? "mb-2" : "mb-3"
              )}>
                <ImageGallery
                  images={question.questionImages}
                  title="Question Images"
                  maxHeight={isUltraCompactMode ? "max-h-32" : isCompactMode ? "max-h-40" : "max-h-64"}
                  gridCols="auto"
                  showZoom={true}
                  compact={isUltraCompactMode || isCompactMode}
                  className="quiz-question-images"
                />
              </div>
            )}


            {/* Optional hint/comment images (legacy support) */}
            {(Array.isArray((question as any).commentImages) && (question as any).commentImages.length > 0) && (
              <div className={cn(
                isUltraCompactMode ? "mb-1" : isCompactMode ? "mb-2" : "mb-3"
              )}>
                <ImageGallery
                  images={(question as any).commentImages}
                  title="Hint Images"
                  maxHeight={isUltraCompactMode ? "max-h-32" : isCompactMode ? "max-h-40" : "max-h-64"}
                  gridCols="auto"
                  showZoom={true}
                  compact={isUltraCompactMode || isCompactMode}
                  className="quiz-hint-images"
                />
              </div>
            )}

            {/* Shown when English was asked for but this question has no translation */}
            {question.requestedLanguage === 'en' && !question.hasEnglish && (
              <div>
                <EnglishUnavailableBadge />
              </div>
            )}

            {/* Question Text - Responsive sizing */}
            <div className="prose prose-sm sm:prose-base max-w-none">
              <div className={cn(
                "font-bold text-foreground mb-0 quiz-question-text break-words",
                isUltraCompactMode ? "leading-tight text-sm" : isCompactMode ? "leading-snug text-base" : "leading-snug text-base lg:text-lg"
              )}>
                <SafeMarkdown components={QUESTION_TEXT_COMPONENTS}>{question.content}</SafeMarkdown>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer Section - Dynamic based on question type */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isTextQuestion ? (
          // QROC: Show Answer button first, then reveal answer with self-assessment
          <div className="h-full flex flex-col space-y-3">
            {/* In review mode or if already answered, show answer directly */}
            {(session.status === 'completed' || session.status === 'COMPLETED' || hasSubmitted) ? (
              // Answer Revealed - Show answer (review mode or already submitted)
              <Card className="flex-1 border-success/20 bg-gradient-to-br from-success/5 to-success/10 dark:border-success/30 dark:from-success/10 dark:to-success/20">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <h3 className="text-sm font-semibold text-success uppercase tracking-wide">Answer</h3>
                  </div>
                  <div className="text-lg font-medium text-success flex-1">
                    {question.options?.find(o => o.isCorrect)?.text ? (
                      <SafeMarkdown components={QROC_ANSWER_COMPONENTS}>{question.options?.find(o => o.isCorrect)?.text}</SafeMarkdown>
                    ) : question.correctAnswers?.[0] ? (
                      <SafeMarkdown components={QROC_ANSWER_COMPONENTS}>{question.correctAnswers?.[0]}</SafeMarkdown>
                    ) : question.explanation ? (
                      <div className="prose prose-sm max-w-none text-success prose-p:text-success prose-strong:text-success prose-headings:text-success">
                        <SafeMarkdown components={QROC_ANSWER_COMPONENTS}>{question.explanation}</SafeMarkdown>
                      </div>
                    ) : (
                      'Answer not available'
                    )}
                  </div>

                  {/* Show user's self-assessment result */}
                  {hasSubmitted && userAnswer?.isCorrect !== undefined && (
                    <div className="mt-4 pt-4 border-t border-success/20">
                      <div className={cn(
                        "flex items-center justify-center gap-2 text-sm font-medium",
                        userAnswer.isCorrect ? "text-success" : "text-destructive"
                      )}>
                        {userAnswer.isCorrect ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Marked as Correct</span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4" />
                            <span>Marked as Incorrect</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : !isAnswerRevealed ? (
              // Show Answer Button
              <div className="flex-1 flex items-center justify-center">
                <Button
                  variant="default"
                  size="lg"
                  onClick={revealAnswer}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 px-8 py-4 text-lg"
                >
                  <Lightbulb className="h-5 w-5" />
                  Show Answer
                </Button>
              </div>
            ) : (
              // Answer Revealed - Show answer with self-assessment buttons
              <Card className="flex-1 border-success/20 bg-gradient-to-br from-success/5 to-success/10 dark:border-success/30 dark:from-success/10 dark:to-success/20">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <h3 className="text-sm font-semibold text-success uppercase tracking-wide">Answer</h3>
                  </div>
                  <div className="text-lg font-medium text-success flex-1">
                    {question.options?.find(o => o.isCorrect)?.text ? (
                      <SafeMarkdown components={QROC_ANSWER_COMPONENTS}>{question.options?.find(o => o.isCorrect)?.text}</SafeMarkdown>
                    ) : question.correctAnswers?.[0] ? (
                      <SafeMarkdown components={QROC_ANSWER_COMPONENTS}>{question.correctAnswers?.[0]}</SafeMarkdown>
                    ) : question.explanation ? (
                      <div className="prose prose-sm max-w-none text-success prose-p:text-success prose-strong:text-success prose-headings:text-success">
                        <SafeMarkdown components={QROC_ANSWER_COMPONENTS}>{question.explanation}</SafeMarkdown>
                      </div>
                    ) : (
                      'Answer not available'
                    )}
                  </div>

                  {/* Self-Assessment Buttons */}
                  <div className="mt-4 pt-4 border-t border-success/20">
                    <p className="text-sm text-success mb-3 text-center font-medium">
                      Did you get this correct?
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={async () => {
                          setIsSubmitting(true);
                          try {
                            await submitAnswer({
                              textAnswer: 'self-assessed-correct',
                              isCorrect: true,
                            });
                            setHasSubmitted(true);
                          } catch (error) {
                            console.error('Failed to submit self-assessment:', error);
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        disabled={isSubmitting}
                        className="gap-2 border-success/50 text-success hover:bg-success/5 font-semibold px-6 py-3 min-w-[120px]"
                      >
                        <Check className="h-5 w-5" />
                        Correct
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={async () => {
                          setIsSubmitting(true);
                          try {
                            await submitAnswer({
                              textAnswer: 'self-assessed-incorrect',
                              isCorrect: false,
                            });
                            setHasSubmitted(true);
                          } catch (error) {
                            console.error('Failed to submit self-assessment:', error);
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        disabled={isSubmitting}
                        className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/5 font-semibold px-6 py-3 min-w-[120px]"
                      >
                        <X className="h-5 w-5" />
                        Incorrect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Multiple Choice Questions (QCM/QCS/CAS)
          isMultipleChoice ? (
            // QCM: Multiple choice without RadioGroup wrapper
            <div className={`${getSpacing} flex flex-col h-full`}>
              {question.options?.map((option, index) => {
                const status = getOptionStatus(option);
                const isSelected = selectedOptions.includes(option.id);
                const isDisabled = !editMode && (hasSubmitted || session.status === 'completed' || session.status === 'COMPLETED');
                const alphabetPrefix = String.fromCharCode(65 + index);

                return (
                  <Card
                    key={option.id}
                    className={cn(
                      "group cursor-pointer transition-all duration-200 ease-out border-2 flex-shrink-0 rounded-lg quiz-option-card",
                      // Override default Card py-6 gap-6 with reduced spacing
                      getCardSpacing,
                      getOptionStyles(status),
                      isSelected && !isAnswerRevealed && "ring-2 ring-primary/50 border-primary/40 bg-primary",
                      !isSelected && !isAnswerRevealed && "hover:border-primary/30 hover:bg-primary/5",
                      isDisabled && "cursor-not-allowed opacity-75",
                      eliminatedOptions.has(option.id) && "bg-gray-200 dark:bg-gray-700"
                    )}
                    onClick={() => !isDisabled && handleOptionToggle(option.id)}
                  >
                    <CardContent className={cn(
                      "quiz-option-card",
                      isUltraCompactMode ? "p-0.5 sm:p-1" : isCompactMode ? "p-1 sm:p-1" : "p-1 sm:p-1.5"
                    )}>
                      <div className={`flex items-start ${isUltraCompactMode ? 'gap-1 sm:gap-1.5' : 'gap-1.5 sm:gap-2'}`}>
                        {/* Alphabetical prefix */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={cn(
                            "quiz-option-prefix rounded-md border-2 flex items-center justify-center transition-all duration-200 font-bold",
                            isUltraCompactMode
                              ? "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-xs"
                              : isCompactMode
                                ? "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-xs sm:text-sm"
                                : "w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-sm sm:text-base lg:text-lg",
                            getOptionPrefixColors(status, isSelected, isAnswerRevealed)
                          )}>
                            {alphabetPrefix}
                          </div>
                        </div>

                        {/* Answer Text */}
                        <div className="flex-1 min-w-0 mt-0.5">
                          <div className={cn(
                            "font-semibold transition-colors duration-200 break-words hyphens-auto quiz-option-text",
                            isUltraCompactMode
                              ? "text-xs sm:text-sm lg:text-base leading-tight"
                              : isCompactMode
                                ? "text-sm sm:text-base lg:text-lg leading-snug"
                                : "text-base sm:text-lg lg:text-xl leading-relaxed",
                            getOptionTextColors(status, isSelected, isAnswerRevealed),
                            eliminatedOptions.has(option.id) && "line-through opacity-60"
                          )}>
                            <SafeMarkdown inline>{option.text}</SafeMarkdown>
                          </div>
                        </div>

                        {/* Trash Icon Button */}
                        <div className="flex-shrink-0 mt-0.5">
                          <button
                            onClick={(e) => handleOptionElimination(option.id, e)}
                            className={cn(
                              "p-1 rounded-md transition-all duration-200 hover:bg-muted/50 flex items-center justify-center",
                              eliminatedOptions.has(option.id)
                                ? "text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            title={eliminatedOptions.has(option.id) ? "Restore option" : "Eliminate option"}
                          >
                            <Trash2 className={cn(
                              "transition-all duration-200",
                              isUltraCompactMode
                                ? "w-3 h-3 sm:w-4 sm:h-4"
                                : isCompactMode
                                  ? "w-4 h-4 sm:w-5 sm:h-5"
                                  : "w-5 h-5 sm:w-6 sm:h-6"
                            )} />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // QCS: Single choice with RadioGroup wrapper
            <RadioGroup
              value={currentRadioValue}
              onValueChange={(value) => handleOptionToggle(value)}
              disabled={!editMode && (hasSubmitted || session.status === 'completed' || session.status === 'COMPLETED')}
              className="h-full"
            >
              <div className={`${getSpacing} flex flex-col h-full`}>
                {question.options?.map((option, index) => {
                  const status = getOptionStatus(option);
                  const isSelected = selectedOptions.includes(option.id);
                  const isDisabled = !editMode && (hasSubmitted || session.status === 'completed' || session.status === 'COMPLETED');
                  const alphabetPrefix = String.fromCharCode(65 + index);

                  return (
                    <Card
                      key={option.id}
                      className={cn(
                        "group cursor-pointer transition-all duration-200 ease-out border-2 flex-shrink-0 rounded-lg quiz-option-card",
                        // Override default Card py-6 gap-6 with reduced spacing
                        getCardSpacing,
                        getOptionStyles(status),
                        isSelected && !isAnswerRevealed && "ring-2 ring-primary/50 border-primary/40 bg-primary",
                        !isSelected && !isAnswerRevealed && "hover:border-primary/30 hover:bg-primary/5",
                        isDisabled && "cursor-not-allowed opacity-75",
                        eliminatedOptions.has(option.id) && "bg-gray-200 dark:bg-gray-700"
                      )}
                      onClick={() => !isDisabled && handleOptionToggle(option.id)}
                    >
                      <CardContent className={cn(
                        "quiz-option-card",
                        isUltraCompactMode ? "p-0.5 sm:p-1" : isCompactMode ? "p-1 sm:p-1" : "p-1 sm:p-1.5"
                      )}>
                        <div className={`flex items-start ${isUltraCompactMode ? 'gap-1 sm:gap-1.5' : 'gap-1.5 sm:gap-2'}`}>
                          {/* Alphabetical prefix - Round for QCS */}
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={cn(
                              "quiz-option-prefix rounded-full border-2 flex items-center justify-center transition-all duration-200 font-bold",
                              isUltraCompactMode
                                ? "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-xs"
                                : isCompactMode
                                  ? "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-xs sm:text-sm"
                                  : "w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-sm sm:text-base lg:text-lg",
                              getOptionPrefixColors(status, isSelected, isAnswerRevealed)
                            )}>
                              {alphabetPrefix}
                            </div>
                          </div>

                          {/* Answer Text */}
                          <div className="flex-1 min-w-0 mt-0.5">
                            <div className={cn(
                              "font-semibold transition-colors duration-200 break-words hyphens-auto quiz-option-text",
                              isUltraCompactMode
                                ? "text-xs sm:text-sm lg:text-base leading-tight"
                                : isCompactMode
                                  ? "text-sm sm:text-base lg:text-lg leading-snug"
                                  : "text-base sm:text-lg lg:text-xl leading-relaxed",
                              getOptionTextColors(status, isSelected, isAnswerRevealed),
                              eliminatedOptions.has(option.id) && "line-through opacity-60"
                            )}>
                              <SafeMarkdown inline>{option.text}</SafeMarkdown>
                            </div>
                          </div>

                          {/* Trash Icon Button */}
                          <div className="flex-shrink-0 mt-0.5">
                            <button
                              onClick={(e) => handleOptionElimination(option.id, e)}
                              className={cn(
                                "p-1 rounded-md transition-all duration-200 hover:bg-muted/50 flex items-center justify-center",
                                eliminatedOptions.has(option.id)
                                  ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              title={eliminatedOptions.has(option.id) ? "Restore option" : "Eliminate option"}
                            >
                              <Trash2 className={cn(
                                "transition-all duration-200",
                                isUltraCompactMode
                                  ? "w-3 h-3 sm:w-4 sm:h-4"
                                  : isCompactMode
                                    ? "w-4 h-4 sm:w-5 sm:h-5"
                                    : "w-5 h-5 sm:w-6 sm:h-6"
                              )} />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </RadioGroup>
          )
        )}
      </div>

      {/* Action Buttons - Hidden for QROC since answer is shown directly */}
      {!isTextQuestion && (
        <div className={`flex-shrink-0 ${isUltraCompactMode ? 'pt-1' : 'pt-2'} border-t border-border/20`}>
          <div className="flex items-center justify-between gap-2">
            {/* Left side - Selection count for multiple choice */}
            {isMultipleChoice ? (
              <div className={`${isUltraCompactMode ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                {selectedOptions.length} selected
              </div>
            ) : null}

            {/* Center - Submit Button (when answer selected but not submitted) or Show Explanation Button (when submitted) */}
            <div className="flex-1 flex justify-center">
              {!hasSubmitted && selectedOptions.length > 0 && !isTextQuestion && (
                <Button
                  variant="default"
                  size={isUltraCompactMode ? "sm" : "default"}
                  onClick={handleChoiceSubmit}
                  disabled={isSubmitting}
                  className={`gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation ${isUltraCompactMode ? 'px-3 py-1 text-sm min-h-[36px]' : 'px-4 py-2 text-base min-h-[44px]'
                    }`}
                >
                  <Send className={`${isUltraCompactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              )}

              {!hasSubmitted && textAnswer.trim() && isTextQuestion && (
                <Button
                  variant="default"
                  size={isUltraCompactMode ? "sm" : "default"}
                  onClick={handleTextSubmit}
                  disabled={isSubmitting}
                  className={`gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation ${isUltraCompactMode ? 'px-3 py-1 text-sm min-h-[36px]' : 'px-4 py-2 text-base min-h-[44px]'
                    }`}
                >
                  <Send className={`${isUltraCompactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              )}

              {hasSubmitted && !isAnswerRevealed && (
                <Button
                  variant="outline"
                  size={isUltraCompactMode ? "sm" : "default"}
                  onClick={revealAnswer}
                  className={`gap-1 text-primary border-primary/20 hover:bg-primary/10 font-semibold shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation ${isUltraCompactMode ? 'px-3 py-1 text-sm min-h-[36px]' : 'px-4 py-2 text-base min-h-[44px]'
                    }`}
                >
                  <Lightbulb className={`${isUltraCompactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  Show Explanation
                </Button>
              )}
            </div>

            {/* Right side - Edit/Reset buttons */}
            <div className="flex gap-1">
              {false && hasSubmitted && !isAnswerRevealed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <X className="h-3 w-3" />
                  Reset
                </Button>
              )}

              {false && hasSubmitted && !editMode && !isAnswerRevealed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="gap-1 text-primary border-primary/20 hover:bg-primary/10"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Error Display and Retry */}
          {submissionError && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium">Submission Failed</p>
                  <p className="text-sm text-destructive/80 mt-1">{submissionError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmissionError(null);
                      if (isTextQuestion) {
                        handleTextSubmit();
                      } else {
                        handleChoiceSubmit();
                      }
                    }}
                    disabled={isSubmitting}
                    className="mt-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    {isSubmitting ? 'Retrying...' : 'Retry Submission'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
