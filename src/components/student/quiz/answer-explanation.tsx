// @ts-nocheck
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Check, X, Info } from 'lucide-react';
import { LightbulbBolt } from '@solar-icons/react';
import { SafeMarkdown } from '@/components/ui/safe-markdown';
import { QuizQuestion, UserAnswer } from './quiz-context';
import { ImageGallery } from './image-gallery';
import { resolveImagePath } from '@/lib/image-loader';
import { cn } from '@/lib/utils';

// Stable overrides for SafeMarkdown (kept outside render so memoization holds)
const EXPLANATION_COMPONENTS = {
  p: ({ node: _node, className, children, ...props }) => <p {...props} className={cn('mb-2 last:mb-0', className)}>{children}</p>,
  ul: ({ node: _node, className, children, ...props }) => <ul {...props} className={cn('list-disc ml-4 mb-2', className)}>{children}</ul>,
  ol: ({ node: _node, className, children, ...props }) => <ol {...props} className={cn('list-decimal ml-4 mb-2', className)}>{children}</ol>,
  li: ({ node: _node, className, children, ...props }) => <li {...props} className={cn('mb-1', className)}>{children}</li>,
  strong: ({ node: _node, className, children, ...props }) => <span {...props} className={cn('font-bold text-foreground', className)}>{children}</span>,
  em: ({ node: _node, className, children, ...props }) => <span {...props} className={cn('italic text-foreground', className)}>{children}</span>,
  blockquote: ({ node: _node, className, children, ...props }) => <blockquote {...props} className={cn('border-l-2 border-primary/50 pl-4 italic text-muted-foreground my-2', className)}>{children}</blockquote>,
  code: ({ node: _node, className, children, ...props }) => <code {...props} className={cn('bg-muted px-1 py-0.5 rounded text-xs font-mono', className)}>{children}</code>,
  pre: ({ node: _node, className, children, ...props }) => <pre {...props} className={cn('bg-muted p-2 rounded-lg overflow-x-auto my-2 text-xs font-mono', className)}>{children}</pre>,
};

interface Props {
  question: QuizQuestion;
  userAnswer?: UserAnswer;
}

export function AnswerExplanation({ question, userAnswer }: Props) {
  const isCorrect = userAnswer?.isCorrect || false;

  // Helper function to normalize image data structure
  const normalizeImageArray = (images: any[]): Array<{ id: number; imagePath: string; altText?: string }> => {
    if (!Array.isArray(images)) return [];

    return images.map((img, index) => {
      // Handle different possible image data structures from API
      if (typeof img === 'string') {
        // If image is just a URL string
        return {
          id: index + 1,
          imagePath: resolveImagePath(img),
          altText: `Explanation Image ${index + 1}`
        };
      } else if (img && typeof img === 'object') {
        // If image is an object with properties
        return {
          id: img.id || index + 1,
          imagePath: resolveImagePath(img.imagePath || img.url || img.src || ''),
          altText: img.altText || img.alt || img.description || `Explanation Image ${index + 1}`
        };
      }
      return null;
    }).filter(Boolean);
  };

  // Collect all explanation images from different sources
  const getAllExplanationImages = () => {
    const images: Array<{ id: number; imagePath: string; altText?: string }> = [];

    // Question-level explanation images
    if (Array.isArray(question.questionExplanationImages)) {
      images.push(...normalizeImageArray(question.questionExplanationImages));
    }

    // Answer-level explanation images (from selected answer)
    if (userAnswer && Array.isArray(question.options)) {
      const selectedOption = question.options.find(opt =>
        userAnswer.selectedOptions?.includes(opt.id)
      );
      if (selectedOption && Array.isArray(selectedOption.explanationImages)) {
        images.push(...normalizeImageArray(selectedOption.explanationImages));
      }
    }

    // For API compatibility - check if question has answers with explanationImages
    if (Array.isArray((question as any).questionAnswers)) {
      (question as any).questionAnswers.forEach((answer: any) => {
        if (Array.isArray(answer.explanationImages)) {
          images.push(...normalizeImageArray(answer.explanationImages));
        }
      });
    }

    // Remove duplicates based on imagePath
    const uniqueImages = images.filter((img, index, self) =>
      index === self.findIndex(i => i.imagePath === img.imagePath)
    );

    return uniqueImages;
  };

  const explanationImages = getAllExplanationImages();

  return (
    <Card id="answer-explanation" lang={question.explanationLanguage} className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-primary text-sm sm:text-base font-bold">
          <LightbulbBolt className="h-4 w-4" />
          Explanation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-3">
        {/* Explanation Text */}
        <div className="prose prose-xs sm:prose-sm max-w-none text-foreground text-xs sm:text-sm leading-tight font-medium [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
          <SafeMarkdown components={EXPLANATION_COMPONENTS}>{question.explanation || ''}</SafeMarkdown>
        </div>

        {/* Explanation Images */}
        {explanationImages.length > 0 && (
          <div className="explanation-images">
            <ImageGallery
              images={explanationImages}
              title="Explanation Images"
              maxHeight="max-h-48"
              gridCols="auto"
              showZoom={true}
              compact={true}
              className="explanation-image-gallery"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
