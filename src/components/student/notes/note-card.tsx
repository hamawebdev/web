'use client';

import { Calendar, PenNewSquare, TrashBinTrash, Book, Tag } from '@solar-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toPlainText } from '@/lib/question-localization';
import { StudentNote, NoteCardProps } from '@/types/notes';

/**
 * Individual note card component for the flat notes view
 */
export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        } catch {
            return '';
        }
    };

    // Build the breadcrumb path: Unit → Module → Course
    const getBreadcrumb = () => {
        const parts: string[] = [];
        const course = note.question?.course;
        const module = course?.module;
        const unite = module?.unite;

        if (unite?.name) parts.push(unite.name);
        if (module?.name) parts.push(module.name);
        if (course?.name) parts.push(course.name);

        return parts.join(' → ') || 'General';
    };

    return (
        <Card className="group transition-all hover:shadow-lg hover:border-primary/20 h-full flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground line-clamp-2">
                        {toPlainText(note.question?.questionText, 80) || 'Note'}
                    </CardTitle>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(note);
                            }}
                        >
                            <PenNewSquare className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(note.id);
                            }}
                        >
                            <TrashBinTrash className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between space-y-3">
                {/* Note text */}
                {/* Note text */}
                <div className="text-sm text-foreground line-clamp-4 rich-text relative">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {note.noteText || ''}
                    </ReactMarkdown>
                </div>

                {/* Metadata section */}
                <div className="space-y-2 pt-2 border-t">
                    {/* Labels */}
                    {note.labels && note.labels.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                            {note.labels.slice(0, 3).map(label => (
                                <Badge key={label.id} variant="secondary" className="text-xs px-1.5 py-0">
                                    {label.name}
                                </Badge>
                            ))}
                            {note.labels.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                    +{note.labels.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Book className="h-3 w-3 shrink-0" />
                        <span className="truncate">{getBreadcrumb()}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
