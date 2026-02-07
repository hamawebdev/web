'use client';

import { Search, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentText } from '@solar-icons/react';
import { NoteCard } from './note-card';
import { StudentNote, NotesFilterState } from '@/types/notes';
import { cn } from '@/lib/utils';

interface NotesListProps {
    notes: StudentNote[];
    loading?: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: NotesFilterState['sortBy'];
    sortOrder: NotesFilterState['sortOrder'];
    onSortChange: (sortBy: NotesFilterState['sortBy'], sortOrder: NotesFilterState['sortOrder']) => void;
    onEdit: (note: StudentNote) => void;
    onDelete: (noteId: number) => void;
}

/**
 * Flat notes list with search and sort controls
 */
export function NotesList({
    notes,
    loading,
    searchQuery,
    onSearchChange,
    sortBy,
    sortOrder,
    onSortChange,
    onEdit,
    onDelete,
}: NotesListProps) {
    const sortOptions = [
        { label: 'Last Updated', value: 'updatedAt' as const },
        { label: 'Date Created', value: 'createdAt' as const },
        { label: 'Alphabetical', value: 'alphabetical' as const },
    ];

    const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || 'Sort';

    const handleSortSelect = (newSortBy: NotesFilterState['sortBy']) => {
        // Toggle order if same sort field selected, otherwise default to desc
        const newOrder = newSortBy === sortBy
            ? (sortOrder === 'desc' ? 'asc' : 'desc')
            : 'desc';
        onSortChange(newSortBy, newOrder);
    };

    if (!loading && notes.length === 0 && !searchQuery) {
        return (
            <EmptyState
                icon={DocumentText}
                title="No Notes Yet"
                description="You haven't created any notes yet. Add notes while answering questions in practice or exam sessions."
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="shrink-0">
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            {currentSortLabel}
                            <span className="ml-1 text-muted-foreground">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {sortOptions.map(option => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleSortSelect(option.value)}
                                className={cn(sortBy === option.value && 'bg-accent')}
                            >
                                {option.label}
                                {sortBy === option.value && (
                                    <span className="ml-2 text-muted-foreground">
                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
                {notes.length} note{notes.length !== 1 ? 's' : ''}
                {searchQuery && ' found'}
            </div>

            {/* Notes Grid */}
            {notes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map(note => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            ) : searchQuery ? (
                <EmptyState
                    icon={Search}
                    title="No Results Found"
                    description={`No notes match "${searchQuery}". Try a different search term.`}
                />
            ) : null}
        </div>
    );
}
