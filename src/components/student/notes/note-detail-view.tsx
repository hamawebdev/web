'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StudentNote } from '@/types/notes';
import { ReadOnlyQuestion } from './read-only-question';
import { MarkdownNoteEditor } from '@/components/ui/markdown-editor';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/loading-states';
import { Save, Trash2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface NoteDetailViewProps {
    note: StudentNote | null;
    onBack: () => void;
    onSave: (noteId: number, newText: string) => Promise<void>;
    onDelete: (noteId: number) => void;
    saving: boolean;
}

export function NoteDetailView({
    note,
    onBack,
    onSave,
    onDelete,
    saving
}: NoteDetailViewProps) {
    const [editText, setEditText] = useState('');
    const [showQuestionContext, setShowQuestionContext] = useState(true);

    useEffect(() => {
        if (note) {
            setEditText(note.noteText || '');
        }
    }, [note]);

    const handleSave = async () => {
        if (!note) return;
        await onSave(note.id, editText);
    };

    if (!note) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    className="gap-2 pl-0 hover:pl-2 transition-all"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Notes
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQuestionContext(!showQuestionContext)}
                    >
                        {showQuestionContext ? (
                            <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Question
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show Question
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(note.id)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                    <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-8 pb-10">
                {/* Top Section: Question Context */}
                {showQuestionContext && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-primary">
                            Question
                        </h3>
                        <Card className="border-primary/20 bg-muted/30 max-h-[600px] overflow-hidden flex flex-col">
                            <CardContent className="p-0 overflow-y-auto">
                                <div className="p-6">
                                    {note.question ? (
                                        <ReadOnlyQuestion question={note.question} />
                                    ) : (
                                        <div className="text-center p-12 text-muted-foreground">
                                            Question details not available.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Bottom Section: Note Editor */}
                <div className="flex flex-col transition-all duration-300 ease-in-out">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-primary">
                        My Note
                    </h3>
                    <Card className="overflow-hidden flex flex-col min-h-[500px]">
                        <div className="flex-1 relative">
                            <MarkdownNoteEditor
                                value={editText}
                                onChange={setEditText}
                                placeholder="Write your notes here..."
                            />
                        </div>
                        <div className="bg-muted/30 p-2 text-xs text-muted-foreground text-right border-t">
                            {editText.length} characters
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
