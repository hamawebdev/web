
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Assuming ui/textarea exists, if not input is fine
// Fallback to simple textarea if ui component missing, but likely exists.
// Actually checking imports in ai-chat-panel, it uses Sheet, Button, Badge, ScrollArea.
// It doesn't import Textarea there, but likely project has it.
// To be safe I'll use native textarea with tailwind classes.

interface AIPromptProps {
    value: string;
    onValueChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    selectedModel?: string;
    onModelChange?: (model: string) => void;
    disabled?: boolean;
}

export default function AIPrompt({
    value,
    onValueChange,
    onSubmit,
    isLoading,
    selectedModel,
    onModelChange,
    disabled
}: AIPromptProps) {
    return (
        <div className="flex flex-col gap-2 p-2 border-t mt-auto">
            <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Ask a question..."
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                disabled={disabled}
            />
            <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                    {selectedModel}
                </div>
                <Button
                    onClick={onSubmit}
                    disabled={disabled || isLoading || !value.trim()}
                    size="sm"
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </Button>
            </div>
        </div>
    );
}
