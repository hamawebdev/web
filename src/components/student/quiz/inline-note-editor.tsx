'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownNoteEditor } from '@/components/ui/markdown-editor';
import { toast } from 'sonner';
import { useQuiz } from './quiz-api-context';

interface InlineNoteEditorProps {
    questionId: number;
    initialContent: string;
    onSave: () => void;
    onCancel: () => void;
}

export function InlineNoteEditor({
    questionId,
    initialContent,
    onSave,
    onCancel
}: InlineNoteEditorProps) {
    const { addNote, state } = useQuiz();
    const [noteText, setNoteText] = useState(initialContent || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!questionId) return;

        setIsSaving(true);

        // Optimistically update local state
        addNote(String(questionId), noteText);

        try {
            // Persist to API
            const payload: any = { noteText, questionId: Number(questionId) };
            // Only send quizId if the session has an actual Quiz reference (not the session ID).
            // state.apiSessionId is a QuizSession ID, NOT a Quiz ID — sending it causes
            // "Quiz with ID X not found" because the backend validates against the Quiz table.
            const actualQuizId = state?.session?.quizId;
            if (actualQuizId) payload.quizId = Number(actualQuizId);

            // Dynamic import to avoid circular dependencies
            const { StudentService } = await import('@/lib/api-services');
            await StudentService.createNote(payload);

            toast.success('Note saved successfully');
            onSave();
        } catch (error) {
            console.error('Failed to save note:', error);
            toast.error('Failed to save note to server, but saved locally');
            // Still close editor on partial success (local save)
            onSave();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in-up w-full h-full min-h-[500px]">
            <div className="w-[95%] mx-auto h-full flex flex-col">
                <div className="flex-1 min-h-[450px] border border-input rounded-t-md bg-background">
                    <MarkdownNoteEditor
                        value={noteText}
                        onChange={setNoteText}
                        placeholder="Write your thoughts, analysis, or key takeaways here..."
                    />
                </div>
                <div className="flex justify-end gap-2 px-2 py-2 border border-t-0 border-input rounded-b-md bg-background">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="h-8"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                        className="h-8 min-w-[80px]"
                    >
                        {isSaving ? (
                            'Saving...'
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-1" />
                                Save Note
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
