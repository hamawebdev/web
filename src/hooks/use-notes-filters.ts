'use client';

import { useState, useMemo, useCallback } from 'react';
import { StudentNote, NotesFilterState, DEFAULT_NOTES_FILTER_STATE } from '@/types/notes';

/**
 * Hook for managing notes filter state and applying filters to notes
 */
export function useNotesFilters() {
    const [filters, setFilters] = useState<NotesFilterState>(DEFAULT_NOTES_FILTER_STATE);

    /**
     * Apply all filters to a notes array
     */
    const applyFilters = useCallback((notes: StudentNote[]): StudentNote[] => {
        if (!notes || !Array.isArray(notes)) return [];

        return notes
            .filter(note => {
                // Search filter - matches note text or question text
                if (filters.searchQuery) {
                    const searchLower = filters.searchQuery.toLowerCase();
                    const matchesNoteText = note.noteText?.toLowerCase().includes(searchLower);
                    const matchesQuestionText = note.question?.questionText?.toLowerCase().includes(searchLower);
                    if (!matchesNoteText && !matchesQuestionText) return false;
                }

                // Unit filter
                if (filters.selectedUnits.length > 0) {
                    const noteUnitId = note.question?.course?.module?.unite?.id;
                    if (!noteUnitId || !filters.selectedUnits.includes(noteUnitId)) return false;
                }

                // Module filter
                if (filters.selectedModules.length > 0) {
                    const noteModuleId = note.question?.course?.module?.id;
                    if (!noteModuleId || !filters.selectedModules.includes(noteModuleId)) return false;
                }

                // Label filter
                if (filters.selectedLabels.length > 0) {
                    const noteLabelIds = note.labels?.map(l => l.id) || [];
                    const hasMatchingLabel = filters.selectedLabels.some(id => noteLabelIds.includes(id));
                    if (!hasMatchingLabel) return false;
                }

                // Date range filter
                if (filters.dateFrom || filters.dateTo) {
                    const noteDate = new Date(note.createdAt);
                    if (filters.dateFrom && noteDate < filters.dateFrom) return false;
                    if (filters.dateTo && noteDate > filters.dateTo) return false;
                }

                return true;
            })
            .sort((a, b) => {
                let aVal: string | Date;
                let bVal: string | Date;

                if (filters.sortBy === 'alphabetical') {
                    aVal = a.noteText?.toLowerCase() || '';
                    bVal = b.noteText?.toLowerCase() || '';
                } else {
                    aVal = new Date(a[filters.sortBy] || a.createdAt);
                    bVal = new Date(b[filters.sortBy] || b.createdAt);
                }

                const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
                if (aVal < bVal) return -1 * multiplier;
                if (aVal > bVal) return 1 * multiplier;
                return 0;
            });
    }, [filters]);

    /**
     * Reset all filters to defaults
     */
    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_NOTES_FILTER_STATE);
    }, []);

    /**
     * Update a specific filter
     */
    const updateFilter = useCallback(<K extends keyof NotesFilterState>(
        key: K,
        value: NotesFilterState[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    /**
     * Toggle a unit selection
     */
    const toggleUnit = useCallback((unitId: number) => {
        setFilters(prev => ({
            ...prev,
            selectedUnits: prev.selectedUnits.includes(unitId)
                ? prev.selectedUnits.filter(id => id !== unitId)
                : [...prev.selectedUnits, unitId]
        }));
    }, []);

    /**
     * Toggle a module selection
     */
    const toggleModule = useCallback((moduleId: number) => {
        setFilters(prev => ({
            ...prev,
            selectedModules: prev.selectedModules.includes(moduleId)
                ? prev.selectedModules.filter(id => id !== moduleId)
                : [...prev.selectedModules, moduleId]
        }));
    }, []);

    /**
     * Toggle a label selection
     */
    const toggleLabel = useCallback((labelId: number) => {
        setFilters(prev => ({
            ...prev,
            selectedLabels: prev.selectedLabels.includes(labelId)
                ? prev.selectedLabels.filter(id => id !== labelId)
                : [...prev.selectedLabels, labelId]
        }));
    }, []);

    /**
     * Count of active filters
     */
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.searchQuery) count++;
        count += filters.selectedUnits.length;
        count += filters.selectedModules.length;
        count += filters.selectedLabels.length;
        if (filters.dateFrom) count++;
        if (filters.dateTo) count++;
        return count;
    }, [filters]);

    /**
     * Check if any filters are active
     */
    const hasActiveFilters = activeFilterCount > 0;

    return {
        filters,
        setFilters,
        applyFilters,
        resetFilters,
        updateFilter,
        toggleUnit,
        toggleModule,
        toggleLabel,
        activeFilterCount,
        hasActiveFilters,
    };
}
