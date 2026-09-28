'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SafeMarkdown } from '@/components/ui/safe-markdown';
import { localizeQuestion } from '@/lib/question-localization';
import { useQuestionLanguage } from '@/components/student/quiz/question-language-provider';
import { QuestionLanguageToggle, EnglishUnavailableBadge } from '@/components/student/quiz/question-language-toggle';
import { CheckCircle, XCircle, HelpCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { ImageGallery } from '@/components/student/quiz/image-gallery';

interface QuestionAnswer {
    id: number;
    answerText: string;
    answerTextEn?: string | null;
    isCorrect: boolean;
    explanation?: string | null;
    explanationEn?: string | null;
}

interface ReadOnlyQuestionProps {
    question: {
        id: number;
        questionText: string;
        questionTextEn?: string | null;
        explanation?: string | null;
        explanationEn?: string | null;
        questionType?: string;
        questionImages?: string[];
        questionAnswers?: QuestionAnswer[];
        course?: {
            name: string;
            module?: {
                name: string;
            };
        };
        source?: {
            name: string;
        };
        examYear?: number | null;
    };
}

export function ReadOnlyQuestion({ question }: ReadOnlyQuestionProps) {
    const isMultipleChoice = question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE';
    const { language } = useQuestionLanguage();
    const localized = localizeQuestion(question, language);

    return (
        <div className="space-y-6" lang={localized.displayedLanguage}>
            {/* Header / Context */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {question.source?.name && (
                    <Badge variant="outline" className="bg-muted/50">
                        {question.source.name} {question.examYear ? `(${question.examYear})` : ''}
                    </Badge>
                )}
                {question.course?.module?.name && (
                    <Badge variant="outline" className="bg-muted/50">
                        {question.course.module.name}
                    </Badge>
                )}
                {question.course?.name && (
                    <Badge variant="outline" className="bg-muted/50">
                        {question.course.name}
                    </Badge>
                )}
                <div className="ml-auto">
                    <QuestionLanguageToggle />
                </div>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
                {language === 'en' && !localized.hasEnglish && <EnglishUnavailableBadge />}
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    <SafeMarkdown>{localized.questionText}</SafeMarkdown>
                </div>

                {/* Images */}
                {question.questionImages && question.questionImages.length > 0 && (
                    <div className="rounded-lg border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            Question Images
                        </div>
                        <ImageGallery
                            images={question.questionImages.map((img, i) => ({
                                id: i,
                                imagePath: img,
                                altText: `Image ${i + 1}`
                            }))}
                            title="Question Images"
                            maxHeight="max-h-64"
                        />
                    </div>
                )}
            </div>

            {/* Answers / Options */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {isMultipleChoice ? 'Options' : 'Answer'}
                </h4>

                {localized.answers.map((answer) => (
                    <div
                        key={answer.id}
                        className={cn(
                            "p-3 rounded-lg border text-sm transition-colors",
                            answer.isCorrect
                                ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                                : "bg-card border-border opacity-70"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                {answer.isCorrect ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 break-words">
                                <span className={cn(answer.isCorrect && "font-medium text-green-900 dark:text-green-100")}>
                                    <SafeMarkdown inline>{answer.answerText}</SafeMarkdown>
                                </span>
                                {answer.explanation && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        <SafeMarkdown inline>{answer.explanation}</SafeMarkdown>
                                    </div>
                                )}
                            </div>
                            {answer.isCorrect && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none">
                                    Correct
                                </Badge>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Explanation */}
            {localized.explanation && (
                <Card lang={localized.explanationLanguage} className="bg-blue-50/30 border-blue-100 dark:bg-blue-900/5 dark:border-blue-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <FileText className="h-4 w-4" />
                            Explanation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-p:my-1">
                            <SafeMarkdown>{localized.explanation}</SafeMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
