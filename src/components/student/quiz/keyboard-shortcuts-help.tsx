import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Keyboard, ArrowLeft, ArrowRight, Play, Pause, Eye, Trash2 } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  className?: string;
}

export function KeyboardShortcutsHelp({ className }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    {
      key: 'Enter',
      description: 'Show explanation and correct result',
      icon: <Eye className="h-3 w-3" />
    },
    {
      key: '← →',
      description: 'Navigate between questions',
      icon: <div className="flex gap-1"><ArrowLeft className="h-3 w-3" /><ArrowRight className="h-3 w-3" /></div>
    },
    {
      key: 'P',
      description: 'Pause/Resume session',
      icon: <div className="flex gap-1"><Pause className="h-3 w-3" /><Play className="h-3 w-3" /></div>
    },
    {
      key: 'Escape',
      description: 'Show exit dialog',
      icon: <span className="text-xs">⎋</span>
    },
    {
      key: 'Backspace',
      description: 'Clear selected answers',
      icon: <Trash2 className="h-3 w-3" />
    },
    {
      key: 'A, B, C...',
      description: 'Select answer options directly',
      icon: <Keyboard className="h-3 w-3" />
    }
  ];

  return (
    <Card className={`bg-muted/30 border-muted/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          Keyboard Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {shortcut.icon}
              <span className="text-xs text-muted-foreground">{shortcut.description}</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
              {shortcut.key}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
