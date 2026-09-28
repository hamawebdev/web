'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { StudentNote } from '@/types/notes';
import { toPlainText } from '@/lib/question-localization';
import { formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/components/loading-states';

interface NotesTableProps {
    notes: StudentNote[];
    loading: boolean;
    onEdit: (note: StudentNote) => void;
    onDelete: (noteId: number) => void;
    sortBy: 'updatedAt' | 'createdAt' | 'alphabetical';
    sortOrder: 'asc' | 'desc';
    onSortChange: (sortBy: 'updatedAt' | 'createdAt' | 'alphabetical', sortOrder: 'asc' | 'desc') => void;
}

export function NotesTable({
    notes,
    loading,
    onEdit,
    onDelete,
    sortBy,
    sortOrder,
    onSortChange,
}: NotesTableProps) {
    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (notes.length === 0) {
        return (
            <div className="text-center p-12 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">No notes found matching your criteria.</p>
            </div>
        );
    }

    const handleSort = (column: 'updatedAt' | 'createdAt' | 'alphabetical') => {
        if (sortBy === column) {
            onSortChange(column, sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            onSortChange(column, 'desc');
        }
    };

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[30%]">Question</TableHead>
                        <TableHead className="w-[25%] hidden md:table-cell">My Note</TableHead>
                        <TableHead className="w-[20%] hidden lg:table-cell">Context</TableHead>
                        <TableHead className="w-[15%] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('updatedAt')}>
                            <div className="flex items-center gap-2">
                                Last Updated
                                <ArrowUpDown className="h-3 w-3" />
                            </div>
                        </TableHead>
                        <TableHead className="w-[10%] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {notes.map((note) => (
                        <TableRow key={note.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => onEdit(note)}>
                            <TableCell className="font-medium align-top">
                                <div className="line-clamp-2 text-sm">
                                    {toPlainText(note.question?.questionText) || 'No question text'}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {note.labels.map(label => (
                                        <Badge key={label.id} variant="secondary" className="text-[10px] h-5 px-1.5">
                                            {label.name}
                                        </Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="align-top hidden md:table-cell">
                                <div className="line-clamp-2 text-sm text-muted-foreground">
                                    {note.noteText || <span className="italic opacity-50">Empty note</span>}
                                </div>
                            </TableCell>
                            <TableCell className="align-top hidden lg:table-cell">
                                <div className="text-xs text-muted-foreground space-y-1">
                                    {note.question?.course?.module?.unite?.name && (
                                        <div className="font-medium text-foreground">
                                            {note.question.course.module.unite.name}
                                        </div>
                                    )}
                                    {note.question?.course?.module?.name && (
                                        <div>{note.question.course.module.name}</div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="align-top whitespace-nowrap text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right align-top" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(note)}>
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-4 w-4" />
                                                View Details
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(note)}>
                                            <div className="flex items-center gap-2">
                                                <Pencil className="h-4 w-4" />
                                                Edit Note
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => onDelete(note.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
