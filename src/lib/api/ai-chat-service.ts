// @ts-nocheck
/**
 * AI Chat Service
 * 
 * Service for sending messages to AI models (DeepSeek / ChatGPT)
 * to help students understand quiz questions.
 */

import { apiClient } from '../api-client';
import type { AIModel, QuestionContext, AIResponse, ChatMessage } from '@/types/ai-chat-types';

/**
 * Build a system prompt with question context for the AI
 */
function buildSystemPrompt(context: QuestionContext): string {
    const optionsText = context.options
        .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt.text}${opt.isCorrect ? ' (Correct)' : ''}`)
        .join('\n');

    return `You are a helpful medical education assistant. A student is reviewing the following quiz question and needs help understanding it.

**Question:**
${context.questionText}

**Answer Options:**
${optionsText}

**Correct Answer:**
${context.correctAnswer}

**Explanation:**
${context.explanation}

Help the student understand this question better. Be concise, clear, and educational. Use simple language when possible. If they ask about specific concepts, explain them in the context of this question.`;
}

/**
 * Send a message to the AI chat service
 */
export async function sendAIChatMessage(
    message: string,
    context: QuestionContext,
    model: AIModel,
    conversationHistory: ChatMessage[] = []
): Promise<AIResponse> {
    try {
        const systemPrompt = buildSystemPrompt(context);

        // Build messages array for the API
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        const response = await apiClient.post<AIResponse>('/students/ai-chat', {
            model,
            messages,
            questionId: context.questionId
        });

        if (response.success && response.data) {
            return {
                success: true,
                message: response.data.message || response.data as any,
                model,
                usage: response.data.usage
            };
        }

        // If API doesn't have the endpoint yet, provide a helpful fallback
        throw new Error('AI chat service unavailable');
    } catch (error: any) {
        console.error('[AI Chat] Error:', error);

        // For development/demo purposes - provide a mock response
        // Remove this in production when the actual endpoint is available
        if (error.message?.includes('unavailable') || error.statusCode === 404) {
            return {
                success: true,
                message: getMockResponse(message, context),
                model
            };
        }

        return {
            success: false,
            message: error.message || 'Failed to get AI response. Please try again.',
            model
        };
    }
}

/**
 * Mock response generator for development
 * This can be removed when the actual backend endpoint is ready
 */
function getMockResponse(message: string, context: QuestionContext): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('why') || lowerMessage.includes('explain')) {
        return `Great question! Let me explain this concept:\n\n${context.explanation}\n\nThe key point to understand here is that the correct answer (${context.correctAnswer}) is based on the specific clinical presentation described in the question. Would you like me to clarify any specific aspect?`;
    }

    if (lowerMessage.includes('wrong') || lowerMessage.includes('incorrect')) {
        const wrongOptions = context.options.filter(o => !o.isCorrect);
        if (wrongOptions.length > 0) {
            return `The other options are incorrect because:\n\n${wrongOptions.map(o => `• **${o.text}**: This doesn't fit the clinical picture or the specific criteria mentioned in the question.`).join('\n\n')}\n\nRemember, it's important to carefully read all the details in the question to identify the most appropriate answer.`;
        }
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('understand')) {
        return `I'm here to help you understand this question better!\n\n**Summary:**\n${context.questionText.substring(0, 200)}...\n\n**Key Learning Point:**\n${context.explanation}\n\nFeel free to ask me about specific concepts, why certain answers are correct or incorrect, or any clinical reasoning involved.`;
    }

    return `Based on the question about "${context.questionText.substring(0, 100)}...":\n\n${context.explanation}\n\nIs there a specific part of this concept you'd like me to elaborate on?`;
}

export const aiChatService = {
    sendMessage: sendAIChatMessage
};
