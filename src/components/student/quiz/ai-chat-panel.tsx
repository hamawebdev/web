// @ts-nocheck
'use client';

/**
 * AI Chat Panel Component
 * 
 * A slide-out sheet panel that allows students to chat with AI
 * about quiz questions. Supports DeepSeek and ChatGPT models.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Sheet,
    SheetContent
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { cn } from '@/lib/utils';
import {
    Bot,
    User,
    RefreshCw,
    Loader2,
    AlertCircle
} from 'lucide-react';
import type { AIModel, QuestionContext, ChatMessage } from '@/types/ai-chat-types';
import { useAIChat } from '@/hooks/use-ai-chat';
import AIPrompt from '@/components/ai/ai-prompt';
import AILoader from '@/components/ai/ai-loader';

interface AIChatPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    questionContext: QuestionContext | null;
}

// Model configuration for display
const MODEL_CONFIG: Record<AIModel, { name: string; icon: string; color: string }> = {
    chatgpt: { name: 'ChatGPT', icon: '🤖', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
    deepseek: { name: 'DeepSeek', icon: '🧠', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' }
};

export function AIChatPanel({ open, onOpenChange, questionContext }: AIChatPanelProps) {
    const [inputValue, setInputValue] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const {
        messages,
        selectedModel,
        isLoading,
        error,
        sendMessage,
        setModel,
        setQuestionContext,
        retryLastMessage
    } = useAIChat({ initialModel: 'chatgpt', questionContext });

    // Update context when it changes
    useEffect(() => {
        setQuestionContext(questionContext);
    }, [questionContext, setQuestionContext]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const handleSend = useCallback(async () => {
        if (!inputValue.trim() || isLoading) return;
        const message = inputValue;
        setInputValue('');
        await sendMessage(message);
    }, [inputValue, isLoading, sendMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // Suggested quick questions
    const quickQuestions = [
        "Why is this the correct answer?",
        "Explain the key concepts",
        "What's wrong with the other options?",
        "Give me a memory tip"
    ];

    const handleQuickQuestion = (question: string) => {
        sendMessage(question);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md md:max-w-lg flex flex-col p-0 gap-0"
            >


                {/* Question Context Preview */}
                {questionContext && (
                    <div className="px-4 py-2 bg-muted/30 border-b">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Current Question:</p>
                        <p className="text-xs line-clamp-2 text-foreground/90">
                            {questionContext.questionText.length > 120
                                ? questionContext.questionText.substring(0, 120) + '...'
                                : questionContext.questionText}
                        </p>
                    </div>
                )}

                {/* Messages Area */}
                <ScrollArea
                    ref={scrollAreaRef}
                    className="flex-1 px-4 py-3 overflow-hidden"
                    forceVisible
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <AILoader
                                title="AI Assistant is ready"
                                subtitle="Ask anything about this question to help you learn better"
                                size="sm"
                            />

                            {/* Quick Questions */}
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                                {quickQuestions.map((q, i) => (
                                    <Button
                                        key={i}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7 rounded-full px-3"
                                        onClick={() => handleQuickQuestion(q)}
                                    >
                                        {q}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span className="text-xs">Thinking...</span>
                                    </div>
                                </div>
                            )}

                            {/* Error state */}
                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs">{error}</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2 h-7 text-xs"
                                            onClick={retryLastMessage}
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Retry
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                <div className="px-4 pb-0">
                    <AIPrompt
                        value={inputValue}
                        onValueChange={setInputValue}
                        onSubmit={handleSend}
                        isLoading={isLoading}
                        selectedModel={selectedModel}
                        onModelChange={setModel}
                        disabled={!questionContext}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Message bubble component
function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';

    return (
        <div className={cn(
            "flex gap-2",
            isUser ? "flex-row-reverse" : "flex-row"
        )}>
            <div className={cn(
                "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center shadow-sm",
                isUser ? "bg-primary text-primary-foreground" : "bg-muted border border-muted-foreground/10"
            )}>
                {isUser ? (
                    <User className="h-3.5 w-3.5" />
                ) : (
                    <Bot className="h-3.5 w-3.5" />
                )}
            </div>
            <div className={cn(
                "flex-1 max-w-[85%] rounded-lg px-3 py-2 shadow-sm",
                isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-muted-foreground/10 text-foreground"
            )}>
                <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                </p>

            </div>
        </div>
    );
}
