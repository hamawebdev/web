// @ts-nocheck
'use client';

/**
 * useAIChat Hook
 * 
 * Custom hook for managing AI chat state and interactions.
 * Handles sending messages, model selection, and conversation history.
 */

import { useState, useCallback, useMemo } from 'react';
import type { AIModel, ChatMessage, QuestionContext, AIChatState } from '@/types/ai-chat-types';
import { sendAIChatMessage } from '@/lib/api/ai-chat-service';

interface UseAIChatOptions {
    initialModel?: AIModel;
    questionContext?: QuestionContext | null;
}

interface UseAIChatReturn extends AIChatState {
    sendMessage: (content: string) => Promise<void>;
    setModel: (model: AIModel) => void;
    setQuestionContext: (context: QuestionContext | null) => void;
    clearChat: () => void;
    retryLastMessage: () => Promise<void>;
}

function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
    const { initialModel = 'chatgpt', questionContext: initialContext = null } = options;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedModel, setSelectedModel] = useState<AIModel>(initialModel);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [questionContext, setQuestionContext] = useState<QuestionContext | null>(initialContext);

    // Send a message to the AI
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || !questionContext) {
            return;
        }

        const userMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const response = await sendAIChatMessage(
                content,
                questionContext,
                selectedModel,
                messages
            );

            if (response.success) {
                const assistantMessage: ChatMessage = {
                    id: generateMessageId(),
                    role: 'assistant',
                    content: response.message,
                    timestamp: new Date(),
                    model: response.model
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        } finally {
            setIsLoading(false);
        }
    }, [questionContext, selectedModel, messages]);

    // Retry the last message
    const retryLastMessage = useCallback(async () => {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMessage) {
            // Remove the last failed response if any
            setMessages(prev => {
                const lastIndex = prev.length - 1;
                if (prev[lastIndex]?.role === 'assistant' || error) {
                    return prev.slice(0, lastIndex);
                }
                return prev;
            });
            setError(null);
            await sendMessage(lastUserMessage.content);
        }
    }, [messages, error, sendMessage]);

    // Set AI model
    const setModel = useCallback((model: AIModel) => {
        setSelectedModel(model);
    }, []);

    // Clear all messages
    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    // Update question context (also clears messages when question changes)
    const updateQuestionContext = useCallback((context: QuestionContext | null) => {
        if (context?.questionId !== questionContext?.questionId) {
            setMessages([]);
            setError(null);
        }
        setQuestionContext(context);
    }, [questionContext?.questionId]);

    return {
        messages,
        selectedModel,
        isLoading,
        error,
        questionContext,
        sendMessage,
        setModel,
        setQuestionContext: updateQuestionContext,
        clearChat,
        retryLastMessage
    };
}
