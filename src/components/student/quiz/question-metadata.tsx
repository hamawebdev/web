'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  FileText,
  Info,
  Layers,
  Tag,
  RefreshCw,
  Repeat
} from 'lucide-react';
import { QuizQuestion } from './quiz-context';

interface QuestionMetadataProps {
  question: QuizQuestion;
  className?: string;
}

export function QuestionMetadata({ question, className = '' }: QuestionMetadataProps) {
  // Map question types to display format (MULTIPLE_CHOICE → QCM, SINGLE_CHOICE → QCS)
  const getQuestionTypeDisplay = (questionType?: string) => {
    if (!questionType) return null;

    const type = questionType.toUpperCase();
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'QCM';
      case 'SINGLE_CHOICE':
        return 'QCS';
      case 'TRUE_FALSE':
        return 'QCS';
      default:
        return questionType;
    }
  };

  // Parse metadata if it's a JSON string
  const parseMetadata = (metadata?: string) => {
    if (!metadata) return null;

    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  };

  const questionTypeDisplay = getQuestionTypeDisplay(question.questionType);
  const parsedMetadata = parseMetadata(question.metadata);
  const sourceName = typeof question.source === 'object' ? question.source?.name : question.source;

  // Check if we have any metadata to display
  const hasMetadata = !!(
    question.examYear ||
    question.course?.name ||
    questionTypeDisplay ||
    sourceName ||
    parsedMetadata ||
    (question.fields && question.fields.length > 0) ||
    (question.tags && question.tags.length > 0) ||
    question.repetitionCount !== undefined ||
    (question.repetitionYears && question.repetitionYears.length > 0)
  );

  if (!hasMetadata) {
    return null;
  }

  return (
    <div className={`${className} quiz-question-metadata overflow-hidden`} role="complementary" aria-label="Question metadata">
      {/*
        Single horizontal row layout with responsive wrapping
        - All metadata items display inline horizontally
        - Graceful wrapping on smaller screens
        - Consistent spacing and alignment across all devices
        - No truncation or ellipsis - full text visibility
      */}
      <div className="flex flex-wrap items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-2.5 leading-none min-h-[24px] w-full">
        {/* Question Type - Primary badge */}
        {questionTypeDisplay && (
          <Badge variant="secondary" className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold whitespace-nowrap border-0 bg-primary/10 text-primary hover:bg-primary/15">
            <FileText className="h-3 w-3 mr-1 sm:mr-1.5" />
            {questionTypeDisplay}
          </Badge>
        )}

        {/* Exam Year */}
        {question.examYear && (
          <Badge variant="secondary" className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold whitespace-nowrap border-0 bg-primary/10 text-primary hover:bg-primary/15">
            <Calendar className="h-3 w-3 mr-1 sm:mr-1.5" />
            {question.examYear}
          </Badge>
        )}

        {/* Course Name */}
        {question.course?.name && (
          <Badge
            variant="secondary"
            className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold border-0 bg-primary/10 text-primary hover:bg-primary/15"
          >
            <BookOpen className="h-3 w-3 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{question.course.name}</span>
          </Badge>
        )}


        {/* Source */}
        {sourceName && (
          <Badge
            variant="secondary"
            className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold border-0 bg-primary/10 text-primary hover:bg-primary/15"
          >
            <GraduationCap className="h-3 w-3 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{sourceName}</span>
          </Badge>
        )}

        {/* Year Level */}
        {question.yearLevel && (
          <Badge variant="secondary" className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold whitespace-nowrap border-0 bg-primary/10 text-primary hover:bg-primary/15">
            <span>Year {question.yearLevel}</span>
          </Badge>
        )}

        {/* Fields */}
        {question.fields && question.fields.length > 0 && (
          <Badge variant="secondary" className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold border-0 bg-primary/10 text-primary hover:bg-primary/15">
            <Layers className="h-3 w-3 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{question.fields.join(', ')}</span>
          </Badge>
        )}

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {question.tags.map((tag, index) => (
              <Badge key={`${tag}-${index}`} variant="secondary" className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold whitespace-nowrap border-0 bg-primary/10 text-primary hover:bg-primary/15">
                <Tag className="h-3 w-3 mr-1 sm:mr-1.5" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Repetition Count */}
        {question.repetitionCount !== undefined && (
          <Badge variant="secondary" className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold whitespace-nowrap border-0 bg-primary/10 text-primary hover:bg-primary/15">
            <RefreshCw className="h-3 w-3 mr-1 sm:mr-1.5" />
            <span>Repeated {question.repetitionCount}x</span>
          </Badge>
        )}

        {/* Repetition Years */}
        {question.repetitionYears && question.repetitionYears.length > 0 && (
          <Badge variant="secondary" className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold border-0 bg-primary/10 text-primary hover:bg-primary/15">
            <Repeat className="h-3 w-3 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Years: {question.repetitionYears.join(', ')}</span>
          </Badge>
        )}

        {/* Metadata details */}
        {parsedMetadata?.difficulty && (
          <Badge variant="secondary" className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold whitespace-nowrap border-0 bg-primary/10 text-primary hover:bg-primary/15">
            <Info className="h-3 w-3 mr-1 sm:mr-1.5" />
            {parsedMetadata.difficulty}
          </Badge>
        )}

        {parsedMetadata?.topic && (
          <Badge
            variant="secondary"
            className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold border-0 bg-primary/10 text-primary hover:bg-primary/15"
          >
            <span className="whitespace-nowrap">{parsedMetadata.topic}</span>
          </Badge>
        )}

        {parsedMetadata?.category && (
          <Badge
            variant="secondary"
            className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold border-0 bg-primary/10 text-primary hover:bg-primary/15"
          >
            <span className="whitespace-nowrap">{parsedMetadata.category}</span>
          </Badge>
        )}

        {parsedMetadata?.estimatedTime && (
          <Badge variant="secondary" className="quiz-session-badge h-6 px-2 sm:px-2.5 text-xs font-semibold whitespace-nowrap border-0 bg-primary/10 text-primary hover:bg-primary/15">
            <span>{parsedMetadata.estimatedTime}s</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
