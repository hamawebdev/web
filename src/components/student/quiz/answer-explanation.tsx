// @ts-nocheck
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Check, X, Info } from 'lucide-react';
import { LightbulbBolt } from '@solar-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; import { QuizQuestion, UserAnswer } from './quiz-context';
import { ImageGallery } from './image-gallery';

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
          imagePath: img,
          altText: `Explanation Image ${index + 1}`
        };
      } else if (img && typeof img === 'object') {
        // If image is an object with properties
        return {
          id: img.id || index + 1,
          imagePath: img.imagePath || img.url || img.src || '',
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
    <Card id="answer-explanation" className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-primary text-sm sm:text-base font-bold">
          <LightbulbBolt className="h-4 w-4" />
          Explanation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-3">
        {/* Explanation Text */}
        <div className="prose prose-xs sm:prose-sm max-w-none text-foreground text-xs sm:text-sm leading-tight font-medium [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <span className="font-bold text-foreground">{children}</span>,
              em: ({ children }) => <span className="italic text-foreground">{children}</span>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground my-2">{children}</blockquote>,
              code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
              pre: ({ children }) => <pre className="bg-muted p-2 rounded-lg overflow-x-auto my-2 text-xs font-mono">{children}</pre>,
            }}
          >
            {question.explanation || ''}
          </ReactMarkdown>
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
