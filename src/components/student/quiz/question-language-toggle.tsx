'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useQuestionLanguage } from './question-language-provider';

interface QuestionLanguageToggleProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
}

/**
 * FR/EN switch for question texts, styled like SoundToggle. The visible code is the language the
 * questions are currently requested in; the button is "pressed" when English is selected.
 */
export function QuestionLanguageToggle({
  className,
  size = 'sm',
  variant = 'outline',
}: QuestionLanguageToggleProps) {
  const { language, toggleLanguage } = useQuestionLanguage();
  const isEnglish = language === 'en';
  const hint = isEnglish
    ? 'Questions in English. Switch to French'
    : 'Questions in French. Switch to English';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={toggleLanguage}
          className={cn(
            'gap-1 sm:gap-2 btn-modern focus-ring hover:bg-accent/50 px-2 sm:px-3',
            'transition-all duration-200 hover:scale-105 touch-target',
            'flex-shrink-0',
            className
          )}
          aria-label="Show questions in English"
          aria-pressed={isEnglish}
          title={hint}
          type="button"
        >
          <Languages
            aria-hidden="true"
            className={cn(
              'hidden sm:block h-3 w-3 sm:h-4 sm:w-4',
              isEnglish ? 'text-foreground' : 'text-muted-foreground'
            )}
          />
          <span aria-hidden="true" className="text-xs font-semibold tracking-wide">
            {isEnglish ? 'EN' : 'FR'}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{hint}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Small note shown next to a question when English was asked for but the question has none. */
export function EnglishUnavailableBadge({ className }: { className?: string }) {
  return (
    <span
      lang="en"
      role="note"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5',
        'text-[11px] font-medium leading-tight text-muted-foreground',
        className
      )}
    >
      <Languages aria-hidden="true" className="h-3 w-3 flex-shrink-0" />
      English not available — shown in French
    </span>
  );
}
