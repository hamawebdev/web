'use client';

import { useEffect, useState } from 'react';
import { Filter, X, ChevronDown, ChevronRight } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NotesFilterState } from '@/types/notes';
import { cn } from '@/lib/utils';

interface Unit {
    id: number;
    name: string;
    modules?: { id: number; name: string }[];
}

interface Label {
    id: number;
    name: string;
}

interface NotesFilterSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: NotesFilterState;
    onFiltersChange: (filters: NotesFilterState) => void;
    onApply: () => void;
    onClear: () => void;
    activeFilterCount: number;
    units: Unit[];
    labels: Label[];
    unitsLoading?: boolean;
    labelsLoading?: boolean;
}

/**
 * Side panel filter sheet for notes
 */
export function NotesFilterSheet({
    open,
    onOpenChange,
    filters,
    onFiltersChange,
    onApply,
    onClear,
    activeFilterCount,
    units,
    labels,
    unitsLoading,
    labelsLoading,
}: NotesFilterSheetProps) {
    const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());

    // Toggle unit expansion
    const toggleUnitExpanded = (unitId: number) => {
        setExpandedUnits(prev => {
            const next = new Set(prev);
            if (next.has(unitId)) {
                next.delete(unitId);
            } else {
                next.add(unitId);
            }
            return next;
        });
    };

    // Toggle unit selection
    const toggleUnit = (unitId: number) => {
        const newUnits = filters.selectedUnits.includes(unitId)
            ? filters.selectedUnits.filter(id => id !== unitId)
            : [...filters.selectedUnits, unitId];
        onFiltersChange({ ...filters, selectedUnits: newUnits });
    };

    // Toggle module selection
    const toggleModule = (moduleId: number) => {
        const newModules = filters.selectedModules.includes(moduleId)
            ? filters.selectedModules.filter(id => id !== moduleId)
            : [...filters.selectedModules, moduleId];
        onFiltersChange({ ...filters, selectedModules: newModules });
    };

    // Toggle label selection
    const toggleLabel = (labelId: number) => {
        const newLabels = filters.selectedLabels.includes(labelId)
            ? filters.selectedLabels.filter(id => id !== labelId)
            : [...filters.selectedLabels, labelId];
        onFiltersChange({ ...filters, selectedLabels: newLabels });
    };

    const handleApply = () => {
        onApply();
        onOpenChange(false);
    };

    const handleClear = () => {
        onClear();
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[320px] sm:w-[400px] flex flex-col">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </SheetTitle>
                    </div>
                    <SheetDescription>
                        Refine your notes by unit, module, or labels
                    </SheetDescription>
                </SheetHeader>

                <Separator className="my-4" />

                <ScrollArea className="flex-1 -mr-4 pr-4">
                    <div className="space-y-6">
                        {/* Units & Modules Section */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Units & Modules</h4>
                            {unitsLoading ? (
                                <div className="text-sm text-muted-foreground py-2">Loading...</div>
                            ) : units.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-2">No units available</div>
                            ) : (
                                <div className="space-y-1">
                                    {units.map(unit => (
                                        <Collapsible
                                            key={unit.id}
                                            open={expandedUnits.has(unit.id)}
                                            onOpenChange={() => toggleUnitExpanded(unit.id)}
                                        >
                                            <div className="flex items-center gap-2 py-1.5">
                                                <Checkbox
                                                    id={`unit-${unit.id}`}
                                                    checked={filters.selectedUnits.includes(unit.id)}
                                                    onCheckedChange={() => toggleUnit(unit.id)}
                                                />
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex-1 justify-between h-auto p-0 hover:bg-transparent"
                                                    >
                                                        <label
                                                            htmlFor={`unit-${unit.id}`}
                                                            className="text-sm cursor-pointer"
                                                        >
                                                            {unit.name}
                                                        </label>
                                                        {unit.modules && unit.modules.length > 0 && (
                                                            expandedUnits.has(unit.id) ? (
                                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                            )
                                                        )}
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </div>
                                            <CollapsibleContent>
                                                {unit.modules && unit.modules.length > 0 && (
                                                    <div className="ml-6 space-y-1 py-1">
                                                        {unit.modules.map(module => (
                                                            <div key={module.id} className="flex items-center gap-2 py-1">
                                                                <Checkbox
                                                                    id={`module-${module.id}`}
                                                                    checked={filters.selectedModules.includes(module.id)}
                                                                    onCheckedChange={() => toggleModule(module.id)}
                                                                />
                                                                <label
                                                                    htmlFor={`module-${module.id}`}
                                                                    className="text-sm cursor-pointer text-muted-foreground"
                                                                >
                                                                    {module.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Labels Section */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Labels</h4>
                            {labelsLoading ? (
                                <div className="text-sm text-muted-foreground py-2">Loading...</div>
                            ) : labels.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-2">No labels available</div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {labels.map(label => (
                                        <Badge
                                            key={label.id}
                                            variant={filters.selectedLabels.includes(label.id) ? 'default' : 'outline'}
                                            className="cursor-pointer transition-colors"
                                            onClick={() => toggleLabel(label.id)}
                                        >
                                            {label.name}
                                            {filters.selectedLabels.includes(label.id) && (
                                                <X className="h-3 w-3 ml-1" />
                                            )}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <Separator className="my-4" />

                <SheetFooter className="flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClear}
                        disabled={activeFilterCount === 0}
                        className="flex-1"
                    >
                        Clear All
                    </Button>
                    <Button onClick={handleApply} className="flex-1">
                        Apply Filters
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
