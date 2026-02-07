// AI Chat Types and Interfaces
// Types for the AI-powered chat feature that helps students understand quiz questions

export type AIModel = 'deepseek' | 'chatgpt';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    model?: AIModel;
}

export interface QuestionContext {
    questionId: number;
    questionText: string;
    options: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
    }>;
    correctAnswer: string;
    explanation: string;
    questionType?: string;
    yearLevel?: string;
    course?: string;
}

export interface AIResponse {
    success: boolean;
    message: string;
    model: AIModel;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface AIChatState {
    messages: ChatMessage[];
    selectedModel: AIModel;
    isLoading: boolean;
    error: string | null;
    questionContext: QuestionContext | null;
}
