/**
 * Notes Feature Type Definitions
 * Types for the flat notes view with filter sheet
 */

/**
 * Student note with full hierarchy for filtering
 */
export interface StudentNote {
    id: number;
    noteText: string;
    questionId: number | null;
    quizId: number | null;
    createdAt: string;
    updatedAt: string;
    labels: NoteLabel[];
    question?: {
        id: number;
        questionText: string;
        course?: {
            id: number;
            name: string;
            module?: {
                id: number;
                name: string;
                unite?: {
                    id: number;
                    name: string;
                };
            };
        };
    };
}

/**
 * Label attached to a note
 */
export interface NoteLabel {
    id: number;
    name: string;
}

/**
 * Filter state for notes view
 */
export interface NotesFilterState {
    selectedUnits: number[];
    selectedModules: number[];
    selectedLabels: number[];
    searchQuery: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy: 'updatedAt' | 'createdAt' | 'alphabetical';
    sortOrder: 'asc' | 'desc';
}

/**
 * Default filter state
 */
export const DEFAULT_NOTES_FILTER_STATE: NotesFilterState = {
    selectedUnits: [],
    selectedModules: [],
    selectedLabels: [],
    searchQuery: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
};

/**
 * Props for NoteCard component
 */
export interface NoteCardProps {
    note: StudentNote;
    onEdit: (note: StudentNote) => void;
    onDelete: (noteId: number) => void;
}

/**
 * Props for NotesFilterSheet component
 */
export interface NotesFilterSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: NotesFilterState;
    onFiltersChange: (filters: NotesFilterState) => void;
    onApply: () => void;
    onClear: () => void;
    activeFilterCount: number;
}

/**
 * Props for ActiveFilters component
 */
export interface ActiveFiltersProps {
    filters: NotesFilterState;
    onRemoveUnit: (unitId: number) => void;
    onRemoveModule: (moduleId: number) => void;
    onRemoveLabel: (labelId: number) => void;
    onClearSearch: () => void;
    onClearAll: () => void;
    // Lookup maps for display names
    unitNames?: Map<number, string>;
    moduleNames?: Map<number, string>;
    labelNames?: Map<number, string>;
}
