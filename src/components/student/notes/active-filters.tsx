'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotesFilterState } from '@/types/notes';

interface ActiveFiltersProps {
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

/**
 * Display active filter chips with remove buttons
 */
export function ActiveFilters({
    filters,
    onRemoveUnit,
    onRemoveModule,
    onRemoveLabel,
    onClearSearch,
    onClearAll,
    unitNames = new Map(),
    moduleNames = new Map(),
    labelNames = new Map(),
}: ActiveFiltersProps) {
    const hasFilters =
        filters.selectedUnits.length > 0 ||
        filters.selectedModules.length > 0 ||
        filters.selectedLabels.length > 0 ||
        !!filters.searchQuery;

    if (!hasFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active:</span>

            {/* Search filter chip */}
            {filters.searchQuery && (
                <Badge variant="secondary" className="gap-1 pr-1">
                    Search: "{filters.searchQuery.substring(0, 15)}{filters.searchQuery.length > 15 ? '...' : ''}"
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={onClearSearch}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </Badge>
            )}

            {/* Unit filter chips */}
            {filters.selectedUnits.map(unitId => (
                <Badge key={`unit-${unitId}`} variant="secondary" className="gap-1 pr-1">
                    {unitNames.get(unitId) || `Unit ${unitId}`}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => onRemoveUnit(unitId)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </Badge>
            ))}

            {/* Module filter chips */}
            {filters.selectedModules.map(moduleId => (
                <Badge key={`module-${moduleId}`} variant="secondary" className="gap-1 pr-1">
                    {moduleNames.get(moduleId) || `Module ${moduleId}`}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => onRemoveModule(moduleId)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </Badge>
            ))}

            {/* Label filter chips */}
            {filters.selectedLabels.map(labelId => (
                <Badge key={`label-${labelId}`} variant="outline" className="gap-1 pr-1">
                    {labelNames.get(labelId) || `Label ${labelId}`}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => onRemoveLabel(labelId)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </Badge>
            ))}

            {/* Clear all button */}
            <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={onClearAll}
            >
                Clear all
            </Button>
        </div>
    );
}
