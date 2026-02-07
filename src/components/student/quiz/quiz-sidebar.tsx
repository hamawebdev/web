// @ts-nocheck
'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Circle,
  Clock,
  Star,
  Flag,
  AlertTriangle,
  Filter,
  Search,
  BookOpen,
  Target,
  X,
  Check,
  XIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useQuiz } from './quiz-api-context';

type FilterType = 'all' | 'answered' | 'unanswered' | 'bookmarked' | 'flagged';

export function QuizSidebar() {
  const { state, goToQuestion, toggleSidebar } = useQuiz();
  const { session, currentQuestion } = state;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const getQuestionStatus = (questionId: string | number) => {
    const id = Number(questionId);
    // Prefer most up-to-date local answer; fallback to persisted session answer
    const userAnswer = state.localAnswers?.[id] || session.userAnswers?.[String(id)];

    if (!userAnswer) return 'unanswered';

    // Check if answer was submitted (has selectedOptions, selectedAnswerIds, or selectedAnswerId) or if session is completed
    const hasUserInteraction = !!(
      (Array.isArray(userAnswer.selectedOptions) && userAnswer.selectedOptions.length > 0) ||
      (Array.isArray(userAnswer.selectedAnswerIds) && userAnswer.selectedAnswerIds.length > 0) ||
      (userAnswer.selectedAnswerId !== undefined && userAnswer.selectedAnswerId !== null) ||
      (typeof userAnswer.textAnswer === 'string' && userAnswer.textAnswer.trim().length > 0) ||
      session.status === 'COMPLETED' ||
      session.status === 'completed'
    );

    if (!hasUserInteraction) return 'unanswered';

    // If we have the isCorrect field directly, use it (set at submission time)
    if (typeof userAnswer.isCorrect === 'boolean') {
      return userAnswer.isCorrect ? 'correct' : 'incorrect';
    }

    // Find the question to determine correctness
    const question = session.questions.find(q => String(q.id) === String(id));
    if (!question) return 'answered'; // Fallback if question not found

    // Normalize selected answer IDs as trimmed strings
    let selectedAnswerIds: string[] = [];
    if (Array.isArray(userAnswer.selectedOptions) && userAnswer.selectedOptions.length) {
      selectedAnswerIds = userAnswer.selectedOptions.map((v: any) => String(v).trim());
    } else if (Array.isArray(userAnswer.selectedAnswerIds) && userAnswer.selectedAnswerIds.length) {
      selectedAnswerIds = userAnswer.selectedAnswerIds.map((v: any) => String(v).trim());
    } else if (userAnswer.selectedAnswerId !== undefined && userAnswer.selectedAnswerId !== null) {
      selectedAnswerIds = [String(userAnswer.selectedAnswerId).trim()];
    }

    // Handle text answers (QROC questions) - check correctness if possible
    if ((typeof userAnswer.textAnswer === 'string' && userAnswer.textAnswer.trim().length > 0) && selectedAnswerIds.length === 0) {
      const correctAnswers = question.correctAnswers || [];
      if (correctAnswers.length === 0) {
        // No reference data available, treat as answered-neutral
        return 'answered';
      }

      // Simple keyword matching for text answers (same logic as unified-question.tsx)
      const userText = userAnswer.textAnswer.toLowerCase().trim();
      const isCorrect = correctAnswers.some(correctAnswer => {
        const keywords = correctAnswer.toLowerCase().split(/[\s,;]+/);
        const matchedKeywords = keywords.filter(keyword =>
          keyword.length > 2 && userText.includes(keyword)
        );
        return matchedKeywords.length >= Math.ceil(keywords.length * 0.6);
      });
      return isCorrect ? 'correct' : 'incorrect';
    }

    // Build the array of answer options from the question, preferring documented fields
    const rawOptions = (question as any).questionAnswers || (question as any).answers || (question as any).options || [];

    // Extract correct IDs with robust field support (handle boolean/number/string forms)
    const toBool = (v: any) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v === 1;
      if (typeof v === 'string') {
        const s = v.toLowerCase().trim();
        return s === 'true' || s === '1' || s === 'yes' || s === 'y';
      }
      return false;
    };

    const correctIds = rawOptions
      .filter((opt: any) => opt && (toBool(opt.isCorrect) || toBool(opt.correct) || toBool(opt.isRightAnswer) || toBool(opt.isCorrectAnswer)))
      .map((opt: any) => String(opt.id).trim());

    if (correctIds.length > 0 && selectedAnswerIds.length > 0) {
      // For multiple choice: exact set match required
      const selectedSet = new Set(selectedAnswerIds);
      const correctSet = new Set(correctIds);
      const isCorrect = selectedSet.size === correctSet.size && [...selectedSet].every(id => correctSet.has(id));
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        // Debug aid to verify why a question is marked red/green
        console.debug('[Sidebar] Computed status', { questionId: id, selectedAnswerIds, correctIds, isCorrect });
      }
      return isCorrect ? 'correct' : 'incorrect';
    }

    // If we can't determine correctness, mark as answered (neutral), not incorrect
    return 'answered';
  };

  const isQuestionBookmarked = (questionId: string | number) => {
    const id = Number(questionId);
    // Use localAnswers from API context instead of session.userAnswers
    const userAnswer = state.localAnswers?.[id] || session.userAnswers?.[String(id)];
    return userAnswer?.isBookmarked || false;
  };

  const isQuestionFlagged = (questionId: string | number) => {
    const id = Number(questionId);
    // Use localAnswers from API context instead of session.userAnswers
    const userAnswer = state.localAnswers?.[id] || session.userAnswers?.[String(id)];
    const flags = userAnswer?.flags || [];
    return flags.length > 0;
  };

  const getQuestionFlags = (questionId: string | number) => {
    const id = Number(questionId);
    // Use localAnswers from API context instead of session.userAnswers
    const userAnswer = state.localAnswers?.[id] || session.userAnswers?.[String(id)];
    return userAnswer?.flags || [];
  };

  const filteredQuestions = session.questions.filter((question, index) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const questionTitle = question.title || question.questionText || '';
      const questionContent = question.content || question.questionText || '';
      const questionTags = question.tags || [];

      const matchesSearch =
        questionTitle.toLowerCase().includes(searchLower) ||
        questionContent.toLowerCase().includes(searchLower) ||
        questionTags.some(tag => tag.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // Status filter
    const questionStatus = getQuestionStatus(question.id);
    switch (filterType) {
      case 'answered':
        return ['answered', 'correct', 'incorrect'].includes(questionStatus);
      case 'unanswered':
        return questionStatus === 'unanswered';
      case 'bookmarked':
        return isQuestionBookmarked(question.id);
      case 'flagged':
        return isQuestionFlagged(question.id);
      default:
        return true;
    }
  });

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'QCM':
        return '☑️';
      case 'QCS':
        return '⚪';
      case 'QROC':
        return '✏️';
      case 'CAS':
        return '🏥';
      default:
        return '❓';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-primary/10 text-primary-foreground border-primary/20';
      case 'intermediate':
        return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'advanced':
        return 'bg-destructive/10 text-destructive-foreground border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  // Calculate counts using all questions, not just userAnswers keys
  const correctCount = session.questions.filter(
    question => {
      const status = getQuestionStatus(question.id);
      return status === 'correct';
    }
  ).length;

  const incorrectCount = session.questions.filter(
    question => {
      const status = getQuestionStatus(question.id);
      return status === 'incorrect';
    }
  ).length;

  const answeredCount = session.questions.filter(
    question => {
      const status = getQuestionStatus(question.id);
      return ['answered', 'correct', 'incorrect'].includes(status);
    }
  ).length;

  const unansweredCount = session.questions.filter(
    question => {
      const status = getQuestionStatus(question.id);
      return status === 'unanswered';
    }
  ).length;

  const bookmarkedCount = session.questions.filter(
    question => isQuestionBookmarked(question.id)
  ).length;

  const flaggedCount = session.questions.filter(
    question => isQuestionFlagged(question.id)
  ).length;

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden sm:bg-card/30 md:bg-card/50 lg:bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 xl:p-8 border-b bg-card sm:bg-card/50 md:bg-card/50 lg:bg-card/50">
        <div className="space-y-3 sm:space-y-4 lg:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-primary" />
              </div>
              <h2 className="font-bold text-sm sm:text-base lg:text-lg xl:text-xl tracking-tight text-foreground truncate">
                Question Navigator
              </h2>
            </div>

            {/* Close button - visible on all screens */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-1.5 sm:p-2 lg:p-2.5 hover:bg-accent/50 focus-ring transition-colors flex-shrink-0"
              aria-label="Close navigation"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 text-xs">
            <div className="text-center p-2 sm:p-3 lg:p-4 xl:p-5 rounded-lg" style={{ backgroundColor: '#00B05020', border: '1px solid #00B05040' }}>
              <div className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl" style={{ color: '#00B050' }}>{correctCount}</div>
              <div className="font-medium text-xs sm:text-sm lg:text-base leading-tight" style={{ color: '#00B050' }}>Correct</div>
            </div>
            <div className="text-center p-2 sm:p-3 lg:p-4 xl:p-5 rounded-lg" style={{ backgroundColor: '#FF000020', border: '1px solid #FF000040' }}>
              <div className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl" style={{ color: '#FF0000' }}>{incorrectCount}</div>
              <div className="font-medium text-xs sm:text-sm lg:text-base leading-tight" style={{ color: '#FF0000' }}>Incorrect</div>
            </div>
            <div className="text-center p-2 sm:p-3 lg:p-4 xl:p-5 rounded-lg" style={{ backgroundColor: '#BFBFBF20', border: '1px solid #BFBFBF40' }}>
              <div className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl" style={{ color: '#BFBFBF' }}>{unansweredCount}</div>
              <div className="font-medium text-xs sm:text-sm lg:text-base leading-tight" style={{ color: '#BFBFBF' }}>Unanswered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 xl:p-8 space-y-3 sm:space-y-4 lg:space-y-5 border-b bg-muted/50 sm:bg-muted/20 md:bg-muted/20 lg:bg-muted/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-10 lg:pl-12 h-8 sm:h-9 lg:h-10 xl:h-11 text-xs sm:text-sm lg:text-base focus-ring bg-background/80 border-border/50"
          />
        </div>

        <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
          <SelectTrigger className="h-8 sm:h-9 lg:h-10 xl:h-11 text-xs sm:text-sm lg:text-base focus-ring bg-background/80 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
            <SelectItem value="all" className="font-medium text-xs sm:text-sm lg:text-base">All Questions ({session.totalQuestions})</SelectItem>
            <SelectItem value="answered" className="font-medium text-xs sm:text-sm lg:text-base">Answered ({answeredCount})</SelectItem>
            <SelectItem value="unanswered" className="font-medium text-xs sm:text-sm lg:text-base">Unanswered ({unansweredCount})</SelectItem>
            <SelectItem value="bookmarked" className="font-medium text-xs sm:text-sm lg:text-base">Bookmarked ({bookmarkedCount})</SelectItem>
            <SelectItem value="flagged" className="font-medium text-xs sm:text-sm lg:text-base">Flagged ({flaggedCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Question List - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 sm:p-3 lg:p-4 xl:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
          {filteredQuestions.map((question, filteredIndex) => {
            const originalIndex = session.questions.findIndex(q => q.id === question.id);
            const isActive = currentQuestion && currentQuestion.id === question.id;
            const status = getQuestionStatus(question.id);
            const isBookmarked = isQuestionBookmarked(question.id);
            const flags = getQuestionFlags(question.id);
            const timeSpent = (state.localAnswers?.[Number(question.id)] || session.userAnswers[String(question.id)])?.timeSpent || 0;

            return (
              <Button
                key={question.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start p-2 sm:p-3 lg:p-3 xl:p-4 h-auto text-left btn-modern focus-ring transition-all duration-300",
                  "min-h-[48px] sm:min-h-[52px] lg:min-h-[56px] xl:min-h-[60px]",
                  isActive && "ring-2 ring-primary/30 shadow-md bg-primary/5",
                  !isActive && status === 'correct' && "hover:bg-green-500/20 bg-green-500/10 border-green-500/30 text-green-700 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-500/20",
                  !isActive && status === 'incorrect' && "hover:bg-red-500/20 bg-red-500/10 border-red-500/30 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20",
                  !isActive && status === 'answered' && "hover:bg-blue-50 bg-blue-50/30 border-blue-200/30 text-blue-800 dark:bg-secondary dark:text-secondary-foreground dark:border-secondary dark:hover:bg-accent",
                  !isActive && status === 'unanswered' && "hover:bg-accent/50 hover:shadow-sm text-muted-foreground"
                )}
                onClick={() => goToQuestion(originalIndex)}
              >
                <div className="flex items-start gap-2 sm:gap-3 lg:gap-3 w-full min-w-0">
                  {/* Question Number & Status */}
                  <div className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                      <span className={cn(
                        "text-xs sm:text-sm font-bold w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 rounded-md flex items-center justify-center transition-colors",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                      )}>
                        {originalIndex + 1}
                      </span>
                      {status === 'correct' ? (
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 text-green-600 fill-green-100" />
                      ) : status === 'incorrect' ? (
                        <XIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 text-red-600" />
                      ) : status === 'answered' ? (
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 text-blue-600 fill-blue-100" />
                      ) : (
                        <Circle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm lg:text-sm">{getQuestionTypeIcon(question.type || 'QCM')}</span>
                  </div>

                  {/* Question Info */}
                  <div className="flex-1 min-w-0 space-y-1 sm:space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm lg:text-sm font-medium truncate leading-tight">
                        {question.title || question.questionText || `Question ${originalIndex + 1}`}
                      </h4>
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        {isBookmarked && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        {flags.includes('difficult') && (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                        {flags.includes('review_later') && (
                          <Flag className="h-3 w-3 text-chart-2" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-xs px-1 py-0 font-medium", getDifficultyColor(question.difficulty || 'medium'))}
                      >
                        {question.difficulty || 'Medium'}
                      </Badge>

                      {timeSpent > 0 && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          <span className="hidden sm:inline font-mono text-xs">
                            {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                          </span>
                          <span className="sm:hidden font-mono text-xs">
                            {Math.floor(timeSpent / 60)}m
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {question.tags && Array.isArray(question.tags) && question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {question.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {question.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{question.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            );
          })}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t">
        <div className="text-xs text-muted-foreground text-center">
          {filteredQuestions.length} of {session.totalQuestions} questions
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      </div>
    </div>
  );
}
