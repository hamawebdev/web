'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSoundManager } from '@/hooks/use-sound-manager';

interface SoundToggleProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
  showLabel?: boolean;
}

/**
 * Sound toggle button component for quiz sessions
 * Provides mute/unmute functionality with visual feedback
 * Matches the design system used in quiz header controls
 */
export function SoundToggle({ 
  className,
  size = 'sm',
  variant = 'outline',
  showLabel = false,
}: SoundToggleProps) {
  const { isMuted, toggleMute } = useSoundManager();
  
  
  // Force re-render when state changes
  const [renderKey, setRenderKey] = React.useState(0);
  React.useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [isMuted]);

  const handleToggle = () => {
    toggleMute();
  };

  const Icon = isMuted ? VolumeX : Volume2;
  const label = isMuted ? 'Unmute sounds' : 'Mute sounds';
  const buttonText = isMuted ? 'Muted' : 'Sound';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          key={renderKey}
          variant={variant}
          size={size}
          onClick={handleToggle}
          className={cn(
            'gap-1 sm:gap-2 btn-modern focus-ring hover:bg-accent/50 px-2 sm:px-3',
            'transition-all duration-200 hover:scale-105 touch-target',
            // Match the styling from other header controls in quiz-layout.tsx
            'flex-shrink-0',
            className
          )}
          aria-label={label}
          title={label}
          disabled={false}
          type="button"
        >
          <Icon className={cn(
            'h-3 w-3 sm:h-4 sm:w-4',
            isMuted ? 'text-muted-foreground' : 'text-foreground'
          )} />
          {showLabel && (
            <span className="hidden sm:inline text-xs">
              {buttonText}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Compact version for mobile/small spaces
 * Matches the pattern used in other quiz components
 */
export function SoundToggleCompact({ className }: { className?: string }) {
  const { isMuted, toggleMute } = useSoundManager();
  
  
  // Force re-render when state changes
  const [renderKey, setRenderKey] = React.useState(0);
  React.useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [isMuted]);

  const Icon = isMuted ? VolumeX : Volume2;
  const label = isMuted ? 'Unmute sounds' : 'Mute sounds';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          key={renderKey}
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className={cn(
            'h-8 w-8 p-0 hover:bg-accent/50 transition-colors',
            className
          )}
          aria-label={label}
          disabled={false}
          type="button"
        >
          <Icon className={cn(
            'h-4 w-4',
            isMuted ? 'text-muted-foreground' : 'text-foreground'
          )} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
