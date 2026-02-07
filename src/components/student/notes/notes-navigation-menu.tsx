// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Menu, X, BookOpen, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ModuleNavigationItem } from '@/types/api';
import { cn } from '@/lib/utils';

interface NotesNavigationMenuProps {
  navigationItems: ModuleNavigationItem[];
  selectedFilter: { type: 'unite' | 'module' | null; id: number | null } | null;
  onFilterSelect: (filter: { type: 'unite' | 'module'; id: number } | null) => void;
  loading?: boolean;
}

export function NotesNavigationMenu({
  navigationItems,
  selectedFilter,
  onFilterSelect,
  loading = false
}: NotesNavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Group items by unite for better organization
  const groupedItems = React.useMemo(() => {
    const unites: Array<{
      unite: ModuleNavigationItem | null;
      modules: ModuleNavigationItem[];
    }> = [];
    const independentModules: ModuleNavigationItem[] = [];

    navigationItems.forEach(item => {
      if (item.type === 'unite') {
        // Find existing unite group or create new one
        const existingGroup = unites.find(group => group.unite?.id === item.id);
        if (!existingGroup) {
          unites.push({
            unite: item,
            modules: []
          });
        }
      } else if (item.type === 'module') {
        if (item.uniteId) {
          // Module belongs to a unite
          let uniteGroup = unites.find(group => group.unite?.id === item.uniteId);
          if (!uniteGroup) {
            // Create unite group if it doesn't exist
            uniteGroup = {
              unite: {
                id: item.uniteId,
                name: item.uniteName || 'Unknown Unite',
                type: 'unite'
              },
              modules: []
            };
            unites.push(uniteGroup);
          }
          uniteGroup.modules.push(item);
        } else {
          // Independent module
          independentModules.push(item);
        }
      }
    });

    return { unites, independentModules };
  }, [navigationItems]);

  const handleItemSelect = (item: ModuleNavigationItem) => {
    onFilterSelect({
      type: item.type,
      id: item.id
    });
    setIsOpen(false);
  };

  const clearFilter = () => {
    onFilterSelect(null);
    setIsOpen(false);
  };

  const isItemSelected = (item: ModuleNavigationItem) => {
    return selectedFilter?.type === item.type && selectedFilter?.id === item.id;
  };

  const getSelectedItemName = () => {
    if (!selectedFilter) return 'All Notes';
    
    const item = navigationItems.find(
      item => item.type === selectedFilter.type && item.id === selectedFilter.id
    );
    
    if (item) {
      return item.type === 'unite' ? `${item.name} (Unite)` : `${item.name} (Module)`;
    }
    
    return 'Selected Filter';
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            isOpen && "bg-primary/10 border-primary/20"
          )}
          disabled={loading}
        >
          {isOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {getSelectedItemName()}
          </span>
          {selectedFilter && (
            <Badge variant="secondary" className="ml-1">
              Filtered
            </Badge>
          )}
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <Card className="absolute top-full left-0 mt-2 w-80 max-w-[90vw] z-50 shadow-lg border-border/50 animate-in slide-in-from-top-2 duration-200">
            <CardContent className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">Filter by Module</h3>
                  {selectedFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilter}
                      className="text-xs"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>

                <Separator />

                {/* All Notes Option */}
                <Button
                  variant={!selectedFilter ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={clearFilter}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  All Notes
                </Button>

                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}

                {/* Unites and Modules */}
                {!loading && (
                  <div className="space-y-3">
                    {groupedItems.unites.map(({ unite, modules }) => (
                      <div key={unite?.id} className="space-y-2">
                        {/* Unite Item */}
                        {unite && (
                          <Button
                            variant={isItemSelected(unite) ? "secondary" : "ghost"}
                            className="w-full justify-start font-medium"
                            onClick={() => handleItemSelect(unite)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {unite.name}
                            <ChevronRight className="h-3 w-3 ml-auto" />
                          </Button>
                        )}

                        {/* Modules within Unite */}
                        {modules.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {modules.map(module => (
                              <Button
                                key={module.id}
                                variant={isItemSelected(module) ? "secondary" : "ghost"}
                                className="w-full justify-start text-sm"
                                onClick={() => handleItemSelect(module)}
                              >
                                <BookOpen className="h-3 w-3 mr-2" />
                                {module.name}
                                {module.noteCount !== undefined && (
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    {module.noteCount}
                                  </Badge>
                                )}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Independent Modules */}
                    {groupedItems.independentModules.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground px-2">
                          Independent Modules
                        </div>
                        {groupedItems.independentModules.map(module => (
                          <Button
                            key={module.id}
                            variant={isItemSelected(module) ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => handleItemSelect(module)}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            {module.name}
                            {module.noteCount !== undefined && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                {module.noteCount}
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!loading && navigationItems.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No modules available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

